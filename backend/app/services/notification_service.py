"""
알림 서비스 (REQ-F09 Phase 1)

**쓰기 주체는 백엔드 하나다.** 프론트 폴링의 `DONE` 분기에서 쓰면 계약 #22 정면 위반이고,
B10 에서 그 구조로 문제집이 통째로 사라졌다 — 화면을 떠나면 분기가 안 돈다.

**조회는 LIST 만으로 신규를 판정한다.** 알림은 몇 초마다 폴링되므로 `list_workbooks()`
패턴(전체 glob → 전량 read)을 베끼면 R2 에서 매 폴링마다 LIST + N GET 이 돌고
30일치가 쌓일수록 N 이 자란다. 키 이름에 타임스탬프가 박혀 있으므로 필터는 키만으로
끝나고, **평상시(신규 0건) GET 은 0회**다.
"""
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.models.schemas import (
    BoundariesStatus,
    JobStatus,
    JobStatusFile,
    NotificationKind,
    NotificationSeverity,
)
from app.services import notification_broker as broker
from app.services import storage
from app.utils import notification_key as nkey

logger = logging.getLogger(__name__)

# 보관 기간 — 읽음 여부와 무관하다. 정리는 조회 시 lazy (이 레포엔 스케줄러·cron 이 없다).
RETENTION_DAYS = 30

# 첫 진입은 최대 DEFAULT_LIMIT 건을 읽는데 R2 왕복이 건당 수십~수백 ms라 순차로는 그대로 쌓인다
# (실측 3.79s). I/O bound 라 스레드로 겹친다 — `prewarm_service` 가 R2 PUT 에 쓰는 것과 같은 이유다.
_READ_WORKERS = 12

# `since` 미지정(앱 첫 진입) 시 상한. 평상시 폴링은 since 가 붙어 GET 0회지만
# 첫 진입은 전량을 읽으므로 여기서 끊지 않으면 LIST + N GET 이 그대로 돈다.
DEFAULT_LIMIT = 50


# ── 쓰기 ──────────────────────────────────────────────────

def emit(
    job_id: str,
    kind: NotificationKind,
    severity: NotificationSeverity = NotificationSeverity.SUCCESS,
    title: Optional[str] = None,
    message: Optional[str] = None,
) -> None:
    """
    알림 1건을 기록한다. **실패해도 호출부를 깨뜨리지 않는다** —
    알림 저장 실패가 "감지 실패"·"생성 실패"로 둔갑하면 안 된다
    (`_save_workbook_meta` 실패를 PDF 생성 실패로 만들지 않는 것과 같은 판단).
    """
    # created_at 을 여기서 찍는다 — 저장 키와 SSE 이벤트 id 가 같은 값이어야 재연결 시
    # `Last-Event-ID` 로 이어 붙일 수 있다(REQ-P04).
    body = {
        "job_id": job_id,
        "kind": kind.value,
        "severity": severity.value,
        "title": title,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        storage.save_notification(body)
    except Exception as e:  # noqa: BLE001
        logger.warning("[notification] 저장 실패(무시) | job_id=%s error=%s", job_id, e)
        return  # 저장 안 된 알림은 푸시하지 않는다 — 재연결 재동기로 되찾을 수 없다

    # 저장이 끝난 뒤에만 푸시한다. 푸시 실패도 호출부를 깨뜨리지 않는다.
    try:
        broker.publish(
            {
                "event": "notification",
                "id": body["created_at"],
                "data": {**body, "unread_count": _unread_count()},
            }
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("[notification] 푸시 실패(무시) | job_id=%s error=%s", job_id, e)


def emit_detection(job: JobStatusFile) -> None:
    """
    문항 감지 완료/실패 알림.

    ⚠️ **호출부는 2곳뿐이다** — `upload._trigger_boundary_detection`(최초 감지)와
    `browse._run_refresh_detection`(재감지). `BoundariesStatus.DONE` 을 찍는 나머지
    2곳(`list_all_questions`·`list_questions`)은 **조회 경로의 지연 감지**라
    붙이면 사용자가 지금 보고 있는 화면에 대해 "완료됐습니다"가 뜬다.
    성공만이 아니라 **FAILED 도 같은 기준으로 가른다.**
    """
    failed = job.boundaries_status == BoundariesStatus.FAILED
    emit(
        job_id=job.job_id,
        kind=NotificationKind.DETECTION,
        severity=NotificationSeverity.ERROR if failed else NotificationSeverity.SUCCESS,
        title=job.filename,
        message="문항 감지에 실패했습니다." if failed else "문항 감지가 완료되었습니다.",
    )


def emit_export(job: JobStatusFile, workbook_name: Optional[str] = None) -> None:
    """
    문제집 생성 완료/실패 알림.

    ⚠️ **`workbook_name` 유무로 가르지 않는다.** 그 분기(계약 #23)는 *메타 저장 주체*를
    정한 것이지 알림과는 목적이 다르다 — 안쪽에 넣으면 구 프론트로 만든 문제집은
    영원히 알림이 안 온다.
    """
    failed = job.status == JobStatus.FAILED
    emit(
        job_id=job.job_id,
        kind=NotificationKind.EXPORT,
        severity=NotificationSeverity.ERROR if failed else NotificationSeverity.SUCCESS,
        title=workbook_name or job.filename,
        message="문제집 생성에 실패했습니다." if failed else "문제집 생성이 완료되었습니다.",
    )


# ── 조회 ──────────────────────────────────────────────────

def _cutoff() -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)


def _purge_expired_months(keys: list[str], cutoff: datetime) -> list[str]:
    """
    보관 기간이 통째로 지난 월 프리픽스를 삭제하고, 남은 키만 돌려준다.

    정리 주체를 안 정하면 조용히 쌓인다 — 조회가 그 주체다.
    """
    expired = {
        month
        for month in {k.split("/", 1)[0] for k in keys if "/" in k}
        if nkey.month_is_expired(month, cutoff)
    }
    for month in expired:
        try:
            storage.delete_notification_month(month)
        except Exception as e:  # noqa: BLE001
            logger.warning("[notification] 월 프리픽스 정리 실패(무시) | month=%s error=%s", month, e)
    if not expired:
        return keys
    return [k for k in keys if k.split("/", 1)[0] not in expired]


def _unread_count() -> int:
    """읽음 커서 이후 개수 — 키 이름만으로 센다(파일 읽기 0회)."""
    cutoff = _cutoff()
    cursor_ts = _parse_iso(storage.get_read_cursor())
    return sum(
        1
        for ts in (nkey.parse_stamp(k) for k in storage.list_notification_keys())
        if ts is not None and ts >= cutoff and (cursor_ts is None or ts > cursor_ts)
    )


def list_feed(since: Optional[str] = None, limit: int = DEFAULT_LIMIT) -> dict:
    """
    알림 피드. 반환은 `{"notifications": [...], "unread_count": N}`.

    필터 순서가 곧 비용이다 — 키 이름으로 다 거른 **뒤에** 남은 것만 읽는다.
    """
    cutoff = _cutoff()
    keys = _purge_expired_months(storage.list_notification_keys(), cutoff)

    # 키 이름만으로 (시각, 키) 쌍을 만든다. 여기까지 파일 읽기 0회.
    dated = []
    for key in keys:
        ts = nkey.parse_stamp(key)
        if ts is None or ts < cutoff:
            continue
        dated.append((ts, key))
    dated.sort(key=lambda p: p[0], reverse=True)

    cursor = storage.get_read_cursor()
    cursor_ts = _parse_iso(cursor)
    unread_count = sum(1 for ts, _ in dated if cursor_ts is None or ts > cursor_ts)

    since_ts = _parse_iso(since)
    if since_ts is not None:
        dated = [(ts, k) for ts, k in dated if ts > since_ts]

    selected = dated[: max(limit, 0)]

    notifications = _read_many([key for _, key in selected])

    return {"notifications": notifications, "unread_count": unread_count}


def _read_many(keys: list[str]) -> list[dict]:
    """
    알림 본문을 **병렬로** 읽는다 (REQ-P05). 순서는 인자로 받은 키 순서를 그대로 지킨다 —
    `list_feed` 가 이미 최신순으로 정렬해 넘기므로 여기서 다시 정렬하지 않는다.

    개별 실패는 **건너뛴다**. 한 건이 깨졌다고 피드 전체가 사라지면 벨이 통째로 비는데,
    그건 순차 구현에서도 `read_notification` 이 `None` 을 돌려주면 제외하던 동작이다
    (`prewarm_service` 가 개별 썸네일 실패를 무시하고 계속하는 것과 같은 규칙).
    """
    if not keys:
        return []

    def _read(key: str) -> Optional[dict]:
        try:
            return storage.read_notification(key)
        except Exception as e:  # noqa: BLE001
            logger.warning("[notification] 항목 읽기 실패(건너뜀) | key=%s error=%s", key, e)
            return None

    with ThreadPoolExecutor(max_workers=min(_READ_WORKERS, len(keys))) as executor:
        items = list(executor.map(_read, keys))  # map 은 입력 순서를 보존한다

    return [item for item in items if item is not None]


def mark_all_read() -> Optional[str]:
    """
    전체 읽음 — 커서 **파일 1개**만 쓴다.

    항목별 읽음이었다면 읽을 때마다 N개 파일을 다시 써야 했다. 뱃지의 목적은
    "새 게 있나"지 개별 추적이 아니라는 결정이 서버 저장의 비용을 크게 깎았다.
    """
    cutoff = _cutoff()
    stamps = [
        ts
        for ts in (nkey.parse_stamp(k) for k in storage.list_notification_keys())
        if ts is not None and ts >= cutoff
    ]
    # 커서는 "지금"이 아니라 **가장 최근 알림의 시각**이다. now() 로 잡으면 이 호출
    # 직후 미세하게 늦게 기록된 알림이 읽음 처리되어 조용히 사라진다.
    cursor_dt = max(stamps) if stamps else datetime.now(timezone.utc)
    cursor = cursor_dt.isoformat()
    storage.save_read_cursor(cursor)
    # 다른 탭의 뱃지도 지워져야 한다("모두의 알림" — 커서가 공유된다). 프론트가 세지 않는다(계약 #27).
    broker.publish({"event": "read", "data": {"unread_count": 0}})
    return cursor


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return nkey.to_utc(datetime.fromisoformat(value))
    except (ValueError, TypeError):
        return None
