"""
REQ-F14 Phase 1 — 감지 상태 전환을 SSE `status` 이벤트로 알린다

검증 계약: docs/plans/PLAN-F14-stats-board-and-badges.md `## 검증 계약`
케이스: F14-01 ~ F14-03

업로드 직후 목록 뱃지는 "대기 중", 현황판은 "분석 중"이었다 — 둘이 다른 시점에 상태를 읽고, 감지 **시작**을 알리는 신호가 없어
완료 전까지 어긋났다. 결정: `QUEUED`·`PROCESSING` 전환 때 **저장하지 않는** `status` 이벤트를 보낸다(기존 `read` 이벤트와 같은 방식).

무대: F09 알림 훅 테스트와 같은 픽스처(`make_job`·`stub_detection`·`fake_pdf`·`notif_files`).
발행은 `notification_broker.publish` 를 가로채 본다 — 알림·읽음 이벤트가 모두 이 한 곳을 지난다.
"""
import pytest

JOB = "job-f14"


@pytest.fixture
def published(monkeypatch):
    """`notification_broker.publish` 대역 — 발행된 이벤트를 순서대로 적는다."""
    from app.services import notification_broker

    events: list[dict] = []
    monkeypatch.setattr(notification_broker, "publish", events.append)
    return events


def _statuses(events: list[dict], job_id: str) -> list[str]:
    return [
        str(e["data"]["boundaries_status"]).split(".")[-1]
        for e in events
        if e.get("event") == "status" and e["data"].get("job_id") == job_id
    ]


def test_F14_01_upload_detection_emits_queued_then_processing(
    make_job, stub_detection, fake_pdf, published
):
    from app.routers.upload import _trigger_boundary_detection

    make_job(JOB)
    stub_detection(count=2)

    _trigger_boundary_detection(JOB)

    assert _statuses(published, JOB)[:2] == ["QUEUED", "PROCESSING"]


def test_F14_02_refresh_emits_queued_then_processing(
    authed_client, make_job, stub_detection, fake_pdf, published
):
    make_job(JOB)
    stub_detection(count=2)

    authed_client.post(f"/api/jobs/{JOB}/refresh")

    assert _statuses(published, JOB)[:2] == ["QUEUED", "PROCESSING"]


def test_F14_03_status_events_are_not_stored(
    authed_client, make_job, stub_detection, fake_pdf, published, notif_files
):
    make_job(JOB)
    stub_detection(count=2)

    authed_client.post(f"/api/jobs/{JOB}/refresh")

    assert _statuses(published, JOB), "status 이벤트가 발행돼야 저장 여부를 따질 수 있다"
    assert len(notif_files()) == 1   # 감지 완료 알림 1건뿐 — status 는 파일이 되지 않는다
