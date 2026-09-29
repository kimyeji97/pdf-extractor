"""
REQ-B20 Phase 1 — 보이지 않는 번호 글자(1pt 이하)는 어느 감지 경로에서도 문항이 되지 않는다

검증 계약: docs/plans/PLAN-B20-invisible-number-and-id-collision.md `## 검증 계약`
케이스: B20-01 ~ B20-03

실제 샘플(dev `테스트02` = HWP 출력 PDF)은 저장소에 없어 **같은 모양의 합성 PDF**로 재현한다.
보이는 번호 옆에 0.1pt `N.`을 따로 심는다. 재현 조건이 하나 더 있다 — 보이는 번호의 **형식이 섞여야**
(`01` 20pt / `4.` 13pt) 보이는 쪽 수열이 여러 그룹으로 쪼개지고, 한 형식으로 끝까지 이어지는 보이지 않는
번호가 adaptive 의 최고 점수 그룹이 된다. 보이는 번호가 한 형식이면 보이는 쪽이 이겨서 재현되지 않는다
(합성 PDF 시제작 실측).

⚠️ 2·4쪽의 13pt 보이는 번호는 폰트 임계값(20pt 기준)에 걸려 수정 후에도 잡힐지 계획서가 정하지 않았다 —
단언하지 않는다.
"""
import fitz
import pdfplumber

from app.utils.question_parser import (
    detect_question_boundaries,
    detect_question_boundaries_adaptive,
)

W, H = 595, 842


def _hidden_number_pdf(tmp_path) -> str:
    """4쪽 · 쪽당 3문항. 1·3쪽은 20pt `0N`, 2·4쪽은 13pt `N.` + 모든 문항 아래 0.1pt `N.`."""
    doc = fitz.open()
    n = 1
    for pg in range(4):
        p = doc.new_page(width=W, height=H)
        for y in (150, 380, 610):
            if pg % 2 == 0:
                p.insert_text((50, y), f"{n:02d}", fontsize=20)
            else:
                p.insert_text((50, y), f"{n}.", fontsize=13)
            p.insert_text((85, y), "다음 식의 값을 구하시오", fontsize=10, fontname="korea")
            p.insert_text((85, y + 18), "보기를 참고하여 답하시오", fontsize=10, fontname="korea")
            p.insert_text((95, y + 40), f"{n}.", fontsize=0.1)  # 보이지 않는 번호
            n += 1
    path = tmp_path / "hidden.pdf"
    doc.save(path)
    doc.close()
    return str(path)


def _invisible_positions(pdf_path: str, key: str = "x0") -> set[tuple[int, int]]:
    """(쪽, 번호 글자 x0 또는 top) — 1pt 이하 번호 글자의 위치."""
    out = set()
    with pdfplumber.open(pdf_path) as pdf:
        for pi, page in enumerate(pdf.pages):
            for w in page.extract_words(extra_attrs=["size"]):
                if w["size"] <= 1.0:
                    out.add((pi, round(w[key])))
    return out


def _at_invisible(boundaries, invisible) -> list:
    # 경계의 col_x0 는 번호 글자 x0 − 10 이다(정밀화 규칙)
    return [b for b in boundaries if (b.page_index, round(b.col_x0 + 10)) in invisible]


def test_B20_01_no_boundary_at_invisible_number(tmp_path):
    path = _hidden_number_pdf(tmp_path)
    bs = detect_question_boundaries(path)
    assert _at_invisible(bs, _invisible_positions(path)) == []


def test_B20_02_visible_numbers_not_false_positive(tmp_path):
    bs = detect_question_boundaries(_hidden_number_pdf(tmp_path))
    visible = sorted(
        (b.page_index, b.number) for b in bs
        if b.page_index in (0, 2) and round(b.col_x0 + 10) == 50 and not b.is_false_positive
    )
    assert visible == [(0, 1), (0, 2), (0, 3), (2, 7), (2, 8), (2, 9)]


def test_B20_03_adaptive_alone_ignores_invisible(tmp_path):
    # adaptive 단독 결과는 정밀화 전이라 col_x0 가 번호 x0 가 아니라 단 왼쪽 경계다 — `_at_invisible`(x0 비교)로는
    # 수정 전 코드도 통과한다(/testrun B20 실측). 정밀화 전 y_top 은 번호 글자의 top 그대로라 그걸로 비교한다
    path = _hidden_number_pdf(tmp_path)
    bs = detect_question_boundaries_adaptive(path)
    tops = _invisible_positions(path, key="top")
    assert [b for b in bs if (b.page_index, round(b.y_top)) in tops] == []


# ── Phase 2 — 두 번째 번호 형식: 정규식 전용 경계의 높이 규칙 (200pt) ──
# 테스트02 의 20pt `0N` 기본문제처럼, adaptive 가 인정한 주 그룹(13pt `N.`)과 형식이 다른 보이는 번호는
# 전부 "정규식 전용"이 된다. 쪽을 채우는 문항(키 큼)은 오탐이 아니고, 바로 아래 문항이 붙는 제목(키 작음)은
# 오탐으로 남아야 한다(내신마스터 "유형 01" 과 같은 모양). 높이 190/210 같은 경계값은 측정 기준(하단 조임
# 전·후)이 계획서 미결이라 쓰지 않는다 — 두 경계는 기준에서 멀다(약 470pt / 약 76pt, 시제작 실측).

def _body(page, x, y, lines: int) -> None:
    for k in range(lines):
        page.insert_text((x, y + 18 * k), "다음 식의 값을 구하시오", fontsize=10, fontname="korea")


def _two_format_pdf(tmp_path) -> str:
    """1~4쪽 13pt `N.` 3문항씩(주 그룹) · 5~7쪽 쪽을 채우는 20pt `01~03` · 8쪽 20pt 제목 `04` + 바로 아래 13pt 문항."""
    doc = fitz.open()
    n = 1
    for _ in range(4):
        p = doc.new_page(width=W, height=H)
        for y in (150, 380, 610):
            p.insert_text((50, y), f"{n}.", fontsize=13)
            _body(p, 75, y, 3)
            n += 1
    for k in range(1, 4):
        p = doc.new_page(width=W, height=H)
        p.insert_text((50, 150), f"{k:02d}", fontsize=20)
        _body(p, 85, 150, 25)
    p = doc.new_page(width=W, height=H)
    p.insert_text((50, 150), "04", fontsize=20)
    p.insert_text((85, 150), "삼각비의 값", fontsize=14, fontname="korea")
    for y in (210, 440, 670):
        p.insert_text((50, y), f"{n}.", fontsize=13)
        _body(p, 75, y, 3)
        n += 1
    path = tmp_path / "two_format.pdf"
    doc.save(path)
    doc.close()
    return str(path)


def test_B20_04_tall_second_format_not_false_positive(tmp_path):
    bs = detect_question_boundaries(_two_format_pdf(tmp_path))
    tall = sorted((b.page_index, b.number, b.is_false_positive) for b in bs if b.page_index in (4, 5, 6))
    assert tall == [(4, 1, False), (5, 2, False), (6, 3, False)]


def test_B20_05_short_second_format_title_stays_false_positive(tmp_path):
    bs = detect_question_boundaries(_two_format_pdf(tmp_path))
    title = [b for b in bs if b.page_index == 7 and b.number == 4]
    assert [b.is_false_positive for b in title] == [True]
