"""
GET  /api/notifications          - 알림 피드 (첫 진입 기준선 · REQ-F09)
GET  /api/notifications/stream   - SSE 스트림 (상시 전달 경로 · REQ-P04)
POST /api/notifications/read     - 읽음 커서 갱신 (전체 읽음)

프론트는 완료를 판정하지 않는다 — 서버가 완료 시점에 쓴 알림을 읽기만 한다(계약 #22).
P04 로 폴링이 사라졌지만 피드 GET 은 남는다: 첫 진입의 30일 기준선(계약 #27)이 그것이다.
"""
import asyncio
import json
import logging
from typing import AsyncIterator, Optional

from fastapi import APIRouter, Header, Query
from starlette.responses import StreamingResponse

from app.models.schemas import NotificationListResponse, NotificationReadResponse
from app.services import notification_broker as broker
from app.services import notification_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    since: Optional[str] = Query(
        default=None,
        description="ISO 8601 시각. 이후 알림만 반환한다. 미지정 시 최근 30일 전체(최신 50건).",
    ),
    limit: int = Query(default=notification_service.DEFAULT_LIMIT, ge=1, le=200),
):
    return notification_service.list_feed(since=since, limit=limit)


# Cloudflare edge 는 오리진이 125초 동안 한 바이트도 안 보내면 스트림을 끊는다
# (PLAN-P04 § Phase 0 결과). 컷의 1/4. 로컬(터널 없음)에선 heartbeat 없이도 멀쩡해서
# 이 값을 빼도 로컬 테스트로는 안 잡힌다 — 바꾸기 전에 그 절을 읽을 것.
HEARTBEAT_S = 30


def _format(event: dict) -> str:
    lines = [f"event: {event['event']}"]
    if event.get("id") is not None:
        lines.append(f"id: {event['id']}")
    lines.append(f"data: {json.dumps(event['data'], ensure_ascii=False, default=str)}")
    return "\n".join(lines) + "\n\n"


async def event_stream(
    last_event_id: Optional[str], heartbeat_s: float = HEARTBEAT_S
) -> AsyncIterator[str]:
    """
    SSE 청크 생성기.

    - 구독을 **먼저** 잡고 재전송을 한다 — 순서를 바꾸면 그 틈에 난 알림이 빠진다.
    - `Last-Event-ID`(= 마지막으로 받은 알림의 `created_at`)가 있으면 그 이후분을
      스토리지에서 읽어 오래된 순으로 먼저 흘린다. 브라우저 `EventSource`가 자동 재연결마다
      이 헤더를 붙이므로 끊긴 동안의 알림이 프론트 코드 없이 복구된다.
    - 헤더가 없는 첫 연결에는 **아무것도 재전송하지 않는다.** 기준선은 피드 GET 이 잡는다 —
      여기서 최근분을 흘리면 앱을 열자마자 스낵바가 쏟아진다(계약 #27).
    - 구독 직후 `: connected` 코멘트를 **재전송보다 먼저** 한 줄 흘린다 (REQ-C09). edge 가 첫
      바이트까지 응답 헤더를 붙잡고 있어서, 이게 없으면 브라우저 `EventSource` 가 첫 keepalive
      (30s)까지 `CONNECTING` 으로 남는다. 코멘트라 이벤트로 취급되지 않아 프론트는 무변경이다.
    """
    async with broker.subscribe() as queue:
        yield ": connected\n\n"
        if last_event_id:
            feed = notification_service.list_feed(since=last_event_id)
            for item in reversed(feed["notifications"]):
                yield _format(
                    {
                        "event": "notification",
                        "id": item.get("created_at"),
                        "data": {**item, "unread_count": feed["unread_count"]},
                    }
                )
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=heartbeat_s)
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"
                continue
            yield _format(event)


@router.get("/notifications/stream")
async def stream_notifications(
    last_event_id: Optional[str] = Header(default=None, alias="Last-Event-ID"),
):
    return StreamingResponse(
        event_stream(last_event_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/notifications/read", response_model=NotificationReadResponse)
def mark_notifications_read():
    """팝오버를 열면 호출된다 — 개별 항목이 아니라 전체를 읽음 처리한다."""
    cursor = notification_service.mark_all_read()
    return NotificationReadResponse(cursor=cursor, unread_count=0)
