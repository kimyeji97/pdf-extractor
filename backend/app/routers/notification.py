"""
GET  /api/notifications          - 알림 피드 (첫 진입 기준선 · REQ-F09)
GET  /api/notifications/stream   - SSE 스트림 (상시 전달 경로 · REQ-P04)
POST /api/notifications/read     - 읽음 ({"ids": [...]} 그 알림만, 본문 없으면 전체 — 사용자별, REQ-B27)

세 엔드포인트 모두 로그인 필요 · user 는 본인 job 의 알림만, admin 은 전체(REQ-B27).

프론트는 완료를 판정하지 않는다 — 서버가 완료 시점에 쓴 알림을 읽기만 한다(계약 #22).
P04 로 폴링이 사라졌지만 피드 GET 은 남는다: 첫 진입의 30일 기준선(계약 #27)이 그것이다.
"""
import asyncio
import json
import logging
from typing import AsyncIterator, Optional

from fastapi import APIRouter, Body, Depends, Header, Query
from starlette.responses import StreamingResponse

from app.models.schemas import NotificationListResponse, NotificationReadResponse
from app.services import notification_broker as broker
from app.services import auth_service, notification_service, storage

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    since: Optional[str] = Query(
        default=None,
        description="ISO 8601 시각. 이후 알림만 반환한다. 미지정 시 최근 30일 전체(최신 50건).",
    ),
    limit: int = Query(default=notification_service.DEFAULT_LIMIT, ge=1, le=200),
    current_user: dict = Depends(auth_service.get_current_user),
):
    return notification_service.list_feed(since=since, limit=limit, user=current_user)


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


def _for(user: Optional[dict], event: dict) -> Optional[dict]:
    """이 사용자 스트림에 흘릴 모양으로 — 남의 job 이벤트·남의 읽음은 None(REQ-B27). user None 이면 그대로."""
    if user is None:
        return event
    if event.get("event") == "read":
        return event if event.get("user_id") in (None, user.get("user_id")) else None
    data = event.get("data") or {}
    if not notification_service.can_see(user, data.get("job_id")):
        return None
    if event.get("event") == "notification":   # 미확인 수는 받는 사람 기준
        return {**event, "data": {**data, "unread_count": notification_service.unread_count(user)}}
    return event


def _still_active(user: Optional[dict]) -> bool:
    """콘솔은 별도 프로세스가 저장소에 쓰므로 다시 읽어야 안다 — heartbeat 주기마다 1회.
    이벤트마다 읽지 않는다 — 연결 수 × 이벤트 수만큼 R2 동기 GET 이 나가 루프를 막는다(리뷰 C12 회차 2)."""
    if user is None:
        return True
    current = storage.get_user(user["user_id"])
    return current is not None and auth_service.user_status(current) == "active"


async def event_stream(
    last_event_id: Optional[str], heartbeat_s: float = HEARTBEAT_S, user: Optional[dict] = None
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
            feed = notification_service.list_feed(since=last_event_id, user=user)
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
                if not _still_active(user):  # REQ-C12 — 차단되면 열린 스트림도 heartbeat 안에 끊는다
                    return
                yield ": keepalive\n\n"
                continue
            event = _for(user, event)
            if event is not None:
                yield _format(event)


@router.get("/notifications/stream")
async def stream_notifications(
    last_event_id: Optional[str] = Header(default=None, alias="Last-Event-ID"),
    # EventSource 는 헤더를 못 붙인다 — 쿠키도 받는다(계약 #31, GET 조회라 CSRF 표면 없음)
    current_user: dict = Depends(auth_service.get_current_user_allow_cookie),
):
    return StreamingResponse(
        event_stream(last_event_id, user=current_user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/notifications/read", response_model=NotificationReadResponse)
def mark_notifications_read(
    body: Optional[dict] = Body(default=None),
    current_user: dict = Depends(auth_service.get_current_user),
):
    """알림을 클릭하면 그 알림만(`{"ids": [created_at]}`), '모두 읽음'이면 본문 없이 — 이 사용자만 (REQ-B27)."""
    ids = (body or {}).get("ids")
    remaining = notification_service.mark_read(current_user, ids)
    return NotificationReadResponse(unread_count=remaining)
