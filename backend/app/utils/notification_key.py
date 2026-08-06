"""
알림 오브젝트 키 규약 (REQ-F09 Phase 1)

저장 레이아웃:
    notifications/{YYYY-MM}/{ISO}-{job_id}.json
    notifications/read_cursor.json

**키 형식을 여기 한 곳에만 둔다.** local_storage_service 와 s3_service 는 인터페이스를
각자 구현하는 관례지만, 키 형식이 갈리면 로컬에선 되는데 R2 에서만 알림이 안 잡히는
형태로 조용히 깨진다 — 형식 자체는 공유한다.

키에 타임스탬프를 박는 이유는 **LIST 결과만으로 신규 판정**을 하기 위해서다.
`list_workbooks()` 처럼 전량을 읽으면 알림은 몇 초마다 폴링되므로 R2 에서 매번
LIST + N GET 이 돌고 30일치가 쌓일수록 N 이 자란다 (REQ-P03 썸네일 병목과 같은 계열).
"""
import re
from datetime import datetime, timezone

NOTIFICATIONS_PREFIX = "notifications"
READ_CURSOR_NAME = "read_cursor.json"

_STAMP_FMT = "%Y-%m-%dT%H:%M:%S.%f%z"

# {stamp}-{job_id}.json — job_id 에도 '-' 가 들어가므로 split 이 아니라 앵커된 정규식으로 가른다.
_FILENAME_RE = re.compile(
    r"^(?P<stamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}[+-]\d{4})-(?P<job_id>.+)\.json$"
)


def to_utc(dt: datetime) -> datetime:
    """naive datetime 은 UTC 로 간주한다 (저장 시각은 전부 UTC 로 통일)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def format_stamp(dt: datetime) -> str:
    return to_utc(dt).strftime(_STAMP_FMT)


def month_of(dt: datetime) -> str:
    return to_utc(dt).strftime("%Y-%m")


def build_relpath(dt: datetime, job_id: str) -> str:
    """`notifications/` 아래의 상대 경로를 만든다. 예: `2026-08/2026-08-06T...+0000-abc.json`"""
    return f"{month_of(dt)}/{format_stamp(dt)}-{job_id}.json"


def parse_stamp(relpath: str):
    """
    상대 경로에서 생성 시각을 뽑는다. 형식에 안 맞으면 None.

    **파일을 열지 않는다** — 이 함수가 "평상시 GET 0회"를 성립시키는 지점이다.
    """
    filename = relpath.rsplit("/", 1)[-1]
    m = _FILENAME_RE.match(filename)
    if not m:
        return None
    try:
        return datetime.strptime(m.group("stamp"), _STAMP_FMT)
    except ValueError:
        return None


def month_is_expired(month: str, cutoff: datetime) -> bool:
    """
    월 프리픽스 전체가 보관 기간을 벗어났는가.

    월의 **마지막 순간까지** cutoff 이전일 때만 참이다. 하루라도 살아 있는 달을
    통째로 지우면 보관 기간 내 알림이 함께 날아간다.
    """
    try:
        year, mon = (int(x) for x in month.split("-"))
    except (ValueError, TypeError):
        return False
    next_month_start = datetime(
        year + (1 if mon == 12 else 0),
        1 if mon == 12 else mon + 1,
        1,
        tzinfo=timezone.utc,
    )
    return next_month_start <= to_utc(cutoff)
