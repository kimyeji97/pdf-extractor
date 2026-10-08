"""
REQ-C12 Phase 1 — 가입 승인

검증 계약: docs/plans/PLAN-C12-ops-console-accounts-server.md `## 검증 계약`
케이스: C12-01 ~ C12-05 · C12-08

새 가입자는 승인 대기(`pending`)이고 로그인이 403으로 거부된다. `status`가 없는 기존 레코드는
`active`로 취급한다. 승인은 운영 콘솔이 부를 `auth_service.set_user_status()`로 한다
(콘솔 스크립트는 임포트 시점에 `sys.argv`를 읽어 테스트로 임포트할 수 없다).
"""
import json

import pytest

EMAIL, PASSWORD = "c12@example.com", "correct-horse-battery-staple"


def _signup(client):
    return client.post("/api/auth/signup", json={"email": EMAIL, "password": PASSWORD})


def _login(client):
    return client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD})


def _stored(isolated_storage, user_id) -> dict:
    return json.loads((isolated_storage / "users" / f"{user_id}.json").read_text(encoding="utf-8"))


def test_C12_01_가입하면_status가_pending으로_저장된다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "새 가입자는 `status: pending`으로 저장된다" """
    res = _signup(client)

    assert (res.json()["status"], _stored(isolated_storage, res.json()["user_id"])["status"]) == ("pending", "pending")


def test_C12_02_pending_사용자_로그인은_403과_승인_안내(client):
    """근거: PLAN § 결정 — "로그인 거부 + \"관리자 승인 후 이용할 수 있습니다\" 안내" """
    _signup(client)

    res = _login(client)

    assert (res.status_code, "관리자 승인 후 이용할 수 있습니다" in res.json().get("detail", "")) == (403, True)


def test_C12_03_status가_없는_기존_레코드는_로그인된다(client, isolated_storage):
    """근거: PLAN § 결정 — "`status`가 없는 레코드 = `active`" """
    user_id = _signup(client).json()["user_id"]
    path = isolated_storage / "users" / f"{user_id}.json"
    legacy = json.loads(path.read_text(encoding="utf-8"))
    legacy.pop("status", None)
    path.write_text(json.dumps(legacy), encoding="utf-8")

    assert _login(client).status_code == 200


def test_C12_04_active로_승인하면_저장되고_로그인된다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "승인 대기를 승인·차단할 수 있다" """
    from app.services import auth_service

    user_id = _signup(client).json()["user_id"]
    auth_service.set_user_status(user_id, "active")

    assert (_stored(isolated_storage, user_id)["status"], _login(client).status_code) == ("active", 200)


def test_C12_05_정해진_세_값_밖의_status는_ValueError(client):
    """근거: PLAN § 결정 — "— `pending` · `active` · `blocked`" """
    from app.services import auth_service

    user_id = _signup(client).json()["user_id"]

    with pytest.raises(ValueError):
        auth_service.set_user_status(user_id, "approved")


def test_C12_08_blocked_사용자_로그인은_403과_제한_안내(client):
    """근거: PLAN § 결정 — "`active`가 아니면 로그인 거부" (리뷰 회차 0 — pending만 막으면 [차단]이 로그인을 연다)"""
    from app.services import auth_service

    user_id = _signup(client).json()["user_id"]
    auth_service.set_user_status(user_id, "blocked")

    res = _login(client)

    assert (res.status_code, "이용이 제한된 계정" in res.json().get("detail", "")) == (403, True)
