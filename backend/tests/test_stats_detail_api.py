"""
REQ-F12 Phase 2 — `GET /api/stats/detail` 검증 계약

검증 계약: docs/plans/PLAN-F12-detection-stats-dashboard.md `## 검증 계약`
케이스: F12-18 ~ F12-24

계획서 § 결정 "아코디언 상세 데이터 출처"가 고정한 계약:
    GET /api/stats/detail?field=<processing_count|undetected_page_count|
                                  false_positive_count|manual_count>
    → { "field": "...", "items": [ {job_id, filename, workbook_name, count, pages}, ... ] }

`pages`는 `false_positive_count`·`manual_count`·`undetected_page_count`일 때만 채우고
(그 지표가 걸린 페이지 번호 목록), `processing_count`는 `count`·`pages` 둘 다 `null`이다.
`SOURCE` job만, 그 field 값이 0보다 큰 job만 포함한다.

Phase 1 필드(`false_positive_count` 등)는 이미 구현돼 있으므로 여기서는 **job 상태에
직접 대입**해 "이 job이 걸리는가"를 결정하고, `pages` 응답은 boundaries/manual 캐시를
직접 심어 검증한다 — 엔드포인트는 필터링엔 캐시된 카운트를, 페이지 번호엔 원본 캐시를
읽는다는 계획서 설계를 그대로 따른 것(둘을 분리해 심어야 "필터"와 "페이지 산출" 각각이
제대로 동작하는지 갈라서 본다).
"""
import pytest

from app.models.schemas import BoundariesStatus, JobType


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


def _items_by_id(res):
    return {item["job_id"]: item for item in res.json()["items"]}


# ── processing_count ──────────────────────────────────────

def test_F12_18_processing_count는_PROCESSING_job만_count_pages는_null(client, make_job):
    """근거: PLAN § 결정 — "`processing_count`는 `count`·`pages` 둘 다 `null`(페이지 개념이 없음)" """
    from app.services import storage

    j1 = make_job("job-processing")
    j1.boundaries_status = BoundariesStatus.PROCESSING
    storage.put_status(j1)

    j2 = make_job("job-done")
    j2.boundaries_status = BoundariesStatus.DONE
    storage.put_status(j2)

    res = client.get("/api/stats/detail", params={"field": "processing_count"})
    items = _items_by_id(res)

    assert set(items.keys()) == {"job-processing"}
    assert items["job-processing"]["count"] is None
    assert items["job-processing"]["pages"] is None


# ── false_positive_count ─────────────────────────────────

def test_F12_19_false_positive_count는_오탐_페이지_번호_목록을_준다(client, make_job):
    """근거: PLAN § 결정 — "`false_positive_count`·`manual_count`·`undetected_page_count`일 때만 채우고(해당 지표가 걸린 페이지 번호 목록)" """
    from app.services import storage

    job = make_job("job-fp")
    job.false_positive_count = 2
    storage.put_status(job)
    storage.save_boundaries_cache("job-fp", [
        _boundary(0, 1, is_false_positive=True),
        _boundary(0, 2, is_false_positive=False),
        _boundary(2, 1, is_false_positive=True),
    ])

    res = client.get("/api/stats/detail", params={"field": "false_positive_count"})
    items = _items_by_id(res)

    assert items["job-fp"]["count"] == 2
    assert sorted(items["job-fp"]["pages"]) == [0, 2]


# ── manual_count ──────────────────────────────────────────

def test_F12_20_manual_count는_수동문항_페이지_번호_목록을_준다(client, make_job):
    """근거: PLAN § 결정 — "`false_positive_count`·`manual_count`·`undetected_page_count`일 때만 채우고(해당 지표가 걸린 페이지 번호 목록)" """
    from app.services import storage

    job = make_job("job-manual")
    job.manual_count = 2
    storage.put_status(job)
    storage.save_manual_questions("job-manual", [
        _manual(1, "m1"),
        _manual(3, "m2"),
    ])

    res = client.get("/api/stats/detail", params={"field": "manual_count"})
    items = _items_by_id(res)

    assert items["job-manual"]["count"] == 2
    assert sorted(items["job-manual"]["pages"]) == [1, 3]


# ── undetected_page_count ─────────────────────────────────

def test_F12_21_undetected_page_count는_실제_미탐지_페이지_번호를_준다(client, make_job):
    """근거: PLAN § 결정 — "`false_positive_count`·`manual_count`·`undetected_page_count`일 때만 채우고(해당 지표가 걸린 페이지 번호 목록)" """
    from app.services import storage

    job = make_job("job-undetected")
    job.undetected_page_count = 2
    job.total_pages = 3
    storage.put_status(job)
    storage.save_boundaries_cache("job-undetected", [_boundary(0, 1)])
    # 페이지 1·2는 자동·수동 어느 쪽도 없어 미탐지

    res = client.get("/api/stats/detail", params={"field": "undetected_page_count"})
    items = _items_by_id(res)

    assert sorted(items["job-undetected"]["pages"]) == [1, 2]
    assert items["job-undetected"]["count"] == len(items["job-undetected"]["pages"])


# ── 0-값 제외 ──────────────────────────────────────────────

def test_F12_22_해당_field가_0인_job은_목록에서_빠진다(client, make_job):
    """근거: PLAN § 결정 — "그 field 값이 0보다 큰 job만 포함" """
    from app.services import storage

    job = make_job("job-zero")
    job.false_positive_count = 0
    storage.put_status(job)

    res = client.get("/api/stats/detail", params={"field": "false_positive_count"})

    assert "job-zero" not in _items_by_id(res)


# ── EXPORT 제외 ────────────────────────────────────────────

def test_F12_23_EXPORT_job은_제외된다(client, make_job):
    """근거: PLAN § 결정 — "`SOURCE` job만" """
    from app.services import storage

    job = make_job("job-export", job_type=JobType.EXPORT)
    job.false_positive_count = 3
    storage.put_status(job)
    storage.save_boundaries_cache("job-export", [_boundary(0, 1, is_false_positive=True)])

    res = client.get("/api/stats/detail", params={"field": "false_positive_count"})

    assert "job-export" not in _items_by_id(res)


# ── 잘못된 field ───────────────────────────────────────────

def test_F12_24_잘못되거나_없는_field는_4xx(client):
    """근거: PLAN § 결정 — "`field=<processing_count\\|undetected_page_count\\|false_positive_count\\|manual_count>`" """
    invalid = client.get("/api/stats/detail", params={"field": "workbook_count"})
    missing = client.get("/api/stats/detail")

    assert 400 <= invalid.status_code < 500
    assert 400 <= missing.status_code < 500
