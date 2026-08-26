"""
REQ-P04 Phase 1 — 알림 **브로커 + SSE 스트림** 검증 계약

검증 계약: docs/plans/PLAN-P04-websocket-push.md `## 검증 계약`
케이스: P04-01 ~ P04-13

계획서가 고정한 표면:
    GET  /api/notifications/stream          — text/event-stream, heartbeat 30s, Last-Event-ID 재전송
    POST /api/notifications/read            — 기존 API. 이제 `read` 이벤트도 publish 한다

계획서가 정하지 않아 **이 파일이 검증 계약으로 고정하는 인터페이스**:
    app.services.notification_broker
        subscribe()          — async context manager. 구독 큐(`await q.get()` 로 이벤트 dict 수신)를 준다.
                               구독 시점의 running loop 를 기억해 두므로 별도 bind 가 필요 없다.
        publish(event: dict) — **어느 스레드에서 불러도** 구독자를 깨운다 (call_soon_threadsafe).
        subscriber_count()   — 살아 있는 구독 수.
    app.routers.notification
        HEARTBEAT_S                          — 기본 30
        event_stream(last_event_id, heartbeat_s) — SSE 청크(str) async generator.
                                               라우트 핸들러가 그대로 StreamingResponse 로 감싼다.

이벤트 dict 모양(브로커 → 스트림):
    {"event": "notification", "id": <created_at>, "data": {<알림 본문>, "unread_count": int}}
    {"event": "read",         "data": {"unread_count": 0}}

⚠️ 이 파일의 async 케이스는 `anyio` 플러그인(fastapi 의존성으로 이미 설치됨)으로 돈다.
   pytest-asyncio 를 추가하지 않는다 — 의존성 추가는 승인 사항이다.
"""
import asyncio
import json
from datetime import timezone

import pytest

from app.models.schemas import NotificationKind


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def _next(queue, timeout: float = 2.0) -> dict:
    """구독 큐에서 이벤트 1건. 계획서 완료 기준(N ≤ 2s)을 대기 상한으로 쓴다."""
    return await asyncio.wait_for(queue.get(), timeout)


def _parse_sse(chunk: str) -> dict:
    """SSE 청크 한 덩이 → {'event','id','data','comment'}"""
    out: dict = {}
    for line in chunk.splitlines():
        if line.startswith(":"):
            out["comment"] = line[1:].strip()
        elif ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip()
    if "data" in out:
        out["data"] = json.loads(out["data"])
    return out


async def _collect(gen, n: int, timeout: float = 2.0) -> list[dict]:
    """스트림 생성기에서 청크 n개를 파싱해 모은다."""
    got = []
    async def _pull():
        async for chunk in gen:
            got.append(_parse_sse(chunk))
            if len(got) >= n:
                return
    await asyncio.wait_for(_pull(), timeout)
    return got


# ── 브로커 — emit() 과의 결합 ─────────────────────────────

@pytest.mark.anyio
async def test_P04_01_emit_저장_성공후_구독자에_알림_1건_도달():
    """근거: PLAN § 작업 단계 Phase 1 — "`emit()`이 저장 성공 후 publish" """
    from app.services import notification_broker as broker
    from app.services import notification_service

    async with broker.subscribe() as q:
        notification_service.emit("job-a", NotificationKind.DETECTION)
        ev = await _next(q)

    assert ev["event"] == "notification"
    assert ev["data"]["job_id"] == "job-a"


@pytest.mark.anyio
async def test_P04_02_threadpool에서_emit해도_구독자가_깨어난다():
    """근거: PLAN § 제약·함정 — "케이스 하나는 반드시 `run_in_threadpool` 경유로 발행한다"

    BackgroundTasks 는 sync 함수를 threadpool 에서 돌린다. 루프 밖에서 `Queue.put_nowait`
    를 직접 부르면 **에러 없이 구독자가 안 깨어난다** — 같은 스레드에서 도는 P04-01 은
    이 결함을 못 잡는다.
    """
    from starlette.concurrency import run_in_threadpool

    from app.services import notification_broker as broker
    from app.services import notification_service

    async with broker.subscribe() as q:
        await run_in_threadpool(
            notification_service.emit, "job-thread", NotificationKind.EXPORT
        )
        ev = await _next(q)

    assert ev["data"]["job_id"] == "job-thread"


@pytest.mark.anyio
async def test_P04_03_저장_실패시_publish하지_않는다(monkeypatch):
    """근거: PLAN § 작업 단계 Phase 1 — "저장 실패 시 publish 안 함" """
    from app.services import notification_broker as broker
    from app.services import notification_service, storage

    def _boom(_data):
        raise OSError("disk full")

    monkeypatch.setattr(storage, "save_notification", _boom)

    async with broker.subscribe() as q:
        notification_service.emit("job-fail", NotificationKind.DETECTION)  # 예외를 삼켜야 한다(F09)
        with pytest.raises(asyncio.TimeoutError):
            await _next(q, timeout=0.3)


# ── 스트림 — 형식 ─────────────────────────────────────────

def test_P04_04_stream_응답은_text_event_stream(client):
    """근거: PLAN § 작업 단계 Phase 1 — "`text/event-stream`" """
    with client.stream("GET", "/api/notifications/stream") as res:
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/event-stream")


@pytest.mark.anyio
async def test_P04_05_이벤트_id는_알림의_created_at():
    """근거: PLAN § 작업 단계 Phase 1 — "이벤트 `id`=`created_at`" """
    from app.routers.notification import event_stream
    from app.services import notification_service

    gen = event_stream(last_event_id=None, heartbeat_s=60)
    task = asyncio.ensure_future(_collect(gen, 1))
    await asyncio.sleep(0.05)  # 구독이 잡힐 시간
    notification_service.emit("job-id", NotificationKind.DETECTION)
    [ev] = await task

    assert ev["event"] == "notification"
    assert ev["id"] == ev["data"]["created_at"]


@pytest.mark.anyio
async def test_P04_06_이벤트_페이로드에_unread_count_동봉(write_notif, days_ago):
    """근거: PLAN § 작업 단계 Phase 1 — "페이로드에 `unread_count` 동봉" """
    from app.routers.notification import event_stream
    from app.services import notification_service

    write_notif("job-old", days_ago(1))  # 미읽음 1건이 이미 있다

    gen = event_stream(last_event_id=None, heartbeat_s=60)
    task = asyncio.ensure_future(_collect(gen, 1))
    await asyncio.sleep(0.05)
    notification_service.emit("job-new", NotificationKind.DETECTION)
    [ev] = await task

    assert ev["data"]["unread_count"] == 2


# ── 스트림 — 재연결 ───────────────────────────────────────

@pytest.mark.anyio
async def test_P04_07_Last_Event_ID_이후_알림을_첫머리에_흘린다(write_notif, days_ago):
    """근거: PLAN § 작업 단계 Phase 1 — "`Last-Event-ID` 헤더가 오면 `list_feed(since=)` 결과를 먼저 흘린다" """
    from app.routers.notification import event_stream

    write_notif("job-before", days_ago(3))
    write_notif("job-after", days_ago(1))
    since = days_ago(2).astimezone(timezone.utc).isoformat()

    got = await _collect(event_stream(last_event_id=since, heartbeat_s=60), 1)

    assert [e["data"]["job_id"] for e in got] == ["job-after"]


@pytest.mark.anyio
async def test_P04_08_첫_연결은_기존_알림을_재전송하지_않는다(write_notif, days_ago):
    """근거: PLAN § 제약·함정 — "첫 연결에는 재전송하지 않는다." """
    from app.routers.notification import event_stream

    write_notif("job-old", days_ago(1))

    # heartbeat 를 짧게 줘서 "첫 청크"가 무엇인지 본다 — 알림이면 실패, keepalive 면 통과
    [first] = await _collect(event_stream(last_event_id=None, heartbeat_s=0.05), 1)

    assert "data" not in first
    assert first.get("comment") == "keepalive"


# ── 읽음 이벤트 ───────────────────────────────────────────

@pytest.mark.anyio
async def test_P04_09_read_API가_read_이벤트를_publish한다(write_notif, days_ago):
    """근거: PLAN § 작업 단계 Phase 1 — "`read` 이벤트(`unread_count: 0`)를 publish" """
    from app.services import notification_broker as broker
    from app.services import notification_service

    write_notif("job-a", days_ago(1))

    async with broker.subscribe() as q:
        notification_service.mark_all_read()
        ev = await _next(q)

    assert ev["event"] == "read"
    assert ev["data"]["unread_count"] == 0


# ── heartbeat ─────────────────────────────────────────────

@pytest.mark.anyio
async def test_P04_10_알림이_없어도_keepalive가_나간다():
    """근거: PLAN § 작업 단계 Phase 1 — "`: keepalive` **30s**" """
    from app.routers.notification import event_stream

    got = await _collect(event_stream(last_event_id=None, heartbeat_s=0.05), 2, timeout=1.0)

    assert [g.get("comment") for g in got] == ["keepalive", "keepalive"]


def test_P04_11_heartbeat_기본_간격은_30초():
    """근거: PLAN § Phase 0 결과 — "**heartbeat 30s** 권장(컷의 1/4)" """
    from app.routers.notification import HEARTBEAT_S

    assert HEARTBEAT_S == 30


# ── 브로커 — 수명 ─────────────────────────────────────────

@pytest.mark.anyio
async def test_P04_12_구독_해제후_구독자_수는_0():
    """근거: PLAN § 작업 단계 Phase 1 — "구독 해제 시 큐 정리" """
    from app.services import notification_broker as broker

    async with broker.subscribe():
        assert broker.subscriber_count() == 1

    assert broker.subscriber_count() == 0


@pytest.mark.anyio
async def test_P04_13_구독자_2개에_같은_알림이_모두_도달():
    """근거: PLAN § 작업 단계 Phase 1 — "구독자별 `asyncio.Queue`" """
    from app.services import notification_broker as broker
    from app.services import notification_service

    async with broker.subscribe() as q1, broker.subscribe() as q2:
        notification_service.emit("job-multi", NotificationKind.DETECTION)
        a, b = await _next(q1), await _next(q2)

    assert a["data"]["job_id"] == b["data"]["job_id"] == "job-multi"
