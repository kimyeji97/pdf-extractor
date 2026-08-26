"""
알림 브로커 — 프로세스 내 pub/sub (REQ-P04 Phase 1)

알림 피드의 상시 폴링을 서버 푸시(SSE)로 바꾸기 위한 **전달 경로**다. 알림의 *쓰기*는
그대로 `notification_service.emit()`이 스토리지에 하고(계약 #22·#23), 이 모듈은 저장이
끝난 뒤 열려 있는 스트림들에 같은 이벤트를 흘려보내기만 한다.

⚠️ **1태스크 · 1워커 가정.** 구독자는 이 프로세스의 메모리에만 있다. ECS `desired-count`
    또는 uvicorn `--workers`를 2 이상으로 올리면 **다른 프로세스에 붙은 클라이언트는 알림을
    못 받는다.** 그 시점에 브로드캐스트(스토리지 폴링 등)를 얹는 것은 별도 REQ다
    (PLAN-P04 § 결정 — 다중 인스턴스).

⚠️ **publish 는 어느 스레드에서 불러도 된다 — 그래서 `call_soon_threadsafe` 다.**
    `emit()`은 `BackgroundTasks`가 threadpool 에서 돌리는 sync 함수 안에서 불린다.
    거기서 `Queue.put_nowait`를 직접 부르면 **에러 없이 구독자가 깨어나지 않는다**
    (루프에 wakeup 이 전달되지 않는다). 구독 시점의 running loop 를 기억해 두고
    그 루프에 넘긴다 — 별도의 startup bind 가 필요 없다.
"""
import asyncio
import contextlib
import logging
from typing import AsyncIterator

logger = logging.getLogger(__name__)

# (queue, loop) 쌍. 구독자 하나 = 열린 스트림 하나.
_subscribers: set[tuple[asyncio.Queue, asyncio.AbstractEventLoop]] = set()


@contextlib.asynccontextmanager
async def subscribe() -> AsyncIterator[asyncio.Queue]:
    """구독 큐를 준다. `async with` 를 벗어나면 큐가 정리된다 — 끊긴 스트림이 남지 않는다."""
    queue: asyncio.Queue = asyncio.Queue()
    entry = (queue, asyncio.get_running_loop())
    _subscribers.add(entry)
    try:
        yield queue
    finally:
        _subscribers.discard(entry)


def publish(event: dict) -> None:
    """이벤트 1건을 모든 구독자에게. 스레드 안전. 구독자가 없으면 아무 일도 없다."""
    for queue, loop in tuple(_subscribers):
        if loop.is_closed():
            _subscribers.discard((queue, loop))
            continue
        loop.call_soon_threadsafe(queue.put_nowait, event)


def subscriber_count() -> int:
    return len(_subscribers)
