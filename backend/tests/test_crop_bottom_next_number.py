"""
REQ-B21 Phase 1 — 하단 조임이 다음 문항 첫 줄을 제 것으로 잡지 않는다

검증 계약: docs/plans/PLAN-B21-crop-bottom-next-number.md `## 검증 계약`
케이스: B21-01 ~ B21-04

다음 문항이 있으면 `_fill_y_bottom` 이 정한 y_bottom 은 **다음 문항 번호 글자의 top 과 같다.** 조임에 넘기는
단어를 `top <= y_bottom` 으로 고르면 그 번호 글자가 이 문항의 가장 아래 단어가 되어 조임이 다음 문항 시작에서 멈춘다
(기출 4종 1,145건 중 563건). 결정: 다음 문항이 시작하기 **전에 끝나는** 단어·그림(bottom ≤ 다음 문항 시작)만 이 문항 것.

무대는 `test_crop_margin.py`(B13)와 같다 — PDF 없이 단어 좌표로 `_fill_y_bottom` → `_apply_precision_improvements`.
x 좌표 불변·실제 PDF(Red 3쪽 6번 ≈ 315.1)는 합성 좌표로 단언하면 현재 동작을 박제하므로 수동 실측으로 둔다.
"""
from app.utils.question_parser import (
    QuestionBoundary,
    _apply_precision_improvements,
    _fill_y_bottom,
)

PAGE_W = 595.0
PAGE_H = 842.0
MARGIN = 10.0            # B13 § 결정 "네 변 모두 10pt"
NEXT_TOP = 500.0         # 2번 번호 글자의 top = 1번의 _fill_y_bottom 결과


def word(text: str, x0: float, top: float, x1: float, bottom: float) -> dict:
    return {"text": text, "x0": x0, "top": top, "x1": x1, "bottom": bottom, "size": 10.0}


def boundary(number: int, y_top: float) -> QuestionBoundary:
    return QuestionBoundary(
        number=number, page_index=0, y_top=y_top, y_bottom=PAGE_H,
        col=0, col_x0=0.0, col_x1=PAGE_W,
    )


def refine(words, graphics=None):
    """1번(200)·2번(NEXT_TOP) 경계를 만들고 y_bottom 확정 → 정밀화. 1번 경계를 돌려준다."""
    bs = [boundary(1, 200.0), boundary(2, NEXT_TOP)]
    _fill_y_bottom(bs, [PAGE_H])
    assert bs[0].y_bottom == NEXT_TOP   # 무대 전제: 1번의 조임 전 하단 = 2번 시작
    _apply_precision_improvements(bs, [(PAGE_W, PAGE_H, words)], [graphics or []])
    return bs[0]


def q1_body(last_bottom: float) -> list[dict]:
    """1번: 번호 + 본문 두 줄, 마지막 줄 bottom = last_bottom."""
    return [
        word("1.", 100, 200, 120, 212),
        word("다음을", 130, 200, 300, 212),
        word("구하시오", 100, last_bottom - 12, 300, last_bottom),
    ]


def q2_line() -> list[dict]:
    """2번: 번호(top = NEXT_TOP) + 같은 줄 본문."""
    return [
        word("2.", 100, NEXT_TOP, 120, NEXT_TOP + 12),
        word("다음", 130, NEXT_TOP, 300, NEXT_TOP + 12),
    ]


def test_B21_01_non_last_question_tightens_to_own_text():
    b = refine(q1_body(312.0) + q2_line())
    assert b.y_bottom == 312.0 + MARGIN


def test_B21_02_close_next_question_keeps_min_guard():
    b = refine(q1_body(495.0) + q2_line())
    assert b.y_bottom == NEXT_TOP


def test_B21_03_tall_glyph_on_next_first_line_is_not_ours():
    # 수식 글리프: top 이 번호보다 4pt 위(3pt 기준 밖)지만 bottom 은 번호 줄 아래까지 — 2번 첫 줄이다
    tall = word("cos", 140, NEXT_TOP - 4, 170, NEXT_TOP + 14)
    b = refine(q1_body(312.0) + q2_line() + [tall])
    assert b.y_bottom == 312.0 + MARGIN


def test_B21_04_next_question_graphic_is_not_ours():
    graphic = {"x0": 130.0, "x1": 400.0, "top": NEXT_TOP, "bottom": 600.0}
    b = refine(q1_body(312.0) + [w for w in q2_line() if w["text"] != "다음"], [graphic])
    assert b.y_bottom == 312.0 + MARGIN
