"""
REQ-B19 Phase 1 — 조회 경로는 경계 캐시가 없어도 감지를 돌리지 않는다

검증 계약: docs/plans/PLAN-B19-lookup-path-sync-detection.md `## 검증 계약`
케이스: B19-01 ~ B19-10

캐시가 없을 때 조회 3곳(전체 문항·페이지 문항·문항 썸네일)이 요청 안에서
`detect_question_boundaries`를 돌리던 폴백을 걷어낸다. 212쪽은 0.5 vCPU에서 30초를 넘겨
504가 나고, 감지 스레드는 타임아웃 뒤에도 계속 돌아 새로고침마다 쌓였다(TODO §7).

⚠️ 감지 대역은 **빈 목록이 아니라 page 0의 1·2번 문항을 돌려준다.** 빈 목록을 주면 현재
코드에서도 썸네일이 "문항 없음" 404로 떨어져 B19-05가 가짜로 통과한다.
"""
import pytest

from app.models.schemas import BoundariesStatus


@pytest.fixture
def detect_spy(monkeypatch, fake_pdf):
    """browse 모듈에 바인딩된 감지 함수를 호출 횟수를 세는 대역으로 바꾼다."""
    from app.routers import browse as browse_router
    from app.utils.question_parser import QuestionBoundary

    calls = []

    def _fn(pdf_path):
        calls.append(pdf_path)
        return [
            QuestionBoundary(
                number=i + 1, page_index=0,
                y_top=float(100 * i), y_bottom=float(100 * i + 90),
                col=0, col_x0=50.0, col_x1=545.0,
            )
            for i in range(2)
        ]

    monkeypatch.setattr(browse_router, "detect_question_boundaries", _fn)
    return calls


@pytest.fixture
def job_without_cache(make_job):
    """경계 캐시가 없는 job — 기본은 B17 시작 시 전환처럼 FAILED."""
    from app.services import storage

    def _make(status: BoundariesStatus = BoundariesStatus.FAILED, job_id: str = "job-b19"):
        job = make_job(job_id)
        job.boundaries_status = status
        storage.put_status(job)
        assert storage.get_boundaries_cache(job_id) is None
        return job

    return _make


def _status_of(job_id: str) -> BoundariesStatus:
    from app.services import storage

    return storage.get_status(job_id).boundaries_status


# ── 전체 문항 조회 ─────────────────────────────────────────

def test_B19_01_all_questions_no_cache_does_not_detect(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    authed_client.get(f"/api/jobs/{job.job_id}/questions")
    assert detect_spy == []


def test_B19_02_all_questions_no_cache_returns_empty(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    res = authed_client.get(f"/api/jobs/{job.job_id}/questions")
    assert res.status_code == 200
    assert (res.json()["total_count"], res.json()["pages"]) == (0, [])


# ── 페이지 문항 조회 ───────────────────────────────────────

def test_B19_03_page_questions_no_cache_does_not_detect(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    authed_client.get(f"/api/jobs/{job.job_id}/pages/0/questions")
    assert detect_spy == []


def test_B19_04_page_questions_no_cache_returns_empty(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    res = authed_client.get(f"/api/jobs/{job.job_id}/pages/0/questions")
    assert res.status_code == 200
    assert res.json()["questions"] == []


# ── 문항 썸네일 ────────────────────────────────────────────

def test_B19_05_question_thumbnail_no_cache_is_404(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    res = authed_client.get(f"/api/jobs/{job.job_id}/pages/0/questions/1/thumbnail")
    assert res.status_code == 404


def test_B19_06_question_thumbnail_no_cache_does_not_detect(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    authed_client.get(f"/api/jobs/{job.job_id}/pages/0/questions/1/thumbnail")
    assert detect_spy == []


# ── 조회는 상태를 쓰지 않는다 ──────────────────────────────

def test_B19_07_all_questions_keeps_failed_status(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    authed_client.get(f"/api/jobs/{job.job_id}/questions")
    assert _status_of(job.job_id) == BoundariesStatus.FAILED


def test_B19_08_page_questions_keeps_failed_status(authed_client, job_without_cache, detect_spy):
    job = job_without_cache()
    authed_client.get(f"/api/jobs/{job.job_id}/pages/0/questions")
    assert _status_of(job.job_id) == BoundariesStatus.FAILED


@pytest.mark.parametrize(
    "status",
    [BoundariesStatus.PENDING, BoundariesStatus.QUEUED, BoundariesStatus.DONE],
)
def test_B19_09_no_cache_any_status_does_not_detect(authed_client, job_without_cache, detect_spy, status):
    job = job_without_cache(status)
    authed_client.get(f"/api/jobs/{job.job_id}/questions")
    assert detect_spy == []


# ── 캐시가 있으면 그대로 ───────────────────────────────────

def test_B19_10_all_questions_with_cache_returns_cached(authed_client, job_without_cache, detect_spy):
    from app.services import storage

    job = job_without_cache(BoundariesStatus.DONE)
    cached = [
        dict(number=n, page_index=p, y_top=0.0, y_bottom=90.0, col=0, col_x0=50.0, col_x1=545.0)
        for p, n in [(0, 1), (0, 2), (1, 3)]
    ]
    storage.save_boundaries_cache(job.job_id, cached)

    res = authed_client.get(f"/api/jobs/{job.job_id}/questions")
    assert res.json()["total_count"] == 3
