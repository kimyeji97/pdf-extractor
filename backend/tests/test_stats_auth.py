"""
REQ-B24 — 현황판 통계 API(`/api/stats`·`/api/stats/detail`) 인증·소유자 필터 검증 계약

검증 계약: docs/plans/PLAN-B24-stats-auth-missing.md `## 검증 계약`
케이스: B24-01 ~ B24-09

`user`는 본인 소유만, `admin`은 전체(REQ-27 Phase 2 목록 API와 같은 규칙).
owner_id 없는 옛 레코드는 admin만 본다(계약 #32의 None 처리와 같은 결).
"""
import json

from app.models.schemas import BoundariesStatus


# ── 헬퍼 (test_auth_authorization.py와 같은 모양) ─────────────


def _approve(user_id):
    """REQ-C12 — 새 가입자는 승인 대기(pending)라 로그인 전에 승인한다(이 테스트의 의도는 승인과 무관)."""
    from app.services import storage

    user = storage.get_user(user_id)
    user["status"] = "active"
    storage.save_user(user_id, user)


def _signup_and_login(client, email, password="correct-horse-battery-staple"):
    signup = client.post("/api/auth/signup", json={"email": email, "password": password}).json()
    _approve(signup["user_id"])
    login = client.post("/api/auth/login", json={"email": email, "password": password}).json()
    return {"user_id": signup["user_id"], "access_token": login["access_token"]}


def _make_admin(client, isolated_storage, email, password="correct-horse-battery-staple"):
    signup = client.post("/api/auth/signup", json={"email": email, "password": password}).json()
    _approve(signup["user_id"])
    user_path = isolated_storage / "users" / f"{signup['user_id']}.json"
    user = json.loads(user_path.read_text(encoding="utf-8"))
    user["role"] = "admin"
    user_path.write_text(json.dumps(user), encoding="utf-8")
    login = client.post("/api/auth/login", json={"email": email, "password": password}).json()
    return {"user_id": signup["user_id"], "access_token": login["access_token"]}


def _headers(who):
    return {"Authorization": f"Bearer {who['access_token']}"}


def _job(make_job, job_id, owner_id, **fields):
    from app.services import storage

    job = make_job(job_id)
    job.owner_id = owner_id
    job.filename = f"{job_id}.pdf"
    for k, v in fields.items():
        setattr(job, k, v)
    storage.put_status(job)
    return job


def _workbook(workbook_id, owner_id):
    from app.services import storage

    data = {"workbook_id": workbook_id, "created_at": "2026-10-02T00:00:00+00:00"}
    if owner_id is not None:
        data["owner_id"] = owner_id
    storage.save_workbook(workbook_id, data)


def _detail_ids(res):
    return {item["job_id"] for item in res.json()["items"]}


# ── B24-01·02 : 비로그인 401 ──────────────────────────────

def test_B24_01_stats는_비로그인이면_401(client):
    """근거: PLAN § 작업 단계 — "비로그인 401" """
    assert client.get("/api/stats").status_code == 401


def test_B24_02_stats_detail은_비로그인이면_401(client):
    """근거: PLAN § 작업 단계 — "비로그인 401" """
    res = client.get("/api/stats/detail", params={"field": "processing_count"})
    assert res.status_code == 401


# ── B24-03~07 : user는 본인 것만 ───────────────────────────

def test_B24_03_user의_stats는_본인_job만_합산(client, make_job):
    """근거: PLAN § 작업 단계 — "`user`는 본인 job만 합산·나열" """
    a = _signup_and_login(client, "b24-a3@example.com")
    b = _signup_and_login(client, "b24-b3@example.com")
    _job(make_job, "job-a", a["user_id"], total_question_count=10)
    _job(make_job, "job-b", b["user_id"], total_question_count=7)

    body = client.get("/api/stats", headers=_headers(a)).json()

    assert (body["source_count"], body["question_count"]) == (1, 10)


def test_B24_04_user의_workbook_count는_본인_문제집만(client):
    """근거: PLAN § 작업 단계 — "`user`는 본인 job만 합산·나열" """
    a = _signup_and_login(client, "b24-a4@example.com")
    b = _signup_and_login(client, "b24-b4@example.com")
    _workbook("wb-a1", a["user_id"])
    _workbook("wb-a2", a["user_id"])
    _workbook("wb-b1", b["user_id"])

    body = client.get("/api/stats", headers=_headers(a)).json()

    assert body["workbook_count"] == 2


def test_B24_05_user의_오탐_상세에_남의_job이_없다(client, make_job):
    """근거: PLAN § 작업 단계 — "남의 job_id·파일명이 응답에 없음" """
    a = _signup_and_login(client, "b24-a5@example.com")
    b = _signup_and_login(client, "b24-b5@example.com")
    _job(make_job, "job-a", a["user_id"], false_positive_count=1)
    _job(make_job, "job-b", b["user_id"], false_positive_count=1)

    res = client.get(
        "/api/stats/detail", params={"field": "false_positive_count"}, headers=_headers(a)
    )

    assert _detail_ids(res) == {"job-a"}


def test_B24_06_user의_처리중_상세에_남의_job이_없다(client, make_job):
    """근거: PLAN § 작업 단계 — "남의 job_id·파일명이 응답에 없음" """
    a = _signup_and_login(client, "b24-a6@example.com")
    b = _signup_and_login(client, "b24-b6@example.com")
    _job(make_job, "job-a", a["user_id"], boundaries_status=BoundariesStatus.PROCESSING)
    _job(make_job, "job-b", b["user_id"], boundaries_status=BoundariesStatus.PROCESSING)

    res = client.get(
        "/api/stats/detail", params={"field": "processing_count"}, headers=_headers(a)
    )

    assert _detail_ids(res) == {"job-a"}


def test_B24_07_owner_없는_옛_job과_문제집은_user_합산에서_빠진다(client, make_job):
    """근거: PLAN § 미결 질문 — "`owner_id`가 없는 옛 문제집은 admin에게만 보인다" """
    a = _signup_and_login(client, "b24-a7@example.com")
    _job(make_job, "job-a", a["user_id"], total_question_count=3)
    _job(make_job, "job-legacy", None, total_question_count=50)
    _workbook("wb-a", a["user_id"])
    _workbook("wb-legacy", None)

    body = client.get("/api/stats", headers=_headers(a)).json()

    assert (body["source_count"], body["question_count"], body["workbook_count"]) == (1, 3, 1)


# ── B24-08·09 : admin은 전체 ──────────────────────────────

def test_B24_08_admin의_stats는_전체를_합산(client, make_job, isolated_storage):
    """근거: PLAN § 작업 단계 — "`admin`은 지금과 같은 전체 결과" """
    admin = _make_admin(client, isolated_storage, "b24-admin8@example.com")
    a = _signup_and_login(client, "b24-a8@example.com")
    b = _signup_and_login(client, "b24-b8@example.com")
    _job(make_job, "job-a", a["user_id"], total_question_count=10)
    _job(make_job, "job-b", b["user_id"], total_question_count=7)
    _job(make_job, "job-legacy", None, total_question_count=5)
    _workbook("wb-a", a["user_id"])
    _workbook("wb-legacy", None)

    body = client.get("/api/stats", headers=_headers(admin)).json()

    assert (body["source_count"], body["question_count"], body["workbook_count"]) == (3, 22, 2)


def test_B24_09_admin의_상세는_모든_사용자_job을_나열(client, make_job, isolated_storage):
    """근거: PLAN § 작업 단계 — "`admin`은 지금과 같은 전체 결과" """
    admin = _make_admin(client, isolated_storage, "b24-admin9@example.com")
    a = _signup_and_login(client, "b24-a9@example.com")
    b = _signup_and_login(client, "b24-b9@example.com")
    _job(make_job, "job-a", a["user_id"], false_positive_count=1)
    _job(make_job, "job-b", b["user_id"], false_positive_count=1)

    res = client.get(
        "/api/stats/detail", params={"field": "false_positive_count"}, headers=_headers(admin)
    )

    assert _detail_ids(res) == {"job-a", "job-b"}
