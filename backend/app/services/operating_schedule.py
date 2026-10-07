"""
운영 구간 (REQ-F19 Phase 3) — ECS 예약 작업(Application Auto Scaling)에서 앞으로 운영 구간을 계산한다.

prod 는 예약 작업으로 켜지고 꺼진다(2026-10-07 실측: on `cron(0 15 ? * MON-FRI *)` · off `cron(0 23 ? * MON-FRI *)`,
Timezone Asia/Seoul). 시각은 사용자가 수시로 바꾸므로 코드·환경변수에 박지 않고 여기서 읽는다.
프론트는 cron 을 해석하지 않는다 — 절대 시각(ISO, 시간대 포함) `{start, end}` 목록만 받는다.

- 켜짐/꺼짐은 이름이 아니라 **용량**으로 식별한다 — `MinCapacity >= 1` 이 켜짐, `MaxCapacity == 0` 이 꺼짐.
- AWS cron 은 6필드(분 시 일 월 요일 연도)이고 `?` 가 있으며 요일은 1=SUN … 7=SAT 다. 일반 cron(5필드)과 다르다.
- `at(...)`·`rate(...)` 는 계산하지 않는다 — 일회성 예약을 구간에 어떻게 반영할지는 계획서 미결 질문이다.
- 조회 대상 서비스는 `SCHEDULE_RESOURCE_ID`(예: `service/pdf-extractor-cluster/pdf-extractor-backend-prod-svc`).
  비어 있으면(로컬·dev) 조회하지 않고 빈 목록이다.
"""
import logging
import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings

logger = logging.getLogger(__name__)

_DOW = {"SUN": 1, "MON": 2, "TUE": 3, "WED": 4, "THU": 5, "FRI": 6, "SAT": 7}
_MON = {m: i for i, m in enumerate(
    ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], start=1)}


def fetch_scheduled_actions() -> list[dict]:
    """대상 서비스의 예약 작업 원본(`ScheduledActions` 항목). 설정이 없으면 빈 목록."""
    if not settings.SCHEDULE_RESOURCE_ID:
        return []
    import boto3

    client = boto3.client("application-autoscaling", region_name=settings.SCHEDULE_AWS_REGION)
    res = client.describe_scheduled_actions(ServiceNamespace="ecs", ResourceId=settings.SCHEDULE_RESOURCE_ID)
    return res.get("ScheduledActions", [])


def _field(expr: str, lo: int, hi: int, names: dict | None = None) -> set[int] | None:
    """cron 필드 하나 → 허용 값 집합. `*`·`?` 는 None(제약 없음)."""
    if expr in ("*", "?"):
        return None
    out: set[int] = set()
    for part in expr.split(","):
        part, _, step = part.partition("/")
        if names:
            for k, v in names.items():
                part = part.replace(k, str(v))
        if part == "*":
            a, b = lo, hi
        elif "-" in part:
            a, b = (int(x) for x in part.split("-"))
        else:
            a = b = int(part)
        out.update(range(a, b + 1, int(step) if step else 1))
    return out


def _occurrences(schedule: str, tz: ZoneInfo, start: datetime, end: datetime) -> list[datetime]:
    """`cron(...)` 이 [start, end) 에서 발화하는 시각들. cron 이 아니면 빈 목록."""
    m = re.fullmatch(r"cron\((.+)\)", schedule.strip())
    if not m:
        return []
    minute, hour, dom, month, dow, year = m.group(1).split()
    minutes, hours = _field(minute, 0, 59), _field(hour, 0, 23)
    doms, months = _field(dom, 1, 31), _field(month, 1, 12, _MON)
    dows, years = _field(dow, 1, 7, _DOW), _field(year, 1970, 2199)

    out = []
    day = start.astimezone(tz).date()
    while day <= end.astimezone(tz).date():
        aws_dow = (day.isoweekday() % 7) + 1  # 월=1…일=7 → AWS 일=1…토=7
        if ((doms is None or day.day in doms) and (months is None or day.month in months)
                and (dows is None or aws_dow in dows) and (years is None or day.year in years)):
            for h in sorted(hours if hours is not None else range(24)):
                for mi in sorted(minutes if minutes is not None else range(60)):
                    t = datetime(day.year, day.month, day.day, h, mi, tzinfo=tz)
                    if start <= t < end:
                        out.append(t)
        day += timedelta(days=1)
    return out


def compute_windows(actions: list[dict], now: datetime, days: int = 14) -> list[dict]:
    """앞으로 `days` 일 안의 운영 구간 `[{start, end}]`. 지금이 들어 있는 구간도 포함한다(배너가 그 end 를 본다)."""
    horizon = now + timedelta(days=days)
    lookback = now - timedelta(days=days)  # 진행 중 구간의 시작을 찾으려고 과거도 본다
    events: list[tuple[datetime, bool]] = []
    for a in actions:
        cap = a.get("ScalableTargetAction") or {}
        if cap.get("MinCapacity", 0) >= 1:
            is_on = True
        elif cap.get("MaxCapacity") == 0:
            is_on = False
        else:
            continue
        tz = ZoneInfo(a.get("Timezone") or "UTC")
        events += [(t, is_on) for t in _occurrences(a.get("Schedule", ""), tz, lookback, horizon)]
    events.sort(key=lambda e: e[0])

    windows, opened = [], None
    for t, is_on in events:
        if is_on and opened is None:
            opened = t
        elif not is_on and opened is not None:
            if t > now and opened < horizon:
                windows.append({"start": opened.isoformat(), "end": t.isoformat()})
            opened = None
    return windows


def upcoming_windows() -> list[dict]:
    """API 용 — 조회·계산이 실패해도 앱을 막지 않는다(배너만 안 뜬다)."""
    try:
        return compute_windows(fetch_scheduled_actions(), datetime.now(timezone.utc))
    except Exception:
        logger.warning("운영 구간 조회 실패 — 빈 목록으로 응답", exc_info=True)
        return []
