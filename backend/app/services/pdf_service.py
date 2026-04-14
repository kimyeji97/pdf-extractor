"""
PDF 처리 서비스

흐름:
  1. pdfplumber → 텍스트 추출 + 문항 경계 감지
  2. 실패 시 → textract_service.py (fallback)
  3. pymupdf (fitz) → 해당 페이지 추출 → 새 PDF 저장
"""
import tempfile
import fitz          # pymupdf
import pdfplumber
from pathlib import Path

from app.utils.question_parser import (
    parse_question_numbers,
    detect_question_boundaries_from_text,
    map_questions_to_pages,
)
from app.services import textract_service


# ── 메인 엔트리포인트 ─────────────────────────────────

def extract_questions(
    input_pdf_path: str,
    question_numbers_raw: str,
    output_pdf_path: str,
) -> int:
    """
    입력 PDF에서 요청 문항을 추출해 output_pdf_path에 저장.
    Returns: 추출된 문항 수 (감지 성공 기준)

    Raises:
        ValueError: 감지된 문항이 없을 때
    """
    requested = parse_question_numbers(question_numbers_raw)

    # Step 1: pdfplumber로 텍스트 추출 시도
    pages_text = _extract_text_with_pdfplumber(input_pdf_path)
    boundaries = detect_question_boundaries_from_text(pages_text)

    # Step 2: 감지된 문항이 요청 수의 절반 미만이면 Textract fallback
    detected_nums = {b.number for b in boundaries}
    missing = [n for n in requested if n not in detected_nums]

    if len(missing) > len(requested) / 2:
        # 텍스트 레이어가 부족한 PDF → Textract
        boundaries = textract_service.extract_boundaries(input_pdf_path)

    # Step 3: 문항 → 페이지 매핑
    q_to_pages = map_questions_to_pages(boundaries, requested)

    if not q_to_pages:
        raise ValueError(f"요청한 문항({requested})을 PDF에서 감지하지 못했습니다.")

    # Step 4: pymupdf로 페이지 추출 → 새 PDF
    pages_to_include = sorted(set(p for pages in q_to_pages.values() for p in pages))
    _build_pdf_from_pages(input_pdf_path, pages_to_include, output_pdf_path)

    return len(q_to_pages)


# ── 내부 헬퍼 ─────────────────────────────────────────

def _extract_text_with_pdfplumber(pdf_path: str) -> list[str]:
    """페이지별 텍스트 추출 (빈 페이지는 빈 문자열)"""
    texts: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            texts.append(text)
    return texts


def _build_pdf_from_pages(
    src_path: str,
    page_indices: list[int],
    dst_path: str,
) -> None:
    """
    pymupdf로 지정 페이지만 뽑아 새 PDF 생성.
    텍스트·이미지·벡터 그래픽을 그대로 유지한다.
    """
    src = fitz.open(src_path)
    dst = fitz.open()

    for idx in page_indices:
        if 0 <= idx < len(src):
            dst.insert_pdf(src, from_page=idx, to_page=idx)

    dst.save(dst_path, garbage=4, deflate=True)
    src.close()
    dst.close()
