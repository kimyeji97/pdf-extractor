"""
REQ-F17 Phase 1 — 출처 문구를 백엔드도 같은 형식으로 그린다

검증 계약: docs/plans/PLAN-F17-source-label-format.md `## 검증 계약`
케이스: F17-14

무대:
  - 지금 라벨 조립은 `extract_questions_v2` 본문 안에 인라인이라 이음매가 없다 →
    순수 함수 `build_source_label` 로 빼고 그걸 직접 부른다. PDF 를 만들지 않으므로
    `pdf_service` 의 무거운 경로(PyMuPDF 렌더·R2)를 타지 않는다.

⚠️ **계약 #12 — 프론트와 같은 문자열이어야 한다.** 짝은
   `frontend/src/utils/sourceLabel.test.js`(F17-10~13)이고 **같은 입력에 같은 기대값**을 쓴다.
   한쪽만 고치면 미리보기와 생성 PDF 가 갈린다 — 기대 문자열을 바꿀 땐 반드시 둘 다 고친다.
"""

from app.services.pdf_service import build_source_label


def test_F17_14_same_string_as_frontend():
    """프론트 F17-10 과 같은 입력 → 같은 문자열."""
    assert (
        build_source_label(
            index=1,
            workbook_name="심화대비",
            filename="",
            page_num=2,
            question_name="문항 유형 01",
        )
        == "1번) 심화대비. p3. 문항 유형 01."
    )
