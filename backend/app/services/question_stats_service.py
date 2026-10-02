"""
문항 통계 캐시 재계산 (REQ-F12 Phase 1)

`JobStatusFile`의 `false_positive_count`·`manual_count`·`undetected_page_count`는
매 요청마다 boundaries·수동 문항을 다시 읽어 집계하지 않는다 — 감지 완료(최초 감지·재감지)·
문항 삭제·수동 문항 추가/삭제·벌크 삭제 지점마다 **전량 재계산**해 job 상태 파일에 저장해
두고, `/api/stats`는 그 캐시값을 합산만 한다(계획서 § 결정 "집계 방식").

`total_pages`는 이 함수가 다루지 않는다 — 감지 완료 시 1회만 정해지고 문항 편집으로
바뀌지 않으므로(PDF 페이지 수 자체) 각 호출부가 감지 완료 지점에서 직접 설정한다.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

PAGE_LIST_KEYS = ("false_positive_pages", "manual_pages", "undetected_pages")


def compute_question_stats(
    boundaries: list[dict],
    manual_list: list[dict],
    page_count: Optional[int],
) -> dict:
    """
    boundaries 캐시·수동 문항 목록으로부터 3개 필드를 전량 재계산한다.

    - boundaries: `storage.get_boundaries_cache()` 형식의 raw dict 리스트
      (`is_false_positive`·`page_index` 키를 읽는다. `dataclasses.asdict(QuestionBoundary)`와
      같은 형식이므로 감지 완료 지점에서도 그대로 넘길 수 있다)
    - manual_list: `storage.get_manual_questions()` 형식의 raw dict 리스트 (`page_num` 키)
    - page_count: job의 `total_pages` (아직 없으면 None → `undetected_page_count`도 None)

    반환값은 `JobStatusFile`에 그대로 대입할 수 있는 키를 쓴다.
    """
    false_positive_count = sum(1 for b in boundaries if b.get("is_false_positive"))
    manual_count = len(manual_list)

    if page_count is None:
        undetected_page_count = None
        undetected_pages = None
    else:
        pages_with_content = {b.get("page_index") for b in boundaries}
        pages_with_content |= {m.get("page_num") for m in manual_list}
        undetected_page_count = max(page_count - len(pages_with_content), 0)
        undetected_pages = [p for p in range(page_count) if p not in pages_with_content]

    return {
        "false_positive_count": false_positive_count,
        "manual_count": manual_count,
        "undetected_page_count": undetected_page_count,
        # 쪽 목록(REQ-P06) — `/api/stats/detail`이 이걸 그대로 쓴다
        "false_positive_pages": sorted({b.get("page_index") for b in boundaries if b.get("is_false_positive")}),
        "manual_pages": sorted({m.get("page_num") for m in manual_list}),
        "undetected_pages": undetected_pages,
    }


def backfill_page_lists() -> int:
    """
    쪽 목록이 없는 옛 SOURCE 상태 파일에 쪽 목록 3종을 채운다 (REQ-P06 — 서버 시작 시 1회).

    이미 있는 job은 건너뛴다(재실행 안전). 계산은 `/api/stats/detail`의 옛 경로와 같은 원천
    (경계·수동 파일)이다. 쓰기 직전에 최신 상태를 다시 읽어 **쪽 목록만** 얹는다 — 목록을 읽은 뒤
    감지·편집이 쓴 값을 덮지 않으려고. 채운 job 수를 반환한다.
    """
    from app.models.schemas import JobType
    from app.services import storage

    filled = 0
    for snapshot in storage.list_jobs():
        if snapshot.job_type != JobType.SOURCE or snapshot.false_positive_pages is not None:
            continue
        stats = compute_question_stats(
            storage.get_boundaries_cache(snapshot.job_id) or [],
            storage.get_manual_questions(snapshot.job_id),
            snapshot.total_pages,
        )
        latest = storage.get_status(snapshot.job_id)
        if latest is None or latest.false_positive_pages is not None:
            continue
        for key in PAGE_LIST_KEYS:
            setattr(latest, key, stats[key])
        storage.put_status(latest)
        filled += 1
    logger.info("[stats] 쪽 목록 채우기 완료 | filled=%d", filled)
    return filled
