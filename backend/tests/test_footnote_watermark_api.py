"""
REQ-29 Phase 1 — 각주·워터마크 CRUD 검증 계약

검증 계약: docs/plans/PLAN-29-footnote-watermark-registration.md `## 검증 계약`
케이스: 29-01 ~ 29-10

계획서가 고정한 표면 — 표지 CRUD(`backend/app/routers/cover.py`)와 같은 모양이되,
각주는 이미지 대신 텍스트를 저장한다:
    각주:     POST/GET /api/footnotes, DELETE /api/footnotes/{id}
    워터마크: POST/GET /api/watermarks, GET /api/watermarks/{id}/image,
              DELETE /api/watermarks/{id}  (표지와 완전히 동일한 업로드 방식 — 사용자 확정)

응답 봉투는 계획서가 정하지 않았으므로 **이 파일이 검증 계약으로 고정한다** — `cover.py`의
기존 응답 모양을 그대로 따른다:
    POST /api/footnotes  → {footnote_id, name, text, created_at}
    GET  /api/footnotes  → {footnotes: [...]}
    POST /api/watermarks → {watermark_id, name, thumbnail_url, created_at}
    GET  /api/watermarks → {watermarks: [...]}

워터마크 업로드 제한(JPEG/PNG, 10MB)은 `cover.py`의 `_ALLOWED_TYPES`·`_MAX_SIZE`와
동일하다(계획서 § 결정 "워터마크 업로드 제한").
"""
import pytest


def _png_bytes() -> bytes:
    """최소한의 유효 PNG 바이트 — 워터마크 업로드 테스트용. PIL 의존 없이 fitz로 만든다."""
    import fitz

    doc = fitz.open()
    page = doc.new_page(width=50, height=50)
    pix = page.get_pixmap()
    data = pix.tobytes("png")
    doc.close()
    return data


# ── 각주 CRUD ─────────────────────────────────────────────

def test_29_01_각주_등록시_201과_footnote_id(client):
    """근거: PLAN § 범위 — "텍스트를 저장한다는 점만 빼면 표지 CRUD(`cover.py`)와 같은 모양" """
    res = client.post("/api/footnotes", json={"name": "저작권 문구", "text": "본 자료의 무단 배포를 금합니다."})

    assert res.status_code == 201
    assert res.json()["footnote_id"]


def test_29_02_등록한_각주가_목록에_나타난다(client):
    """근거: PLAN § 범위 — "텍스트를 저장한다는 점만 빼면 표지 CRUD(`cover.py`)와 같은 모양" """
    created = client.post("/api/footnotes", json={"name": "저작권 문구", "text": "내용"}).json()

    res = client.get("/api/footnotes")

    ids = [f["footnote_id"] for f in res.json()["footnotes"]]
    assert created["footnote_id"] in ids


def test_29_03_각주_삭제후_목록에서_빠진다(client):
    """근거: PLAN § 범위 — "텍스트를 저장한다는 점만 빼면 표지 CRUD(`cover.py`)와 같은 모양" """
    created = client.post("/api/footnotes", json={"name": "저작권 문구", "text": "내용"}).json()

    client.delete(f"/api/footnotes/{created['footnote_id']}")

    ids = [f["footnote_id"] for f in client.get("/api/footnotes").json()["footnotes"]]
    assert created["footnote_id"] not in ids


def test_29_04_없는_각주_삭제는_404(client):
    """근거: PLAN § 범위 — cover.py 기존 패턴(존재하지 않는 id 삭제 시 404)"""
    res = client.delete("/api/footnotes/no-such-id")

    assert res.status_code == 404


# ── 워터마크 CRUD ─────────────────────────────────────────

def test_29_05_워터마크_등록시_201과_watermark_id(client):
    """근거: PLAN § 범위 — "워터마크 CRUD(`/api/watermarks`) — 표지와 동일하게 이미지 업로드·목록·삭제" """
    res = client.post(
        "/api/watermarks",
        files={"file": ("wm.png", _png_bytes(), "image/png")},
        data={"name": "회사 로고"},
    )

    assert res.status_code == 201
    assert res.json()["watermark_id"]


def test_29_06_등록한_워터마크가_목록에_나타난다(client):
    """근거: PLAN § 범위 — "워터마크 CRUD(`/api/watermarks`) — 표지와 동일하게 이미지 업로드·목록·삭제" """
    created = client.post(
        "/api/watermarks",
        files={"file": ("wm.png", _png_bytes(), "image/png")},
        data={"name": "회사 로고"},
    ).json()

    res = client.get("/api/watermarks")

    ids = [w["watermark_id"] for w in res.json()["watermarks"]]
    assert created["watermark_id"] in ids


def test_29_07_워터마크_이미지_조회시_바이트를_반환한다(client):
    """근거: PLAN § 범위 — "워터마크 CRUD(`/api/watermarks`) — 표지와 동일하게 이미지 업로드·목록·삭제" """
    created = client.post(
        "/api/watermarks",
        files={"file": ("wm.png", _png_bytes(), "image/png")},
        data={"name": "회사 로고"},
    ).json()

    res = client.get(f"/api/watermarks/{created['watermark_id']}/image")

    assert res.status_code == 200
    assert len(res.content) > 0


def test_29_08_워터마크_삭제후_목록에서_빠진다(client):
    """근거: PLAN § 범위 — "워터마크 CRUD(`/api/watermarks`) — 표지와 동일하게 이미지 업로드·목록·삭제" """
    created = client.post(
        "/api/watermarks",
        files={"file": ("wm.png", _png_bytes(), "image/png")},
        data={"name": "회사 로고"},
    ).json()

    client.delete(f"/api/watermarks/{created['watermark_id']}")

    ids = [w["watermark_id"] for w in client.get("/api/watermarks").json()["watermarks"]]
    assert created["watermark_id"] not in ids


def test_29_09_허용안된_형식_업로드는_400(client):
    """근거: PLAN § 결정 — "표지와 동일 — JPEG/PNG만, 최대 10MB" """
    res = client.post(
        "/api/watermarks",
        files={"file": ("wm.webp", b"fake-webp-bytes", "image/webp")},
        data={"name": "회사 로고"},
    )

    assert res.status_code == 400


def test_29_10_10MB_초과_업로드는_400(client):
    """근거: PLAN § 결정 — "표지와 동일 — JPEG/PNG만, 최대 10MB" """
    oversized = b"0" * (10 * 1024 * 1024 + 1)

    res = client.post(
        "/api/watermarks",
        files={"file": ("wm.png", oversized, "image/png")},
        data={"name": "회사 로고"},
    )

    assert res.status_code == 400
