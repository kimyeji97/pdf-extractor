"""
PDF 처리 서비스 v2

흐름:
  1. pdfplumber  → 단어 좌표 기반 문항 경계 감지 (2단 레이아웃 + Y클리핑)
  2. 감지 실패 시 → textract_service (Tesseract OCR fallback)
  3. PyMuPDF     → CropRegion 기반 벡터 크롭 → 새 PDF 저장

크롭 전략:
  - 전체 페이지 영역 → insert_pdf()  : 텍스트/벡터 완전 보존
  - 부분 영역        → show_pdf_page(): 벡터 기반 클리핑, 선명도 유지
"""

import fitz         # pymupdf
import pdfplumber
from pathlib import Path

from app.utils.question_parser import (
    parse_question_numbers,
    detect_question_boundaries,
    map_questions_to_regions,
    CropRegion,
)
from app.services import textract_service


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 메인 엔트리포인트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def extract_questions(
    input_pdf_path: str,
    question_numbers_raw: str,
    output_pdf_path: str,
) -> int:
    """
    입력 PDF에서 요청 문항을 추출하여 output_pdf_path에 저장한다.

    Args:
        input_pdf_path:      원본 PDF 경로
        question_numbers_raw: "1,3,5" / "1-5" / "1,3,7-10" 형식의 문항 번호
        output_pdf_path:     출력 PDF 경로

    Returns:
        추출 성공한 문항 수

    Raises:
        ValueError: 감지된 문항이 하나도 없을 때
    """
    requested = parse_question_numbers(question_numbers_raw)

    # ── Step 1: 좌표 기반 문항 경계 감지 (2단 레이아웃 지원) ──
    boundaries = detect_question_boundaries(input_pdf_path)
    detected_nums = {b.number for b in boundaries}
    missing = [n for n in requested if n not in detected_nums]

    # ── Step 2: 절반 이상 누락이면 OCR fallback ──────────────
    if len(missing) > len(requested) / 2:
        ocr_boundaries = textract_service.extract_boundaries(input_pdf_path)
        if ocr_boundaries:
            boundaries = ocr_boundaries

    # ── Step 3: 문항 → CropRegion 매핑 ──────────────────────
    q_to_regions = map_questions_to_regions(boundaries, requested)

    if not q_to_regions:
        raise ValueError(
            f"요청한 문항 {requested} 을 PDF에서 감지하지 못했습니다.\n"
            f"감지된 문항 번호: {sorted(detected_nums)}"
        )

    # ── Step 4: CropRegion → 새 PDF 빌드 ────────────────────
    # 문항 번호 순서대로 region 정렬
    ordered_regions: list[CropRegion] = []
    for q_num in sorted(q_to_regions.keys()):
        ordered_regions.extend(q_to_regions[q_num])

    _build_pdf_from_regions(input_pdf_path, ordered_regions, output_pdf_path)

    return len(q_to_regions)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 내부 헬퍼: PDF 빌드
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 전체 페이지로 간주하는 오차 허용 범위 (pt)
_FULL_PAGE_TOLERANCE = 6.0


def _build_pdf_from_regions(
    src_path: str,
    regions: list[CropRegion],
    dst_path: str,
) -> None:
    """
    CropRegion 목록을 순서대로 새 PDF에 삽입한다.

    전략:
      - 전체 페이지 영역 → insert_pdf() : 텍스트·벡터·메타데이터 완전 보존
      - 부분 영역        → show_pdf_page() : 벡터 기반 클리핑 (선명, 빠름)
      - y1 == 9999      → 전체 페이지 (중간 페이지 sentinel 값)
    """
    src = fitz.open(src_path)
    dst = fitz.open()

    for region in regions:
        if not (0 <= region.page_index < len(src)):
            continue  # 범위 초과 방어

        src_page = src[region.page_index]
        page_rect = src_page.rect  # (0, 0, width, height)

        # sentinel: 중간 페이지 전체 포함
        is_full_sentinel = region.y1 >= 9990

        # 실제 클리핑 rect 계산 (페이지 범위 클램프)
        clip = fitz.Rect(
            max(region.x0, page_rect.x0),
            max(region.y0, page_rect.y0),
            min(region.x1, page_rect.x1),
            min(region.y1, page_rect.y1) if not is_full_sentinel else page_rect.y1,
        )

        # 전체 페이지 여부 판단
        is_full_page = is_full_sentinel or (
            abs(clip.x0 - page_rect.x0) <= _FULL_PAGE_TOLERANCE
            and abs(clip.y0 - page_rect.y0) <= _FULL_PAGE_TOLERANCE
            and abs(clip.x1 - page_rect.x1) <= _FULL_PAGE_TOLERANCE
            and abs(clip.y1 - page_rect.y1) <= _FULL_PAGE_TOLERANCE
        )

        if is_full_page:
            # 전체 페이지: 텍스트·이미지·벡터 완전 보존
            dst.insert_pdf(src, from_page=region.page_index, to_page=region.page_index)
        else:
            # 부분 크롭: 벡터 기반 클리핑
            _insert_cropped_page(src_page, clip, dst)

    dst.save(dst_path, garbage=4, deflate=True)
    src.close()
    dst.close()


def _insert_cropped_page(
    src_page: fitz.Page,
    clip: fitz.Rect,
    dst: fitz.Document,
) -> None:
    """
    src_page의 clip 영역만을 dst에 새 페이지로 추가한다.

    방법: show_pdf_page()
      - 벡터 그래픽, 수식, 텍스트 선명도를 래스터화 없이 보존
      - 출력 페이지 크기 = clip 크기 (불필요한 여백 없음)
    """
    w = clip.width
    h = clip.height

    if w <= 0 or h <= 0:
        return  # 유효하지 않은 영역 스킵

    new_page = dst.new_page(width=w, height=h)
    dst_rect  = fitz.Rect(0, 0, w, h)

    new_page.show_pdf_page(
        dst_rect,
        src_page.parent,   # 원본 Document
        src_page.number,   # 원본 페이지 번호
        clip=clip,         # 클리핑 영역
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 레거시 호환: 페이지 번호 기반 추출 (OCR fallback에서 사용)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _build_pdf_from_pages(
    src_path: str,
    page_indices: list[int],
    dst_path: str,
) -> None:
    """
    지정된 페이지 번호 목록만 추출해 새 PDF 생성.
    좌표 정보 없이 페이지 단위로만 추출할 때 사용.
    """
    src = fitz.open(src_path)
    dst = fitz.open()
    for idx in page_indices:
        if 0 <= idx < len(src):
            dst.insert_pdf(src, from_page=idx, to_page=idx)
    dst.save(dst_path, garbage=4, deflate=True)
    src.close()
    dst.close()
