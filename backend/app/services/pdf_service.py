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

import dataclasses
import fitz         # pymupdf
import pdfplumber
from dataclasses import dataclass
from pathlib import Path

from app.utils.question_parser import (
    parse_question_numbers,
    detect_question_boundaries,
    detect_question_boundaries_adaptive,
    map_questions_to_regions,
    CropRegion,
    QuestionBoundary,
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

    # ── Step 1: 정규식 기반 문항 경계 감지 (단일 패스) ────────
    boundaries = detect_question_boundaries(input_pdf_path)
    detected_nums = {b.number for b in boundaries}
    missing = [n for n in requested if n not in detected_nums]

    # ── Step 2: 연속 증가 수열 방식 (새 양식 대응) ────────────
    if len(missing) > len(requested) / 2:
        adaptive_boundaries = detect_question_boundaries_adaptive(input_pdf_path)
        if adaptive_boundaries:
            adaptive_detected = {b.number for b in adaptive_boundaries}
            adaptive_missing = [n for n in requested if n not in adaptive_detected]
            if len(adaptive_missing) < len(missing):
                boundaries = adaptive_boundaries
                missing = adaptive_missing

    # ── Step 3: 절반 이상 여전히 누락이면 OCR fallback ────────
    if len(missing) > len(requested) / 2:
        # 감지된 문항 위치 기반으로 누락 구간 페이지만 OCR 처리
        import fitz as _fitz
        _doc = _fitz.open(input_pdf_path)
        total_pages = len(_doc)
        _doc.close()
        ocr_pages = _estimate_missing_page_ranges(
            detected={b.number: b.page_index for b in boundaries},
            missing=missing,
            total_pages=total_pages,
        )
        ocr_boundaries = textract_service.extract_boundaries(
            input_pdf_path,
            page_indices=ocr_pages if ocr_pages else None,
        )
        if ocr_boundaries:
            boundaries = ocr_boundaries

    # ── Step 4: 문항 → CropRegion 매핑 ──────────────────────
    q_to_regions = map_questions_to_regions(boundaries, requested)

    if not q_to_regions:
        raise ValueError(
            f"요청한 문항 {requested} 을 PDF에서 감지하지 못했습니다.\n"
            f"감지된 문항 번호: {sorted(detected_nums)}"
        )

    # ── Step 5: CropRegion → 새 PDF 빌드 ────────────────────
    ordered_regions: list[CropRegion] = []
    for q_num in sorted(q_to_regions.keys()):
        ordered_regions.extend(q_to_regions[q_num])

    _build_pdf_from_regions(input_pdf_path, ordered_regions, output_pdf_path)

    return len(q_to_regions)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OCR 대상 페이지 추정 헬퍼
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _estimate_missing_page_ranges(
    detected: dict[int, int],   # {question_number: page_index}
    missing: list[int],
    total_pages: int,
    margin: int = 2,
) -> list[int]:
    """
    누락된 문항이 있을 법한 페이지 인덱스 목록을 반환한다.

    전략:
      - 각 누락 문항의 앞뒤 감지된 문항 페이지를 기준으로 범위 추정
      - 앞뒤로 margin 페이지 여유 추가
      - 감지된 문항이 없으면 전체 페이지 반환
    """
    if not detected:
        return list(range(total_pages))

    sorted_detected = sorted(detected.items())  # [(num, page_idx), ...]
    pages: set[int] = set()

    for q_num in missing:
        # q_num 바로 앞에 감지된 문항의 페이지
        prev_page = next(
            (p for n, p in reversed(sorted_detected) if n < q_num),
            0,
        )
        # q_num 바로 뒤에 감지된 문항의 페이지
        next_page = next(
            (p for n, p in sorted_detected if n > q_num),
            total_pages - 1,
        )
        start = max(0, prev_page - margin)
        end = min(total_pages - 1, next_page + margin)
        pages.update(range(start, end + 1))

    return sorted(pages)


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

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# v2: 복수 소스 PDF 빌드
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass
class SourcedCropRegion:
    """복수 소스 PDF를 처리하기 위한 CropRegion 확장형"""
    src_path: str       # 원본 PDF 로컬 경로
    page_index: int
    x0: float
    y0: float
    x1: float
    y1: float


def _build_pdf_from_multi_sources(
    regions: list[SourcedCropRegion],
    dst_path: str,
) -> None:
    """
    복수 소스 PDF에서 크롭 영역을 순서대로 새 PDF에 삽입.
    src_cache dict로 같은 PDF 파일을 한 번만 열어 재사용한다.
    기존 _insert_cropped_page()를 재사용한다.
    """
    src_cache: dict[str, fitz.Document] = {}
    dst = fitz.open()

    for region in regions:
        if region.src_path not in src_cache:
            src_cache[region.src_path] = fitz.open(region.src_path)

        src = src_cache[region.src_path]
        if not (0 <= region.page_index < len(src)):
            continue

        src_page = src[region.page_index]
        page_rect = src_page.rect

        is_full_sentinel = region.y1 >= 9990
        clip = fitz.Rect(
            max(region.x0, page_rect.x0),
            max(region.y0, page_rect.y0),
            min(region.x1, page_rect.x1),
            min(region.y1, page_rect.y1) if not is_full_sentinel else page_rect.y1,
        )

        is_full_page = is_full_sentinel or (
            abs(clip.x0 - page_rect.x0) <= _FULL_PAGE_TOLERANCE
            and abs(clip.y0 - page_rect.y0) <= _FULL_PAGE_TOLERANCE
            and abs(clip.x1 - page_rect.x1) <= _FULL_PAGE_TOLERANCE
            and abs(clip.y1 - page_rect.y1) <= _FULL_PAGE_TOLERANCE
        )

        if is_full_page:
            dst.insert_pdf(src, from_page=region.page_index, to_page=region.page_index)
        else:
            _insert_cropped_page(src_page, clip, dst)

    dst.save(dst_path, garbage=4, deflate=True)
    for doc in src_cache.values():
        doc.close()
    dst.close()


def extract_questions_v2(
    selections: list,
    export_job_id: str,
    tmpdir: str,
) -> int:
    """
    복수 job/page/question 선택을 하나의 PDF로 추출하여 스토리지에 저장.

    Args:
        selections: list[SelectionItem] (순환참조 회피로 타입힌트 생략)
        export_job_id: 새로 생성된 export job UUID
        tmpdir: 임시 디렉토리 경로

    Returns:
        추출 성공한 문항 수

    흐름:
        1. 고유 job_id별 PDF 다운로드 (pdf_paths dict로 중복 방지)
        2. 경계 캐시 조회 → 없으면 detect_question_boundaries → 캐시 저장
        3. map_questions_to_regions 재사용 → SourcedCropRegion으로 변환
        4. _build_pdf_from_multi_sources 호출
        5. result_key에 업로드
    """
    from app.services import storage

    # 1. 고유 job_id별 PDF 다운로드
    pdf_paths: dict[str, str] = {}
    for sel in selections:
        if sel.job_id not in pdf_paths:
            local_path = str(Path(tmpdir) / f"{sel.job_id}.pdf")
            storage.download_file(storage.original_key(sel.job_id), local_path)
            pdf_paths[sel.job_id] = local_path

    # 2. job_id별 경계 데이터 확보
    boundaries_map: dict[str, list[QuestionBoundary]] = {}
    for job_id, pdf_path in pdf_paths.items():
        cached = storage.get_boundaries_cache(job_id)
        if cached is not None:
            boundaries_map[job_id] = [QuestionBoundary(**b) for b in cached]
        else:
            boundaries = detect_question_boundaries(pdf_path)
            boundaries_map[job_id] = boundaries
            storage.save_boundaries_cache(job_id, [dataclasses.asdict(b) for b in boundaries])

    # 3. selections → SourcedCropRegion 변환 (selections 순서 유지)
    all_regions: list[SourcedCropRegion] = []
    success_count = 0
    for sel in selections:
        boundaries = boundaries_map.get(sel.job_id, [])
        q_to_regions = map_questions_to_regions(boundaries, [sel.question_num])
        if sel.question_num not in q_to_regions:
            continue
        success_count += 1
        for region in q_to_regions[sel.question_num]:
            all_regions.append(SourcedCropRegion(
                src_path=pdf_paths[sel.job_id],
                page_index=region.page_index,
                x0=region.x0,
                y0=region.y0,
                x1=region.x1,
                y1=region.y1,
            ))

    if not all_regions:
        raise ValueError("선택한 문항을 PDF에서 감지하지 못했습니다.")

    # 4. PDF 빌드
    output_path = str(Path(tmpdir) / "result.pdf")
    _build_pdf_from_multi_sources(all_regions, output_path)

    # 5. 스토리지에 업로드
    res_key = storage.result_key(export_job_id)
    storage.upload_file(output_path, res_key)

    return success_count


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
