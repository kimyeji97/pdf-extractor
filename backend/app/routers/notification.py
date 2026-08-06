"""
GET  /api/notifications        - 알림 피드 (전역 폴링 대상 · REQ-F09)
POST /api/notifications/read   - 읽음 커서 갱신 (전체 읽음)

폴링 대상은 **이 엔드포인트 1개**다. 프론트는 완료를 판정하지 않는다 —
서버가 완료 시점에 쓴 알림을 읽기만 한다(계약 #22).
"""
import logging
from typing import Optional

from fastapi import APIRouter, Query

from app.models.schemas import NotificationListResponse, NotificationReadResponse
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


@router.post("/notifications/read", response_model=NotificationReadResponse)
def mark_notifications_read():
    """팝오버를 열면 호출된다 — 개별 항목이 아니라 전체를 읽음 처리한다."""
    cursor = notification_service.mark_all_read()
    return NotificationReadResponse(cursor=cursor, unread_count=0)
