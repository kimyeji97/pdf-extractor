"""
REQ-B27 Phase 1 — 알림 사용자별 분리 · 알림별 읽음 검증 계약

검증 계약: docs/plans/PLAN-B27-notification-per-user.md `## 검증 계약`
케이스: B27-01 ~ B27-15

알림 3종(피드·스트림·읽음)에 인증이 없고 전 사용자 알림을 줬다. 읽음도 서버 전체 커서 하나였다.

이 계약이 고정하는 표면:
    POST /api/notifications/read   본문 {"ids": ["<created_at>", ...]} → 그 알림만 읽음 / 본문 없음 → 내 알림 전부
    GET  /api/notifications        항목마다 "read": bool
    event_stream(last_event_id, heartbeat_s, user=<current_user dict>)

소유자는 알림 본문이 아니라 **job 상태의 owner_id** 로 판정한다(계획서 결정 — F09-09 "평상시 GET 0회" 유지).
알림 파일은 `write_notif` 로 직접 심는다(쓰기 훅과 분리 — F09 관례).
"""
import asyncio
import json

import pytest

from tests.test_auth_authorization import _headers, _make_admin, _make_job, _signup_and_login


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _feed(client, who):
    return client.get("/api/notifications", headers=_headers(who["access_token"])).json()


def _ids(feed):
    return [n["job_id"] for n in feed["notifications"]]


@pytest.fixture
def two_users(client, isolated_storage):
    """A·B 일반 사용자 + 각자 job 하나."""
    a = _signup_and_login(client, "b27-a@example.com")
    b = _signup_and_login(client, "b27-b@example.com")
    _make_job(isolated_storage, "job-a", owner_id=a["user_id"])
    _make_job(isolated_storage, "job-b", owner_id=b["user_id"])
    return a, b


# ── B27-01~03 : 비로그인 401 ──────────────────────────────

def test_B27_01_피드는_비로그인이면_401(client):
    """근거: PLAN § 작업 단계 — "비로그인 401" """
    assert client.get("/api/notifications").status_code == 401


def test_B27_02_스트림은_비로그인이면_401(client):
    """근거: PLAN § 작업 단계 — "비로그인 401" """
    with client.stream("GET", "/api/notifications/stream") as res:
        assert res.status_code == 401


def test_B27_03_읽음은_비로그인이면_401(client):
    """근거: PLAN § 작업 단계 — "비로그인 401" """
    assert client.post("/api/notifications/read").status_code == 401


# ── B27-04~07 : 피드 소유자 필터 · read 플래그 ────────────

def test_B27_04_user_피드는_내_job_알림만(client, two_users, write_notif, days_ago):
    """근거: PLAN § 작업 단계 — "user는 본인 알림만(피드·스트림)" """
    a, _ = two_users
    write_notif("job-a", days_ago(2))
    write_notif("job-b", days_ago(1))

    assert _ids(_feed(client, a)) == ["job-a"]


def test_B27_05_admin_피드는_모든_사용자_알림(client, two_users, write_notif, days_ago, isolated_storage):
    """근거: PLAN § 범위 — "`admin`은 전체" """
    admin = _make_admin(client, isolated_storage, "b27-admin@example.com")
    write_notif("job-a", days_ago(2))
    write_notif("job-b", days_ago(1))

    assert sorted(_ids(_feed(client, admin))) == ["job-a", "job-b"]


def test_B27_06_소유자_없는_job과_없는_job의_알림은_user에게_안_보인다(
    client, two_users, write_notif, days_ago, isolated_storage
):
    """근거: PLAN § 결정 — "소유자 없거나 job이 없으면 admin만" """
    a, _ = two_users
    _make_job(isolated_storage, "job-legacy")          # owner_id 없음
    write_notif("job-a", days_ago(3))
    write_notif("job-legacy", days_ago(2))
    write_notif("job-deleted", days_ago(1))            # status 파일 없음

    assert _ids(_feed(client, a)) == ["job-a"]


def test_B27_07_피드_항목마다_read가_있고_처음엔_false(client, two_users, write_notif, days_ago):
    """근거: PLAN § 범위 — "확인·미확인 알림 디자인 구분" """
    a, _ = two_users
    write_notif("job-a", days_ago(2))
    write_notif("job-a", days_ago(1))

    assert [n.get("read") for n in _feed(client, a)["notifications"]] == [False, False]


# ── B27-08~10 : 알림별 읽음 · 격리 ────────────────────────

def test_B27_08_단건_읽음은_그_항목만_읽고_미읽음이_1_준다(client, two_users, write_notif, days_ago):
    """근거: PLAN § 결정 — "**클릭한 알림만**" """
    a, _ = two_users
    write_notif("job-a", days_ago(2))
    write_notif("job-a", days_ago(1))
    newest, older = _feed(client, a)["notifications"]

    client.post("/api/notifications/read", json={"ids": [older["created_at"]]}, headers=_headers(a["access_token"]))

    after = _feed(client, a)
    assert ([n["read"] for n in after["notifications"]], after["unread_count"]) == ([False, True], 1)


def test_B27_09_A가_읽어도_B의_미읽음은_그대로(client, two_users, write_notif, days_ago):
    """근거: PLAN § 작업 단계 — "다른 사용자의 읽음이 내 뱃지에 영향 없음" """
    a, b = two_users
    write_notif("job-a", days_ago(2))
    write_notif("job-b", days_ago(1))

    client.post("/api/notifications/read", headers=_headers(a["access_token"]))

    assert _feed(client, b)["unread_count"] == 1


def test_B27_10_전체_읽음은_내_알림만_전부_읽는다(client, two_users, write_notif, days_ago):
    """근거: PLAN § 결정 — "'모두 읽음' 버튼" """
    a, b = two_users
    write_notif("job-a", days_ago(3))
    write_notif("job-a", days_ago(2))
    write_notif("job-b", days_ago(1))

    client.post("/api/notifications/read", headers=_headers(a["access_token"]))

    assert (_feed(client, a)["unread_count"], _feed(client, b)["unread_count"]) == (0, 1)


# ── B27-11~14 : SSE 스트림 필터 ───────────────────────────

def _parse(chunk: str) -> dict:
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


async def _open(user, heartbeat_s=0.3):
    """구독이 잡힌(= `: connected` 를 받은) 스트림 생성기."""
    from app.routers.notification import event_stream

    gen = event_stream(last_event_id=None, heartbeat_s=heartbeat_s, user=user)
    first = _parse(await gen.__anext__())
    assert first.get("comment") == "connected"
    return gen


async def _next(gen, timeout=2.0) -> dict:
    return _parse(await asyncio.wait_for(gen.__anext__(), timeout))


def _as_user(who):
    return {"user_id": who["user_id"], "role": "user"}


@pytest.mark.anyio
async def test_B27_11_남의_job_알림_이벤트는_내_스트림에_오지_않는다(two_users):
    """근거: PLAN § 작업 단계 — "user는 본인 알림만(피드·스트림)" """
    from app.services import notification_broker as broker

    a, _ = two_users
    gen = await _open(_as_user(a))
    broker.publish({"event": "notification", "id": "2026-10-02T00:00:00+00:00", "data": {"job_id": "job-b"}})
    broker.publish({"event": "notification", "id": "2026-10-02T00:00:01+00:00", "data": {"job_id": "job-a"}})

    got = await _next(gen)

    assert (got.get("event"), got["data"]["job_id"]) == ("notification", "job-a")


@pytest.mark.anyio
async def test_B27_12_남의_job_status_이벤트도_오지_않는다(two_users):
    """근거: PLAN § 작업 단계 — "user는 본인 알림만(피드·스트림)" """
    from app.services import notification_broker as broker

    a, _ = two_users
    gen = await _open(_as_user(a))
    broker.publish({"event": "status", "data": {"job_id": "job-b", "boundaries_status": "PROCESSING"}})
    broker.publish({"event": "status", "data": {"job_id": "job-a", "boundaries_status": "PROCESSING"}})

    got = await _next(gen)

    assert (got.get("event"), got["data"]["job_id"]) == ("status", "job-a")


@pytest.mark.anyio
async def test_B27_13_남의_모두_읽음이_내_스트림에_read로_오지_않는다(client, two_users, write_notif, days_ago):
    """근거: PLAN § 작업 단계 — "다른 사용자의 읽음이 내 뱃지에 영향 없음"

    `read` 이벤트(unread_count 0)가 전원에게 가면 프론트 뱃지가 남의 '모두 읽음'에 0이 된다.
    """
    a, b = two_users
    write_notif("job-a", days_ago(1))
    write_notif("job-b", days_ago(1))
    gen = await _open(_as_user(a), heartbeat_s=0.3)

    await asyncio.to_thread(client.post, "/api/notifications/read", headers=_headers(b["access_token"]))
    got = await _next(gen)

    assert got.get("comment") == "keepalive"


@pytest.mark.anyio
async def test_B27_14_알림_이벤트의_unread_count는_받는_사람_기준(two_users, write_notif, days_ago):
    """근거: PLAN § 작업 단계 — "unread_count = 본인 미확인 개수" """
    from app.models.schemas import NotificationKind
    from app.services import notification_service

    a, _ = two_users
    write_notif("job-a", days_ago(2))
    write_notif("job-b", days_ago(1))
    gen = await _open(_as_user(a))

    notification_service.emit(job_id="job-a", kind=NotificationKind.DETECTION)
    got = await _next(gen)

    assert (got["data"]["job_id"], got["data"]["unread_count"]) == ("job-a", 2)


# ── B27-15 : SSE 쿠키 인증 ────────────────────────────────

def test_B27_15_스트림은_헤더_없이_access_쿠키만으로_연결된다(isolated_storage, monkeypatch):
    """근거: PLAN § 결정 — "쿠키 허용 인증"

    `EventSource` 는 헤더를 못 붙인다(계약 #31). B15 처럼 쿠키 저장소만 가진 https 클라이언트로 연다.
    무한 스트림이라 생성기를 유한한 것으로 바꿔 상태 코드만 본다(P04-04 관례).
    """
    from fastapi.testclient import TestClient

    from app.main import app
    from app.routers import notification as router_mod

    async def _finite(*args, **kwargs):
        yield ": connected\n\n"

    monkeypatch.setattr(router_mod, "event_stream", _finite)
    c = TestClient(app, base_url="https://testserver")
    pw = "correct-horse-battery-staple"
    signup = c.post("/api/auth/signup", json={"email": "b27-cookie@example.com", "password": pw}).json()
    from app.services import storage  # REQ-C12 — 새 가입자는 승인 대기라 로그인 전에 승인한다

    user = storage.get_user(signup["user_id"])
    user["status"] = "active"
    storage.save_user(signup["user_id"], user)
    c.post("/api/auth/login", json={"email": "b27-cookie@example.com", "password": pw})

    with c.stream("GET", "/api/notifications/stream") as res:
        assert res.status_code == 200
