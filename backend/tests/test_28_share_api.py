"""
REQ-28 Phase 2 — 공유 관리 API 검증 계약

검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약`
케이스: 28-18 ~ 28-25

API 모양은 계획서가 "추가·조회·변경·해제, 소유자 전용"까지만 정했다. 경로·바디는 이 파일이 고정한다:
    POST   /api/jobs/{id}/shares            {email, role}  → 201 {user_id, email, role}
    GET    /api/jobs/{id}/shares                           → 200 {shares: [{user_id, email, role}]}
    PATCH  /api/jobs/{id}/shares/{user_id}  {role}         → 200
    DELETE /api/jobs/{id}/shares/{user_id}                 → 204
"""
from tests.test_auth_authorization import _headers, _make_job, _signup_and_login
from tests.test_28_sharing_access import _MANUAL_BODY, _share


def _stage(client, isolated_storage, tag):
    a = _signup_and_login(client, f"28-{tag}-owner@example.com")
    b = _signup_and_login(client, f"28-{tag}-target@example.com")
    job_id = f"28-{tag}-job"
    _make_job(isolated_storage, job_id, owner_id=a["user_id"])
    return a, b, job_id


def _post_share(client, job_id, token, email, role="editor"):
    return client.post(
        f"/api/jobs/{job_id}/shares", json={"email": email, "role": role}, headers=_headers(token)
    )


def test_28_18_이메일로_공유하면_상대가_조회한다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "상대는 이메일로 지정한다" """
    a, b, job_id = _stage(client, isolated_storage, "18")

    _post_share(client, job_id, a["access_token"], "28-18-target@example.com")

    assert client.get(f"/api/jobs/{job_id}", headers=_headers(b["access_token"])).status_code == 200


def test_28_19_없는_이메일이면_404(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "없는 이메일이면 그렇다고 알린다" """
    a, _, job_id = _stage(client, isolated_storage, "19")

    res = _post_share(client, job_id, a["access_token"], "nobody@example.com")

    assert res.status_code == 404


def test_28_20_편집자가_공유를_추가하면_403(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "공유 관리 API (추가·조회·변경·해제, 소유자 전용)" """
    _, b, job_id = _stage(client, isolated_storage, "20")
    _signup_and_login(client, "28-20-third@example.com")
    _share(isolated_storage, job_id, b["user_id"], "editor")

    res = _post_share(client, job_id, b["access_token"], "28-20-third@example.com")

    assert res.status_code == 403


def test_28_21_공유_목록에_이메일과_역할이_있다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — 상동"""
    a, b, job_id = _stage(client, isolated_storage, "21")
    _share(isolated_storage, job_id, b["user_id"], "viewer")

    res = client.get(f"/api/jobs/{job_id}/shares", headers=_headers(a["access_token"]))

    assert res.json()["shares"] == [
        {"user_id": b["user_id"], "email": "28-21-target@example.com", "role": "viewer"}
    ]


def test_28_22_편집자를_뷰어로_바꾸면_쓰기가_403(client, isolated_storage):
    """근거: PLAN § 작업 단계 — 상동"""
    a, b, job_id = _stage(client, isolated_storage, "22")
    _share(isolated_storage, job_id, b["user_id"], "editor")

    client.patch(
        f"/api/jobs/{job_id}/shares/{b['user_id']}", json={"role": "viewer"}, headers=_headers(a["access_token"])
    )

    res = client.post(
        f"/api/jobs/{job_id}/pages/0/questions/manual", json=_MANUAL_BODY, headers=_headers(b["access_token"])
    )
    assert res.status_code == 403


def test_28_23_해제하면_상대_단건_조회가_404(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "해제 즉시 상대 목록·단건 조회에서 사라진다" """
    a, b, job_id = _stage(client, isolated_storage, "23")
    _share(isolated_storage, job_id, b["user_id"], "editor")

    client.delete(f"/api/jobs/{job_id}/shares/{b['user_id']}", headers=_headers(a["access_token"]))

    assert client.get(f"/api/jobs/{job_id}", headers=_headers(b["access_token"])).status_code == 404


def test_28_24_해제하면_상대_목록에서_빠진다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — 상동"""
    a, b, job_id = _stage(client, isolated_storage, "24")
    _share(isolated_storage, job_id, b["user_id"], "editor")

    client.delete(f"/api/jobs/{job_id}/shares/{b['user_id']}", headers=_headers(a["access_token"]))

    ids = [j["job_id"] for j in client.get("/api/jobs", headers=_headers(b["access_token"])).json()["items"]]
    assert job_id not in ids


def test_28_25_역할에_owner를_보내면_422(client, isolated_storage):
    """근거: PLAN § 범위 — 공유로 주는 역할은 편집자·뷰어뿐(§ 결정 "공유할 때 역할을 고른다")"""
    a, _, job_id = _stage(client, isolated_storage, "25")

    res = _post_share(client, job_id, a["access_token"], "28-25-target@example.com", role="owner")

    assert res.status_code == 422
