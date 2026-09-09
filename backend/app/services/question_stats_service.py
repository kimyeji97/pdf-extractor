"""
문항 통계 캐시 재계산 (REQ-F12 Phase 1)

`JobStatusFile`의 `false_positive_count`·`manual_count`·`undetected_page_count`는
매 요청마다 boundaries·수동 문항을 다시 읽어 집계하지 않는다 — 감지 완료(최초 감지·재감지)·
문항 삭제·수동 문항 추가/삭제·벌크 삭제 지점마다 **전량 재계산**해 job 상태 파일에 저장해
두고, `/api/stats`는 그 캐시값을 합산만 한다(계획서 § 결정 "집계 방식").

`total_pages`는 이 함수가 다루지 않는다 — 감지 완료 시 1회만 정해지고 문항 편집으로
바뀌지 않으므로(PDF 페이지 수 자체) 각 호출부가 감지 완료 지점에서 직접 설정한다.
"""
from typing import Optional


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
    else:
        pages_with_content = {b.get("page_index") for b in boundaries}
        pages_with_content |= {m.get("page_num") for m in manual_list}
        undetected_page_count = max(page_count - len(pages_with_content), 0)

    return {
        "false_positive_count": false_positive_count,
        "manual_count": manual_count,
        "undetected_page_count": undetected_page_count,
    }
