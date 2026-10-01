"""
REQ-C10 Phase 1 — 감지가 경계마다 원문(`source_text`)을 남긴다

검증 계약: docs/plans/PLAN-C10-question-source-title.md `## 검증 계약`
케이스: C10-01 ~ C10-07 · C10-11 ~ C10-15

원문 = 번호 토큰 + 같은 줄 바로 앞의 키워드 접두어(유제·예제·확인예제·문제·유형). B18 위치 병합 뒤 한 곳에서
채우므로 어느 경로의 경계든 같은 규칙이다. 실제 샘플(내신마스터 "유형 01")은 저장소에 없어 **같은 모양의 합성 PDF**로
재현한다(B20 관례): 13pt `N.` 주 그룹 + 20pt "유형 04" 제목(정규식 전용 → 오탐 표시, B20-05와 같은 모양).

기출 4종·테스트02 경계 불변(계약 #11·#35)은 실제 PDF가 필요해 `/testrun`에서 수동 실측한다.
"""
import fitz

from app.utils.question_parser import detect_question_boundaries

W, H = 595, 842


def _body(page, x, y, lines: int = 3) -> None:
    for k in range(lines):
        page.insert_text((x, y + 18 * k), "다음 식의 값을 구하시오", fontsize=10, fontname="korea")


def _source_pdf(tmp_path) -> str:
    """0~3쪽 13pt `N.` 3문항씩(1~12) · 1쪽 5번 앞에 13pt "참고" · 2쪽 8번 앞에 0.1pt "유형"
    · 4쪽 20pt "유형" + "04" 제목 + 바로 아래 13pt 13~15번."""
    doc = fitz.open()
    n = 1
    for pg in range(4):
        p = doc.new_page(width=W, height=H)
        for y in (150, 380, 610):
            if n == 5:
                p.insert_text((50, y), "참고", fontsize=13, fontname="korea")
                p.insert_text((90, y), f"{n}.", fontsize=13)
                _body(p, 115, y)
            elif n == 8:
                p.insert_text((30, y), "유형", fontsize=0.1, fontname="korea")  # 보이지 않는 접두어
                p.insert_text((50, y), f"{n}.", fontsize=13)
                _body(p, 75, y)
            else:
                p.insert_text((50, y), f"{n}.", fontsize=13)
                _body(p, 75, y)
            n += 1
    p = doc.new_page(width=W, height=H)
    p.insert_text((50, 150), "유형", fontsize=20, fontname="korea")
    p.insert_text((100, 150), "04", fontsize=20)
    p.insert_text((135, 150), "삼각비의 값", fontsize=14, fontname="korea")
    for y in (210, 440, 670):
        p.insert_text((50, y), f"{n}.", fontsize=13)
        _body(p, 75, y)
        n += 1
    path = tmp_path / "source.pdf"
    doc.save(path)
    doc.close()
    return str(path)


def _q_prefixed_pdf(tmp_path) -> str:
    """3쪽 · 쪽당 3문항 13pt `Q{n}` — 정규식 패턴에 없는 형식이라 adaptive 만 잡는다."""
    doc = fitz.open()
    n = 1
    for _ in range(3):
        p = doc.new_page(width=W, height=H)
        for y in (150, 380, 610):
            p.insert_text((50, y), f"Q{n}", fontsize=13)
            _body(p, 80, y)
            n += 1
    path = tmp_path / "q_prefixed.pdf"
    doc.save(path)
    doc.close()
    return str(path)


def _source_texts(bs, page: int, number: int) -> list:
    return [b.source_text for b in bs if b.page_index == page and b.number == number]


def test_C10_01_keyword_prefix_joined(tmp_path):
    bs = detect_question_boundaries(_source_pdf(tmp_path))
    assert _source_texts(bs, 4, 4) == ["유형 04"]


def test_C10_02_plain_number_token_only(tmp_path):
    bs = detect_question_boundaries(_source_pdf(tmp_path))
    assert _source_texts(bs, 0, 3) == ["3."]


def test_C10_03_non_keyword_prefix_excluded(tmp_path):
    bs = detect_question_boundaries(_source_pdf(tmp_path))
    assert _source_texts(bs, 1, 5) == ["5."]


def test_C10_04_adaptive_only_boundary_filled(tmp_path):
    bs = detect_question_boundaries(_q_prefixed_pdf(tmp_path))
    assert _source_texts(bs, 0, 3) == ["Q3"]


def test_C10_05_detection_leaves_title_none(tmp_path):
    bs = detect_question_boundaries(_source_pdf(tmp_path))
    assert [b for b in bs if b.title is not None] == []


def test_C10_06_invisible_prefix_ignored(tmp_path):
    bs = detect_question_boundaries(_source_pdf(tmp_path))
    assert _source_texts(bs, 2, 8) == ["8."]


def test_C10_07_title_boundary_still_false_positive(tmp_path):
    bs = detect_question_boundaries(_source_pdf(tmp_path))
    assert [b.is_false_positive for b in bs if b.page_index == 4 and b.number == 4] == [True]


# ── 개정 2026-10-01 — 번호 바로 위 접두어 (C10-11 ~ 15) ──
# 실제 "유형 N"은 같은 줄이 아니라 번호 바로 위에 얹혀 있다(내신마스터 실측: 8pt "유형" top 105.0 x 85.3 /
# 16pt "01" top 114.6 x 84.0, 같은 줄 0건). 첫 무대(C10-01)는 같은 줄에 놓아 녹색이었지만 실제로는 0건이었다 —
# 그래서 이 무대는 실측 배치를 따른다. 제목마다 쪽을 따로 두고 아래에 13pt 문항을 붙인다(정규식 전용 → 오탐, B20-05 모양).

def _title_page(doc, n: int, put_title) -> int:
    p = doc.new_page(width=W, height=H)
    put_title(p)
    for y in (230, 460):
        p.insert_text((50, y), f"{n}.", fontsize=13)
        _body(p, 75, y)
        n += 1
    return n


def _above_pdf(tmp_path) -> str:
    """0~3쪽 13pt `N.` 주 그룹 · 4~8쪽 20pt `0N` 제목에 접두어 배치를 하나씩."""
    doc = fitz.open()
    n = 1
    for _ in range(4):
        p = doc.new_page(width=W, height=H)
        for y in (150, 380, 610):
            p.insert_text((50, y), f"{n}.", fontsize=13)
            _body(p, 75, y)
            n += 1

    # dy 는 **top 간격**이다. 기준선 간격으로 주면 작은 글자의 top 이 큰 번호의 top 과 거의 같아져 같은 줄이 된다
    # (시제작 실측: 기준선 10pt 위 → top 143.6 vs 번호 144.1). 20pt 번호 top ≈ 기준선 − 15.9, 8pt 라벨 top ≈ 기준선 − 6.4
    label_base = lambda dy: 160 - 15.9 - dy + 6.4

    def above(num, label="유형", dy=10, dx=2):
        # 번호 기준선 160, 라벨 top 은 번호 top 보다 dy 위 — dx 로 x 를 번호 왼쪽 끝 근처에 겹친다
        def put(p):
            p.insert_text((50 + dx, label_base(dy)), label, fontsize=8, fontname="korea")
            p.insert_text((50, 160), num, fontsize=20)
            p.insert_text((85, 160), "삼각비의 값", fontsize=14, fontname="korea")
        return put

    def left_and_above(p):
        p.insert_text((102, label_base(10)), "유형", fontsize=8, fontname="korea")  # "08" 바로 위
        p.insert_text((50, 160), "예제", fontsize=20, fontname="korea")
        p.insert_text((100, 160), "08", fontsize=20)
        p.insert_text((135, 160), "삼각비의 값", fontsize=14, fontname="korea")

    n = _title_page(doc, n, above("05"))                    # 4쪽 바로 위
    n = _title_page(doc, n, above("06", dy=40))             # 5쪽 너무 멀리 위
    n = _title_page(doc, n, above("07", dx=300))            # 6쪽 위지만 x 안 겹침
    n = _title_page(doc, n, left_and_above)                 # 7쪽 같은 줄 왼쪽 + 위
    n = _title_page(doc, n, above("09", label="삼각비"))     # 8쪽 위 단어가 키워드 아님
    path = tmp_path / "above.pdf"
    doc.save(path)
    doc.close()
    return str(path)


def test_C10_11_keyword_directly_above(tmp_path):
    bs = detect_question_boundaries(_above_pdf(tmp_path))
    assert _source_texts(bs, 4, 5) == ["유형 05"]


def test_C10_12_keyword_too_far_above(tmp_path):
    bs = detect_question_boundaries(_above_pdf(tmp_path))
    assert _source_texts(bs, 5, 6) == ["06"]


def test_C10_13_keyword_above_without_x_overlap(tmp_path):
    bs = detect_question_boundaries(_above_pdf(tmp_path))
    assert _source_texts(bs, 6, 7) == ["07"]


def test_C10_14_same_line_left_wins_over_above(tmp_path):
    bs = detect_question_boundaries(_above_pdf(tmp_path))
    assert _source_texts(bs, 7, 8) == ["예제 08"]


def test_C10_15_non_keyword_above_excluded(tmp_path):
    bs = detect_question_boundaries(_above_pdf(tmp_path))
    assert _source_texts(bs, 8, 9) == ["09"]
