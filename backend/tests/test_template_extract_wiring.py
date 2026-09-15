"""
REQ-30 Phase 1 — 생성 파이프라인 배선 + 요청 시점 참조 검증(E) 검증 계약

검증 계약: docs/plans/PLAN-30-template-entity.md `## 검증 계약`
케이스: 30-09 ~ 30-19

`extract_questions_v2` 자체는 이 레포에 렌더 무대가 없다(REQ-29 Phase 1과 같은 결론) —
그래서 여기서는 **경계에서 검증한다.** `POST /api/extract-v2`를 실제로 호출하고,
`pdf_service.extract_questions_v2`를 인자를 받아 적는 대역으로 갈아끼워 **무엇이 전달됐는지**
본다(`test_notification_hooks.py`가 쓰는 방식과 같다). 내부 resolve 함수 이름을 테스트가
지어내지 않으므로, 구현이 그 이름을 어떻게 짓든 계약이 깨지지 않는다.

E(요청 시점 400) 케이스는 대역조차 필요 없다 — 거절되면 백그라운드에 **진입하지 않는 것**이
계약이고(30-18), 그래서 `extract_questions_v2`가 아예 안 불린다.

⚠️ 30-15만은 스토리지에 직접 손을 댄다 — A′가 템플릿→자산 dangling을 **막기 때문에**
정상 경로로는 만들 수 없고, 강제 삭제와 생성이 겹치는 경쟁 상태에서만 생기는 상태이기
때문이다. 이때 쓰는 `storage.get_template_meta`·`storage.save_template`은 기존
`get_cover_meta`/`save_cover`·`get_footnote_meta`/`save_footnote` 명명 규약을 그대로
따른 이름이고, **이 테스트가 그 이름을 검증 계약으로 고정한다**(계획서 § 검증 계약의
"테스트가 먼저 고정한 것"과 같은 성격).
"""
import pytest


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


def _make_footnote(authed_client, name: str = "각주A") -> str:
    return authed_client.post("/api/footnotes", json={"name": name, "text": "본문"}).json()["footnote_id"]


def _make_watermark(authed_client, name: str = "워터마크A") -> str:
    return authed_client.post(
        "/api/watermarks",
        files={"file": ("w.png", _png_bytes(), "image/png")},
        data={"name": name},
    ).json()["watermark_id"]


def _selections() -> list[dict]:
    return [{"job_id": "job-src", "page_num": 0, "question_num": 1}]


@pytest.fixture
def captured_extract(monkeypatch, inline_extract_pool):
    """`extract_questions_v2` 가 받은 인자를 적어 두는 대역.

    시그니처는 `(selections, export_job_id, tmpdir, layout, cover_id, footnote_id,
    watermark_id)` 이고 라우터가 **위치 인자**로 넘긴다(REQ-29 기준). 이 테스트는
    끝의 세 자리만 본다 — 앞자리가 늘어나도 kwargs 로 바뀌어도 깨지지 않게 이름이
    아니라 "표지·각주·워터마크로 무엇이 갔는가"만 단언한다.
    """
    from app.routers import extract as extract_router

    seen: dict = {}

    def _fake(*args, **kwargs):
        seen["args"] = args
        seen["kwargs"] = kwargs
        seen["assets"] = args[-3:] if len(args) >= 3 else ()
        return 1

    monkeypatch.setattr(extract_router.pdf_service, "extract_questions_v2", _fake)
    return seen


# ── 배선 — template_id 가 세 자산으로 풀린다 ───────────────

def test_30_09_template_id만_주면_템플릿의_세_id가_전달된다(authed_client, captured_extract):
    """근거: PLAN § Phase 1 — "반영된 PDF가 나온다." """
    cover_id = _make_cover(authed_client)
    footnote_id = _make_footnote(authed_client)
    watermark_id = _make_watermark(authed_client)
    template = authed_client.post("/api/templates", json={
        "name": "풀세트", "cover_id": cover_id,
        "footnote_id": footnote_id, "watermark_id": watermark_id,
    }).json()

    authed_client.post("/api/extract-v2", json={
        "selections": _selections(), "template_id": template["template_id"],
    })

    assert captured_extract["assets"] == (cover_id, footnote_id, watermark_id)


def test_30_10_template_id와_직접_id가_함께_오면_template_id가_이긴다(authed_client, captured_extract):
    """근거: PLAN § 결정 — "둘 다 오면 `template_id` 우선" """
    template_cover = _make_cover(authed_client, "템플릿표지")
    direct_cover = _make_cover(authed_client, "직접표지")
    template = authed_client.post("/api/templates", json={
        "name": "기본형", "cover_id": template_cover,
    }).json()

    authed_client.post("/api/extract-v2", json={
        "selections": _selections(),
        "template_id": template["template_id"],
        "cover_id": direct_cover,
    })

    assert captured_extract["assets"][0] == template_cover


def test_30_11_template_id가_없으면_직접_id가_그대로_전달된다(authed_client, captured_extract):
    """근거: PLAN § 결정 — "**`template_id` 추가, 기존 3필드 유지.**"

    구 프론트 호환 경로다. 배포가 백엔드 먼저·프론트 나중으로 갈라지는 기간(REQ-B10 실측
    3일)에 이 경로가 죽으면 그동안 표지가 전부 빠진 PDF가 나온다.
    """
    cover_id = _make_cover(authed_client)

    authed_client.post("/api/extract-v2", json={
        "selections": _selections(), "cover_id": cover_id,
    })

    assert captured_extract["assets"][0] == cover_id


def test_30_12_ExtractV2Request의_template_id_기본값은_None(authed_client):
    """근거: PLAN § 제약 — "`template_id`에 기본값을" (계약 #23)

    값이 아니라 **존재 여부**가 동작을 가르므로 기본값을 채우면 안 된다.
    """
    from app.models.schemas import ExtractV2Request

    req = ExtractV2Request(selections=_selections())

    assert req.template_id is None


def test_30_13_생성_성공시_WorkbookMeta에_template_id가_저장된다(authed_client, captured_extract):
    """근거: PLAN § 결정 — "**범위에 넣는다**"

    이력 복원 시 템플릿이 조용히 "없음"이 되는 것을 막는 필드다(계약 #22·#23과 같은 모양).
    """
    from app.services import storage

    template = authed_client.post("/api/templates", json={
        "name": "기본형", "cover_id": _make_cover(authed_client),
    }).json()

    res = authed_client.post("/api/extract-v2", json={
        "selections": _selections(),
        "template_id": template["template_id"],
        "workbook_name": "테스트 문제집",
    })

    export_job_id = res.json()["job_id"]
    saved = [
        w for w in storage.list_workbooks()
        if w.get("result_job_id") == export_job_id
    ]
    assert saved and saved[0]["template_id"] == template["template_id"]


# ── E — 요청 시점 400 ─────────────────────────────────────

def test_30_14_없는_template_id로_생성_요청하면_400(authed_client):
    """근거: PLAN § 결정 — "**E — 요청 시점 400.** 참조가 끊겼으면 백그라운드 진입 전에 거절" """
    res = authed_client.post("/api/extract-v2", json={
        "selections": _selections(), "template_id": "no-such-template",
    })

    assert res.status_code == 400


def test_30_15_템플릿이_가리키는_표지가_삭제됐으면_400(authed_client):
    """근거: PLAN § 결정 — "**E — 요청 시점 400.** 참조가 끊겼으면 백그라운드 진입 전에 거절"

    A′ 가 차단하므로 정상 경로로는 생기기 어렵지만, 강제 삭제와 생성이 겹치는 경쟁
    상태에서 발생한다 — E 는 그 나머지를 잡는 두 번째 그물이다.
    """
    cover_id = _make_cover(authed_client)
    template = authed_client.post("/api/templates", json={
        "name": "기본형", "cover_id": cover_id,
    }).json()
    authed_client.delete(f"/api/covers/{cover_id}?force=true")
    # 강제 삭제는 슬롯을 비우므로, 끊어진 참조 상태를 직접 만든다.
    from app.services import storage

    meta = storage.get_template_meta(template["template_id"])
    meta["cover_id"] = cover_id
    storage.save_template(template["template_id"], meta)

    res = authed_client.post("/api/extract-v2", json={
        "selections": _selections(), "template_id": template["template_id"],
    })

    assert res.status_code == 400


def test_30_16_직접_cover_id가_삭제된_것이면_400(authed_client):
    """근거: PLAN § 결정 — "**직접 id 경로에도 적용한다**"

    "표지를 골랐는데 표지 없이 나온 PDF" 가 실패보다 나쁘다 — 사용자는 다운로드해
    열기 전까지 모른다.
    """
    cover_id = _make_cover(authed_client)
    authed_client.delete(f"/api/covers/{cover_id}")

    res = authed_client.post("/api/extract-v2", json={
        "selections": _selections(), "cover_id": cover_id,
    })

    assert res.status_code == 400


def test_30_17_빈_템플릿을_가리키는_생성_요청은_400(authed_client):
    """근거: PLAN § Phase 1 — "슬롯을 모두 비우는 POST·PATCH와 빈 템플릿을 가리키는 생성 요청은 400으로 거절되지만," """
    cover_id = _make_cover(authed_client)
    template = authed_client.post("/api/templates", json={
        "name": "표지전용", "cover_id": cover_id,
    }).json()
    # 강제 삭제로 마지막 슬롯이 비워진 템플릿 — 저장소에는 남아 있다(30-24).
    authed_client.delete(f"/api/covers/{cover_id}?force=true")

    res = authed_client.post("/api/extract-v2", json={
        "selections": _selections(), "template_id": template["template_id"],
    })

    assert res.status_code == 400


def test_30_18_400이면_export_job이_생성되지_않는다(authed_client):
    """근거: PLAN § Phase 1 — "(`template_id`·직접 id 양쪽) **400으로 거절되고 export job이 생성되지 않는다.**"

    거절인데 job 만 남으면 결과 목록에 영원히 PENDING 인 유령이 쌓인다.
    """
    from app.models.schemas import JobType
    from app.services import storage

    def _export_count() -> int:
        return len([j for j in storage.list_jobs() if j.job_type == JobType.EXPORT])

    before = _export_count()

    authed_client.post("/api/extract-v2", json={
        "selections": _selections(), "template_id": "no-such-template",
    })

    assert _export_count() == before


def test_30_19_pdf_service의_관대_처리가_남아있다():
    """근거: PLAN § 제약 — "**`pdf_service`의 `if meta:` 관대 처리는 지우지 않는다.**"

    요청 검증(E) 통과 후 백그라운드 진입까지의 경쟁 상태가 있어, 거기서 죽는 것보다 낫다.
    "이미 요청에서 막았으니 여기는 필요 없다"며 걷어내면 그 창에서 크래시가 난다.
    """
    with open("app/services/pdf_service.py", encoding="utf-8") as f:
        code = f.read()

    assert "if cover_result:" in code
    assert "if footnote_meta:" in code
    assert "if watermark_result:" in code
