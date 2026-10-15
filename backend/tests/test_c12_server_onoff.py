"""
REQ-C12 Phase 3 — 서버 수동 on/off (운영 콘솔이 부르는 로직)

검증 계약: docs/plans/PLAN-C12-ops-console-accounts-server.md `## 검증 계약` (C12-20 ~ C12-25)

콘솔 스크립트는 임포트 시점에 `sys.argv`를 읽어 테스트로 부를 수 없다 — 로직은 `operating_schedule`에 둔다.
켜고 끄기는 ECS `desiredCount`만 바꾼다(2026-10-15 dev 실측). 다음 예약이 돌면 그 범위로 맞춰지므로
수동 조작은 다음 예약까지만 유효하다 — 콘솔은 켜져 있으면 다음 꺼짐, 꺼져 있으면 다음 켜짐을 보여 준다.

실제 AWS 는 부르지 않는다(계약 #24 와 같은 이유). 모듈은 케이스 안에서 import 한다 —
아직 없을 때 수집 에러로 파일 전체가 죽지 않고 케이스마다 실패하게.
"""
import importlib
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))

# prod 예약 작업 (describe-scheduled-actions 의 ScheduledActions 항목 모양 — 2026-10-15 조회 값)
ON = {
    "ScheduledActionName": "on",
    "Schedule": "cron(0 15 ? * MON-FRI *)",
    "Timezone": "Asia/Seoul",
    "ScalableTargetAction": {"MinCapacity": 1, "MaxCapacity": 1},
}
OFF = {
    "ScheduledActionName": "off",
    "Schedule": "cron(0 23 ? * MON-FRI *)",
    "Timezone": "Asia/Seoul",
    "ScalableTargetAction": {"MinCapacity": 0, "MaxCapacity": 0},
}

CLUSTER = "pdf-extractor-cluster"
SERVICE = "pdf-extractor-backend-prod-svc"


def _svc():
    return importlib.import_module("app.services.operating_schedule")


class _FakeEcs:
    """`update_service`만 있다 — scalable target 등 다른 AWS 호출은 AttributeError 로 실패한다."""

    def __init__(self):
        self.calls = []

    def update_service(self, **kwargs):
        self.calls.append(kwargs)
        return {"service": {"desiredCount": kwargs.get("desiredCount")}}


# ── next_scheduled ───────────────────────────────────────────

def test_C12_20_running_weekday_morning_next_is_tonight_off():
    now = datetime(2026, 10, 7, 10, 0, tzinfo=KST)  # 수
    assert _svc().next_scheduled([ON, OFF], now, running=True) == datetime(2026, 10, 7, 23, 0, tzinfo=KST)


def test_C12_21_stopped_friday_evening_next_is_monday_on():
    now = datetime(2026, 10, 9, 18, 0, tzinfo=KST)  # 금, 운영 구간 안에서 수동으로 끔
    assert _svc().next_scheduled([ON, OFF], now, running=False) == datetime(2026, 10, 12, 15, 0, tzinfo=KST)


def test_C12_22_running_on_weekend_stays_until_monday_off():
    now = datetime(2026, 10, 10, 10, 0, tzinfo=KST)  # 토, 수동으로 켬
    assert _svc().next_scheduled([ON, OFF], now, running=True) == datetime(2026, 10, 12, 23, 0, tzinfo=KST)


def test_C12_23_no_schedule_returns_none():
    now = datetime(2026, 10, 7, 10, 0, tzinfo=KST)
    assert _svc().next_scheduled([], now, running=True) is None


# ── set_service_running ──────────────────────────────────────

def test_C12_24_turn_on_sets_desired_count_only():
    ecs = _FakeEcs()
    _svc().set_service_running(ecs, CLUSTER, SERVICE, on=True)
    assert ecs.calls == [{"cluster": CLUSTER, "service": SERVICE, "desiredCount": 1}]


def test_C12_25_turn_off_sets_desired_count_zero():
    ecs = _FakeEcs()
    _svc().set_service_running(ecs, CLUSTER, SERVICE, on=False)
    assert ecs.calls == [{"cluster": CLUSTER, "service": SERVICE, "desiredCount": 0}]
