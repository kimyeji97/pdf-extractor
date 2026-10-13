"""
REQ-B15 Phase 1 — 이미지·파일 GET 쿠키 인증 검증 계약

검증 계약: docs/plans/PLAN-B15-image-auth-cookie.md `## 검증 계약`
케이스: B15-01 ~ B15-16

브라우저 `<img>`는 `Authorization` 헤더를 붙일 수 없다. 기존 케이스는 전부 헤더를 붙이는
`authed_client`로 불러서 이 조건을 재현하지 못했다(계획서 § 배경). 그래서 여기서는
**헤더를 붙이지 않고 쿠키 저장소만 가진 클라이언트**로 부른다.

- 쿠키 클라이언트는 `https://testserver`로 띄운다 — 결정 표의 `Secure` 쿠키는 http 요청에
  실리지 않으므로 http로 띄우면 올바른 구현도 401이 난다.
- 쿠키 이름은 박지 않는다(계획서가 정하지 않았다). 로그인 응답의 `Set-Cookie`를 클라이언트
  쿠키 저장소가 받아 되돌려 보내는 방식으로 검증하고, 헤더 단언은 값(= access token)으로 찾는다.
- 썸네일 3종은 캐시 파일을 미리 심어 PDF 렌더링 없이 인증 경로만 태운다
  (캐시 레이아웃은 CLAUDE.md "로컬 스토리지 디렉토리 구조").

헬퍼는 `test_auth_authorization.py`(REQ-27 Phase 2)의 것을 그대로 가져다 쓴다 —
`test_upload_extract_auth.py`(REQ-B14)와 같은 선례.
"""
import pytest

from tests.test_auth_authorization import (
    _create_cover,
    _create_watermark,
    _headers,
    _make_job,
    _png_bytes,
)

PASSWORD = "correct-horse-battery-staple"
IMAGE_ENDPOINTS = ["page_thumb", "question_thumb", "manual_thumb", "cover", "watermark", "file"]


# ── 헬퍼 ──────────────────────────────────────────────────

def _cookie_client():
    """헤더 없이 쿠키 저장소만 가진 https 클라이언트 — 브라우저 `<img>` 조건."""
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app, base_url="https://testserver")



def _approve(user_id):
    """REQ-C12 — 새 가입자는 승인 대기(pending)라 로그인 전에 승인한다(이 테스트의 의도는 승인과 무관)."""
    from app.services import storage

    user = storage.get_user(user_id)
    user["status"] = "active"
    storage.save_user(user_id, user)


def _signup_login(c, email):
    signup = c.post("/api/auth/signup", json={"email": email, "password": PASSWORD}).json()
    _approve(signup["user_id"])
    res = c.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    return res, {**res.json(), "user_id": signup["user_id"]}


def _cookie_header_with_value(res, value):
    """`Set-Cookie` 중 값이 `value`인 것 (이름을 모르므로 값으로 찾는다)."""
    for raw in res.headers.get_list("set-cookie"):
        name_value = raw.split(";", 1)[0]
        if name_value.split("=", 1)[1] == value:
            return raw
    return None


def _cookie_attrs(raw):
    return [part.strip().lower() for part in raw.split(";")[1:]]


def _seed_images(c, isolated_storage, owner):
    """owner 소유의 이미지 6종을 심고 엔드포인트 이름 → URL 을 돌려준다."""
    job_id = f"b15-job-{owner['user_id'][:8]}"
    _make_job(isolated_storage, job_id, owner_id=owner["user_id"])
    thumbs = isolated_storage / "thumbnails" / job_id
    thumbs.mkdir(parents=True, exist_ok=True)
    png = _png_bytes()
    (thumbs / "page_0.png").write_bytes(png)
    (thumbs / "q_0_1.png").write_bytes(png)
    (thumbs / "manual_0_m1.png").write_bytes(png)

    file_key = f"uploads/{job_id}/original.pdf"
    (isolated_storage / "uploads" / job_id).mkdir(parents=True, exist_ok=True)
    (isolated_storage / file_key).write_bytes(b"%PDF-1.4 fake")

    cover = _create_cover(c, owner["access_token"])
    watermark = _create_watermark(c, owner["access_token"])

    return {
        "page_thumb": f"/api/jobs/{job_id}/pages/0/thumbnail",
        "question_thumb": f"/api/jobs/{job_id}/pages/0/questions/1/thumbnail",
        "manual_thumb": f"/api/jobs/{job_id}/pages/0/questions/manual/m1/thumbnail",
        "cover": f"/api/covers/{cover['cover_id']}/image",
        "watermark": f"/api/watermarks/{watermark['watermark_id']}/image",
        "file": f"/api/files/{file_key}",
        "_cover_id": cover["cover_id"],
    }


@pytest.fixture
def owner_setup(isolated_storage):
    """로그인한 쿠키 클라이언트 + 그 사용자 소유 이미지 6종."""
    c = _cookie_client()
    _, owner = _signup_login(c, "b15-owner@example.com")
    urls = _seed_images(c, isolated_storage, owner)
    return c, owner, urls


# ── B15-01~03 : 로그인·refresh 가 쿠키를 심는다 ───────────────

def test_B15_01_로그인_응답에_access_token_쿠키가_심긴다(isolated_storage):
    """근거: PLAN § 범위 — "로그인·토큰 갱신 응답에서 access token을 **HttpOnly 쿠키**로도 심는다" """
    res, body = _signup_login(_cookie_client(), "b15-01@example.com")

    assert _cookie_header_with_value(res, body["access_token"]) is not None


@pytest.mark.parametrize("attr", ["httponly", "samesite=lax", "secure", "max-age=3600", "path=/api"])
def test_B15_02_로그인_쿠키_속성(isolated_storage, attr):
    """근거: PLAN § 결정 — "`HttpOnly` · `SameSite=Lax` · `Secure`(로컬 http 개발은 설정으로 끔) · `Max-Age=3600` · `Path=/api`" """
    res, body = _signup_login(_cookie_client(), f"b15-02-{attr.split('=')[0]}@example.com")
    raw = _cookie_header_with_value(res, body["access_token"])

    assert raw is not None and attr in _cookie_attrs(raw)


def test_B15_03_refresh_응답에_새_access_token_쿠키가_심긴다(isolated_storage):
    """근거: PLAN § 범위 — "로그인·토큰 갱신 응답에서 access token을 **HttpOnly 쿠키**로도 심는다" """
    c = _cookie_client()
    _, body = _signup_login(c, "b15-03@example.com")

    res = c.post("/api/auth/refresh", json={"refresh_token": body["refresh_token"]})

    assert _cookie_header_with_value(res, res.json()["access_token"]) is not None


# ── B15-04~09 : 헤더 없이 쿠키만으로 이미지·파일 200 ─────────
# 근거(공통): PLAN § 작업 단계 — "헤더 없이 쿠키만 실은 요청으로 이미지 5개 + `/api/files` 가 200"

def test_B15_04_쿠키만으로_페이지_썸네일_200(owner_setup):
    c, _, urls = owner_setup
    assert c.get(urls["page_thumb"]).status_code == 200


def test_B15_05_쿠키만으로_문항_썸네일_200(owner_setup):
    c, _, urls = owner_setup
    assert c.get(urls["question_thumb"]).status_code == 200


def test_B15_06_쿠키만으로_수동_문항_썸네일_200(owner_setup):
    c, _, urls = owner_setup
    assert c.get(urls["manual_thumb"]).status_code == 200


def test_B15_07_쿠키만으로_표지_이미지_200(owner_setup):
    c, _, urls = owner_setup
    assert c.get(urls["cover"]).status_code == 200


def test_B15_08_쿠키만으로_워터마크_이미지_200(owner_setup):
    c, _, urls = owner_setup
    assert c.get(urls["watermark"]).status_code == 200


def test_B15_09_쿠키만으로_files_200(owner_setup):
    c, _, urls = owner_setup
    assert c.get(urls["file"]).status_code == 200


# ── B15-10 : 쿠키·헤더 둘 다 없으면 401 ──────────────────────

@pytest.mark.parametrize("endpoint", IMAGE_ENDPOINTS)
def test_B15_10_쿠키_헤더_둘다_없으면_401(owner_setup, endpoint):
    """근거: PLAN § 작업 단계 — "쿠키·헤더 둘 다 없으면 401" """
    _, _, urls = owner_setup
    anonymous = _cookie_client()

    assert anonymous.get(urls[endpoint]).status_code == 401


# ── B15-11·12 : 쿠키는 이미지·파일 GET 밖에서 통하지 않는다 ────

def test_B15_11_쿠키만으로_jobs_목록은_401(owner_setup):
    """근거: PLAN § 작업 단계 — "쿠키만으로 이미지 외 엔드포인트(예: `GET /api/jobs`)는 401" """
    c, _, _ = owner_setup
    assert c.get("/api/jobs").status_code == 401


def test_B15_12_쿠키만으로_표지_삭제는_401이고_표지는_남는다(owner_setup):
    """근거: PLAN § 결정 — "쿠키로는 \"보기\"만 가능" """
    c, owner, urls = owner_setup

    res = c.delete(f"/api/covers/{urls['_cover_id']}")

    assert res.status_code == 401
    assert c.get(urls["cover"], headers=_headers(owner["access_token"])).status_code == 200


# ── B15-13·14 : 로그아웃이 쿠키를 지운다 ─────────────────────

def test_B15_13_로그아웃_응답이_쿠키를_지운다(isolated_storage):
    """근거: PLAN § 작업 단계 — "로그아웃 응답이 쿠키를 지운다" """
    c = _cookie_client()
    login_res, body = _signup_login(c, "b15-13@example.com")
    cookie_name = _cookie_header_with_value(login_res, body["access_token"]).split("=", 1)[0]

    res = c.post("/api/auth/logout", headers=_headers(body["access_token"]))

    cleared = [
        raw for raw in res.headers.get_list("set-cookie")
        if raw.split("=", 1)[0] == cookie_name
        and ("max-age=0" in _cookie_attrs(raw) or "expires=thu, 01 jan 1970 00:00:00 gmt" in _cookie_attrs(raw))
    ]
    assert cleared


def test_B15_14_로그아웃_후_쿠키로_이미지_요청하면_401(owner_setup):
    """근거: PLAN § 작업 단계 — "로그아웃 후 이미지 URL 직접 열면 401" """
    c, owner, urls = owner_setup
    c.post("/api/auth/logout", headers=_headers(owner["access_token"]))

    assert c.get(urls["cover"]).status_code == 401


# ── B15-15·16 : 헤더 우선 · 소유권 검사 ──────────────────────

def test_B15_15_잘못된_헤더가_있으면_유효한_쿠키가_있어도_401(owner_setup):
    """근거: PLAN § 결정 — "별도 의존성(헤더 우선, 없으면 쿠키)" """
    c, _, urls = owner_setup
    assert c.get(urls["cover"], headers={"Authorization": "Bearer invalid"}).status_code == 401


def test_B15_16_쿠키로_타인_소유_이미지_요청하면_404(owner_setup):
    """근거: PLAN § 결정 — "쿠키로 타인 소유 이미지를 요청하면 404" """
    _, _, urls = owner_setup
    other = _cookie_client()
    _signup_login(other, "b15-other@example.com")

    assert other.get(urls["cover"]).status_code == 404
