"""
REQ-F12 Phase 1 — `GET /api/stats` 확장 필드 검증 계약

검증 계약: docs/plans/PLAN-F12-detection-stats-dashboard.md `## 검증 계약`
케이스: F12-13 ~ F12-16

`StatsResponse`에 `processing_count`·`undetected_page_count`·`false_positive_count`·
`manual_count`·`detection_rate` 5개 필드가 추가된다 — 계획서가 이 이름들을 고정했으므로
여기서도 그대로 쓴다. job별 캐시 필드(test_question_stats_cache.py가 검증)를 `SOURCE`
job에 한해 합산한 값이어야 한다.

이 필드들은 아직 응답에 없다(계획서 Phase 1 착수 전) — 모든 케이스가 지금은
`res.json()["..."]`의 `KeyError`로 빨간불이어야 정상이다.
"""
import pytest


@pytest.fixture
def stub_multi_page_detection(monkeypatch):
    """test_question_stats_cache.py와 동일 — 다중 페이지 + 개별 오탐 지정 감지 대역."""

    def _install(*, boundaries: list[dict], page_count: int):
        from app.routers import browse as browse_router
        from app.routers import upload as upload_router
        from app.utils.question_parser import QuestionBoundary

        def _detect(pdf_path):
            return [QuestionBoundary(**b) for b in boundaries]

        def _page_info(pdf_bytes):
            return [{"width": 595, "height": 842} for _ in range(page_count)]

        for mod in (upload_router, browse_router):
            monkeypatch.setattr(mod, "detect_question_boundaries", _detect)
            monkeypatch.setattr(mod.thumbnail_service, "get_page_info", _page_info)
            monkeypatch.setattr(
                mod.prewarm_service, "prewarm_all_thumbnails", lambda *a, **kw: None
            )

    return _install


def _boundary(page_index: int, number: int, is_false_positive: bool = False) -> dict:
    return dict(
        number=number, page_index=page_index,
        y_top=0.0, y_bottom=90.0, col=0, col_x0=50.0, col_x1=545.0,
        is_false_positive=is_false_positive,
    )


def test_F12_13_stats가_SOURCE_job_오탐수를_합산(
    client, make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 작업 단계 Phase 1 — "`SOURCE` job 캐시 필드만 합산" """
    from app.routers.upload import _trigger_boundary_detection

    make_job("job-a")
    stub_multi_page_detection(
        boundaries=[_boundary(0, 1, is_false_positive=True), _boundary(0, 2)],
        page_count=1,
    )
    _trigger_boundary_detection("job-a")

    make_job("job-b")
    stub_multi_page_detection(
        boundaries=[_boundary(0, 1, is_false_positive=True)], page_count=1
    )
    _trigger_boundary_detection("job-b")

    res = client.get("/api/stats")

    assert res.json()["false_positive_count"] == 2


def test_F12_14_stats_processing_count는_PROCESSING_job_개수(client, make_job):
    """근거: PLAN § 결정 — "`boundaries_status == PROCESSING`인 job 개수" """
    from app.models.schemas import BoundariesStatus
    from app.services import storage

    j1 = make_job("job-p1")
    j1.boundaries_status = BoundariesStatus.PROCESSING
    storage.put_status(j1)

    j2 = make_job("job-p2")
    j2.boundaries_status = BoundariesStatus.DONE
    storage.put_status(j2)

    res = client.get("/api/stats")

    assert res.json()["processing_count"] == 1


def test_F12_15_stats_detection_rate가_공식과_일치(
    client, make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 결정 — "`(total_question_count(자동) − 오탐 수 − 수동 수) / total_question_count(자동)`" """
    from app.routers.upload import _trigger_boundary_detection

    make_job("job-15")
    stub_multi_page_detection(
        boundaries=[
            _boundary(0, 1, is_false_positive=True),
            _boundary(0, 2),
            _boundary(0, 3),
            _boundary(0, 4),
        ],
        page_count=1,
    )
    _trigger_boundary_detection("job-15")
    client.post(
        "/api/jobs/job-15/pages/0/questions/manual",
        json={"title": "수동", "region": {"x0": 0, "y0": 0, "x1": 100, "y1": 50}},
    )

    res = client.get("/api/stats")

    # total_question_count(자동)=4, 오탐=1, 수동=1 → (4-1-1)/4 = 0.5
    assert res.json()["detection_rate"] == pytest.approx(0.5)


def test_F12_16_EXPORT_job은_통계_합산에서_제외(
    client, make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 결정 — "`SOURCE` job만 — `EXPORT`(생성 결과)는 제외" """
    from app.models.schemas import JobType
    from app.routers.upload import _trigger_boundary_detection

    make_job("job-source", job_type=JobType.SOURCE)
    stub_multi_page_detection(
        boundaries=[_boundary(0, 1, is_false_positive=True)], page_count=1
    )
    _trigger_boundary_detection("job-source")

    make_job("job-export", job_type=JobType.EXPORT)
    stub_multi_page_detection(
        boundaries=[
            _boundary(0, 1, is_false_positive=True),
            _boundary(0, 2, is_false_positive=True),
        ],
        page_count=1,
    )
    _trigger_boundary_detection("job-export")

    res = client.get("/api/stats")

    # EXPORT의 오탐 2건이 섞이면 3이 된다 — SOURCE의 1건만 집계돼야 한다
    assert res.json()["false_positive_count"] == 1
