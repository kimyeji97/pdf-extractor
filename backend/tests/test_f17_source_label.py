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


def test_F17_19_uses_saved_source_filename_not_live_status():
    """파일명 폴백은 저장된 `sel.source_filename` 스냅샷에서 온다 (계약 #12).

    프론트는 저장된 값을 읽으므로 백엔드가 live `job_status.filename` 을 읽으면
    옛 저장본(그 필드가 없던 시절)에서 미리보기와 생성 PDF 가 갈린다 —
    `/review` 회차 0 의 (b). 소스 스캔으로 live 조회가 사라졌는지 본다.
    """
    from pathlib import Path

    source = Path(__file__).resolve().parents[1] / "app" / "services" / "pdf_service.py"
    code = source.read_text(encoding="utf-8")

    # 저장 스냅샷을 쓴다
    assert "sel.source_filename" in code
    # live 상태의 filename 을 라벨 재료로 긁어 오지 않는다
    assert "job_status.filename" not in code


def test_F17_22_workbook_name_also_from_saved_snapshot():
    """출처 **이름**도 저장된 `sel.workbook_name` 을 쓴다 (계약 #12).

    `/review` 회차 1 이 "파일명만 스냅샷이라 비대칭"이라고 잡아 고쳤는데, 회차 2 가
    **그 수선을 지키는 단언이 0건**임을 찾아냈다 — live 조회로 되돌려도 전부 녹색이었다.
    F17-19 가 파일명을 보듯 이쪽은 이름을 본다.
    """
    from pathlib import Path

    source = Path(__file__).resolve().parents[1] / "app" / "services" / "pdf_service.py"
    code = source.read_text(encoding="utf-8")

    # 저장 스냅샷에서 이름을 읽는다
    assert "sel.workbook_name" in code
    # live 상태 조회로 이름을 긁어 오지 않는다 (되돌리면 이 둘이 되살아난다)
    assert "workbook_names" not in code
    assert "storage.get_status(sel.job_id)" not in code
