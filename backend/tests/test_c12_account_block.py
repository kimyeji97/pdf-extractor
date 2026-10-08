"""
REQ-C12 Phase 2 — 계정 차단

검증 계약: docs/plans/PLAN-C12-ops-console-accounts-server.md `## 검증 계약`
케이스: C12-09 ~ C12-14 · C12-17

차단은 **즉시** — 로그인뿐 아니라 토큰 갱신·이미 받은 토큰(헤더·쿠키)으로 하는 요청도 403
"이용이 제한된 계정"이다. 열린 알림 스트림은 heartbeat 주기 안에 끝난다. 데이터는 지우지 않는다.
상태 변경은 운영 콘솔이 부르는 `auth_service.set_user_status()`로 한다.
"""
import asyncio
import json

import pytest

PASSWORD = "correct-horse-battery-staple"
BLOCKED = "이용이 제한된 계정"


def _active_user(client, email):
    """가입 → 승인 → 로그인. 차단 전의 정상 세션을 만든다."""
    from app.services import auth_service

    user_id = client.post("/api/auth/signup", json={"email": email, "password": PASSWORD}).json()["user_id"]
    auth_service.set_user_status(user_id, "active")
    tokens = client.post("/api/auth/login", json={"email": email, "password": PASSWORD}).json()
    return user_id, tokens


def _block(user_id):
    from app.services import auth_service

    auth_service.set_user_status(user_id, "blocked")


def _is_blocked_response(res) -> tuple:
    return res.status_code, BLOCKED in res.json().get("detail", "")


def test_C12_09_차단된_사용자의_refresh는_403(client):
    """근거: PLAN § 작업 단계 — "`blocked` 사용자는 로그인·토큰 갱신·인증 요청이 모두 거부된다(이미 로그인한 세션 포함)" """
    user_id, tokens = _active_user(client, "c12-09@example.com")
    _block(user_id)

    res = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})

    assert _is_blocked_response(res) == (403, True)


def test_C12_10_차단_전에_받은_access_토큰으로_한_요청도_403(client):
    """근거: PLAN § 작업 단계 — "`blocked` 사용자는 로그인·토큰 갱신·인증 요청이 모두 거부된다(이미 로그인한 세션 포함)" """
    user_id, tokens = _active_user(client, "c12-10@example.com")
    _block(user_id)

    res = client.get("/api/jobs", headers={"Authorization": f"Bearer {tokens['access_token']}"})

    assert _is_blocked_response(res) == (403, True)


def test_C12_11_차단되면_쿠키_인증_요청도_403(isolated_storage):
    """근거: PLAN § 제약 — "쿠키 인증(`get_current_user_allow_cookie`, 계약 #31)도 같은 함수를 거치는지 확인할 것" """
    from fastapi.testclient import TestClient

    from app.main import app

    c = TestClient(app, base_url="https://testserver")  # Secure 쿠키는 https 요청에만 실린다(계약 #31)
    user_id, _ = _active_user(c, "c12-11@example.com")
    _block(user_id)

    res = c.get("/api/jobs/any-job/pages/0/thumbnail")  # 헤더 없음 — 로그인 응답이 심은 쿠키만

    assert _is_blocked_response(res) == (403, True)


def test_C12_12_차단을_풀면_다시_로그인된다(client):
    """근거: PLAN § 작업 단계 — "운영 콘솔에서 차단·해제할 수 있다" """
    from app.services import auth_service

    user_id, _ = _active_user(client, "c12-12@example.com")
    _block(user_id)
    auth_service.set_user_status(user_id, "active")

    res = client.post("/api/auth/login", json={"email": "c12-12@example.com", "password": PASSWORD})

    assert res.status_code == 200


def test_C12_13_차단해도_사용자의_작업_레코드는_남는다(client, isolated_storage, make_job):
    """근거: PLAN § 작업 단계 — "차단 사용자의 데이터는 남아 있다" """
    from app.services import storage

    user_id, _ = _active_user(client, "c12-13@example.com")
    job = make_job("c12-13-job")
    job.owner_id = user_id
    storage.put_status(job)
    _block(user_id)

    assert storage.get_status("c12-13-job").owner_id == user_id


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_C12_14_열린_스트림은_차단되면_heartbeat_주기_안에_끝난다(client):
    """근거: PLAN § 결정 — "`active`가 아니면 닫는다" """
    from app.routers.notification import event_stream
    from app.services import storage

    user_id, _ = _active_user(client, "c12-14@example.com")
    gen = event_stream(last_event_id=None, heartbeat_s=0.05, user=storage.get_user(user_id))
    await gen.__anext__()  # ": connected"
    _block(user_id)

    async def _drain():
        async for _ in gen:
            pass

    await asyncio.wait_for(_drain(), timeout=2.0)  # 끝나지 않으면 TimeoutError로 실패


def test_C12_17_admin_계정은_차단할_수_없다(client, isolated_storage):
    """근거: PLAN § 결정 — "admin 계정은 차단할 수 없다" """
    from app.services import auth_service

    user_id, _ = _active_user(client, "c12-17@example.com")
    path = isolated_storage / "users" / f"{user_id}.json"
    user = json.loads(path.read_text(encoding="utf-8"))
    user["role"] = "admin"
    path.write_text(json.dumps(user), encoding="utf-8")

    with pytest.raises(ValueError):
        auth_service.set_user_status(user_id, "blocked")
