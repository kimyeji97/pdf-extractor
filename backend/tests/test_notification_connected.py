"""
REQ-C09 Phase 2 — SSE 스트림의 `: connected` 선발송

검증 계약: docs/plans/PLAN-C09-notification-followups.md `## 검증 계약`
케이스: C09-20 ~ C09-22

배경: edge 가 첫 바이트까지 응답 헤더를 붙잡아 브라우저 `EventSource` 가 첫 keepalive(30s)까지
`CONNECTING` 으로 남는다(P04 실측 2026-08-27). 구독 직후 코멘트 한 줄이면 즉시 열린다.

이 파일이 고정하는 인터페이스:
    app.routers.notification.event_stream(last_event_id, heartbeat_s)
        첫 청크 == ": connected\\n\\n"  — 구독 직후, Last-Event-ID 재전송보다 **앞**, 1회만.

수집기·파서는 test_notification_stream.py 의 것을 그대로 쓴다(코멘트 청크도 한 덩이로 센다).
"""
from datetime import timezone

import pytest

from tests.test_notification_stream import _collect


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_C09_20_첫_연결의_첫_청크는_connected_코멘트(isolated_storage):
    """근거: PLAN-C09 § 작업 단계 Phase 2 — "구독 직후 `\": connected\\n\\n\"` 1회" """
    from app.routers.notification import event_stream

    [first] = await _collect(event_stream(last_event_id=None, heartbeat_s=60), 1)

    assert first.get("comment") == "connected"


@pytest.mark.anyio
async def test_C09_21_Last_Event_ID가_있어도_connected가_복구분보다_앞(write_notif, days_ago):
    """근거: PLAN-C09 § 결정 — "`Last-Event-ID` 재전송보다 **앞**에" """
    from app.routers.notification import event_stream

    write_notif("job-before", days_ago(3))
    write_notif("job-after", days_ago(1))
    since = days_ago(2).astimezone(timezone.utc).isoformat()

    got = await _collect(event_stream(last_event_id=since, heartbeat_s=60), 2)

    assert got[0].get("comment") == "connected"
    assert got[1]["data"]["job_id"] == "job-after"


@pytest.mark.anyio
async def test_C09_22_connected는_1회뿐_둘째_청크는_keepalive(isolated_storage):
    """근거: PLAN-C09 § 작업 단계 Phase 2 — "구독 직후 `\": connected\\n\\n\"` 1회" """
    from app.routers.notification import event_stream

    got = await _collect(event_stream(last_event_id=None, heartbeat_s=0.05), 2)

    assert [c.get("comment") for c in got] == ["connected", "keepalive"]
