"""
REQ-30 Phase 1 — 템플릿 CRUD + 자산 삭제 시 참조 검사(A′) 검증 계약

검증 계약: docs/plans/PLAN-30-template-entity.md `## 검증 계약`
케이스: 30-01 ~ 30-08, 30-20 ~ 30-28

계획서가 고정한 표면 — 표지 CRUD(`backend/app/routers/cover.py`)와 같은 모양이되
**PATCH가 더해진다**(템플릿은 조합이라 구성 요소만 바뀌는 변경이 정상이다):
    POST/GET/PATCH/DELETE /api/templates

응답 봉투와 강제 삭제 플래그 전달 방식은 계획서가 정하지 않았으므로 **이 파일이 검증 계약으로
고정한다**(계획서 § 검증 계약 말미에도 같은 내용을 명시했다). `cover.py`의 기존 모양을 따른다:
    POST/PATCH /api/templates → {template_id, name, cover_id, footnote_id,
                                 watermark_id, needs_review, created_at}
    GET  /api/templates       → {templates: [...]}
    강제 삭제                  → DELETE /api/covers/{id}?force=true
                                 (body 있는 DELETE는 프록시·클라이언트 호환이 들쭉날쭉하다)

⚠️ `needs_review`는 **파생 판정이 불가능해서** 저장되는 플래그다 — 강제 삭제가 슬롯을
`None`으로 만드는데 "원래 안 넣은 것"도 `None`이라 저장된 값만으로는 구별할 수 없다
(계획서 § 제약·함정). 30-26이 그 오탐을 막는 회귀 케이스다.
"""


def _png_bytes() -> bytes:
    """최소한의 유효 PNG 바이트 — 표지·워터마크 업로드용. PIL 의존 없이 fitz로 만든다."""
    import fitz

    doc = fitz.open()
    page = doc.new_page(width=50, height=50)
    data = page.get_pixmap().tobytes("png")
    doc.close()
    return data


def _make_cover(client, name: str = "표지A") -> str:
    res = client.post(
        "/api/covers",
        files={"file": ("c.png", _png_bytes(), "image/png")},
        data={"name": name},
    )
    return res.json()["cover_id"]


def _make_footnote(client, name: str = "각주A") -> str:
    return client.post("/api/footnotes", json={"name": name, "text": "본문"}).json()["footnote_id"]


def _make_watermark(client, name: str = "워터마크A") -> str:
    res = client.post(
        "/api/watermarks",
        files={"file": ("w.png", _png_bytes(), "image/png")},
        data={"name": name},
    )
    return res.json()["watermark_id"]


def _make_template(client, **slots) -> dict:
    body = {"name": slots.pop("name", "기본형")}
    body.update(slots)
    return client.post("/api/templates", json=body).json()


def _get_template(client, template_id: str) -> dict | None:
    for t in client.get("/api/templates").json()["templates"]:
        if t["template_id"] == template_id:
            return t
    return None


# ── 템플릿 CRUD ───────────────────────────────────────────

def test_30_01_템플릿_등록시_201과_template_id(client):
    """근거: PLAN § 결정 — "**PATCH 지원.** `cover.py`의 POST/GET/DELETE에 수정을 더한다" """
    cover_id = _make_cover(client)

    res = client.post("/api/templates", json={"name": "기본형", "cover_id": cover_id})

    assert res.status_code == 201
    assert res.json()["template_id"]


def test_30_02_등록한_템플릿이_목록에_나타난다(client):
    """근거: PLAN § 결정 — "**PATCH 지원.** `cover.py`의 POST/GET/DELETE에 수정을 더한다" """
    created = _make_template(client, cover_id=_make_cover(client))

    ids = [t["template_id"] for t in client.get("/api/templates").json()["templates"]]

    assert created["template_id"] in ids


def test_30_03_PATCH로_표지만_바꿔도_template_id가_유지된다(client):
    """근거: PLAN § Phase 1 — "PATCH로 표지만 바꾸면 `template_id`가 유지된 채 다음 생성에 반영된다." """
    created = _make_template(client, cover_id=_make_cover(client, "옛표지"))
    new_cover = _make_cover(client, "새표지")

    res = client.patch(f"/api/templates/{created['template_id']}", json={"cover_id": new_cover})

    assert res.json()["template_id"] == created["template_id"]
    assert res.json()["cover_id"] == new_cover


def test_30_04_PATCH_성공시_needs_review가_해제된다(client):
    """근거: PLAN § 결정 — "**PATCH 성공 시 해제**" """
    cover_id = _make_cover(client)
    created = _make_template(client, cover_id=cover_id, footnote_id=_make_footnote(client))
    # 강제 삭제로 needs_review 를 켠다 — 이 플래그가 켜지는 유일한 경로다.
    client.delete(f"/api/covers/{cover_id}?force=true")
    assert _get_template(client, created["template_id"])["needs_review"] is True

    client.patch(f"/api/templates/{created['template_id']}", json={"cover_id": _make_cover(client, "새표지")})

    assert _get_template(client, created["template_id"])["needs_review"] is False


def test_30_05_템플릿_삭제후_목록에서_빠진다(client):
    """근거: PLAN § 결정 — "**PATCH 지원.** `cover.py`의 POST/GET/DELETE에 수정을 더한다" """
    created = _make_template(client, cover_id=_make_cover(client))

    client.delete(f"/api/templates/{created['template_id']}")

    assert _get_template(client, created["template_id"]) is None


def test_30_06_없는_템플릿_삭제는_404(client):
    """근거: cover.py 기존 패턴(존재하지 않는 id 삭제 시 404)"""
    res = client.delete("/api/templates/no-such-id")

    assert res.status_code == 404


def test_30_07_슬롯이_모두_빈_템플릿_등록은_400(client):
    """근거: PLAN § 결정 — "POST·PATCH·생성 요청은 슬롯 3개가 모두 비면 400" """
    res = client.post("/api/templates", json={"name": "빈템플릿"})

    assert res.status_code == 400


def test_30_08_PATCH로_슬롯을_모두_비우면_400(client):
    """근거: PLAN § 결정 — "POST·PATCH·생성 요청은 슬롯 3개가 모두 비면 400" """
    created = _make_template(client, cover_id=_make_cover(client))

    res = client.patch(f"/api/templates/{created['template_id']}", json={"cover_id": None})

    assert res.status_code == 400


# ── A′ — 자산 삭제 시 참조 검사 + 강제 삭제 ────────────────

def test_30_20_템플릿이_쓰는_표지_삭제는_409(client):
    """근거: PLAN § 결정 — "**A′ — 차단 + 명시적 강제 삭제.** 사용 중이면 409 + 사용 중인 템플릿 이름" """
    cover_id = _make_cover(client)
    _make_template(client, name="기본형", cover_id=cover_id)

    res = client.delete(f"/api/covers/{cover_id}")

    assert res.status_code == 409


def test_30_21_409_본문에_사용중인_템플릿_이름이_들어있다(client):
    """근거: PLAN § 결정 — "**A′ — 차단 + 명시적 강제 삭제.** 사용 중이면 409 + 사용 중인 템플릿 이름" """
    cover_id = _make_cover(client)
    _make_template(client, name="시험지표준", cover_id=cover_id)

    res = client.delete(f"/api/covers/{cover_id}")

    assert "시험지표준" in res.text


def test_30_22_어느_템플릿도_안_쓰는_표지는_그대로_삭제된다(client):
    """근거: PLAN § 결정 — 차단은 "사용 중이면" 일 때만이다

    이 케이스가 없으면 "전부 409" 라는 구현도 30-20을 통과한다.
    """
    cover_id = _make_cover(client)

    res = client.delete(f"/api/covers/{cover_id}")

    assert res.status_code == 200


def test_30_23_강제_삭제하면_표지가_지워지고_템플릿_슬롯이_빈다(client):
    """근거: PLAN § Phase 1 — "플래그를 주면 삭제되며 그 템플릿의 표지 슬롯이 빈다." """
    cover_id = _make_cover(client)
    created = _make_template(client, cover_id=cover_id, footnote_id=_make_footnote(client))

    client.delete(f"/api/covers/{cover_id}?force=true")

    assert _get_template(client, created["template_id"])["cover_id"] is None


def test_30_24_강제_삭제로_마지막_슬롯이_비어도_템플릿이_남는다(client):
    """근거: PLAN § Phase 1 — "**강제 삭제로 비워진 템플릿은 저장소에 남고 `needs_review`가 참이다.**"

    빈 템플릿은 입력(POST·PATCH)으로는 만들 수 없지만(30-07·30-08),
    A′ 강제 삭제의 결과로는 **허용된다** — 자산 삭제의 부수 효과로 사용자가 만든
    템플릿을 없애지 않는다는 결정(계획서 § 결정 "빈 템플릿").
    """
    cover_id = _make_cover(client)
    created = _make_template(client, cover_id=cover_id)

    client.delete(f"/api/covers/{cover_id}?force=true")

    assert _get_template(client, created["template_id"]) is not None


def test_30_25_강제_삭제로_영향받은_템플릿의_needs_review가_참(client):
    """근거: PLAN § Phase 1 — "**강제 삭제로 비워진 템플릿은 저장소에 남고 `needs_review`가 참이다.**" """
    cover_id = _make_cover(client)
    created = _make_template(client, cover_id=cover_id, footnote_id=_make_footnote(client))

    client.delete(f"/api/covers/{cover_id}?force=true")

    assert _get_template(client, created["template_id"])["needs_review"] is True


def test_30_26_원래_슬롯이_비어있던_템플릿은_needs_review가_거짓(client):
    """근거: PLAN § 제약 — "**구별할 수 없으므로** `needs_review`를 파생 판정으로 대체하려 하면 안 된다. 정상 템플릿에 칩이"

    표지를 처음부터 안 넣은 정상 템플릿이다. "슬롯이 비었으면 needs_review" 라는
    파생 판정으로 구현하면 여기가 빨개진다.
    """
    created = _make_template(client, footnote_id=_make_footnote(client))

    assert _get_template(client, created["template_id"])["needs_review"] is False


def test_30_27_템플릿이_쓰는_각주_삭제는_409(client):
    """근거: PLAN § 결정 — "**A′ — 차단 + 명시적 강제 삭제.** 사용 중이면 409 + 사용 중인 템플릿 이름" """
    footnote_id = _make_footnote(client)
    _make_template(client, footnote_id=footnote_id)

    res = client.delete(f"/api/footnotes/{footnote_id}")

    assert res.status_code == 409


def test_30_28_템플릿이_쓰는_워터마크_삭제는_409(client):
    """근거: PLAN § 결정 — "**A′ — 차단 + 명시적 강제 삭제.** 사용 중이면 409 + 사용 중인 템플릿 이름" """
    watermark_id = _make_watermark(client)
    _make_template(client, watermark_id=watermark_id)

    res = client.delete(f"/api/watermarks/{watermark_id}")

    assert res.status_code == 409
