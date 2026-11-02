"""
유휴 스케일인 (REQ-E03 Phase 2) — 사용자 요청이 `IDLE_SCALE_IN_MINUTES` 분 없으면 자기 ECS 서비스를 desired 0 으로 내린다.

- 유휴 시계는 기동 시각에서 시작한다(시작점이 없으면 깨우자마자 꺼진다). `/health`·SSE 스트림·운영 구간 조회는 요청으로 치지 않는다
  (SSE 를 세면 탭을 열어 둔 것만으로 안 꺼진다).
- 감지·생성이 도는 동안(`working()`)은 끄지 않는다. 끄면 작업이 `PROCESSING` 고아가 된다.
- 대상은 `IDLE_SCALE_IN_RESOURCE_ID` 로만 받는다. `SCHEDULE_RESOURCE_ID` 는 쓰지 않는다 — dev 는 그 값이 prod 서비스다.
- 둘 중 하나라도 비면(로컬·테스트·dev) 아무것도 안 한다.
"""
import logging
import threading
import time
from contextlib import contextmanager

from app.core.config import settings
from app.services import operating_schedule

logger = logging.getLogger(__name__)

_NOT_ACTIVITY = ("/health", "/api/notifications/stream", "/api/operating-windows")
_CHECK_INTERVAL = 60

# ponytail: 프로세스 메모리 시계·카운터 — 태스크 1개 전제(계약 #43과 같은 결), 스케일아웃 때 공유 저장소로
last_activity: float = time.time()
_busy = 0
_lock = threading.Lock()


def counts_as_activity(path: str) -> bool:
    return path not in _NOT_ACTIVITY


def touch(now: float | None = None) -> None:
    global last_activity
    last_activity = time.time() if now is None else now


@contextmanager
def working():
    """감지·생성 같은 백그라운드 작업을 감싼다. 감싼 동안은 스케일인하지 않는다."""
    global _busy
    with _lock:
        _busy += 1
    try:
        yield
    finally:
        with _lock:
            _busy -= 1


def busy() -> bool:
    return _busy > 0


def should_scale_in(last_activity: float, now: float, idle_minutes: int, busy: bool) -> bool:
    return not busy and now - last_activity >= idle_minutes * 60


def check_once(ecs, now: float) -> bool:
    """유휴면 대상 서비스를 desired 0 으로. 껐으면 True."""
    minutes = settings.IDLE_SCALE_IN_MINUTES
    resource = settings.IDLE_SCALE_IN_RESOURCE_ID
    if not minutes or not resource:
        return False
    if not should_scale_in(last_activity, now, minutes, busy()):
        return False
    _, cluster, service = resource.split("/", 2)
    logger.warning("[idle] %d분 유휴 — %s 를 desired 0 으로", minutes, resource)
    operating_schedule.set_service_running(ecs, cluster, service, on=False)
    return True


def _loop() -> None:
    import boto3

    ecs = boto3.client("ecs", region_name=settings.SCHEDULE_AWS_REGION)
    while True:
        time.sleep(_CHECK_INTERVAL)
        try:
            check_once(ecs, time.time())
        except Exception:  # noqa: BLE001 — 끄기 실패로 서버를 죽이지 않는다. 다음 주기에 다시 본다
            logger.exception("[idle] 스케일인 실패")


def start() -> None:
    """기동 시 호출: 유휴 시계를 지금으로 맞추고, 설정이 있으면 주기 확인 스레드를 띄운다."""
    touch()
    if settings.IDLE_SCALE_IN_MINUTES and settings.IDLE_SCALE_IN_RESOURCE_ID:
        threading.Thread(target=_loop, daemon=True).start()
