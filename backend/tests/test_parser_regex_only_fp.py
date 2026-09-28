"""
REQ-B18 Phase 1 — 정규식 전용 경계 오탐 표시 + 위치 기준 병합 검증 계약

검증 계약: docs/plans/PLAN-B18-regex-only-false-positive.md `## 검증 계약`
케이스: B18-01 ~ B18-08

실제 샘플(`심화대비`·`내신마스터`)은 저장소에 없어 **같은 모양의 합성 PDF**로 재현한다.
- 목차형: 1쪽 16pt `1~4` 목차 + 12pt `N.` 문항 → 폰트 임계값이 16pt 로 잡혀 정규식은 목차만 잡고,
  번호만 보고 합치던 Step 4 가 adaptive 의 진짜 1~4 를 버린다(계획서 § 배경 1·2).
- 제목형: 12pt 문항 사이에 14pt `유형 N` → 같은 메커니즘으로 제목이 진짜 2·3 번을 밀어낸다.

⚠️ 문항 본문에 숫자를 넣지 않는다 — `(1) 1 (2) 2` 같은 줄이 있으면 본문 숫자끼리 수열을 이뤄
adaptive 가 엉뚱한 그룹을 고른다(합성 PDF 시제작 실측).
"""
import fitz
import pdfplumber
import pytest

from app.utils.question_parser import (
    detect_question_boundaries,
    detect_question_boundaries_adaptive,
)

W, H = 595, 842


def _question(page, n: int, y: float) -> None:
    """12pt `N.` + 숫자 없는 본문 두 줄."""
    page.insert_text((50, y), f"{n}.", fontsize=12)
    page.insert_text((75, y), "다음 식의 값을 구하시오", fontsize=10, fontname="korea")
    page.insert_text((75, y + 18), "보기를 참고하여 답하시오", fontsize=10, fontname="korea")


def _save(doc, tmp_path, name: str) -> str:
    path = tmp_path / f"{name}.pdf"
    doc.save(path)
    doc.close()
    return str(path)


def _toc_pdf(tmp_path) -> str:
    """1쪽 목차(16pt 1~4) + 2·3쪽 문항 1~6."""
    doc = fitz.open()
    p = doc.new_page(width=W, height=H)
    for i, title in enumerate(["삼각비", "원과 직선", "원주각", "통계"]):
        p.insert_text((365, 600 + i * 26), str(i + 1), fontsize=16)
        p.insert_text((392, 600 + i * 26), title, fontsize=16, fontname="korea")
    n = 1
    for _ in range(2):
        p = doc.new_page(width=W, height=H)
        for y in (150, 350, 550):
            _question(p, n, y)
            n += 1
    return _save(doc, tmp_path, "toc")


def _header_pdf(tmp_path) -> str:
    """쪽마다 문항 1개 → 14pt `유형 N` 제목 → 문항 2개. 제목은 1쪽 `유형 2`, 2쪽 `유형 3`."""
    doc = fitz.open()
    n, h = 1, 2
    for _ in range(2):
        p = doc.new_page(width=W, height=H)
        _question(p, n, 150)
        n += 1
        p.insert_text((50, 330), "유형", fontsize=14, fontname="korea")
        p.insert_text((85, 330), str(h), fontsize=14)
        h += 1
        for y in (400, 600):
            _question(p, n, y)
            n += 1
    return _save(doc, tmp_path, "header")


def _short_pdf(tmp_path) -> str:
    """문항 2개 — 유효 수열(3개 이상)이 없어 adaptive 결과가 빈다."""
    doc = fitz.open()
    p = doc.new_page(width=W, height=H)
    _question(p, 1, 150)
    _question(p, 2, 400)
    return _save(doc, tmp_path, "short")


def _yuje_pdf(tmp_path) -> str:
    """`유제` + `N-1` 두 단어 — `_merge_prefix_keyword_pairs` 가 합치는 형식."""
    doc = fitz.open()
    p = doc.new_page(width=W, height=H)
    for i, y in enumerate((150, 350, 550)):
        p.insert_text((50, y), "유제", fontsize=12, fontname="korea")
        p.insert_text((80, y), f"{i + 1}-1", fontsize=12)
        p.insert_text((110, y), "다음을 구하시오", fontsize=10, fontname="korea")
    return _save(doc, tmp_path, "yuje")


def _plain_pdf(tmp_path) -> str:
    """3쪽 · 쪽당 12pt `N.` 3개 — 정규식과 adaptive 가 모두 전부 찾는 평범한 문서."""
    doc = fitz.open()
    n = 1
    for _ in range(3):
        p = doc.new_page(width=W, height=H)
        for y in (150, 380, 610):
            _question(p, n, y)
            n += 1
    return _save(doc, tmp_path, "plain")


def _sig(boundaries):
    return sorted((b.page_index, b.number, b.is_false_positive) for b in boundaries)


def _real(boundaries):
    return sorted((b.page_index, b.number) for b in boundaries if not b.is_false_positive)


# ── 목차형 ────────────────────────────────────────────────

def test_B18_01_toc_real_questions_detected(tmp_path):
    bs = detect_question_boundaries(_toc_pdf(tmp_path))
    assert _real(bs) == [(1, 1), (1, 2), (1, 3), (2, 4), (2, 5), (2, 6)]


def test_B18_02_toc_entries_marked_false_positive(tmp_path):
    bs = detect_question_boundaries(_toc_pdf(tmp_path))
    assert [b.is_false_positive for b in bs if b.page_index == 0] == [True] * 4


# ── "유형 N" 제목형 ───────────────────────────────────────

def test_B18_03_type_headers_marked_false_positive(tmp_path):
    bs = detect_question_boundaries(_header_pdf(tmp_path))
    assert _sig(bs) == [
        (0, 1, False), (0, 2, False), (0, 2, True), (0, 3, False),
        (1, 3, True), (1, 4, False), (1, 5, False), (1, 6, False),
    ]


def test_B18_04_false_positive_header_still_cuts_previous_question(tmp_path):
    """제목이 자르기에서 빠지면 1번 단어 범위에 `유형 2` 가 들어와 하단이 제목 아래로 내려간다.

    기준은 경계가 붙는 **번호 단어 `2`** 의 top 이다 — `유형`(korea 폰트)과 `2`(helv)는 top 이
    0.1pt 어긋나 `유형` 을 기준으로 재면 올바른 구현도 실패한다(/testrun 실측).
    """
    path = _header_pdf(tmp_path)
    with pdfplumber.open(path) as pdf:
        header_top = next(w["top"] for w in pdf.pages[0].extract_words() if w["text"] == "2")
    q1 = next(b for b in detect_question_boundaries(path) if b.page_index == 0 and b.number == 1)
    assert q1.y_bottom <= header_top


# ── 불변식 · 경계 · 회귀 ──────────────────────────────────

@pytest.mark.parametrize("build", [_toc_pdf, _header_pdf, _yuje_pdf, _plain_pdf])
def test_B18_05_non_false_positive_equals_adaptive(tmp_path, build):
    path = build(tmp_path)
    adaptive = sorted((b.page_index, b.number) for b in detect_question_boundaries_adaptive(path))
    assert _real(detect_question_boundaries(path)) == adaptive


def test_B18_06_empty_adaptive_keeps_regex_result(tmp_path):
    bs = detect_question_boundaries(_short_pdf(tmp_path))
    assert _sig(bs) == [(0, 1, False), (0, 2, False)]


def test_B18_07_merged_prefix_word_not_duplicated_nor_flagged(tmp_path):
    bs = detect_question_boundaries(_yuje_pdf(tmp_path))
    assert _sig(bs) == [(0, 1, False), (0, 2, False), (0, 3, False)]


def test_B18_08_both_paths_agree_no_duplicates(tmp_path):
    bs = detect_question_boundaries(_plain_pdf(tmp_path))
    assert _sig(bs) == [(p, n, False) for p, n in
                        [(0, 1), (0, 2), (0, 3), (1, 4), (1, 5), (1, 6), (2, 7), (2, 8), (2, 9)]]
