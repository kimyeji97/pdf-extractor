"""
REQ-28 Phase 4 — 알림 수신자를 공유받은 사람까지 확장 검증 계약

검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약`
케이스: 28-28 ~ 28-31

알림 파일은 `write_notif` 로, 공유는 인덱스 파일로 직접 심는다(쓰기 훅·공유 API와 분리 — F09·B27 관례).
스트림은 라우터의 사용자별 필터 `_for(user, event)` 를 직접 부른다 — 스트림을 열면 heartbeat 를 기다려야 해서
B27 이 같은 함수를 단위로 본 것과 같은 방식이다.
"""
from app.routers import notification as notification_router
from app.services import storage
from tests.test_auth_authorization import _headers, _make_job, _signup_and_login
from tests.test_28_sharing_access import _share


def _feed_ids(client, who):
    res = client.get("/api/notifications", headers=_headers(who["access_token"])).json()
    return [n["job_id"] for n in res["notifications"]]


def _status_event(job_id):
    return {"event": "status", "data": {"job_id": job_id, "boundaries_status": "PROCESSING"}}


def _stage(client, isolated_storage, tag):
    a = _signup_and_login(client, f"28-{tag}-owner@example.com")
    b = _signup_and_login(client, f"28-{tag}-shared@example.com")
    job_id = f"28-{tag}-job"
    _make_job(isolated_storage, job_id, owner_id=a["user_id"])
    return a, b, job_id


def test_28_28_공유받은_사람_피드에_그_job_알림이_든다(client, isolated_storage, write_notif, days_ago):
    """근거: PLAN § 작업 단계 — "`notification_service.can_see`가 소유자 외에 shares도 본다" """
    _, b, job_id = _stage(client, isolated_storage, "28")
    _share(isolated_storage, job_id, b["user_id"], "viewer")
    write_notif(job_id, days_ago(1))

    assert _feed_ids(client, b) == [job_id]


def test_28_29_해제하면_그_job_알림이_피드에서_빠진다(client, isolated_storage, write_notif, days_ago):
    """근거: PLAN § 작업 단계 — "공유 해제 뒤에는 그 job 알림이 상대에게서 빠진다" """
    a, b, job_id = _stage(client, isolated_storage, "29")
    _share(isolated_storage, job_id, b["user_id"], "editor")
    write_notif(job_id, days_ago(1))

    client.delete(f"/api/jobs/{job_id}/shares/{b['user_id']}", headers=_headers(a["access_token"]))

    assert _feed_ids(client, b) == []


def test_28_30_공유받은_사람_스트림에_status_이벤트가_간다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "(SSE status 이벤트 포함)" """
    _, b, job_id = _stage(client, isolated_storage, "30")
    _share(isolated_storage, job_id, b["user_id"], "viewer")

    event = _status_event(job_id)

    assert notification_router._for(storage.get_user(b["user_id"]), event) == event


def test_28_31_공유받지_않은_사람_스트림에는_안_간다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "공유받지 않은 사용자에게는 안 간다" """
    _, _, job_id = _stage(client, isolated_storage, "31")
    stranger = _signup_and_login(client, "28-31-stranger@example.com")

    assert notification_router._for(storage.get_user(stranger["user_id"]), _status_event(job_id)) is None
