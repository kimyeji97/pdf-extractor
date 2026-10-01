"""
REQ-C10 Phase 1 — 문항 조회 API가 원문(`source_text`)을 내려준다

검증 계약: docs/plans/PLAN-C10-question-source-title.md `## 검증 계약`
케이스: C10-08 ~ C10-10

무대: 경계 캐시를 직접 기록한다(B20 `dup_job` 관례). 옛 캐시는 `source_text` 키가 아예 없다 —
원문이 없는 캐시는 재감지 전까지 "문항 N"으로 보여야 하므로(계획서 결정) 조회가 깨지면 안 된다.
"""
import pytest

from app.models.schemas import BoundariesStatus

JOB = "job-c10"
BASE = dict(page_index=0, y_bottom=300.0, col=0, col_x0=50.0, col_x1=545.0)


@pytest.fixture
def cached_job(make_job):
    from app.services import storage

    def _make(boundaries: list[dict]):
        job = make_job(JOB)
        job.boundaries_status = BoundariesStatus.DONE
        storage.put_status(job)
        storage.save_boundaries_cache(JOB, boundaries)
        return job

    return _make


def _auto(items) -> list[dict]:
    return [q for q in items if not q.get("is_manual")]


def test_C10_08_page_list_carries_source_text(authed_client, cached_job):
    cached_job([dict(BASE, number=1, y_top=100.0, source_text="유형 01")])
    res = authed_client.get(f"/api/jobs/{JOB}/pages/0/questions")
    assert [q["source_text"] for q in _auto(res.json()["questions"])] == ["유형 01"]


def test_C10_09_all_list_carries_source_text(authed_client, cached_job):
    cached_job([dict(BASE, number=1, y_top=100.0, source_text="유형 01")])
    res = authed_client.get(f"/api/jobs/{JOB}/questions")
    items = [q for p in res.json()["pages"] for q in p["questions"]]
    assert [q["source_text"] for q in _auto(items)] == ["유형 01"]


def test_C10_10_old_cache_without_source_text(authed_client, cached_job):
    cached_job([dict(BASE, number=1, y_top=100.0)])
    res = authed_client.get(f"/api/jobs/{JOB}/pages/0/questions")
    assert (res.status_code, [q.get("source_text") for q in _auto(res.json()["questions"])]) == (200, [None])
