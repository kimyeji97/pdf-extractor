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

    ⚠️ **호출부는 3곳뿐이다** — `upload._trigger_boundary_detection`(최초 감지)와
    `browse._run_refresh_detection`(재감지), `analysis_slots.fail_interrupted`(서버 시작 시 중단된
    분석을 FAILED 로 전환, REQ-B17). `BoundariesStatus.DONE` 을 찍는 나머지
    2곳(`list_all_questions`·`list_questions`)은 **조회 경로의 지연 감지**라
    붙이면 사용자가 지금 보고 있는 화면에 대해 "완료됐습니다"가 뜬다.
    성공만이 아니라 **FAILED 도 같은 기준으로 가른다.**
    """
    failed = job.boundaries_status == BoundariesStatus.FAILED
    emit(
        job_id=job.job_id,
        kind=NotificationKind.DETECTION,
        severity=NotificationSeverity.ERROR if failed else NotificationSeverity.SUCCESS,
        # 문제집 이름 우선 — 사용자는 파일을 이 이름으로 기억한다(생성 알림과 같은 규칙, REQ-F15).
        # 제목은 발행 시점에 저장된다: 옛 알림·이름을 나중에 바꾼 경우는 그때 이름 그대로다
        title=job.workbook_name or job.filename,
        message="문항 감지에 실패했습니다." if failed else "문항 감지가 완료되었습니다.",
    )


def emit_status(job: JobStatusFile) -> None:
    """
    감지 상태 전환(`QUEUED`·`PROCESSING`)을 SSE `status` 이벤트로 알린다 (REQ-F14).

    **알림이 아니다** — 저장하지 않고 `id`도 없다(`read` 이벤트와 같은 방식). 목록·현황판에 "다시 읽으라"는 신호일 뿐이라
    피드·미읽음 수·벨 뱃지에 섞이면 안 되고, 재연결 때 되찾을 필요도 없다(다시 읽으면 현재 상태가 나온다).
    감지 **시작** 신호가 없어 업로드 직후 목록은 "대기 중", 현황판은 "분석 중"으로 완료 전까지 어긋났다.
    """
    try:
        broker.publish({
            "event": "status",
            "data": {"job_id": job.job_id, "boundaries_status": job.boundaries_status.value},
        })
    except Exception as e:  # noqa: BLE001
        logger.warning("[notification] 상태 푸시 실패(무시) | job_id=%s error=%s", job.job_id, e)


def emit_export(
    job: JobStatusFile,
    workbook_name: Optional[str] = None,
    meta_failed: bool = False,
) -> None:
    """
    문제집 생성 완료/실패 알림.

    ⚠️ **`workbook_name` 유무로 가르지 않는다.** 그 분기(계약 #23)는 *메타 저장 주체*를
    정한 것이지 알림과는 목적이 다르다 — 안쪽에 넣으면 구 프론트로 만든 문제집은
    영원히 알림이 안 온다.

    `meta_failed` 는 **PDF 는 만들어졌는데 문제집 메타만 못 쓴** 경우다 (REQ-B29).
    상태는 `DONE` 이지만 **결과 화면 목록이 문제집 행 기준**이라 그 PDF 가 안 뜨고,
    REQ-F18 이 생성 화면 다운로드를 걷어내 받을 길이 없다 — 그래서 성공이라 하면 안 된다.
    ⚠️ 호출부가 이 값을 **따로 넘겨야 한다.** `job.error` 로는 못 가른다 — 그 필드는
    생성 실패 경로에서도 채워져서, 신호로 쓰면 **문구가 뒤바뀐다.**
    """
    failed = job.status == JobStatus.FAILED
    if failed:
        message = "문제집 생성에 실패했습니다."
    elif meta_failed:
        message = "PDF는 만들어졌지만 생성 이력에 등록하지 못했습니다. 다시 만들어 주세요."
    else:
        message = "문제집 생성이 완료되었습니다."
    emit(
        job_id=job.job_id,
        kind=NotificationKind.EXPORT,
        severity=(
            NotificationSeverity.ERROR
            if failed or meta_failed
            else NotificationSeverity.SUCCESS
        ),
        title=workbook_name or job.filename,
        message=message,
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


def can_see(user: Optional[dict], job_id: Optional[str], owners: Optional[dict] = None) -> bool:
    """
    이 사용자가 이 job 의 알림을 볼 수 있나 (REQ-B27). `user` 가 None 이면 내부 호출 — 거르지 않는다.

    소유자는 알림 본문이 아니라 **job 상태의 owner_id** 로 판정한다 — 본문에 두면 거를 때 파일을 다 열어야 해
    "평상시 GET 0회"(F09-09)가 깨진다. 상태 목록은 메모리 캐시(P06)라 싸다. 소유자 없는 job·지워진 job 은 admin 만.
    """
    if user is None or user.get("role") == "admin":
        return True
    if owners is None:
        owners = _owners()
    return job_id is not None and owners.get(job_id) == user.get("user_id")


def _owners() -> dict:
    return {j.job_id: j.owner_id for j in storage.list_jobs() if j.owner_id}


def _visible_dated(user: Optional[dict]) -> list:
    """보관 기간 안 · 이 사용자가 볼 수 있는 (시각, 키) — 최신순. 키 이름만 본다(파일 읽기 0회)."""
    cutoff = _cutoff()
    keys = _purge_expired_months(storage.list_notification_keys(), cutoff)
    owners = _owners() if user is not None and user.get("role") != "admin" else None
    dated = []
    for key in keys:
        ts = nkey.parse_stamp(key)
        if ts is None or ts < cutoff:
            continue
        if not can_see(user, nkey.parse_job_id(key), owners):
            continue
        dated.append((ts, key))
    dated.sort(key=lambda p: p[0], reverse=True)
    return dated


def _read_ids(user: Optional[dict]) -> set:
    """user None(내부 호출)은 공용 기록 `_all` — `mark_read(None)` 이 쓰는 곳과 같다."""
    return set(storage.get_read_ids(user["user_id"] if user else "_all"))


def unread_count(user: Optional[dict]) -> int:
    """이 사용자의 미확인 개수 — 읽은 id 집합에 없는 것(id = 알림 created_at)."""
    read = _read_ids(user)
    return sum(1 for ts, _ in _visible_dated(user) if ts.isoformat() not in read)


def _unread_count() -> int:
    """발행 시점 이벤트에 싣는 값(내부). 스트림이 받는 사람 기준으로 다시 센다(REQ-B27)."""
    return unread_count(None)


def list_feed(since: Optional[str] = None, limit: int = DEFAULT_LIMIT, user: Optional[dict] = None) -> dict:
    """
    알림 피드. 반환은 `{"notifications": [... + "read"], "unread_count": N}` — 이 사용자 기준.

    필터 순서가 곧 비용이다 — 키 이름으로 다 거른 **뒤에** 남은 것만 읽는다.
    """
    dated = _visible_dated(user)
    read = _read_ids(user)
    unread = sum(1 for ts, _ in dated if ts.isoformat() not in read)

    since_ts = _parse_iso(since)
    if since_ts is not None:
        dated = [(ts, k) for ts, k in dated if ts > since_ts]

    selected = dated[: max(limit, 0)]
    notifications = _read_many([key for _, key in selected])
    for item in notifications:
        item["read"] = item.get("created_at") in read

    return {"notifications": notifications, "unread_count": unread}


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


def mark_read(user: Optional[dict], ids: Optional[list] = None) -> int:
    """
    읽음 처리 (REQ-B27) — `ids`(알림 created_at)만, 없으면 이 사용자가 볼 수 있는 알림 전부. 남은 미확인 개수를 돌려준다.

    읽음은 **사용자별**이다 — 예전 전역 커서는 한 사람이 벨을 열면 모두의 뱃지가 0이 됐다.
    읽은 id 는 보관 기간 안의 것만 남긴다(30일 정리와 함께 비워진다). `read` 이벤트는 이 사용자 스트림에만 간다.
    `user` 가 None 이면 내부 호출(테스트) — 공용 기록 `_all` 에 쓰고 전원에게 알린다.
    """
    owner_key = user["user_id"] if user else "_all"
    visible = {ts.isoformat() for ts, _ in _visible_dated(user)}
    read = set(storage.get_read_ids(owner_key))
    read |= visible if ids is None else (set(ids) & visible)
    storage.save_read_ids(owner_key, sorted(read & visible))
    remaining = len(visible - read)
    event = {"event": "read", "data": {"unread_count": remaining}}
    if user:
        event["user_id"] = user["user_id"]
    broker.publish(event)
    return remaining


def mark_all_read() -> Optional[str]:
    """내부 호출용 전체 읽음(사용자 없음) — 반환은 옛 커서 자리의 None 호환."""
    mark_read(None)
    return None


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return nkey.to_utc(datetime.fromisoformat(value))
    except (ValueError, TypeError):
        return None
