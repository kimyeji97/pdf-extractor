"""
REQ-29 Phase 1 — 각주·워터마크가 PDF에 실제로 반영되는지 검증 계약

검증 계약: docs/plans/PLAN-29-footnote-watermark-registration.md `## 검증 계약`
케이스: 29-11 ~ 29-15

`extract_questions_v2`는 이 레포에 직접 테스트한 선례가 없다 — 유일하게 건드리는 기존
테스트(`test_notification_hooks.py`)도 함수 전체를 monkeypatch로 갈아치울 뿐 내부 로직은
보지 않는다. `work.jsx`(PLAN-B12 § 제약·함정)와 같은 성격의 "검증 무대가 없는 함수"로 보고,
각주·워터마크를 PDF에 실제로 그리는 로직은 독립 함수(`_apply_footnote`·`_apply_watermark`)로
빼서 여기서 완전히 단위 테스트하고(29-11·29-12), `extract_questions_v2` 안의 배선은 소스
스캔으로만 확인한다(29-13~15).
"""
import re

import fitz


def _blank_pdf(path: str, page_count: int, width: float = 300, height: float = 200) -> None:
    doc = fitz.open()
    for _ in range(page_count):
        doc.new_page(width=width, height=height)
    doc.save(path)
    doc.close()


def _png_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=50, height=50)
    data = page.get_pixmap().tobytes("png")
    doc.close()
    return data


def _pdf_service_source() -> str:
    with open("app/services/pdf_service.py", encoding="utf-8") as f:
        return f.read()


def _extract_questions_v2_body(code: str) -> str:
    """`extract_questions_v2` 함수 본문만 잘라낸다 — 다음 top-level `def` 전까지."""
    start = code.index("def extract_questions_v2(")
    rest = code[start:]
    m = re.search(r"\ndef \w", rest[1:])
    end = m.start() + 1 if m else len(rest)
    return rest[:end]


# ── _apply_footnote (직접 단위 테스트) ──────────────────────

def test_29_11_모든_페이지_하단_좌측에_각주가_삽입된다(tmp_path):
    """근거: PLAN § 결정 — "페이지 하단, 좌측 정렬, 작은 글씨" """
    from app.services import pdf_service

    path = str(tmp_path / "grid.pdf")
    page_w, page_h = 300, 200
    _blank_pdf(path, page_count=3, width=page_w, height=page_h)

    pdf_service._apply_footnote(path, "저작권 문구")

    doc = fitz.open(path)
    assert doc.page_count == 3
    for page in doc:
        rects = page.search_for("저작권 문구")
        assert len(rects) == 1
        rect = rects[0]
        assert rect.y1 > page_h * 0.8   # 하단
        assert rect.x0 < page_w * 0.3   # 좌측
    doc.close()


# ── _apply_watermark (직접 단위 테스트) ─────────────────────

def test_29_12_모든_페이지에_워터마크_이미지가_삽입된다(tmp_path):
    """근거: PLAN § 결정 — "페이지 중앙, 크게, 낮은 투명도(문항 텍스트를 가리지 않는 정도)" """
    from app.services import pdf_service

    path = str(tmp_path / "grid.pdf")
    _blank_pdf(path, page_count=3)

    pdf_service._apply_watermark(path, _png_bytes())

    doc = fitz.open(path)
    assert doc.page_count == 3
    for page in doc:
        assert len(page.get_images()) >= 1
    doc.close()


# ── extract_questions_v2 배선 (소스 스캔) ───────────────────

def test_29_13_footnote_id_지정시_apply_footnote_호출_배선이_있다():
    """근거: PLAN § Phase 1 — "각주·워터마크 등록·조회·삭제 API가 동작." """
    body = _extract_questions_v2_body(_pdf_service_source())

    idx = body.find("if footnote_id")
    assert idx > -1
    assert "_apply_footnote(" in body[idx:idx + 400]


def test_29_14_각주_워터마크_호출이_조건문_밖에서_무조건_실행되지_않는다():
    """근거: PLAN § Phase 1 — "동일하게 아무것도 안 붙음)." """
    body = _extract_questions_v2_body(_pdf_service_source())

    # 무조건 실행되는 추가 호출이 없다면, 각 함수는 (조건부 호출 1회씩만) 정확히 1번만 나타난다.
    assert body.count("_apply_footnote(") == 1
    assert body.count("_apply_watermark(") == 1


def test_29_15_각주_워터마크_적용이_표지_삽입보다_먼저_온다():
    """근거: PLAN § 제약·함정 — "표지 삽입(`_prepend_cover_image`)은 원본 grid PDF **앞에 새 문서를 통째로 붙이는** 구조라" """
    body = _extract_questions_v2_body(_pdf_service_source())

    overlay_idx = max(body.find("_apply_footnote("), body.find("_apply_watermark("))
    cover_idx = body.find("_prepend_cover_image(")

    assert overlay_idx > -1
    assert cover_idx > -1
    assert overlay_idx < cover_idx
