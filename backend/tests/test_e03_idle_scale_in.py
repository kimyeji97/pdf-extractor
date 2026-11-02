"""
REQ-E03 Phase 2 — 유휴 스케일인 (사용자 요청이 30분 없으면 자기 서비스를 desired 0 으로)

검증 계약: docs/plans/PLAN-E03-prod-idle-scale-to-zero.md `## 검증 계약` (E03-01 ~ E03-18, F19-43 변경분은 F19 파일)

- 유휴 시계는 기동 시각에서 시작하고, `/health`·SSE 스트림·`/api/operating-windows` 외 요청마다 되돌린다.
- 감지·생성이 도는 동안(`working()`)은 끄지 않는다 — 끄면 작업이 `PROCESSING` 고아가 된다.
- 대상 서비스는 `IDLE_SCALE_IN_RESOURCE_ID` 로만 받는다. dev 의 `SCHEDULE_RESOURCE_ID` 는 prod 를 가리킨다.

실제 AWS 는 부르지 않는다(계약 #24 와 같은 이유). 모듈은 케이스 안에서 import 한다 —
아직 없을 때 수집 에러로 파일 전체가 죽지 않고 케이스마다 실패하게.
"""
import importlib
import inspect
import time
from datetime import datetime, timedelta, timezone

import pytest

KST = timezone(timedelta(hours=9))
NOW = 1_800_000_000.0
MIN = 60.0
RESOURCE = "service/pdf-extractor-cluster/pdf-extractor-backend-prod-svc"


def _idle():
    return importlib.import_module("app.services.idle_scale_in")


def _settings():
    return importlib.import_module("app.core.config").settings


class _FakeEcs:
    def __init__(self):
        self.calls = []

    def update_service(self, **kwargs):
        self.calls.append(kwargs)
        return {"service": {"desiredCount": kwargs.get("desiredCount")}}


@pytest.fixture
def enabled(monkeypatch):
    """prod 설정: 30분, 대상 = prod 서비스. 마지막 활동은 31분 전."""
    s = _settings()
    monkeypatch.setattr(s, "IDLE_SCALE_IN_MINUTES", 30)
    monkeypatch.setattr(s, "IDLE_SCALE_IN_RESOURCE_ID", RESOURCE)
    monkeypatch.setattr(_idle(), "last_activity", NOW - 31 * MIN)
    return s


# ── should_scale_in ──────────────────────────────────────────

def test_E03_01_idle_31min_not_busy_scales_in():
    assert _idle().should_scale_in(NOW - 31 * MIN, NOW, 30, busy=False) is True


def test_E03_02_idle_29min59s_does_not_scale_in():
    assert _idle().should_scale_in(NOW - (30 * MIN - 1), NOW, 30, busy=False) is False


def test_E03_03_idle_exactly_30min_scales_in():
    assert _idle().should_scale_in(NOW - 30 * MIN, NOW, 30, busy=False) is True


def test_E03_04_busy_never_scales_in():
    assert _idle().should_scale_in(NOW - 31 * MIN, NOW, 30, busy=True) is False


# ── check_once ───────────────────────────────────────────────

def test_E03_05_check_once_sets_desired_zero_on_configured_service(enabled):
    ecs = _FakeEcs()
    _idle().check_once(ecs, NOW)
    assert ecs.calls == [
        {"cluster": "pdf-extractor-cluster", "service": "pdf-extractor-backend-prod-svc", "desiredCount": 0}
    ]


def test_E03_06_check_once_inside_working_does_not_call(enabled):
    ecs = _FakeEcs()
    with _idle().working():
        _idle().check_once(ecs, NOW)
    assert ecs.calls == []


def test_E03_07_working_released_after_exception(enabled):
    with pytest.raises(RuntimeError):
        with _idle().working():
            raise RuntimeError("감지 실패")
    assert _idle().busy() is False


def test_E03_08_minutes_zero_does_nothing(enabled, monkeypatch):
    monkeypatch.setattr(enabled, "IDLE_SCALE_IN_MINUTES", 0)
    ecs = _FakeEcs()
    _idle().check_once(ecs, NOW)
    assert ecs.calls == []


def test_E03_09_empty_resource_does_nothing(enabled, monkeypatch):
    monkeypatch.setattr(enabled, "IDLE_SCALE_IN_RESOURCE_ID", "")
    ecs = _FakeEcs()
    _idle().check_once(ecs, NOW)
    assert ecs.calls == []


def test_E03_10_does_not_fall_back_to_schedule_resource_id(enabled, monkeypatch):
    # dev 는 SCHEDULE_RESOURCE_ID 가 prod 서비스다 — 이걸 대상으로 쓰면 dev 가 놀 때 prod 를 끈다
    monkeypatch.setattr(enabled, "IDLE_SCALE_IN_RESOURCE_ID", "")
    monkeypatch.setattr(enabled, "SCHEDULE_RESOURCE_ID", RESOURCE)
    ecs = _FakeEcs()
    _idle().check_once(ecs, NOW)
    assert ecs.calls == []


# ── 유휴 시계 (미들웨어·기동) ────────────────────────────────

def test_E03_11_health_does_not_touch(client, monkeypatch):
    monkeypatch.setattr(_idle(), "last_activity", NOW)
    client.get("/health")
    assert _idle().last_activity == NOW


def test_E03_12_operating_windows_does_not_touch(client, monkeypatch):
    monkeypatch.setattr(importlib.import_module("app.services.operating_schedule"), "fetch_scheduled_actions", lambda: [])
    monkeypatch.setattr(_idle(), "last_activity", NOW)
    client.get("/api/operating-windows")
    assert _idle().last_activity == NOW


def test_E03_13_sse_stream_is_not_activity():
    # 스트림은 응답이 끝나지 않아 TestClient 로 부르지 않는다 — 판정 함수로 본다
    assert _idle().counts_as_activity("/api/notifications/stream") is False


def test_E03_14_authed_api_request_touches(authed_client, monkeypatch):
    monkeypatch.setattr(_idle(), "last_activity", NOW - 31 * MIN)
    before = time.time()
    authed_client.get("/api/jobs?job_type=SOURCE")
    assert _idle().last_activity >= before


def test_E03_15_startup_sets_clock_to_start_time(monkeypatch):
    from fastapi.testclient import TestClient

    from app.main import app

    monkeypatch.setattr(_idle(), "last_activity", 0.0)
    before = time.time()
    with TestClient(app):  # with 블록이어야 lifespan 이 돈다
        assert _idle().last_activity >= before


@pytest.mark.parametrize(
    "module, func",
    [
        ("app.routers.upload", "_trigger_boundary_detection"),
        ("app.routers.browse", "_run_refresh_detection"),
        ("app.routers.extract", "_process_extraction"),
        ("app.routers.extract", "_process_extraction_v2"),
    ],
)
def test_E03_16_background_work_is_wrapped_in_working(module, func):
    src = inspect.getsource(getattr(importlib.import_module(module), func))
    assert "idle_scale_in.working()" in src


# ── 운영 구간 식별 규칙 (Q8·Q11: 켜짐 = MaxCapacity ≥ 1) ────

ON = {
    "ScheduledActionName": "on",
    "Schedule": "cron(0 15 ? * MON-FRI *)",
    "Timezone": "Asia/Seoul",
    "ScalableTargetAction": {"MinCapacity": 1, "MaxCapacity": 1},
}
OPEN = {**ON, "ScalableTargetAction": {"MinCapacity": 0, "MaxCapacity": 1}}  # E03 의 on: 켜지 않고 열기만
OFF = {
    "ScheduledActionName": "off",
    "Schedule": "cron(0 23 ? * MON-FRI *)",
    "Timezone": "Asia/Seoul",
    "ScalableTargetAction": {"MinCapacity": 0, "MaxCapacity": 0},
}


def _sched():
    return importlib.import_module("app.services.operating_schedule")


def test_E03_17_open_only_on_action_yields_same_windows():
    wed_1000 = datetime(2026, 10, 7, 10, 0, tzinfo=KST)
    assert _sched().compute_windows([OPEN, OFF], wed_1000) == _sched().compute_windows([ON, OFF], wed_1000)


def test_E03_18_next_scheduled_finds_open_only_on_when_stopped():
    wed_1000 = datetime(2026, 10, 7, 10, 0, tzinfo=KST)
    assert _sched().next_scheduled([OPEN, OFF], wed_1000, running=False) == datetime(2026, 10, 7, 15, 0, tzinfo=KST)
