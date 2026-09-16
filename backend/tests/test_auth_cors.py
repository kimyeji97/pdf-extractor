"""
REQ-27 Phase 3 — CORS 제한 검증 계약

검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약`
케이스: 27-42 ~ 27-45

대상은 `GET /health`로 고정한다 — 인증·스토리지 격리와 무관하게 CORS 미들웨어
자체만 검증하는 최소 엔드포인트다(계획서 Phase 3 메모).

허용 도메인은 PLAN § 결정 — "CORS 허용 도메인 | dev 프론트 도메인 + 로컬 개발
(localhost:5173) 포함"에서 고정된 두 값이다:
  - https://dailystudy-workbook-dev.yejicraft-cf.com
  - http://localhost:5173

Starlette `CORSMiddleware` 소스로 확인한 동작(계획서 Phase 3 메모):
  - 허용 안 된 origin의 preflight(OPTIONS)는 400 "Disallowed CORS origin"
  - 단순 GET은 200으로 통과하되 `Access-Control-Allow-Origin` 헤더가 붙지 않는다
"""

_DEV_ORIGIN = "https://dailystudy-workbook-dev.yejicraft-cf.com"
_LOCAL_ORIGIN = "http://localhost:5173"
_DISALLOWED_ORIGIN = "https://evil.example.com"


def test_27_42_dev_origin_요청은_허용된다(client):
    resp = client.get("/health", headers={"Origin": _DEV_ORIGIN})
    assert resp.headers.get("access-control-allow-origin") == _DEV_ORIGIN


def test_27_43_localhost_5173_요청은_허용된다(client):
    resp = client.get("/health", headers={"Origin": _LOCAL_ORIGIN})
    assert resp.headers.get("access-control-allow-origin") == _LOCAL_ORIGIN


def test_27_44_허용되지_않은_origin의_preflight는_400으로_차단된다(client):
    resp = client.options(
        "/health",
        headers={
            "Origin": _DISALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code == 400


def test_27_45_허용되지_않은_origin의_단순_요청에는_CORS_헤더가_없다(client):
    resp = client.get("/health", headers={"Origin": _DISALLOWED_ORIGIN})
    assert "access-control-allow-origin" not in resp.headers
