"""
REQ-F13 Phase 1 — `GET /api/templates` 확장(표시용 정보 + 렌더 상수) 검증 계약

검증 계약: docs/plans/PLAN-F13-preview-template-rendering.md `## 검증 계약`
케이스: F13-01 ~ F13-08

미리보기가 각주를 그리려면 **텍스트**가, 워터마크를 그리려면 **이미지 URL**이 필요한데
REQ-30의 응답은 id 뿐이었다. 세 목록(`/covers`·`/footnotes`·`/watermarks`)을 다시 부르는
대신 이 응답 하나가 다 싣는다(계획서 § 결정 "자산 정보 전달").

**응답 필드 이름은 계획서가 정하지 않아 이 파일이 검증 계약으로 고정한다**
(계획서 § 검증 계약 말미에도 같은 내용을 적었다):

    {
      "templates": [{
        "template_id": ..., "name": ...,
        "cover_id": ..., "footnote_id": ..., "watermark_id": ...,   # 기존 id 유지
        "needs_review": ...,  "created_at": ...,
        "cover":     {"name": ..., "image_url": ...} | None,
        "footnote":  {"name": ..., "text": ...}      | None,
        "watermark": {"name": ..., "image_url": ...} | None,
        "render": {
          "footnote_font_size": ..., "footnote_margin": ..., "footnote_color": ...,
          "watermark_size_ratio": ..., "watermark_opacity": ...,
        },
      }]
    }

기존 `cover_id` 등 id 필드는 **그대로 둔다** — 관리 화면의 수정 폼이 id 로 동작한다.

⚠️ **렌더 상수의 단일 출처는 `pdf_service`다**(계획서 § 결정). 라우터가 값을 다시 적으면
F13-06 이 빨개진다 — 그게 이 케이스의 존재 이유다. 값 자체(15%·8pt·12pt)는 아직 스펙으로
확정되지 않았으므로(계획서 § 미결) **이 파일은 숫자를 박지 않고 `pdf_service` 와 같은지만
본다.** 숫자를 박으면 미확정 값이 테스트로 굳는다.
"""


def _png_bytes() -> bytes:
    import fitz

    doc = fitz.open()
    page = doc.new_page(width=50, height=50)
    data = page.get_pixmap().tobytes("png")
    doc.close()
    return data


def _make_cover(authed_client, name: str = "표지A") -> str:
    return authed_client.post(
        "/api/covers",
        files={"file": ("c.png", _png_bytes(), "image/png")},
        data={"name": name},
    ).json()["cover_id"]


def _make_footnote(authed_client, name: str = "각주A", text: str = "무단 배포를 금합니다.") -> str:
    return authed_client.post("/api/footnotes", json={"name": name, "text": text}).json()["footnote_id"]


def _make_watermark(authed_client, name: str = "워터마크A") -> str:
    return authed_client.post(
        "/api/watermarks",
        files={"file": ("w.png", _png_bytes(), "image/png")},
        data={"name": name},
    ).json()["watermark_id"]


def _first_template(authed_client) -> dict:
    return authed_client.get("/api/templates").json()["templates"][0]


# ── 표시용 정보 ───────────────────────────────────────────

def test_F13_01_응답에_각주_텍스트가_실린다(authed_client):
    """근거: PLAN § Phase 1 — "자산 **이름**, 각주 **텍스트**, 표지·워터마크 **이미지 URL**을 함께 싣는다" """
    authed_client.post("/api/templates", json={
        "name": "기본형",
        "footnote_id": _make_footnote(authed_client, text="무단 배포를 금합니다."),
    })

    assert _first_template(authed_client)["footnote"]["text"] == "무단 배포를 금합니다."


def test_F13_02_응답에_표지_이미지_URL이_실린다(authed_client):
    """근거: PLAN § Phase 1 — "자산 **이름**, 각주 **텍스트**, 표지·워터마크 **이미지 URL**을 함께 싣는다"

    URL 은 결정적이다(계약 #15와 같은 결) — 얻으려고 목록 API 를 더 부르지 않는다.
    """
    cover_id = _make_cover(authed_client)
    authed_client.post("/api/templates", json={"name": "기본형", "cover_id": cover_id})

    assert _first_template(authed_client)["cover"]["image_url"] == f"/api/covers/{cover_id}/image"


def test_F13_03_응답에_워터마크_이미지_URL이_실린다(authed_client):
    """근거: PLAN § Phase 1 — "자산 **이름**, 각주 **텍스트**, 표지·워터마크 **이미지 URL**을 함께 싣는다" """
    watermark_id = _make_watermark(authed_client)
    authed_client.post("/api/templates", json={"name": "기본형", "watermark_id": watermark_id})

    assert _first_template(authed_client)["watermark"]["image_url"] == f"/api/watermarks/{watermark_id}/image"


def test_F13_04_응답에_자산_이름이_실린다(authed_client):
    """근거: PLAN § Phase 1 — "자산 **이름**, 각주 **텍스트**, 표지·워터마크 **이미지 URL**을 함께 싣는다"

    관리 화면의 `assetName()` — 세 목록을 뒤져 이름을 찾던 중복 — 이 이 필드로 사라진다.
    """
    authed_client.post("/api/templates", json={
        "name": "기본형", "cover_id": _make_cover(authed_client, "시험지표준표지"),
    })

    assert _first_template(authed_client)["cover"]["name"] == "시험지표준표지"


def test_F13_07_슬롯이_빈_템플릿은_그_자리가_null(authed_client):
    """근거: PLAN § Phase 1 — "자산 **이름**, 각주 **텍스트**, 표지·워터마크 **이미지 URL**을 함께 싣는다"

    빈 슬롯은 REQ-30의 정상 상태다(표지만 든 템플릿 등). 미리보기가 "없음"으로 읽을 수
    있어야 하므로 키를 빼지 않고 `None` 을 싣는다.
    """
    authed_client.post("/api/templates", json={"name": "표지만", "cover_id": _make_cover(authed_client)})

    template = _first_template(authed_client)
    assert template["footnote"] is None


def test_F13_08_dangling_슬롯이어도_500으로_죽지_않는다(authed_client):
    """근거: PLAN § Phase 1 — "미리보기가 거기서 죽으면 안 된다"

    A′ 가 막지만 강제 삭제와의 경쟁 상태가 있다. 끊어진 참조를 직접 만들어 확인한다 —
    이름 자리에 **무엇을** 넣을지는 계획서가 정하지 않았으므로(구현 재량) 값이 아니라
    **200 으로 살아 돌아오는지**만 본다.
    """
    from app.services import storage

    cover_id = _make_cover(authed_client)
    created = authed_client.post("/api/templates", json={"name": "기본형", "cover_id": cover_id}).json()
    authed_client.delete(f"/api/covers/{cover_id}?force=true")
    meta = storage.get_template_meta(created["template_id"])
    meta["cover_id"] = cover_id           # 끊어진 참조 복원
    storage.save_template(created["template_id"], meta)

    res = authed_client.get("/api/templates")

    assert res.status_code == 200


# ── 렌더 상수 ─────────────────────────────────────────────

def test_F13_05_렌더_상수_4종이_응답에_실린다(authed_client):
    """근거: PLAN § Phase 1 — "렌더 상수 4종이 `pdf_service`의 값과 같다." """
    authed_client.post("/api/templates", json={"name": "기본형", "cover_id": _make_cover(authed_client)})

    render = _first_template(authed_client)["render"]

    assert set(render) >= {
        "footnote_font_size", "footnote_margin", "footnote_color",
        "watermark_size_ratio", "watermark_opacity",
    }


def test_F13_06_렌더_상수가_pdf_service의_값과_같다(authed_client):
    """근거: PLAN § Phase 1 — "**`pdf_service`가 단일 출처**이고"

    값을 라우터에 다시 적으면 여기가 빨개진다. **숫자를 박지 않는 것이 핵심** —
    상수 자체는 아직 스펙으로 확정되지 않았고(계획서 § 미결), 이 케이스가 고정하는 것은
    "값이 무엇인가"가 아니라 **"출처가 하나인가"**다. 그래서 기대값을 `pdf_service` 에서
    읽어 와 통째로 비교한다(단언 1개).

    ⚠️ **구현에 딸려오는 것** — 지금 각주 값들은 `_apply_footnote()` 안의 지역 변수다
    (`fontsize = 8.0`, `margin = 12.0`, 색 `(0.4, 0.4, 0.4)`). 지역 변수는 밖에서 읽을 수
    없으므로 **모듈 상수로 올려야** 단일 출처가 성립한다. 그 전까지 이 케이스는
    `AttributeError` 로 빨갛고, 그건 "아직 안 만든 것"이다(`_WATERMARK_OPACITY` 는 이미
    모듈 상수라 그대로 쓴다).
    """
    from app.services import pdf_service

    authed_client.post("/api/templates", json={"name": "기본형", "cover_id": _make_cover(authed_client)})

    render = _first_template(authed_client)["render"]

    assert render == {
        "footnote_font_size":   pdf_service._FOOTNOTE_FONT_SIZE,
        "footnote_margin":      pdf_service._FOOTNOTE_MARGIN,
        "footnote_color":       pdf_service._FOOTNOTE_COLOR,
        "watermark_size_ratio": pdf_service._WATERMARK_SIZE_RATIO,
        "watermark_opacity":    pdf_service._WATERMARK_OPACITY,
    }
