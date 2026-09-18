"""
REQ-27 Phase 1 — 사용자 모델 + 회원가입/로그인/토큰 발급 검증 계약

검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약`
케이스: 27-01 ~ 27-11

계획서가 정하지 않은 것들을 **이 파일이 검증 계약으로 고정한다**(REQ-29 각주·워터마크
CRUD 선례와 동일한 방식):
    POST /api/auth/signup  → 201 {user_id, email, role}
    POST /api/auth/login   → 200 {access_token, refresh_token, token_type}
    POST /api/auth/refresh → 200 {access_token, refresh_token}   (rolling)

사용자 저장 경로는 `users/{user_id}.json` — 표지·각주·워터마크와 같은 파일 기반 패턴을 따른다.

access 1시간 / refresh 7일 수명(계획서 § 결정)은 토큰을 실제로 디코드해 `exp` 클레임으로
확인한다. 서명 라이브러리(PyJWT/python-jose 등)는 구현이 아직 정하지 않았으므로, 서명
검증 없이 payload만 수동으로 base64url 디코드해 구현 선택에 결합되지 않게 한다.
"""
import base64
import json
import time

import pytest


def _jwt_payload(token: str) -> dict:
    """서명 라이브러리에 의존하지 않고 JWT payload만 읽는다 (서명 검증 없음)."""
    segment = token.split(".")[1]
    padded = segment + "=" * (-len(segment) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))


def _signup(client, email="user@example.com", password="correct-horse-battery-staple"):
    return client.post("/api/auth/signup", json={"email": email, "password": password})


# ── 회원가입 ──────────────────────────────────────────────

def test_27_01_가입시_201과_user_id_역할기본값_user(client):
    """근거: PLAN § Phase 1 완료 기준 — "`role`(admin/user) 필드가 사용자 모델에 있고 회원가입 기본값은 `user`" """
    res = _signup(client)

    assert res.status_code == 201
    body = res.json()
    assert body["user_id"]
    assert body["role"] == "user"


def test_27_02_가입_응답에_비밀번호가_노출되지_않는다(client):
    """근거: 검증 계약이 관례로 고정 — 계획서에 명시 없음"""
    res = _signup(client, password="correct-horse-battery-staple")

    body_str = json.dumps(res.json())
    assert "correct-horse-battery-staple" not in body_str
    assert "password" not in res.json()


def test_27_03_저장된_비밀번호는_평문이_아니다(client, isolated_storage):
    """근거: 검증 계약이 관례로 고정 — 계획서에 명시 없음"""
    created = _signup(client, password="correct-horse-battery-staple").json()

    stored = json.loads((isolated_storage / "users" / f"{created['user_id']}.json").read_text())

    assert "correct-horse-battery-staple" not in json.dumps(stored)


def test_27_04_이미_가입된_이메일로_재가입시_409(client):
    """근거: 검증 계약이 관례로 고정 — 각주·워터마크 CRUD 선례(존재 위반 시 명시적 상태 코드)"""
    _signup(client, email="dup@example.com")

    res = _signup(client, email="dup@example.com")

    assert res.status_code == 409


# ── 로그인 ────────────────────────────────────────────────

def test_27_05_로그인시_200과_access_refresh_토큰(client):
    """근거: PLAN § Phase 1 완료 기준 — "로그인 → access/refresh 토큰 발급까지 API로 확인됨" """
    _signup(client, email="login@example.com", password="correct-horse-battery-staple")

    res = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "correct-horse-battery-staple"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["access_token"]
    assert body["refresh_token"]


def test_27_06_access_token_만료는_1시간_후(client):
    """근거: PLAN § 결정 — "토큰 수명: access 1시간, refresh 7일" """
    _signup(client, email="exp-access@example.com", password="correct-horse-battery-staple")
    before = time.time()

    res = client.post(
        "/api/auth/login",
        json={"email": "exp-access@example.com", "password": "correct-horse-battery-staple"},
    )

    exp = _jwt_payload(res.json()["access_token"])["exp"]
    assert abs(exp - (before + 3600)) < 30


def test_27_07_refresh_token_만료는_7일_후(client):
    """근거: PLAN § 결정 — "토큰 수명: access 1시간, refresh 7일" """
    _signup(client, email="exp-refresh@example.com", password="correct-horse-battery-staple")
    before = time.time()

    res = client.post(
        "/api/auth/login",
        json={"email": "exp-refresh@example.com", "password": "correct-horse-battery-staple"},
    )

    exp = _jwt_payload(res.json()["refresh_token"])["exp"]
    assert abs(exp - (before + 7 * 24 * 3600)) < 30


def test_27_08_존재하지_않는_이메일로_로그인시_401(client):
    """근거: 검증 계약이 관례로 고정 — 계획서에 명시 없음"""
    res = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )

    assert res.status_code == 401


def test_27_09_틀린_비밀번호로_로그인시_401(client):
    """근거: 검증 계약이 관례로 고정 — 계획서에 명시 없음"""
    _signup(client, email="wrongpw@example.com", password="correct-horse-battery-staple")

    res = client.post(
        "/api/auth/login",
        json={"email": "wrongpw@example.com", "password": "not-the-password"},
    )

    assert res.status_code == 401


# ── 토큰 갱신 ─────────────────────────────────────────────

def test_27_10_유효한_refresh_token으로_갱신시_새_토큰_쌍을_받는다(client):
    """근거: PLAN § 결정 — "rolling refresh(갱신 때마다 refresh도 재발급해 만료 연장)" """
    _signup(client, email="rolling@example.com", password="correct-horse-battery-staple")
    login = client.post(
        "/api/auth/login",
        json={"email": "rolling@example.com", "password": "correct-horse-battery-staple"},
    ).json()

    res = client.post("/api/auth/refresh", json={"refresh_token": login["refresh_token"]})

    assert res.status_code == 200
    body = res.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["refresh_token"] != login["refresh_token"]


def test_27_11_위조된_refresh_token으로_갱신시_401(client):
    """근거: 검증 계약이 관례로 고정 — 계획서에 명시 없음"""
    res = client.post("/api/auth/refresh", json={"refresh_token": "not-a-valid-token"})

    assert res.status_code == 401
