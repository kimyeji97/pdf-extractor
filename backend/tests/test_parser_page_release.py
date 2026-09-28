"""
REQ-B17 Phase 1 — 문항 감지의 pdfplumber 페이지 누수 수정 검증 계약

검증 계약: docs/plans/PLAN-B17-analysis-oom.md `## 검증 계약`
케이스: B17-01 ~ B17-05

pdfplumber 는 읽은 페이지의 파싱 결과를 캐시에 쥐고 있어서, 감지 루프가 페이지를 닫지 않으면 메모리가
쪽수에 비례해 쌓인다(212쪽 1,032MB → 닫으면 154MB, 계획서 § 배경).

⚠️ **"닫힌 페이지 집합"을 단언하지 않는다.** pdfplumber 0.11.4 의 `PDF.close()` 는 `with` 블록 끝에서 모든
페이지를 닫는다 — 집합만 보면 수정 전 코드도 통과한다. 누수는 **루프 동안** 페이지가 쌓이는 것이므로
B17-01·02 는 호출 순서로 "다음 페이지 단어를 읽기 전에 이전 페이지가 닫혔다"를 본다.

동일성(B17-03·04)은 기준값 파일 대신 **`Page.close` 를 no-op 으로 바꾼 실행**과 비교한다 — 닫기가 결과를
바꾸는지만 보고, 감지 로직이 앞으로 바뀌어도 이 케이스가 괜히 깨지지 않게 한다(계약 #11).

합성 PDF 는 문항마다 끝에 도형을 둔다 — B16(문항 끝 그림 크롭)이 같은 루프에서 그림을 모으므로
닫는 시점이 그 수집보다 앞서면 그림 반영분이 결과에서 사라져 B17-03 이 잡는다.
"""
import fitz
import pdfplumber.page as plumber_page
import pytest

from app.utils import question_parser
from app.utils.question_parser import (
    detect_question_boundaries,
    detect_question_boundaries_adaptive,
)

PAGES = 3


@pytest.fixture
def sample_pdf(tmp_path):
    """3쪽 · 쪽당 문항 3개 · 문항마다 끝에 도형이 붙은 합성 PDF."""
    doc = fitz.open()
    n = 1
    for _ in range(PAGES):
        page = doc.new_page(width=595, height=842)
        y = 120
        for _ in range(3):
            page.insert_text((50, y), f"{n}.", fontsize=12)
            page.insert_text((75, y), f"다음 식의 값을 구하시오 {n}", fontsize=10, fontname="korea")
            page.insert_text((75, y + 18), "(1) 1   (2) 2   (3) 3", fontsize=10)
            page.draw_rect(fitz.Rect(80, y + 30, 200, y + 110))
            y += 230
            n += 1
    path = tmp_path / "sample.pdf"
    doc.save(path)
    doc.close()
    return str(path)


def _signature(boundaries):
    return [
        (b.page_index, b.number, round(b.y_top, 3), round(b.y_bottom, 3), b.is_false_positive)
        for b in boundaries
    ]


def _record_page_events(monkeypatch):
    """`extract_words`·`close` 호출을 (종류, page_number) 순서로 기록한다."""
    events = []
    orig_extract = plumber_page.Page.extract_words
    orig_close = plumber_page.Page.close

    def extract_words(self, *args, **kwargs):
        events.append(("extract", self.page_number))
        return orig_extract(self, *args, **kwargs)

    def close(self):
        events.append(("close", self.page_number))
        return orig_close(self)

    monkeypatch.setattr(plumber_page.Page, "extract_words", extract_words)
    monkeypatch.setattr(plumber_page.Page, "close", close)
    return events


def _closed_before_next_read(events):
    """페이지 k 가 페이지 k+1 의 첫 단어 추출보다 먼저 닫혔는지 — 쪽별 결과."""
    result = {}
    for k in range(1, PAGES):
        next_read = events.index(("extract", k + 1))
        result[k] = ("close", k) in events[:next_read]
    return result


# ── B17-01·02 : 다음 페이지를 읽기 전에 이전 페이지를 닫는다 ──────

def test_B17_01_detect_다음_페이지를_읽기_전에_이전_페이지를_닫는다(sample_pdf, monkeypatch):
    """근거: PLAN § 범위 — "다 읽은 페이지를 닫는다" """
    events = _record_page_events(monkeypatch)

    detect_question_boundaries(sample_pdf)

    assert _closed_before_next_read(events) == {k: True for k in range(1, PAGES)}


def test_B17_02_adaptive_다음_페이지를_읽기_전에_이전_페이지를_닫는다(sample_pdf, monkeypatch):
    """근거: PLAN § 제약·함정 — "감지 루프가 둘이다" """
    events = _record_page_events(monkeypatch)

    detect_question_boundaries_adaptive(sample_pdf)

    assert _closed_before_next_read(events) == {k: True for k in range(1, PAGES)}


# ── B17-03·04 : 닫기가 감지 결과를 바꾸지 않는다 ──────────────────

def test_B17_03_detect_닫기가_결과를_바꾸지_않는다(sample_pdf, monkeypatch):
    """근거: PLAN § 제약·함정 — "누수 수정은 결과를 바꾸면 안 된다" """
    with_close = _signature(detect_question_boundaries(sample_pdf))
    monkeypatch.setattr(plumber_page.Page, "close", lambda self: None)
    without_close = _signature(detect_question_boundaries(sample_pdf))

    assert with_close == without_close


def test_B17_04_adaptive_닫기가_결과를_바꾸지_않는다(sample_pdf, monkeypatch):
    """근거: PLAN § 제약·함정 — "누수 수정은 결과를 바꾸면 안 된다" """
    with_close = _signature(detect_question_boundaries_adaptive(sample_pdf))
    monkeypatch.setattr(plumber_page.Page, "close", lambda self: None)
    without_close = _signature(detect_question_boundaries_adaptive(sample_pdf))

    assert with_close == without_close


# ── B17-05 : 그림 목록은 좌표 숫자만 담는다 ────────────────────────

def test_B17_05_그림_목록은_좌표_네_키만_담는다(sample_pdf, monkeypatch):
    """근거: PLAN § 제약·함정 — "그 넷만 복사해 담을 것" """
    captured = []
    orig = question_parser._apply_precision_improvements

    def spy(boundaries, pages_data, pages_graphics=None):
        captured.append(pages_graphics)
        return orig(boundaries, pages_data, pages_graphics)

    monkeypatch.setattr(question_parser, "_apply_precision_improvements", spy)

    detect_question_boundaries(sample_pdf)

    key_sets = {frozenset(g) for page in captured[0] for g in page}
    assert key_sets == {frozenset({"x0", "x1", "top", "bottom"})}
