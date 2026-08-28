"""
REQ-P05 Phase 2 — 피드 GET 의 건별 읽기 **병렬화** 검증 계약

검증 계약: docs/plans/PLAN-P05-notification-latency.md `## 검증 계약`
케이스: P05-10 ~ P05-13

`list_feed` 는 키 이름만으로 정렬·필터해 파일 읽기를 최소화하도록 잘 짜여 있다(그 부분은
건드리지 않는다). 남은 비용은 **마지막에 최대 50건을 한 건씩 읽는 것**이고, R2 왕복이
건당 수십~수백 ms라 첫 진입 GET 이 3.79s 였다.

병렬성 단언은 **동시 미해결 읽기 수**로 한다(2026-08-28 결정) — `read_notification` 대역이
"지금 진행 중인 호출 수"의 최대치를 기록한다. 1이면 순차, 2 이상이면 병렬.
경과 시간으로 재지 않는다 — 느린 CI·부하에서 플래키다.

병렬화해도 **결과는 순차와 같아야 한다**(P05-10·11·12). 그게 이 변경의 조건이다.
"""
import threading

import pytest


@pytest.fixture
def concurrency_probe(monkeypatch):
    """
    `read_notification` 을 대역으로 바꿔 **동시에 진행 중인 호출 수의 최대치**를 기록한다.

    반환값은 `(peak_getter, install)` 이 아니라 기록용 dict 하나다 — `d["peak"]`.
    대역은 잠깐 대기해 겹칠 시간을 준다(병렬이면 겹치고, 순차면 절대 안 겹친다).
    """
    state = {"peak": 0, "active": 0}
    lock = threading.Lock()

    def _install(fail_keys: set[str] | None = None):
        from app.services import notification_service, storage

        real = storage.read_notification

        def _probe(relpath: str):
            with lock:
                state["active"] += 1
                state["peak"] = max(state["peak"], state["active"])
            try:
                threading.Event().wait(0.02)  # 겹칠 틈 — sleep 대신 이벤트 대기
                if fail_keys and relpath in fail_keys:
                    raise RuntimeError(f"읽기 실패(테스트) | {relpath}")
                return real(relpath)
            finally:
                with lock:
                    state["active"] -= 1

        monkeypatch.setattr(storage, "read_notification", _probe)
        # notification_service 가 storage 모듈을 참조하므로 위 patch 로 충분하지만,
        # 이름을 직접 바인딩한 경우를 대비해 한 번 더 본다.
        if hasattr(notification_service, "read_notification"):
            monkeypatch.setattr(notification_service, "read_notification", _probe)
        return state

    return _install


# ── 결과 동등성 — 병렬화해도 순차와 같아야 한다 ────────────

def test_P05_10_반환_순서는_최신순(write_notif, days_ago):
    """근거: PLAN § 작업 단계 Phase 2 — "반환 순서·`unread_count`가 순차 구현과 동일" """
    from app.services import notification_service

    write_notif("job-old", days_ago(3))
    write_notif("job-mid", days_ago(2))
    write_notif("job-new", days_ago(1))

    feed = notification_service.list_feed()

    assert [n["job_id"] for n in feed["notifications"]] == ["job-new", "job-mid", "job-old"]


def test_P05_11_unread_count가_읽음_커서_기준으로_동일(write_notif, days_ago):
    """근거: PLAN § 작업 단계 Phase 2 — "반환 순서·`unread_count`가 순차 구현과 동일" """
    from app.services import notification_service

    write_notif("job-a", days_ago(3))
    write_notif("job-b", days_ago(2))
    notification_service.mark_all_read()
    write_notif("job-c", days_ago(0.5))

    feed = notification_service.list_feed()

    assert feed["unread_count"] == 1


def test_P05_12_일부_읽기가_실패해도_나머지가_반환된다(
    write_notif, days_ago, concurrency_probe
):
    """근거: PLAN § 제약·함정 — "한 건의 예외가 전체를 깨뜨리면 안 된다" """
    from app.services import notification_service, storage

    write_notif("job-a", days_ago(3))
    write_notif("job-b", days_ago(2))
    write_notif("job-c", days_ago(1))

    # 알림 키에는 job_id 가 들어간다(`{stamp}-{job_id}.json`) — 그 한 건만 실패시킨다.
    doomed = {k for k in storage.list_notification_keys() if "job-b" in str(k)}
    assert doomed, "무대 전제: 키에 job_id 가 들어 있어야 한다"
    concurrency_probe(fail_keys=doomed)

    feed = notification_service.list_feed()

    assert len(feed["notifications"]) == 2


# ── 병렬성 ────────────────────────────────────────────────

def test_P05_13_건별_읽기가_동시에_일어난다(write_notif, days_ago, concurrency_probe):
    """근거: PLAN § 작업 단계 Phase 2 — "`list_feed`의 건별 읽기를 병렬로" """
    from app.services import notification_service

    for i in range(8):
        write_notif(f"job-{i}", days_ago(1 + i * 0.1))
    state = concurrency_probe()

    notification_service.list_feed()

    assert state["peak"] >= 2
