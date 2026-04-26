"""
PDF 처리 서비스 v2

━━━ 전체 흐름 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. pdfplumber  → 단어 좌표 기반 문항 경계 감지 (2단 레이아웃 + Y클리핑)
  2. 감지 실패 시 → textract_service (Tesseract OCR fallback)
  3. PyMuPDF     → CropRegion 기반 벡터 크롭 → 새 PDF 저장

━━━ 크롭 방식 선택 기준 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - 전체 페이지 → insert_pdf()    : 텍스트/벡터/메타데이터 완전 보존
  - 부분 영역   → show_pdf_page() : 벡터 기반 클리핑, 래스터화 없이 선명도 유지
"""

import dataclasses
import fitz         # pymupdf
import pdfplumber
from dataclasses import dataclass
from pathlib import Path

from app.utils.question_parser import (
    parse_question_numbers,
    detect_question_boundaries,
    map_questions_to_regions,
    CropRegion,
    QuestionBoundary,
)
from app.services import textract_service


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 메인 엔트리포인트 (v1 — 단일 PDF 단일 job)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def extract_questions(
    input_pdf_path: str,
    question_numbers_raw: str,
    output_pdf_path: str,
) -> int:
    """
    입력 PDF에서 요청 문항을 추출하여 output_pdf_path에 저장한다.
    v1 API(/api/extract)에서 호출하는 단일-PDF 처리 함수.

    Args:
        input_pdf_path:       원본 PDF 경로
        question_numbers_raw: "1,3,5" / "1-5" / "1,3,7-10" 형식의 문항 번호 문자열
        output_pdf_path:      출력 PDF 경로

    Returns:
        추출 성공한 문항 수

    Raises:
        ValueError: 감지된 문항이 하나도 없을 때
    """
    # 문자열 → 정수 목록으로 파싱 ("1,3,7-10" → [1, 3, 7, 8, 9, 10])
    requested = parse_question_numbers(question_numbers_raw)

    # ── Step 1: 통합 문항 경계 감지 ─────────────────────────────
    # 내부적으로 ① 정규식 패턴 감지 + ② 연속 수열 보완 감지를 단일 스캔으로 실행.
    # 결과는 QuestionBoundary 리스트 (번호별 page, col, y_top, y_bottom 포함).
    boundaries = detect_question_boundaries(input_pdf_path)
    detected_nums = {b.number for b in boundaries}

    # 요청했지만 감지 못한 번호
    missing = [n for n in requested if n not in detected_nums]

    # ── Step 2: 절반 이상 누락 시 OCR fallback ────────────────
    # pdfplumber가 텍스트를 추출하지 못하는 스캔 PDF(이미지 PDF)인 경우에 해당.
    # 전체 페이지 OCR은 비용이 크므로, 누락 번호 주변 페이지만 선별하여 처리.
    if len(missing) > len(requested) / 2:
        import fitz as _fitz
        _doc = _fitz.open(input_pdf_path)
        total_pages = len(_doc)
        _doc.close()

        # 감지된 번호의 위치를 참고해 누락 번호가 있을 법한 페이지 범위 추정
        ocr_pages = _estimate_missing_page_ranges(
            detected={b.number: b.page_index for b in boundaries},
            missing=missing,
            total_pages=total_pages,
        )
        # Tesseract OCR로 해당 페이지 텍스트 추출 후 경계 재감지
        ocr_boundaries = textract_service.extract_boundaries(
            input_pdf_path,
            page_indices=ocr_pages if ocr_pages else None,
        )
        if ocr_boundaries:
            boundaries = ocr_boundaries

    # ── Step 3: 문항 → CropRegion 매핑 ──────────────────────
    # 각 문항 번호를 실제 PDF 좌표 영역(CropRegion)으로 변환.
    # 한 문항이 여러 영역에 걸쳐 있는 경우(페이지 걸침, 컬럼 걸침) 리스트로 반환.
    q_to_regions = map_questions_to_regions(boundaries, requested)

    if not q_to_regions:
        raise ValueError(
            f"요청한 문항 {requested} 을 PDF에서 감지하지 못했습니다.\n"
            f"감지된 문항 번호: {sorted(detected_nums)}"
        )

    # ── Step 4: CropRegion → 새 PDF 빌드 ────────────────────
    # 문항 번호 오름차순으로 정렬하여 영역 목록 구성
    ordered_regions: list[CropRegion] = []
    for q_num in sorted(q_to_regions.keys()):
        ordered_regions.extend(q_to_regions[q_num])

    # 각 영역을 새 PDF 페이지로 크롭하여 저장
    _build_pdf_from_regions(input_pdf_path, ordered_regions, output_pdf_path)

    return len(q_to_regions)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OCR 대상 페이지 추정 헬퍼
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _estimate_missing_page_ranges(
    detected: dict[int, int],   # {question_number: page_index}
    missing: list[int],
    total_pages: int,
    margin: int = 2,            # 앞뒤 여유 페이지 수
) -> list[int]:
    """
    누락된 문항이 있을 법한 페이지 인덱스 목록을 반환한다.

    전체 페이지를 OCR하면 매우 느리므로, 이미 감지된 문항의 위치를 기준으로
    누락 문항이 있을 범위를 좁혀 최소한의 페이지만 처리한다.

    전략:
      - 누락 번호 n의 앞뒤로 감지된 번호의 페이지를 찾아 범위 추정
      - 앞뒤 margin(기본 2) 페이지 여유 추가 (감지 오차 대비)
      - 감지된 문항이 전혀 없으면 전체 페이지 대상

    예) 감지: {1: 0, 5: 2}, 누락: [3]
       → prev_page=0, next_page=2 → range(0-2, 2+2) = [0,1,2,3,4]
    """
    if not detected:
        # 감지된 번호 없음 → 전체 페이지 OCR 필요
        return list(range(total_pages))

    sorted_detected = sorted(detected.items())  # [(num, page_idx), ...] 번호 오름차순
    pages: set[int] = set()

    for q_num in missing:
        # q_num 바로 앞 감지된 번호의 페이지 (없으면 0)
        prev_page = next(
            (p for n, p in reversed(sorted_detected) if n < q_num),
            0,
        )
        # q_num 바로 뒤 감지된 번호의 페이지 (없으면 마지막 페이지)
        next_page = next(
            (p for n, p in sorted_detected if n > q_num),
            total_pages - 1,
        )
        start = max(0, prev_page - margin)
        end = min(total_pages - 1, next_page + margin)
        pages.update(range(start, end + 1))

    return sorted(pages)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 내부 헬퍼: 단일 소스 PDF 빌드
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 전체 페이지로 간주하는 좌표 오차 허용 범위 (pt)
# insert_pdf vs show_pdf_page 선택 기준에 사용.
# 6pt 이내면 실질적으로 전체 페이지와 같다고 판단.
_FULL_PAGE_TOLERANCE = 6.0


def _build_pdf_from_regions(
    src_path: str,
    regions: list[CropRegion],
    dst_path: str,
) -> None:
    """
    단일 소스 PDF의 CropRegion 목록을 순서대로 새 PDF에 삽입한다.

    각 CropRegion은 출력 PDF의 한 페이지가 된다.
    하나의 문항이 여러 CropRegion으로 구성된 경우 모두 별도 페이지로 삽입.

    크롭 방식 선택:
      - 전체 페이지(또는 sentinel y1=9999): insert_pdf()
        → 벡터/텍스트/이미지/폰트 등 모든 PDF 요소를 그대로 복사
        → 가장 빠르고 품질 손실 없음
      - 부분 영역: _insert_cropped_page() → show_pdf_page()
        → 지정 영역만 래스터화 없이 벡터로 클리핑
        → 출력 페이지 크기 = clip 크기 (여백 없음)
    """
    src = fitz.open(src_path)
    dst = fitz.open()

    for region in regions:
        if not (0 <= region.page_index < len(src)):
            continue  # 범위 초과 방어 (감지 오류 대응)

        src_page = src[region.page_index]
        page_rect = src_page.rect  # (0, 0, page_width, page_height)

        # sentinel: y1=9999는 "전체 페이지를 포함하라"는 표시
        # (케이스 C 중간 페이지에서 사용)
        is_full_sentinel = region.y1 >= 9990

        # 실제 클리핑 rect: 페이지 범위를 벗어나지 않도록 클램프
        clip = fitz.Rect(
            max(region.x0, page_rect.x0),
            max(region.y0, page_rect.y0),
            min(region.x1, page_rect.x1),
            min(region.y1, page_rect.y1) if not is_full_sentinel else page_rect.y1,
        )

        # 전체 페이지 여부 판단:
        # sentinel이거나 clip이 페이지 경계와 6pt 이내로 일치하면 전체 페이지 처리
        is_full_page = is_full_sentinel or (
            abs(clip.x0 - page_rect.x0) <= _FULL_PAGE_TOLERANCE
            and abs(clip.y0 - page_rect.y0) <= _FULL_PAGE_TOLERANCE
            and abs(clip.x1 - page_rect.x1) <= _FULL_PAGE_TOLERANCE
            and abs(clip.y1 - page_rect.y1) <= _FULL_PAGE_TOLERANCE
        )

        if is_full_page:
            # 전체 페이지: 텍스트·이미지·벡터 완전 보존 (가장 빠름)
            dst.insert_pdf(src, from_page=region.page_index, to_page=region.page_index)
        else:
            # 부분 크롭: 벡터 기반 클리핑 (래스터화 없음)
            _insert_cropped_page(src_page, clip, dst)

    # garbage=4: 사용하지 않는 PDF 객체 4단계 정리 (파일 크기 최소화)
    # deflate=True: 스트림 데이터 압축
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

    ━━━ show_pdf_page() 방식을 선택한 이유 ━━━
      - 래스터화(픽셀 변환) 없이 벡터 그래픽 원본 유지
      - 수식, 도형, 한자 등 복잡한 요소도 선명하게 유지
      - 클리핑을 PDF 렌더링 레벨에서 처리하므로 픽셀 오차 없음
      - 출력 페이지 크기를 clip 크기와 정확히 일치시켜 불필요한 여백 제거

    Args:
        src_page: 원본 페이지 객체
        clip:     추출할 영역 (페이지 좌표계)
        dst:      결과를 추가할 대상 Document
    """
    w = clip.width
    h = clip.height

    if w <= 0 or h <= 0:
        return  # 유효하지 않은 영역 스킵 (감지 오류 방어)

    # 출력 페이지 크기 = clip 크기 (clip 영역이 꽉 차게 배치됨)
    new_page = dst.new_page(width=w, height=h)
    dst_rect  = fitz.Rect(0, 0, w, h)  # 출력 페이지 전체 영역

    new_page.show_pdf_page(
        dst_rect,              # 출력 페이지에서 그릴 위치 (전체)
        src_page.parent,       # 원본 Document (페이지가 속한 문서)
        src_page.number,       # 원본 페이지 번호
        clip=clip,             # 원본에서 가져올 영역 (이 부분만 dst_rect에 표시)
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# v2: 복수 소스 PDF 빌드
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass
class SourcedCropRegion:
    """
    복수 소스 PDF 처리를 위한 CropRegion 확장형.

    v2 API는 여러 PDF에서 문항을 골라 하나의 PDF로 합치는 기능을 제공하므로
    각 크롭 영역이 어느 PDF에서 왔는지(src_path)도 함께 저장한다.
    """
    src_path: str       # 원본 PDF 로컬 경로 (tmpdir 내 다운로드된 파일)
    page_index: int     # 0-based 페이지 인덱스
    x0: float
    y0: float
    x1: float
    y1: float


def _build_pdf_from_multi_sources(
    regions: list[SourcedCropRegion],
    dst_path: str,
) -> None:
    """
    여러 소스 PDF에서 크롭 영역을 순서대로 가져와 하나의 PDF로 합친다.

    src_cache 딕셔너리로 같은 경로의 PDF는 한 번만 열어 재사용한다.
    (선택 문항이 같은 PDF에 여러 개인 경우 중복 오픈 방지)

    단일 소스 처리(_build_pdf_from_regions)와 크롭 로직은 동일하며,
    소스 PDF를 동적으로 교체하는 점만 다르다.
    """
    src_cache: dict[str, fitz.Document] = {}  # {pdf_path: fitz.Document}
    dst = fitz.open()

    for region in regions:
        # 캐시에 없으면 열고 저장
        if region.src_path not in src_cache:
            src_cache[region.src_path] = fitz.open(region.src_path)

        src = src_cache[region.src_path]
        if not (0 <= region.page_index < len(src)):
            continue  # 범위 초과 방어

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
    # 캐시에 열린 모든 소스 PDF 닫기
    for doc in src_cache.values():
        doc.close()
    dst.close()


def extract_questions_v2(
    selections: list,
    export_job_id: str,
    tmpdir: str,
) -> int:
    """
    복수 job/page/question 선택을 하나의 PDF로 추출하여 스토리지에 저장한다.
    v2 API(/api/extract-v2)에서 호출하는 다중-PDF 처리 함수.

    Args:
        selections:     list[SelectionItem] — 사용자가 선택한 문항/영역 목록
                        (순환참조 회피로 타입힌트 생략)
        export_job_id:  새로 생성된 export job의 UUID
        tmpdir:         임시 디렉토리 경로 (PDF 다운로드·결과 저장용)

    Returns:
        추출 성공한 항목(문항 또는 수동 영역) 수

    ━━━ 처리 흐름 ━━━
      1. 고유 job_id별로 원본 PDF를 스토리지에서 다운로드
         (같은 job_id는 한 번만 다운로드 — pdf_paths dict로 중복 방지)
      2. job_id별 문항 경계 데이터 확보
         → 캐시 있으면 재사용, 없으면 detect_question_boundaries 실행 후 저장
         (경계 감지는 전체 PDF 기준이므로 캐시 활용이 성능에 크게 영향)
      3. selections 순서를 유지하며 SourcedCropRegion 목록 구성
         → 수동 지정 영역(custom_region)은 좌표를 그대로 사용
         → 자동 감지 문항(question_num)은 경계 캐시 + map_questions_to_regions 사용
      4. SourcedCropRegion 목록으로 최종 PDF 빌드
      5. 결과 PDF를 스토리지에 업로드
    """
    from app.services import storage

    # ── Step 1: 고유 job_id별 PDF 다운로드 ─────────────────
    # 여러 selections이 같은 job_id를 참조해도 PDF는 한 번만 다운로드
    pdf_paths: dict[str, str] = {}
    for sel in selections:
        if sel.job_id not in pdf_paths:
            local_path = str(Path(tmpdir) / f"{sel.job_id}.pdf")
            storage.download_file(storage.original_key(sel.job_id), local_path)
            pdf_paths[sel.job_id] = local_path

    # ── Step 2: job_id별 문항 경계 데이터 확보 ─────────────
    # 경계 감지(detect_question_boundaries)는 전체 PDF를 분석하는 무거운 작업.
    # 스토리지 캐시(boundaries/{job_id}.json)에 저장된 결과가 있으면 재사용.
    # 없으면 감지 후 캐시에 저장 — 이후 같은 PDF 요청 시 즉시 응답 가능.
    boundaries_map: dict[str, list[QuestionBoundary]] = {}
    for job_id, pdf_path in pdf_paths.items():
        cached = storage.get_boundaries_cache(job_id)
        if cached is not None:
            # 캐시 히트: JSON dict → QuestionBoundary 객체로 역직렬화
            boundaries_map[job_id] = [QuestionBoundary(**b) for b in cached]
        else:
            # 캐시 미스: 전체 PDF 재분석
            boundaries = detect_question_boundaries(pdf_path)
            boundaries_map[job_id] = boundaries
            # 결과 캐시 저장 (dataclass → dict 변환)
            storage.save_boundaries_cache(job_id, [dataclasses.asdict(b) for b in boundaries])

    # ── Step 3: selections → SourcedCropRegion 변환 ─────────
    # selections 순서가 곧 출력 PDF 페이지 순서가 된다.
    all_regions: list[SourcedCropRegion] = []
    success_count = 0

    for sel in selections:

        # ── 수동 지정 영역 (custom_region 우선) ─────────────
        # 사용자가 드래그로 직접 지정한 영역.
        # 경계 감지 결과와 무관하게 지정된 좌표를 그대로 크롭에 사용.
        if getattr(sel, "custom_region", None) is not None:
            cr = sel.custom_region
            all_regions.append(SourcedCropRegion(
                src_path=pdf_paths[sel.job_id],
                page_index=sel.page_num,
                x0=cr.x0,
                y0=cr.y0,
                x1=cr.x1,
                y1=cr.y1,
            ))
            success_count += 1
            continue

        # ── 자동 감지 문항 ───────────────────────────────────
        # question_num 기반: 경계 캐시에서 해당 번호의 위치를 찾아 CropRegion으로 변환.
        # question_num도 custom_region도 없는 경우는 잘못된 요청이므로 스킵.
        if getattr(sel, "question_num", None) is None:
            continue

        boundaries = boundaries_map.get(sel.job_id, [])
        # 단일 문항 → 1개 이상의 CropRegion (페이지/컬럼 걸침 대응)
        q_to_regions = map_questions_to_regions(boundaries, [sel.question_num])

        if sel.question_num not in q_to_regions:
            continue  # 해당 번호를 감지하지 못함 → 스킵

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

    # ── Step 4: 최종 PDF 빌드 ────────────────────────────────
    # SourcedCropRegion 목록을 순서대로 크롭하여 하나의 PDF로 합침
    output_path = str(Path(tmpdir) / "result.pdf")
    _build_pdf_from_multi_sources(all_regions, output_path)

    # ── Step 5: 결과 스토리지에 업로드 ──────────────────────
    # 클라이언트는 /api/status/{export_job_id} 폴링으로 DONE 상태를 확인 후
    # download_url로 다운로드한다
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

    좌표 정보 없이 페이지 단위로만 추출할 때 사용 (OCR fallback 결과 처리 등).
    Y 클리핑이 없어 문항 경계가 정확하지 않지만, 스캔 PDF 대응 최후 수단으로 활용.
    """
    src = fitz.open(src_path)
    dst = fitz.open()
    for idx in page_indices:
        if 0 <= idx < len(src):
            dst.insert_pdf(src, from_page=idx, to_page=idx)
    dst.save(dst_path, garbage=4, deflate=True)
    src.close()
    dst.close()
