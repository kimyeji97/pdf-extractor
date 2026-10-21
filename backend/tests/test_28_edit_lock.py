"""
REQ-28 Phase 3 — 같은 job 동시 편집 잠금 검증 계약

검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약`
케이스: 28-26 ~ 28-27

무대:
  - 쓰기 경로는 "읽고-고치고-통째로 쓰기"다. 경쟁 창을 넓히려고 **읽기 직후 잠깐 멈추는** 대역을
    `storage` 모듈 이름에 덮는다(라우터가 호출 시점에 `storage.<함수>`를 찾으므로 여기서 갈면 된다).
  - 요청은 스레드마다 별도 TestClient 로 보낸다. 잠금이 없으면 뒤에 쓴 쪽이 앞의 변경을 덮는다.
"""
import threading
import time

from fastapi.testclient import TestClient

from app.main import app
from app.services import storage
from tests.test_auth_authorization import _headers, _make_job, _signup_and_login

N = 8
PAUSE = 0.05


def _slow_reader(monkeypatch, name):
    original = getattr(storage, name)

    def _slow(*a, **kw):
        data = original(*a, **kw)
        time.sleep(PAUSE)
        return data

    monkeypatch.setattr(storage, name, _slow)


def _run_parallel(fns):
    threads = [threading.Thread(target=f) for f in fns]
    for t in threads:
        t.start()
    for t in threads:
        t.join(10)


def test_28_26_동시_수동_문항_추가가_모두_남는다(client, isolated_storage, monkeypatch):
    """근거: PLAN § 작업 단계 — "같은 job에 수동 문항 추가를 동시에 N건 보내면 N건이 모두 남는다" """
    a = _signup_and_login(client, "28-26-owner@example.com")
    _make_job(isolated_storage, "28-26-job", owner_id=a["user_id"])
    _slow_reader(monkeypatch, "get_manual_questions")

    def _add(i):
        return lambda: TestClient(app).post(
            "/api/jobs/28-26-job/pages/0/questions/manual",
            json={"title": f"q{i}", "region": {"x0": 0, "y0": 0, "x1": 10, "y1": 10}},
            headers=_headers(a["access_token"]),
        )

    _run_parallel([_add(i) for i in range(N)])

    assert len(storage.get_manual_questions("28-26-job")) == N


def test_28_27_동시_자동_문항_제목_수정이_모두_반영된다(client, isolated_storage, monkeypatch):
    """근거: PLAN § 작업 단계 — "같은 job의 쓰기 경로(...)를 job 단위 잠금 안에서 읽고 쓴다" """
    a = _signup_and_login(client, "28-27-owner@example.com")
    _make_job(isolated_storage, "28-27-job", owner_id=a["user_id"])
    storage.save_boundaries_cache("28-27-job", [
        {"number": i + 1, "page_index": 0, "y_top": 100.0 * i, "y_bottom": 100.0 * i + 90,
         "col": 0, "col_x0": 50.0, "col_x1": 545.0}
        for i in range(N)
    ])
    _slow_reader(monkeypatch, "get_boundaries_cache")

    def _rename(num):
        return lambda: TestClient(app).patch(
            f"/api/jobs/28-27-job/pages/0/questions/{num}",
            json={"title": f"t{num}"},
            headers=_headers(a["access_token"]),
        )

    _run_parallel([_rename(i + 1) for i in range(N)])

    titles = [b.get("title") for b in storage.get_boundaries_cache("28-27-job")]
    assert titles == [f"t{i + 1}" for i in range(N)]
