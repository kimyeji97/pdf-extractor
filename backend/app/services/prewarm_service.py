"""
문항 경계 감지 직후 전체 페이지 썸네일 + 문항 크롭 썸네일을 미리 렌더링해 캐시에 저장한다 (REQ-P03-01).

업로드/재감지 백그라운드 태스크가 이미 pdf_bytes를 메모리에 들고 있는 시점에 호출되므로,
이후 개별 썸네일 GET 요청이 R2 전체 PDF 재다운로드 없이 캐시만 읽도록 만든다.
프로파일링상 병목은 R2 전체 PDF 다운로드(~99%)이며 렌더링 자체는 페이지당 ~30ms 수준이라
전 페이지를 미리 렌더링해도 백그라운드 태스크 시간에만 더해질 뿐 사용자 요청은 막지 않는다.
"""
import logging
from concurrent.futures import ThreadPoolExecutor

from app.services import storage
from app.services import thumbnail_service

logger = logging.getLogger(__name__)

_MAX_WORKERS = 12  # I/O bound(R2 PUT) 작업이라 스레드로 병렬화 — 순차 시 job당 3~4분 소요됨


def _prewarm_page(job_id: str, pdf_bytes: bytes, page_num: int) -> None:
    png_bytes = thumbnail_service.get_page_thumbnail(pdf_bytes, page_num, 96)
    storage.save_thumbnail_cache(job_id, page_num, png_bytes)


def _prewarm_question(job_id: str, pdf_bytes: bytes, b) -> None:
    png_bytes = thumbnail_service.get_question_thumbnail(
        pdf_bytes=pdf_bytes,
        page_index=b.page_index,
        x0=b.col_x0,
        y0=b.y_top,
        x1=b.col_x1,
        y1=b.y_bottom,
    )
    storage.save_question_thumbnail_cache(job_id, b.page_index, b.number, png_bytes)


def prewarm_all_thumbnails(job_id: str, pdf_bytes: bytes, boundaries: list, page_count: int) -> None:
    """전 페이지 썸네일 + 감지된 문항 크롭 썸네일을 렌더링하여 캐시에 저장한다.

    R2 저장(PUT)이 건당 ~270ms라 순차 처리 시 job당 3~4분이 걸리므로
    스레드풀로 병렬 처리한다. 개별 페이지/문항 실패는 건너뛰고 계속 진행한다 —
    프리워밍은 성능 최적화일 뿐이며 실패해도 캐시 미스 시 기존 온디맨드 경로로 폴백된다.
    """
    with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as executor:
        page_futures = {
            executor.submit(_prewarm_page, job_id, pdf_bytes, page_num): page_num
            for page_num in range(page_count)
        }
        for future in page_futures:
            try:
                future.result()
            except Exception as e:
                logger.warning(
                    "[prewarm] 페이지 썸네일 실패(무시) | job_id=%s page=%d error=%s",
                    job_id, page_futures[future], e,
                )

        question_futures = {
            executor.submit(_prewarm_question, job_id, pdf_bytes, b): b
            for b in boundaries
        }
        for future in question_futures:
            try:
                future.result()
            except Exception as e:
                b = question_futures[future]
                logger.warning(
                    "[prewarm] 문항 썸네일 실패(무시) | job_id=%s page=%d num=%d error=%s",
                    job_id, b.page_index, b.number, e,
                )

    logger.info(
        "[prewarm] 완료 | job_id=%s pages=%d questions=%d", job_id, page_count, len(boundaries)
    )
