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
    src_path: str               # 원본 PDF 로컬 경로 (tmpdir 내 다운로드된 파일)
    page_index: int             # 0-based 페이지 인덱스
    x0: float
    y0: float
    x1: float
    y1: float
    source_label: str = ""      # 셀 상단에 표시할 출처 문자열 (예: "Q1 · 수학문제집 · p.3")


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
    layout: str = "2단",
) -> int:
    """
    복수 job/page/question 선택을 하나의 PDF로 추출하여 스토리지에 저장한다.
    v2 API(/api/extract-v2)에서 호출하는 다중-PDF 처리 함수.

    Args:
        selections:     list[SelectionItem] — 사용자가 선택한 문항/영역 목록
        export_job_id:  새로 생성된 export job의 UUID
        tmpdir:         임시 디렉토리 경로 (PDF 다운로드·결과 저장용)
        layout:         그리드 레이아웃 ("2단", "4단", "6단") — REQ-18
                        기존 API 호환을 위해 기본값 "2단" (각 문항이 한 셀에 배치됨)

    Returns:
        추출 성공한 항목(문항 또는 수동 영역) 수

    ━━━ 처리 흐름 ━━━
      1. 고유 job_id별로 원본 PDF를 스토리지에서 다운로드
      2. job_id별 문항 경계 데이터 확보 (캐시 우선)
      3. selections 순서를 유지하며 SourcedCropRegion 목록 구성
         → 수동 지정 영역(custom_region): 좌표 그대로 사용
         → 수동 추가 문항(manual_id): manual_questions 스토리지에서 region 조회
         → 자동 감지 문항(question_num): 경계 캐시에서 bbox 조회
      4. 레이아웃 그리드 PDF 빌드 (layout_spec.py 기반, contain_fit 적용)
      5. 결과 PDF를 스토리지에 업로드
    """
    from app.services import storage
    from app.utils.layout_spec import (
        calc_cell_rect, contain_fit, questions_per_page,
        LAYOUTS, DEFAULT_LAYOUT, A4_WIDTH_PT, A4_HEIGHT_PT,
    )

    # ── Step 1: 고유 job_id별 PDF 다운로드 + 문제집 이름 조회 ─
    pdf_paths: dict[str, str] = {}
    workbook_names: dict[str, str] = {}   # {job_id: workbook_name}
    for sel in selections:
        if sel.job_id not in pdf_paths:
            local_path = str(Path(tmpdir) / f"{sel.job_id}.pdf")
            storage.download_file(storage.original_key(sel.job_id), local_path)
            pdf_paths[sel.job_id] = local_path
            job_status = storage.get_status(sel.job_id)
            workbook_names[sel.job_id] = (job_status.workbook_name or "") if job_status else ""

    # ── Step 2: job_id별 문항 경계 데이터 확보 ─────────────
    boundaries_map: dict[str, list[QuestionBoundary]] = {}
    for job_id, pdf_path in pdf_paths.items():
        cached = storage.get_boundaries_cache(job_id)
        if cached is not None:
            boundaries_map[job_id] = [QuestionBoundary(**b) for b in cached]
        else:
            boundaries = detect_question_boundaries(pdf_path)
            boundaries_map[job_id] = boundaries
            storage.save_boundaries_cache(job_id, [dataclasses.asdict(b) for b in boundaries])

    # ── Step 3: selections → SourcedCropRegion 변환 ─────────
    # selections 순서가 곧 그리드 배치 순서가 된다 (REQ-19 DnD 순서 반영).
    all_regions: list[SourcedCropRegion] = []
    success_count = 0
    q_global = 0  # 전체 문항 순번 (출처 레이블 "Q번호"용)

    for sel in selections:
        q_global += 1
        wb_name = workbook_names.get(sel.job_id, "")
        page_label = f"p.{sel.page_num + 1}"
        label_parts = [f"Q{q_global}"]
        if wb_name:
            label_parts.append(wb_name)
        label_parts.append(page_label)
        src_label = " · ".join(label_parts)

        # ── 구형 수동 지정 영역 (custom_region) ─────────────
        if getattr(sel, "custom_region", None) is not None:
            cr = sel.custom_region
            all_regions.append(SourcedCropRegion(
                src_path=pdf_paths[sel.job_id],
                page_index=sel.page_num,
                x0=cr.x0, y0=cr.y0, x1=cr.x1, y1=cr.y1,
                source_label=src_label,
            ))
            success_count += 1
            continue

        # ── v3 수동 추가 문항 (manual_id) ───────────────────
        if getattr(sel, "manual_id", None) is not None:
            manual_list = storage.get_manual_questions(sel.job_id)
            target = next((m for m in manual_list if m.get("manual_id") == sel.manual_id), None)
            if target is None:
                q_global -= 1
                continue
            r = target["region"]
            all_regions.append(SourcedCropRegion(
                src_path=pdf_paths[sel.job_id],
                page_index=sel.page_num,
                x0=r["x0"], y0=r["y0"], x1=r["x1"], y1=r["y1"],
                source_label=src_label,
            ))
            success_count += 1
            continue

        # ── 자동 감지 문항 (question_num) ───────────────────
        if getattr(sel, "question_num", None) is None:
            q_global -= 1
            continue

        boundaries = boundaries_map.get(sel.job_id, [])
        target = next(
            (b for b in boundaries
             if b.page_index == sel.page_num and b.number == sel.question_num),
            None,
        )
        if target is None:
            q_global -= 1
            continue

        all_regions.append(SourcedCropRegion(
            src_path=pdf_paths[sel.job_id],
            page_index=target.page_index,
            x0=target.col_x0, y0=target.y_top, x1=target.col_x1, y1=target.y_bottom,
            source_label=src_label,
        ))
        success_count += 1

    if not all_regions:
        raise ValueError("선택한 문항을 PDF에서 감지하지 못했습니다.")

    # ── Step 4: 레이아웃 그리드 PDF 빌드 ────────────────────
    # layout_spec.py의 상수와 contain_fit()을 사용하여
    # Canvas 미리보기와 동일한 그리드 레이아웃으로 PDF를 생성한다 (REQ-17).
    output_path = str(Path(tmpdir) / "result.pdf")

    # layout 유효성 검증 — 지원하지 않는 값이면 기본값 사용
    effective_layout = layout if layout in LAYOUTS else DEFAULT_LAYOUT
    _build_grid_pdf(all_regions, output_path, effective_layout)

    # ── Step 5: 결과 스토리지에 업로드 ──────────────────────
    res_key = storage.result_key(export_job_id)
    storage.upload_file(output_path, res_key)

    return success_count


def _build_grid_pdf(
    regions: list["SourcedCropRegion"],
    dst_path: str,
    layout_key: str,
) -> None:
    """
    레이아웃 그리드(2단/4단/6단)에 문항을 배치하여 A4 PDF를 빌드한다.

    Canvas ↔ PDF 일치 보장:
      - layout_spec.py의 A4_WIDTH_PT, A4_HEIGHT_PT, MARGIN_PT, GAP_PT 상수 사용
      - contain_fit() 수식이 frontend/src/utils/workbookLayout.js#containFit() 와 동일
      - 같은 그리드 좌표 공식, 같은 contain 피팅 → 미리보기 = 실제 출력

    처리 흐름:
      regions 목록을 순서대로 (page, row, col) 셀에 배치.
      한 페이지가 채워지면 다음 A4 페이지를 새로 생성.
      각 셀에는 contain_fit()으로 계산한 dst_rect에 show_pdf_page()로 벡터 크롭 삽입.
    """
    from app.utils.layout_spec import (
        calc_cell_rect, top_left_fit, questions_per_page, LAYOUTS,
        A4_WIDTH_PT, A4_HEIGHT_PT, MARGIN_PT, GAP_PT,
        DIVIDER_WIDTH_PT, DIVIDER_COLOR, LABEL_HEIGHT_PT,
    )

    spec = LAYOUTS[layout_key]
    rows = spec["rows"]
    cols = spec["cols"]
    qpp  = questions_per_page(layout_key)   # 페이지당 문항 수

    # 출처 레이블 사용 여부 — 하나라도 source_label이 있으면 모든 셀에 레이블 영역 예약
    has_labels = any(getattr(r, "source_label", "") for r in regions)
    label_h    = LABEL_HEIGHT_PT if has_labels else 0

    # 세로 구분선 x 좌표 사전 계산 (REQ-C05)
    cell_w_base = (A4_WIDTH_PT - 2 * MARGIN_PT - (cols - 1) * GAP_PT) / cols
    divider_xs = [
        MARGIN_PT + (ci + 1) * (cell_w_base + GAP_PT) - GAP_PT / 2
        for ci in range(cols - 1)
    ] if cols > 1 else []

    src_cache: dict[str, fitz.Document] = {}
    dst = fitz.open()
    current_page: fitz.Page | None = None

    for idx, region in enumerate(regions):
        cell_idx = idx % qpp              # 현재 페이지 내 셀 인덱스 (0~qpp-1)
        row = cell_idx // cols
        col = cell_idx % cols

        # 새 페이지 필요 — 첫 항목이거나 이전 페이지가 가득 찬 경우
        if cell_idx == 0:
            current_page = dst.new_page(width=A4_WIDTH_PT, height=A4_HEIGHT_PT)

        # 원본 PDF 열기 (캐시 활용)
        if region.src_path not in src_cache:
            src_cache[region.src_path] = fitz.open(region.src_path)
        src_doc = src_cache[region.src_path]

        if not (0 <= region.page_index < len(src_doc)):
            continue  # 범위 초과 방어

        # 셀 좌표 계산 (layout_spec.py 공식)
        cell_x, cell_y, cell_w, cell_h = calc_cell_rect(layout_key, row, col)

        # 레이블 영역만큼 이미지 시작 y를 내림
        img_cell_y = cell_y + label_h
        img_cell_h = cell_h - label_h

        # 원본 문항 크기 (bbox 크기)
        src_w = region.x1 - region.x0
        src_h = region.y1 - region.y0

        # 좌측 상단 고정 피팅 (REQ-C06) — 종횡비 유지, 셀 좌측 상단에 배치
        # Canvas와 완전히 동일한 수식으로 미리보기 ↔ PDF 출력 일치 보장
        dst_x, dst_y, dst_w, dst_h = top_left_fit(src_w, src_h, cell_x, img_cell_y, cell_w, img_cell_h)

        dst_rect  = fitz.Rect(dst_x, dst_y, dst_x + dst_w, dst_y + dst_h)
        clip_rect = fitz.Rect(region.x0, region.y0, region.x1, region.y1)

        # 벡터 기반 크롭 삽입 (래스터화 없음)
        current_page.show_pdf_page(
            dst_rect,
            src_doc,
            region.page_index,
            clip=clip_rect,
        )

        # 출처 레이블 렌더링 (이미지 위에 덮어쓰기)
        label_text = getattr(region, "source_label", "")
        if label_text and current_page is not None:
            label_rect = fitz.Rect(cell_x, cell_y, cell_x + cell_w, cell_y + label_h)
            current_page.draw_rect(label_rect, color=None, fill=(0.96, 0.96, 0.98), width=0)
            current_page.insert_text(
                fitz.Point(cell_x + 2, cell_y + label_h - 2),
                label_text,
                fontsize=7,
                color=(0.25, 0.25, 0.35),
            )

    # 세로 구분선 그리기 — 마지막 페이지에만 아니라 모든 완성된 페이지에 적용 (REQ-C05)
    if divider_xs:
        for page in dst:
            for x in divider_xs:
                page.draw_line(
                    fitz.Point(x, MARGIN_PT),
                    fitz.Point(x, A4_HEIGHT_PT - MARGIN_PT),
                    color=DIVIDER_COLOR,
                    width=DIVIDER_WIDTH_PT,
                )

    dst.save(dst_path, garbage=4, deflate=True)
    for doc in src_cache.values():
        doc.close()
    dst.close()


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
