"""
REQ-B13 Phase 1 — 문항 크롭 여백을 네 변 10pt로 통일 검증 계약

검증 계약: docs/plans/PLAN-B13-crop-margin-uniform.md `## 검증 계약`
케이스: B13-01 ~ B13-10

`_apply_precision_improvements()` 는 `(page_w, page_h, words)` 튜플과 `QuestionBoundary`
리스트만 받는다 — **PDF 도 mock 도 필요 없다.** 이 레포에서 드물게 깨끗한 무대라 크롭 경계
계산을 순수 단위 테스트로 덮을 수 있다.

⚠️ **여유 상수의 이름은 계획서가 정하지 않아 이 파일이 검증 계약으로 고정한다** —
`question_parser._CROP_MARGIN_PT`. B13-10 이 monkeypatch 로 "네 변이 이 하나를 공유하는가"를
검증하므로 **함수 안에서 읽어야 한다**. import 시점에 지역 변수로 복사해 두면 B13-10 이 빨갛다.

⚠️ **B13-05·06 이 이 REQ 에서 가장 위험한 자리를 지킨다.** 경계를 넓히는 작업이라 다음/이전
문항 텍스트가 딸려 들어올 수 있고, 계획서가 "둘 중 하나라도 빼면 크롭에 남의 문항이 찍힌다"고
지목한 두 방어선이 그것이다(계약 #11 — 감지 정확도).
"""
import pytest

from app.utils import question_parser
from app.utils.question_parser import (
    QuestionBoundary,
    _apply_precision_improvements,
    _fill_y_bottom,
)

PAGE_W = 595.0
PAGE_H = 842.0
MARGIN = 10.0          # 계획서 § 결정 "네 변 모두 10pt"


def word(text: str, x0: float, top: float, x1: float, bottom: float) -> dict:
    """pdfplumber 단어 하나. 파서가 읽는 키만 담는다."""
    return {"text": text, "x0": x0, "top": top, "x1": x1, "bottom": bottom, "size": 10.0}


def boundary(number: int, y_top: float, **over) -> QuestionBoundary:
    """컬럼 분할점 기준의 거친 경계 — 정밀화 이전 상태."""
    kwargs = dict(
        number=number,
        page_index=0,
        y_top=y_top,
        y_bottom=PAGE_H,
        col=0,
        col_x0=0.0,
        col_x1=PAGE_W,
    )
    kwargs.update(over)
    return QuestionBoundary(**kwargs)


def refine(boundaries, words):
    """정밀화를 돌리고 경계를 그대로 돌려준다 (in-place 수정)."""
    _apply_precision_improvements(boundaries, [(PAGE_W, PAGE_H, words)])
    return boundaries


# ── 단일 문항: 네 변 ───────────────────────────────────────

def _single_question():
    """번호(100,200)~(120,212) + 본문 한 줄(100,220)~(300,232) 짜리 문항 하나."""
    words = [
        word("1.", 100, 200, 120, 212),
        word("본문", 100, 220, 300, 232),
    ]
    return [boundary(1, y_top=200)], words


def test_B13_01_좌측은_번호_x0에서_10pt_왼쪽():
    """근거: PLAN § 결정 — "**네 변 모두 10pt** | 좌측이 이미 10pt이고"

    현행 유지 케이스다 — 이 값이 "번호가 잘리지 않는" 실측 기준이었고 나머지 세 변을
    여기에 맞춘다.
    """
    b, words = _single_question()

    refine(b, words)

    assert b[0].col_x0 == 100 - MARGIN


def test_B13_02_우측은_최대_x1에서_10pt_오른쪽():
    """근거: PLAN § Phase 1 — "완료 기준: 자동 감지 문항의 크롭 경계가 **네 변 모두 텍스트에서 10pt 떨어져 있다.**" """
    b, words = _single_question()

    refine(b, words)

    assert b[0].col_x1 == 300 + MARGIN


def test_B13_03_상단은_번호_top에서_10pt_위():
    """근거: PLAN § Phase 1 — "완료 기준: 자동 감지 문항의 크롭 경계가 **네 변 모두 텍스트에서 10pt 떨어져 있다.**" """
    b, words = _single_question()

    refine(b, words)

    assert b[0].y_top == 200 - MARGIN


def test_B13_04_하단은_마지막_텍스트_bottom에서_10pt_아래():
    """근거: PLAN § Phase 1 — "완료 기준: 자동 감지 문항의 크롭 경계가 **네 변 모두 텍스트에서 10pt 떨어져 있다.**"

    종전에는 `+50pt` 가 **상한**이라 다음 문항이 가까우면 그만큼 줄어 문항마다 달랐다.
    이제 고정값이다.
    """
    b, words = _single_question()

    refine(b, words)

    assert b[0].y_bottom == 232 + MARGIN


# ── 이웃 문항 침범 방어 (이 REQ 의 가장 위험한 자리) ────────

def test_B13_05_다음_문항이_가까우면_그_y_top을_넘지_않는다():
    """근거: PLAN § Phase 1 — "다음 문항이 10pt보다 가까우면 그만큼만 주고 **다음 문항 번호를 포함하지 않는다.**"

    문항 1의 마지막 텍스트 bottom=232, 문항 2의 y_top=236 — 간격이 4pt 라 10pt 를 다 줄 수
    없다. 가드를 빼면 242 가 되어 **다음 문항 번호가 크롭에 찍힌다.**
    """
    words = [
        word("1.", 100, 200, 120, 212),
        word("본문", 100, 220, 300, 232),
        word("2.", 100, 236, 120, 248),
    ]
    b = [boundary(1, y_top=200), boundary(2, y_top=236)]
    _fill_y_bottom(b, [PAGE_H])

    refine(b, words)

    assert b[0].y_bottom <= 236


def test_B13_06_상단이_이전_문항_y_bottom보다_위로_가지_않는다():
    """근거: PLAN § 결정 — "**이전 문항의 `y_bottom`을 넘지 않는다** (+ `max(0, …)`)"

    문항 1이 232 에서 끝나고 문항 2가 236 에서 시작한다 — 위로 10pt 넓히면 226 이 되어
    **앞 문항 꼬리가 들어온다.** 페이지 상단 클램프만으로는 못 막는 경우다.
    """
    words = [
        word("1.", 100, 200, 120, 212),
        word("본문", 100, 220, 300, 232),
        word("2.", 100, 236, 120, 248),
    ]
    b = [boundary(1, y_top=200), boundary(2, y_top=236)]
    _fill_y_bottom(b, [PAGE_H])

    refine(b, words)

    assert b[1].y_top >= b[0].y_bottom


def test_B13_07_페이지_마지막_문항도_같은_규칙을_따른다():
    """근거: PLAN § Phase 1 — "페이지 마지막 문항도 같은 규칙을 따른다. 수동 문항 경계는 **변하지 않는다.**"

    종전에는 마지막 문항만 `footer_y = page_h × 0.91`(= 766.2) 이라는 **완전히 다른 규칙**을
    써서 여백이 튀었다. 이제 마지막 텍스트 + 10pt 다.
    """
    words = [
        word("1.", 100, 200, 120, 212),
        word("본문", 100, 220, 300, 232),
    ]
    b = [boundary(1, y_top=200)]
    _fill_y_bottom(b, [PAGE_H])

    refine(b, words)

    assert b[0].y_bottom == 232 + MARGIN


# ── 페이지 경계 클램프 ─────────────────────────────────────

def test_B13_08_우측이_페이지_폭을_넘지_않는다():
    """근거: PLAN § 결정 — "**`min(page_w, …)`**" """
    words = [
        word("1.", 100, 200, 120, 212),
        word("본문", 100, 220, PAGE_W - 3, 232),   # 오른쪽 끝에서 3pt
    ]
    b = [boundary(1, y_top=200)]

    refine(b, words)

    assert b[0].col_x1 <= PAGE_W


def test_B13_09_상단이_0_미만이_되지_않는다():
    """근거: PLAN § 결정 — "**이전 문항의 `y_bottom`을 넘지 않는다** (+ `max(0, …)`)" """
    words = [
        word("1.", 100, 3, 120, 15),                # 페이지 맨 위에서 3pt
        word("본문", 100, 20, 300, 32),
    ]
    b = [boundary(1, y_top=3)]

    refine(b, words)

    assert b[0].y_top >= 0


# ── 상수 공유 ─────────────────────────────────────────────

@pytest.mark.parametrize(
    "side, expected",
    [
        ("col_x0", 100 - 12),
        ("col_x1", 300 + 12),
        ("y_top", 200 - 12),
        ("y_bottom", 232 + 12),
    ],
)
def test_B13_10_상수를_바꾸면_네_변이_모두_따라간다(monkeypatch, side, expected):
    """근거: PLAN § 제약 — "상수 하나를 넷이 공유해야 "통일"이 코드에서"

    소스에서 `10` 을 세는 대신 **상수를 12pt 로 바꿔 네 변이 모두 따라가는지** 본다.
    네 곳에 숫자를 각각 박아 넣은 구현은 여기서 빨개진다 — 그게 이 케이스의 존재 이유다.

    ⚠️ 상수를 **함수 안에서 읽어야** monkeypatch 가 먹는다. import 시점에 지역 변수로
    복사해 두면 값이 안 바뀐다.
    """
    monkeypatch.setattr(question_parser, "_CROP_MARGIN_PT", 12.0)
    b, words = _single_question()

    refine(b, words)

    assert getattr(b[0], side) == expected
