"""
REQ-F12 Phase 1 — 문항 통계 job 캐시 검증 계약

검증 계약: docs/plans/PLAN-F12-detection-stats-dashboard.md `## 검증 계약`
케이스: F12-01 ~ F12-12

감지 완료(최초 감지·재감지)·문항 삭제·수동 문항 추가/삭제·벌크 삭제 지점마다
`JobStatusFile`에 캐시되는 4개 필드 — `total_pages`·`false_positive_count`·
`manual_count`·`undetected_page_count` — 를 검증한다.

이 필드들은 아직 구현 전이다(계획서 Phase 1 착수 전). `storage.get_status(...)`가 돌려주는
`JobStatusFile`은 pydantic 모델이라 선언 안 된 필드에 접근하면 `AttributeError`로 떨어진다 —
이 파일의 모든 케이스가 지금은 그 이유로 빨간불이어야 정상이다. `/testrun`은 이걸 "테스트
결함"이 아니라 "구현 결함"으로 분류해야 한다.

⚠️ 값을 직접 주입하지 않는다. 편집 엔드포인트(`delete_question` 등)는 계획서가 명시한 대로
**전량 재계산**이므로(델타 누적이 아님), 모든 케이스는 실제 boundaries/수동 문항 상태를
`storage.save_boundaries_cache`/`save_manual_questions`로 심거나 실제 감지 함수
(`_trigger_boundary_detection`/`_run_refresh_detection`)를 돌려 만든 뒤, 그 상태에서
엔드포인트를 호출해 재계산된 값을 읽는다 — pydantic이 아직 없는 필드로의 직접 대입을
막아 주기도 하고(값 조작이 아니라 조작하면 그 자체로 에러), 무엇보다 계획서가 정한
"전량 재계산" 계약을 실제로 검증하는 방식이다.

공용 `stub_detection` 픽스처(conftest.py)는 페이지 1개로 고정돼 있어 이 파일의
다중 페이지·오탐 혼합 시나리오에 맞지 않는다 — 아래 `stub_multi_page_detection`을 쓴다.
"""
import pytest


# ── 감지 완료 지점 전용 대역 (다중 페이지 + 개별 오탐 지정) ────

@pytest.fixture
def stub_multi_page_detection(monkeypatch):
    """
    `detect_question_boundaries`를 지정한 boundary 목록으로, `get_page_info`를
    지정한 페이지 수로 갈아끼운다. 호출마다 새로 지정할 수 있어 재감지 케이스(F12-12)처럼
    한 job에 두 번 다른 결과를 심을 때도 쓴다.
    """

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


def _manual(page_num: int, manual_id: str) -> dict:
    return {
        "manual_id": manual_id,
        "page_num": page_num,
        "title": "테스트 수동 문항",
        "region": {"x0": 0.0, "y0": 0.0, "x1": 100.0, "y1": 50.0},
        "created_at": "2026-09-08T00:00:00+00:00",
    }


MANUAL_BODY = {"title": "테스트 수동 문항", "region": {"x0": 0, "y0": 0, "x1": 100, "y1": 50}}


# ── total_pages ───────────────────────────────────────────

def test_F12_01_최초감지_완료시_total_pages_저장(make_job, stub_multi_page_detection, fake_pdf):
    """근거: PLAN § 작업 단계 Phase 1 — "`total_pages`는 감지 완료 시 1회 정해지면 문항 편집으로 바뀌지 않는다" """
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-01")
    stub_multi_page_detection(boundaries=[_boundary(0, 1)], page_count=5)

    _trigger_boundary_detection("job-01")

    assert storage.get_status("job-01").total_pages == 5


def test_F12_02_문항_삭제해도_total_pages_유지(client, make_job, stub_multi_page_detection, fake_pdf):
    """근거: PLAN § 작업 단계 Phase 1 — "`total_pages`는 감지 완료 시 1회 정해지면 문항 편집으로 바뀌지 않는다" """
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-02")
    stub_multi_page_detection(boundaries=[_boundary(0, 1), _boundary(0, 2)], page_count=4)
    _trigger_boundary_detection("job-02")

    res = client.delete("/api/jobs/job-02/pages/0/questions/1")

    assert res.status_code == 204
    assert storage.get_status("job-02").total_pages == 4


# ── false_positive_count ─────────────────────────────────

def test_F12_03_최초감지_완료시_오탐개수_저장(make_job, stub_multi_page_detection, fake_pdf):
    """근거: PLAN § 제약·함정 — "`is_false_positive`는 감지 알고리즘이 한 번만 매기고" """
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-03")
    stub_multi_page_detection(
        boundaries=[
            _boundary(0, 1, is_false_positive=True),
            _boundary(0, 2, is_false_positive=False),
            _boundary(1, 1, is_false_positive=True),
        ],
        page_count=2,
    )

    _trigger_boundary_detection("job-03")

    assert storage.get_status("job-03").false_positive_count == 2


def test_F12_04_오탐_문항_삭제시_오탐개수_감소(client, make_job):
    """근거: PLAN § 제약·함정 — "오탐 캐시는 감지 완료·문항 삭제·재감지 시점에만 갱신하면 되고" """
    from app.services import storage

    make_job("job-04")
    storage.save_boundaries_cache("job-04", [
        _boundary(0, 1, is_false_positive=True),
        _boundary(0, 2, is_false_positive=True),
        _boundary(0, 3, is_false_positive=False),
    ])

    res = client.delete("/api/jobs/job-04/pages/0/questions/1")

    assert res.status_code == 204
    assert storage.get_status("job-04").false_positive_count == 1


def test_F12_05_수동문항_추가는_오탐개수_불변(
    client, make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 제약·함정 — "수동 문항 추가/삭제는 오탐 수에 영향 없다." """
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-05")
    stub_multi_page_detection(
        boundaries=[_boundary(0, 1, is_false_positive=True), _boundary(0, 2)],
        page_count=2,
    )
    _trigger_boundary_detection("job-05")
    before = storage.get_status("job-05").false_positive_count

    res = client.post("/api/jobs/job-05/pages/1/questions/manual", json=MANUAL_BODY)

    assert res.status_code == 201
    assert storage.get_status("job-05").false_positive_count == before == 1


# ── manual_count ──────────────────────────────────────────

def test_F12_06_수동문항_추가시_manual_count_증가(client, make_job):
    """근거: PLAN § 작업 단계 Phase 1 — "`add_manual_question`·" """
    from app.services import storage

    make_job("job-06")
    storage.save_manual_questions("job-06", [_manual(0, "m1")])

    res = client.post("/api/jobs/job-06/pages/0/questions/manual", json=MANUAL_BODY)

    assert res.status_code == 201
    assert storage.get_status("job-06").manual_count == 2


def test_F12_07_수동문항_삭제시_manual_count_감소(client, make_job):
    """근거: PLAN § 작업 단계 Phase 1 — "`delete_manual_question`·" """
    from app.services import storage

    make_job("job-07")
    storage.save_manual_questions("job-07", [_manual(0, "m1"), _manual(0, "m2")])

    res = client.delete("/api/jobs/job-07/pages/0/questions/manual/m1")

    assert res.status_code == 204
    assert storage.get_status("job-07").manual_count == 1


def test_F12_08_벌크삭제시_manual_count_일괄_감소(client, make_job):
    """근거: PLAN § 작업 단계 Phase 1 — "bulk-delete 지점마다" """
    from app.services import storage

    make_job("job-08")
    storage.save_manual_questions(
        "job-08", [_manual(0, "m1"), _manual(0, "m2"), _manual(0, "m3")]
    )

    res = client.post(
        "/api/jobs/job-08/pages/0/questions/bulk-delete",
        json={"question_nums": [], "manual_ids": ["m1", "m2"]},
    )

    assert res.status_code == 200
    assert storage.get_status("job-08").manual_count == 1


# ── undetected_page_count ─────────────────────────────────

def test_F12_09_문항0개_페이지가_있으면_미탐지수_반영(
    make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 결정 — "자동 + 수동 합쳐 문항이 0개인 페이지 수" """
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-09")
    stub_multi_page_detection(boundaries=[_boundary(0, 1)], page_count=3)

    _trigger_boundary_detection("job-09")

    # page_count=3 (0·1·2) 중 boundary는 page 0에만 있음 → 1·2가 미탐지
    assert storage.get_status("job-09").undetected_page_count == 2


def test_F12_10_미탐지_페이지에_수동문항_추가시_미탐지수_감소(
    client, make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 결정 — "자동 + 수동 합쳐 문항이 0개인 페이지 수" """
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-10")
    stub_multi_page_detection(boundaries=[_boundary(0, 1)], page_count=3)
    _trigger_boundary_detection("job-10")

    res = client.post("/api/jobs/job-10/pages/1/questions/manual", json=MANUAL_BODY)

    assert res.status_code == 201
    assert storage.get_status("job-10").undetected_page_count == 1


def test_F12_11_페이지의_마지막_문항_삭제시_미탐지수_증가(
    client, make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 결정 — "자동 + 수동 합쳐 문항이 0개인 페이지 수" """
    from app.routers.upload import _trigger_boundary_detection
    from app.services import storage

    make_job("job-11")
    stub_multi_page_detection(
        boundaries=[_boundary(0, 1), _boundary(1, 1)], page_count=2
    )
    _trigger_boundary_detection("job-11")

    res = client.delete("/api/jobs/job-11/pages/1/questions/1")

    assert res.status_code == 204
    assert storage.get_status("job-11").undetected_page_count == 1


# ── 재감지 — 옛 캐시 값이 안 남는다 ─────────────────────────

def test_F12_12_재감지시_통계가_새_boundaries_기준으로_갱신(
    make_job, stub_multi_page_detection, fake_pdf
):
    """근거: PLAN § 작업 단계 Phase 1 — "감지 완료(최초 감지·재감지)" """
    from app.routers.upload import _trigger_boundary_detection
    from app.routers.browse import _run_refresh_detection
    from app.services import storage

    make_job("job-12")
    stub_multi_page_detection(
        boundaries=[_boundary(0, 1, is_false_positive=True)], page_count=2
    )
    _trigger_boundary_detection("job-12")
    assert storage.get_status("job-12").false_positive_count == 1

    stub_multi_page_detection(
        boundaries=[_boundary(0, 1), _boundary(1, 1)], page_count=2
    )
    _run_refresh_detection("job-12")

    assert storage.get_status("job-12").false_positive_count == 0
