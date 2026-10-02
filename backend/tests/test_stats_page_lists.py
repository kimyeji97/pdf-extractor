"""
REQ-P06 Phase 5 — 상태 파일에 쪽 목록 저장 검증 계약

검증 계약: docs/plans/PLAN-P06-api-latency-during-analysis.md `## 검증 계약`
케이스: P06-01 ~ P06-04

`/api/stats/detail`이 대상 job마다 경계·수동 파일을 순차로 읽던 것(미탐지 6.4s)을 없앤다 —
개수를 캐시하는 자리(`compute_question_stats`)에서 쪽 목록도 함께 내고 상태 파일에 저장한다.
쪽 목록이 없는 옛 상태 파일은 지금처럼 파일을 읽어 계산한다.
"""
import pytest


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
        "created_at": "2026-10-02T00:00:00+00:00",
    }


MANUAL_BODY = {"title": "테스트 수동 문항", "region": {"x0": 0, "y0": 0, "x1": 100, "y1": 50}}


def test_P06_01_compute_question_stats가_쪽_목록_3종을_낸다():
    """근거: PLAN § 결정 — "상태 파일에 쪽 목록을 함께 저장" """
    from app.services.question_stats_service import compute_question_stats

    boundaries = [
        _boundary(2, 3, is_false_positive=True),
        _boundary(1, 1, is_false_positive=True),
        _boundary(1, 2, is_false_positive=True),
        _boundary(0, 4),
    ]
    manual = [_manual(3, "m1"), _manual(3, "m2")]

    stats = compute_question_stats(boundaries, manual, 5)

    assert (stats["false_positive_pages"], stats["manual_pages"], stats["undetected_pages"]) == (
        [1, 2], [3], [4],
    )


@pytest.mark.parametrize("field,pages_attr", [
    ("false_positive_count", "false_positive_pages"),
    ("manual_count", "manual_pages"),
    ("undetected_page_count", "undetected_pages"),
])
def test_P06_02_쪽_목록이_있으면_경계_수동_파일을_읽지_않는다(
    authed_client, make_job, monkeypatch, field, pages_attr
):
    """근거: PLAN § 결정 — "상세 조회가 경계·수동 문항 파일을 읽지 않는다" """
    from app.services import storage

    job = make_job("job-p06-02")
    setattr(job, field, 2)
    setattr(job, pages_attr, [3, 7])
    job.total_pages = 10
    storage.put_status(job)

    def _forbidden(*args, **kwargs):
        raise AssertionError("쪽 목록이 캐시돼 있으면 경계·수동 파일을 읽으면 안 된다")

    monkeypatch.setattr(storage, "get_boundaries_cache", _forbidden)
    monkeypatch.setattr(storage, "get_manual_questions", _forbidden)

    res = authed_client.get("/api/stats/detail", params={"field": field})

    assert [item["pages"] for item in res.json()["items"]] == [[3, 7]]


def test_P06_03_쪽_목록_없는_옛_상태_파일은_파일을_읽어_계산(authed_client, make_job):
    """근거: PLAN § 결정 — "쪽 목록이 없는 옛 상태 파일은 지금처럼 읽어서 계산" """
    from app.services import storage

    job = make_job("job-p06-03")
    job.false_positive_count = 2
    storage.put_status(job)   # false_positive_pages 없음 = 옛 상태 파일
    storage.save_boundaries_cache("job-p06-03", [
        _boundary(4, 1, is_false_positive=True),
        _boundary(1, 2, is_false_positive=True),
        _boundary(1, 3),
    ])

    res = authed_client.get("/api/stats/detail", params={"field": "false_positive_count"})

    assert [item["pages"] for item in res.json()["items"]] == [[1, 4]]


def test_P06_04_수동_문항_추가가_상태_파일_manual_pages를_갱신(authed_client, make_job):
    """근거: PLAN § 결정 — "상태 파일에 쪽 목록을 함께 저장" """
    from app.services import storage

    make_job("job-p06-04")
    storage.save_manual_questions("job-p06-04", [_manual(2, "m1")])

    res = authed_client.post("/api/jobs/job-p06-04/pages/0/questions/manual", json=MANUAL_BODY)

    assert res.status_code == 201
    assert storage.get_status("job-p06-04").manual_pages == [0, 2]


# ── 옛 상태 파일 채우기 (서버 시작 시 1회) ────────────────
#
# 대상: `question_stats_service.backfill_page_lists()` — 목록은 `storage.list_jobs()`로 얻고,
# 서버 시작(lifespan)이 이 함수를 **모듈 속성으로** 부른다(P06-18이 바꿔 끼운다).

def _old_job(make_job, job_id, total_pages):
    """쪽 목록이 없는 옛 상태 파일."""
    from app.services import storage

    job = make_job(job_id)
    job.total_pages = total_pages
    job.false_positive_count = 1
    job.manual_count = 1
    storage.put_status(job)
    return job


def test_P06_15_시작_채우기가_옛_job에_쪽_목록_3종을_채운다(make_job):
    """근거: PLAN § 결정 — "쪽 목록이 없는 SOURCE job만 경계·수동 파일을 읽어 쪽 목록을 저장" """
    from app.services import question_stats_service, storage

    _old_job(make_job, "job-p06-15", total_pages=4)
    storage.save_boundaries_cache("job-p06-15", [
        _boundary(0, 1), _boundary(1, 2, is_false_positive=True),
    ])
    storage.save_manual_questions("job-p06-15", [_manual(2, "m1")])

    question_stats_service.backfill_page_lists()

    job = storage.get_status("job-p06-15")
    assert (job.false_positive_pages, job.manual_pages, job.undetected_pages) == ([1], [2], [3])


def test_P06_16_이미_쪽_목록이_있는_job은_건너뛴다(make_job):
    """근거: PLAN § 결정 — "이미 있는 job은 건너뛴다(재실행 안전)" """
    from app.services import question_stats_service, storage

    job = _old_job(make_job, "job-p06-16", total_pages=4)
    job.false_positive_pages, job.manual_pages, job.undetected_pages = [9], [8], [7]
    storage.put_status(job)
    storage.save_boundaries_cache("job-p06-16", [_boundary(1, 2, is_false_positive=True)])

    question_stats_service.backfill_page_lists()

    job = storage.get_status("job-p06-16")
    assert (job.false_positive_pages, job.manual_pages, job.undetected_pages) == ([9], [8], [7])


def test_P06_17_채우는_사이_바뀐_상태를_덮지_않는다(make_job, monkeypatch):
    """근거: PLAN § 제약 — "쓰기 직전에 최신 상태를 다시 읽어 쪽 목록만 얹는다" """
    from app.services import question_stats_service, storage

    stale = _old_job(make_job, "job-p06-17", total_pages=2).model_copy()
    stale.filename = "stale.pdf"
    latest = storage.get_status("job-p06-17")
    latest.filename = "latest.pdf"          # 목록을 읽은 뒤 감지·편집이 바꾼 값
    storage.put_status(latest)
    monkeypatch.setattr(storage, "list_jobs", lambda: [stale])

    question_stats_service.backfill_page_lists()

    job = storage.get_status("job-p06-17")
    assert (job.filename, job.undetected_pages) == ("latest.pdf", [0, 1])


def test_P06_18_서버_시작이_채우기를_부르되_기동을_막지_않는다(monkeypatch):
    """근거: PLAN § 제약 — "기동을 막지 않게" """
    import threading
    import time

    from fastapi.testclient import TestClient

    from app.main import app
    from app.services import question_stats_service

    called, release = threading.Event(), threading.Event()

    def _slow_backfill():
        called.set()
        release.wait(5)

    monkeypatch.setattr(question_stats_service, "backfill_page_lists", _slow_backfill)

    started = time.monotonic()
    try:
        with TestClient(app):
            entered = time.monotonic() - started
            was_called = called.wait(2)
    finally:
        release.set()

    assert (was_called, entered < 1) == (True, True)
