"""
REQ-28 Phase 8 — 동시 편집 후속 검증 계약

검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약`
케이스: 28-63 · 28-66 · 28-67

무대:
  - 28-63: 감지 함수 대역 안에서 상태 파일 이름을 바꿔 "재감지 도중 편집자가 이름을 바꿨다"를 만든다
  - 28-66·67: 잠금을 테스트가 직접 잡고 요청을 다른 스레드에서 보내 "끼어든 순간"을 고정한다
"""
import json
import threading
import time

from tests.test_auth_authorization import _headers, _make_job, _signup_and_login
from tests.test_28_sharing_access import _share


def test_28_63_재감지_중_바뀐_이름이_재감지_뒤에도_남는다(make_job, fake_pdf, monkeypatch):
    """근거: PLAN § 결정 — "재감지는 쓸 때마다 상태를 다시 읽고 감지 필드만 바꿔 편집 잠금 안에서 쓴다" """
    from app.routers import browse as browse_router
    from app.services import storage

    make_job("28-63-job")

    def _detect_while_renamed(pdf_path):
        job = storage.get_status("28-63-job")
        job.workbook_name = "편집자가 바꾼 이름"
        storage.put_status(job)
        return []

    monkeypatch.setattr(browse_router, "detect_question_boundaries", _detect_while_renamed)
    monkeypatch.setattr(browse_router.thumbnail_service, "get_page_info", lambda b: [{"width": 595, "height": 842}])
    monkeypatch.setattr(browse_router.prewarm_service, "prewarm_all_thumbnails", lambda *a, **kw: None)

    browse_router._run_refresh_detection("28-63-job")

    assert storage.get_status("28-63-job").workbook_name == "편집자가 바꾼 이름"


def test_28_66_편집_잠금이_잡혀_있는_동안_삭제가_끝나지_않는다(client, isolated_storage):
    """근거: PLAN § 결정 — "job 삭제도 편집 잠금을 잡는다" """
    from app.routers import browse as browse_router

    a = _signup_and_login(client, "28-66-owner@example.com")
    _make_job(isolated_storage, "28-66-job", owner_id=a["user_id"])
    with browse_router._job_locks_guard:
        lock = browse_router._job_locks.setdefault("28-66-job", threading.Lock())
    lock.acquire()
    worker = threading.Thread(
        target=lambda: client.delete("/api/jobs/28-66-job", headers=_headers(a["access_token"]))
    )
    try:
        worker.start()
        worker.join(0.5)
        finished_while_locked = not worker.is_alive()
    finally:
        lock.release()
        worker.join(5)

    assert finished_while_locked is False


def test_28_67_역할_변경_도중_해제가_끼어들면_되살아나지_않는다(client, isolated_storage):
    """근거: PLAN § 결정 — "공유 역할 변경은 존재 확인과 쓰기를 인덱스 잠금 안에서 한 번에 한다" """
    from app.services import share_service

    a = _signup_and_login(client, "28-67-owner@example.com")
    b = _signup_and_login(client, "28-67-target@example.com")
    _make_job(isolated_storage, "28-67-job", owner_id=a["user_id"])
    _share(isolated_storage, "28-67-job", b["user_id"], "editor")
    index = isolated_storage / "shares" / "index.json"

    share_service._index_lock.acquire()
    worker = threading.Thread(
        target=lambda: client.patch(
            f"/api/jobs/28-67-job/shares/{b['user_id']}", json={"role": "viewer"}, headers=_headers(a["access_token"])
        )
    )
    try:
        worker.start()
        time.sleep(0.3)  # 변경 요청이 존재 확인까지 가서 잠금 앞에 선다
        index.write_text(json.dumps({}), encoding="utf-8")  # 그 사이 해제가 끝났다
    finally:
        share_service._index_lock.release()
        worker.join(5)

    assert json.loads(index.read_text(encoding="utf-8")).get("28-67-job", []) == []


def _stub_refresh(monkeypatch, *, detect=None, prewarm=None):
    from app.routers import browse as browse_router

    monkeypatch.setattr(browse_router, "detect_question_boundaries", detect or (lambda pdf_path: []))
    monkeypatch.setattr(browse_router.thumbnail_service, "get_page_info", lambda b: [{"width": 595, "height": 842}])
    monkeypatch.setattr(browse_router.prewarm_service, "prewarm_all_thumbnails", prewarm or (lambda *a, **kw: None))
    return browse_router


def test_28_68_재감지_도중_지운_job은_되살아나지_않는다(make_job, fake_pdf, monkeypatch):
    """근거: PLAN § 결정 — "다시 읽었는데 상태가 없으면(그 사이 삭제) 쓰지 않는다" """
    from app.services import storage

    make_job("28-68-job")

    def _detect_then_deleted(pdf_path):
        storage.delete_job("28-68-job")
        return []

    browse_router = _stub_refresh(monkeypatch, detect=_detect_then_deleted)

    browse_router._run_refresh_detection("28-68-job")

    assert storage.get_status("28-68-job") is None


def test_28_69_썸네일_준비_중_바뀐_수동_문항_수가_남는다(make_job, fake_pdf, monkeypatch):
    """근거: PLAN § 결정 — "성공 경로가 저장했으면 마무리에서 다시 쓰지 않는다" """
    from app.services import storage

    make_job("28-69-job")

    def _prewarm_while_manual_added(*args, **kwargs):
        job = storage.get_status("28-69-job")
        job.manual_count = 1
        storage.put_status(job)

    browse_router = _stub_refresh(monkeypatch, prewarm=_prewarm_while_manual_added)

    browse_router._run_refresh_detection("28-69-job")

    assert storage.get_status("28-69-job").manual_count == 1
