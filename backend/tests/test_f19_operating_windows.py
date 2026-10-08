"""
REQ-F19 Phase 3 — 운영 구간 API (AWS 예약 작업 → 앞으로 2주 치 운영 구간)

검증 계약: docs/plans/PLAN-F19-server-down-notice.md `## 검증 계약` (F19-15 ~ F19-24)

prod 는 ECS Application Auto Scaling 예약 작업으로 켜지고 꺼진다(2026-10-07 실측 — 아래 픽스처가 그 값).
백엔드가 그걸 읽어 **절대 시각(ISO, 시간대 포함)** 구간으로 준다 — 프론트는 cron 을 해석하지 않는다.

실제 AWS 는 부르지 않는다(계획서 "백엔드 테스트" — 계약 #24 와 같은 이유). 계산은 순수 함수
`compute_windows` 로, API 는 `fetch_scheduled_actions` 를 monkeypatch 로 갈아 끼워 본다.
시각 비교는 문자열이 아니라 시점(instant)으로 한다 — 출력 오프셋 표기는 구현이 정한다.

모듈은 케이스 안에서 import 한다 — 아직 없을 때 수집 에러로 파일 전체가 죽지 않고 케이스마다 실패하게.
"""
import importlib
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))

# 2026-10-07 실측: on/off 예약 작업 (describe-scheduled-actions 의 ScheduledActions 항목 모양)
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

WED_1000 = datetime(2026, 10, 7, 10, 0, tzinfo=KST)  # 2026-10-07 은 수요일


def _svc():
    return importlib.import_module("app.services.operating_schedule")


def _first(windows):
    w = windows[0]
    return datetime.fromisoformat(w["start"]), datetime.fromisoformat(w["end"])


# ── compute_windows (순수 함수) ───────────────────────────────

def test_F19_15_weekday_morning_first_window_is_today():
    start, end = _first(_svc().compute_windows([ON, OFF], WED_1000))
    assert (start, end) == (datetime(2026, 10, 7, 15, 0, tzinfo=KST), datetime(2026, 10, 7, 23, 0, tzinfo=KST))


def test_F19_16_friday_night_skips_weekend_to_monday():
    now = datetime(2026, 10, 9, 23, 30, tzinfo=KST)  # 금
    start, _ = _first(_svc().compute_windows([ON, OFF], now))
    assert start == datetime(2026, 10, 12, 15, 0, tzinfo=KST)  # 월


def test_F19_17_after_todays_window_first_is_tomorrow():
    now = datetime(2026, 10, 7, 23, 30, tzinfo=KST)  # 수, 당일 구간 끝남
    start, _ = _first(_svc().compute_windows([ON, OFF], now))
    assert start == datetime(2026, 10, 8, 15, 0, tzinfo=KST)  # 목


def test_F19_18_in_progress_window_is_included():
    now = datetime(2026, 10, 7, 16, 0, tzinfo=KST)  # 수, 구간 진행 중
    start, end = _first(_svc().compute_windows([ON, OFF], now))
    assert (start, end) == (datetime(2026, 10, 7, 15, 0, tzinfo=KST), datetime(2026, 10, 7, 23, 0, tzinfo=KST))


def test_F19_19_two_weeks_from_wednesday_is_ten_windows():
    assert len(_svc().compute_windows([ON, OFF], WED_1000)) == 10


def test_F19_20_start_and_end_are_tz_aware_iso():
    windows = _svc().compute_windows([ON, OFF], WED_1000)
    assert all(
        datetime.fromisoformat(w[k]).tzinfo is not None for w in windows for k in ("start", "end")
    )


def test_F19_21_actions_identified_by_capacity_not_name():
    renamed = [{**ON, "ScheduledActionName": "wake"}, {**OFF, "ScheduledActionName": "sleep"}]
    assert _svc().compute_windows(renamed, WED_1000) == _svc().compute_windows([ON, OFF], WED_1000)


# ── GET /api/operating-windows ────────────────────────────────

def test_F19_22_fetch_error_returns_empty_list(client, monkeypatch):
    def boom():
        raise RuntimeError("AccessDeniedException")

    monkeypatch.setattr(_svc(), "fetch_scheduled_actions", boom)
    res = client.get("/api/operating-windows")
    assert (res.status_code, res.json()) == (200, [])


def test_F19_23_no_actions_returns_empty_list(client, monkeypatch):
    monkeypatch.setattr(_svc(), "fetch_scheduled_actions", lambda: [])
    res = client.get("/api/operating-windows")
    assert (res.status_code, res.json()) == (200, [])


def test_F19_24_no_auth_header_is_not_401(client, monkeypatch):
    monkeypatch.setattr(_svc(), "fetch_scheduled_actions", lambda: [ON, OFF])
    res = client.get("/api/operating-windows")
    assert res.status_code == 200


# ── at(...) 일회성 · rate(...) 주기 (2026-10-08 결정) ─────────────

def _at(when, is_on, tz="Asia/Seoul"):
    cap = {"MinCapacity": 1, "MaxCapacity": 1} if is_on else {"MinCapacity": 0, "MaxCapacity": 0}
    return {"ScheduledActionName": f"at-{when}", "Schedule": f"at({when})", "Timezone": tz, "ScalableTargetAction": cap}


def test_F19_39_at_off_cuts_todays_window():
    early_off = _at("2026-10-07T20:00:00", is_on=False)
    _, end = _first(_svc().compute_windows([ON, OFF, early_off], WED_1000))
    assert end == datetime(2026, 10, 7, 20, 0, tzinfo=KST)


def test_F19_40_at_on_off_adds_weekend_window():
    sat_on, sat_off = _at("2026-10-10T10:00:00", is_on=True), _at("2026-10-10T14:00:00", is_on=False)
    windows = _svc().compute_windows([ON, OFF, sat_on, sat_off], WED_1000)
    starts_ends = [(datetime.fromisoformat(w["start"]), datetime.fromisoformat(w["end"])) for w in windows]
    assert (datetime(2026, 10, 10, 10, 0, tzinfo=KST), datetime(2026, 10, 10, 14, 0, tzinfo=KST)) in starts_ends


def test_F19_41_at_uses_its_own_timezone():
    utc_off = _at("2026-10-07T13:00:00", is_on=False, tz="UTC")  # 13:00 UTC = 22:00 KST
    _, end = _first(_svc().compute_windows([ON, OFF, utc_off], WED_1000))
    assert end == datetime(2026, 10, 7, 22, 0, tzinfo=KST)


def test_F19_42_rate_in_on_off_returns_empty():
    rate_off = {**OFF, "Schedule": "rate(1 day)"}
    assert _svc().compute_windows([ON, rate_off], WED_1000) == []


def test_F19_43_rate_in_non_on_off_action_is_ignored():
    neither = {
        "ScheduledActionName": "scale",
        "Schedule": "rate(1 day)",
        "Timezone": "Asia/Seoul",
        "ScalableTargetAction": {"MinCapacity": 0, "MaxCapacity": 1},
    }
    assert _svc().compute_windows([ON, OFF, neither], WED_1000) == _svc().compute_windows([ON, OFF], WED_1000)
