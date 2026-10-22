"""
REQ-28 Phase 6 — 공동 소유자 검증 계약

검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약`
케이스: 28-44 ~ 28-50

무대: 업로더 a 의 job 을 b 에게 owner 로 공유(인덱스 직접 심기 — Phase 1 무대와 같은 이유).
"""
from tests.test_auth_authorization import _headers, _make_job, _signup_and_login
from tests.test_28_share_api import _post_share
from tests.test_28_sharing_access import _share


def _co_owned(client, isolated_storage, tag):
    """업로더 a 의 job 을 b 가 공동 소유 — (a, b, job_id)."""
    a = _signup_and_login(client, f"28-{tag}-uploader@example.com")
    b = _signup_and_login(client, f"28-{tag}-coowner@example.com")
    job_id = f"28-{tag}-job"
    _make_job(isolated_storage, job_id, owner_id=a["user_id"])
    _share(isolated_storage, job_id, b["user_id"], "owner")
    return a, b, job_id


def test_28_44_소유자로_공유하면_상대_my_role이_owner(client, isolated_storage):
    """근거: PLAN § 결정 — "공유할 때 역할로 소유자도 고를 수 있다" """
    a = _signup_and_login(client, "28-44-uploader@example.com")
    b = _signup_and_login(client, "28-44-target@example.com")
    _make_job(isolated_storage, "28-44-job", owner_id=a["user_id"])

    _post_share(client, "28-44-job", a["access_token"], "28-44-target@example.com", role="owner")

    assert client.get("/api/jobs/28-44-job", headers=_headers(b["access_token"])).json().get("my_role") == "owner"


def test_28_45_공동_소유자가_공유를_추가한다(client, isolated_storage):
    """근거: PLAN § 결정 — "공동 소유자는 소유자 전용 동작(재감지·삭제·공유 관리)을 다 한다" """
    _, b, job_id = _co_owned(client, isolated_storage, "45")
    _signup_and_login(client, "28-45-third@example.com")

    res = _post_share(client, job_id, b["access_token"], "28-45-third@example.com")

    assert res.status_code == 201


def test_28_46_공동_소유자가_job을_삭제한다(client, isolated_storage):
    """근거: PLAN § 결정 — 상동"""
    _, b, job_id = _co_owned(client, isolated_storage, "46")

    res = client.delete(f"/api/jobs/{job_id}", headers=_headers(b["access_token"]))

    assert res.status_code == 204


def test_28_47_공동_소유자가_업로더_역할을_바꿔도_업로더는_owner(client, isolated_storage):
    """근거: PLAN § 결정 — "공동 소유자는 업로더(`owner_id`)를 해제하거나 역할을 바꿀 수 없다" """
    a, b, job_id = _co_owned(client, isolated_storage, "47")

    client.patch(
        f"/api/jobs/{job_id}/shares/{a['user_id']}", json={"role": "viewer"}, headers=_headers(b["access_token"])
    )

    assert client.get(f"/api/jobs/{job_id}", headers=_headers(a["access_token"])).json().get("my_role") == "owner"


def test_28_48_공동_소유자가_업로더를_해제해도_업로더는_조회한다(client, isolated_storage):
    """근거: PLAN § 결정 — 상동"""
    a, b, job_id = _co_owned(client, isolated_storage, "48")

    client.delete(f"/api/jobs/{job_id}/shares/{a['user_id']}", headers=_headers(b["access_token"]))

    assert client.get(f"/api/jobs/{job_id}", headers=_headers(a["access_token"])).status_code == 200


def test_28_49_공유_목록에_업로더가_owner로_온다(client, isolated_storage):
    """근거: PLAN § 결정 — "공유 목록 응답에 업로더를 따로 실어" """
    a, b, job_id = _co_owned(client, isolated_storage, "49")

    res = client.get(f"/api/jobs/{job_id}/shares", headers=_headers(b["access_token"]))

    assert res.json().get("owner") == {
        "user_id": a["user_id"], "email": "28-49-uploader@example.com", "role": "owner"
    }


def test_28_50_공동_소유자가_업로더_이메일로_공유하면_400(client, isolated_storage):
    """근거: PLAN § 결정 — "업로더는 공유 인덱스에 없고 `owner_id`에 있다" """
    _, b, job_id = _co_owned(client, isolated_storage, "50")

    res = _post_share(client, job_id, b["access_token"], "28-50-uploader@example.com", role="viewer")

    assert res.status_code == 400


# ── Phase 7: 본인 권한 ─────────────────────────────────────

def test_28_53_공동_소유자가_자기_역할을_바꾸면_400(client, isolated_storage):
    """근거: PLAN § 결정 — "서버도 자기 자신을 대상으로 한 역할 변경·해제를 400으로 막는다" """
    _, b, job_id = _co_owned(client, isolated_storage, "53")

    res = client.patch(
        f"/api/jobs/{job_id}/shares/{b['user_id']}", json={"role": "viewer"}, headers=_headers(b["access_token"])
    )

    assert res.status_code == 400


def test_28_54_공동_소유자가_자기를_해제하면_400(client, isolated_storage):
    """근거: PLAN § 결정 — 상동"""
    _, b, job_id = _co_owned(client, isolated_storage, "54")

    res = client.delete(f"/api/jobs/{job_id}/shares/{b['user_id']}", headers=_headers(b["access_token"]))

    assert res.status_code == 400


def test_28_62_공동_소유자가_자기_이메일로_공유하면_400(client, isolated_storage):
    """근거: PLAN § 결정 — "서버도 자기 자신을 대상으로 한 역할 변경·해제를 400으로 막는다" (리뷰 회차 2 (b) — POST 로 덮어쓰는 길)"""
    _, b, job_id = _co_owned(client, isolated_storage, "62")

    res = _post_share(client, job_id, b["access_token"], "28-62-coowner@example.com", role="viewer")

    assert res.status_code == 400
