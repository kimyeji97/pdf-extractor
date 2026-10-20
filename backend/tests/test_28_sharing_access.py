"""
REQ-28 Phase 1 — 공유받은 분석의 권한 판정 검증 계약

검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약`
케이스: 28-01 ~ 28-17

무대:
  - 공유는 인덱스 파일 `shares/index.json`(`{job_id: [{user_id, role}]}`)을 **직접 심는다** —
    Phase 2 공유 API가 깨졌을 때 이 파일까지 빨개지면 `/testrun` 의 원인 분류가 안 된다.
  - job·사용자 헬퍼는 `test_auth_authorization.py`(REQ-27 Phase 2)의 것을 가져다 쓴다(B14·B15와 같은 선례).
  - 403/404 는 계획서 § 결정 "권한 부족 응답" — 읽을 수 있으면 403, 못 읽으면 404.
"""
import json
from datetime import datetime, timezone

from tests.test_auth_authorization import _headers, _make_job, _signup_and_login
from tests.test_image_cookie_auth import _cookie_client, _signup_login


# ── 헬퍼 ──────────────────────────────────────────────────

def _share(isolated_storage, job_id, user_id, role):
    path = isolated_storage / "shares" / "index.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    data.setdefault(job_id, []).append({"user_id": user_id, "role": role})
    path.write_text(json.dumps(data), encoding="utf-8")


def _shared_job(client, isolated_storage, tag, role):
    """소유자 a 의 job 을 b 에게 role 로 공유한 무대 — (a, b, job_id)."""
    a = _signup_and_login(client, f"28-{tag}-owner@example.com")
    b = _signup_and_login(client, f"28-{tag}-{role}@example.com")
    job_id = f"28-{tag}-job"
    _make_job(isolated_storage, job_id, owner_id=a["user_id"])
    _share(isolated_storage, job_id, b["user_id"], role)
    return a, b, job_id


_MANUAL_BODY = {"title": "수동", "region": {"x0": 10, "y0": 10, "x1": 100, "y1": 100}}


# ── 읽기 ──────────────────────────────────────────────────

def test_28_01_뷰어로_공유받은_job_단건_조회_200(client, isolated_storage):
    """근거: PLAN § 범위 — "공유받은 분석이 목록에 보이고, 그 분석으로 문제집을 만들 수 있다" """
    _, b, job_id = _shared_job(client, isolated_storage, "01", "viewer")

    res = client.get(f"/api/jobs/{job_id}", headers=_headers(b["access_token"]))

    assert res.status_code == 200


def test_28_02_공유받은_job이_목록에_나온다(client, isolated_storage):
    """근거: PLAN § 범위 — 상동"""
    _, b, job_id = _shared_job(client, isolated_storage, "02", "viewer")

    res = client.get("/api/jobs", headers=_headers(b["access_token"]))

    assert job_id in [j["job_id"] for j in res.json()["items"]]


def test_28_03_my_role이_역할별로_온다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "단건 응답에 내 역할(`my_role`) 추가" """
    a, editor, job_id = _shared_job(client, isolated_storage, "03", "editor")
    viewer = _signup_and_login(client, "28-03-viewer2@example.com")
    _share(isolated_storage, job_id, viewer["user_id"], "viewer")

    roles = [
        client.get(f"/api/jobs/{job_id}", headers=_headers(u["access_token"])).json().get("my_role")
        for u in (a, editor, viewer)
    ]

    assert roles == ["owner", "editor", "viewer"]


def test_28_04_공유받지_않은_사용자는_404(client, isolated_storage):
    """근거: PLAN § 결정 — "읽을 수 없는 사람은 지금처럼 404" """
    _, _, job_id = _shared_job(client, isolated_storage, "04", "viewer")
    stranger = _signup_and_login(client, "28-04-stranger@example.com")

    res = client.get(f"/api/jobs/{job_id}", headers=_headers(stranger["access_token"]))

    assert res.status_code == 404


# ── 쓰기 ──────────────────────────────────────────────────

def test_28_05_뷰어가_수동_문항을_추가하면_403(client, isolated_storage):
    """근거: PLAN § 결정 — "읽을 수 있는 사람(뷰어·편집자)이 넘는 동작은 403" """
    _, b, job_id = _shared_job(client, isolated_storage, "05", "viewer")

    res = client.post(
        f"/api/jobs/{job_id}/pages/0/questions/manual", json=_MANUAL_BODY, headers=_headers(b["access_token"])
    )

    assert res.status_code == 403


def test_28_06_뷰어가_자동_문항_제목을_바꾸면_403(client, isolated_storage):
    """근거: PLAN § 결정 — 상동"""
    _, b, job_id = _shared_job(client, isolated_storage, "06", "viewer")

    res = client.patch(
        f"/api/jobs/{job_id}/pages/0/questions/1", json={"title": "새 제목"}, headers=_headers(b["access_token"])
    )

    assert res.status_code == 403


def test_28_07_편집자는_수동_문항을_추가한다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "쓰기 = 편집자 이상" """
    _, b, job_id = _shared_job(client, isolated_storage, "07", "editor")

    res = client.post(
        f"/api/jobs/{job_id}/pages/0/questions/manual", json=_MANUAL_BODY, headers=_headers(b["access_token"])
    )

    assert res.status_code == 201


def test_28_08_편집자는_job_메타를_수정한다(client, isolated_storage):
    """근거: PLAN § 작업 단계 — "쓰기 = 편집자 이상" """
    _, b, job_id = _shared_job(client, isolated_storage, "08", "editor")

    res = client.patch(f"/api/jobs/{job_id}", json={"workbook_name": "새 이름"}, headers=_headers(b["access_token"]))

    assert res.status_code == 200


def test_28_09_편집자가_재감지하면_403(client, isolated_storage):
    """근거: PLAN § 결정 — "재감지 · job 삭제 · 공유 관리" """
    _, b, job_id = _shared_job(client, isolated_storage, "09", "editor")

    res = client.post(f"/api/jobs/{job_id}/refresh", headers=_headers(b["access_token"]))

    assert res.status_code == 403


def test_28_10_편집자가_job을_삭제하면_403(client, isolated_storage):
    """근거: PLAN § 결정 — 상동"""
    _, b, job_id = _shared_job(client, isolated_storage, "10", "editor")

    res = client.delete(f"/api/jobs/{job_id}", headers=_headers(b["access_token"]))

    assert res.status_code == 403


def test_28_11_공유받지_않은_사용자의_쓰기는_404(client, isolated_storage):
    """근거: PLAN § 결정 — "읽을 수 없는 사람은 지금처럼 404" """
    _, _, job_id = _shared_job(client, isolated_storage, "11", "editor")
    stranger = _signup_and_login(client, "28-11-stranger@example.com")

    res = client.post(
        f"/api/jobs/{job_id}/pages/0/questions/manual", json=_MANUAL_BODY, headers=_headers(stranger["access_token"])
    )

    assert res.status_code == 404


def test_28_12_owner_id_없는_옛_job은_공유_항목이_있어도_404(client, isolated_storage):
    """근거: PLAN § 제약 — "`shares`가 있어도 이 규칙을 바꾸지 않는다" """
    b = _signup_and_login(client, "28-12-viewer@example.com")
    _make_job(isolated_storage, "28-12-legacy")  # owner_id 없음
    _share(isolated_storage, "28-12-legacy", b["user_id"], "editor")

    res = client.get("/api/jobs/28-12-legacy", headers=_headers(b["access_token"]))

    assert res.status_code == 404


def test_28_13_뷰어가_쿠키만으로_수동_문항_썸네일을_받는다(client, isolated_storage):
    """근거: PLAN § 제약 — "쿠키 인증 경로도 새 판정을 거치는지 따로 확인한다" """
    a = _signup_and_login(client, "28-13-owner@example.com")
    c = _cookie_client()
    _, viewer = _signup_login(c, "28-13-viewer@example.com")
    _make_job(isolated_storage, "28-13-job", owner_id=a["user_id"])
    _share(isolated_storage, "28-13-job", viewer["user_id"], "viewer")
    thumb = isolated_storage / "thumbnails" / "28-13-job" / "manual_0_m1.png"
    thumb.parent.mkdir(parents=True, exist_ok=True)
    thumb.write_bytes(b"\x89PNG fake")

    res = c.get("/api/jobs/28-13-job/pages/0/questions/manual/m1/thumbnail")

    assert res.status_code == 200


# ── 현황판 · 생성 ─────────────────────────────────────────

def _make_stat_job(isolated_storage, job_id, owner_id):
    body = {
        "job_id": job_id,
        "status": "DONE",
        "filename": f"{job_id}.pdf",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "job_type": "SOURCE",
        "boundaries_status": "DONE",
        "owner_id": owner_id,
        "manual_count": 1,
        "manual_pages": [0],
    }
    path = isolated_storage / "status" / f"{job_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(body), encoding="utf-8")


def test_28_14_공유받은_분석이_현황판_합계에_든다(client, isolated_storage):
    """근거: PLAN § 결정 — "`/api/stats`·`/api/stats/detail`이 목록과 같은 판정을 쓴다" """
    a = _signup_and_login(client, "28-14-owner@example.com")
    b = _signup_and_login(client, "28-14-viewer@example.com")
    _make_stat_job(isolated_storage, "28-14-job", a["user_id"])
    _share(isolated_storage, "28-14-job", b["user_id"], "viewer")

    res = client.get("/api/stats", headers=_headers(b["access_token"]))

    assert res.json()["source_count"] == 1


def test_28_15_공유받은_분석이_현황판_상세에_든다(client, isolated_storage):
    """근거: PLAN § 결정 — 상동"""
    a = _signup_and_login(client, "28-15-owner@example.com")
    b = _signup_and_login(client, "28-15-viewer@example.com")
    _make_stat_job(isolated_storage, "28-15-job", a["user_id"])
    _share(isolated_storage, "28-15-job", b["user_id"], "viewer")

    res = client.get("/api/stats/detail?field=manual_count", headers=_headers(b["access_token"]))

    assert [i["job_id"] for i in res.json()["items"]] == ["28-15-job"]


def test_28_16_뷰어로_공유받은_job으로_생성_요청이_막히지_않는다(
    client, isolated_storage, monkeypatch, inline_extract_pool
):
    """근거: PLAN § 범위 — "그 분석으로 문제집을 만들 수 있다" """
    from app.routers import extract as extract_router

    monkeypatch.setattr(extract_router.pdf_service, "extract_questions_v2", lambda *a, **kw: 1)
    _, b, job_id = _shared_job(client, isolated_storage, "16", "viewer")

    res = client.post(
        "/api/extract-v2",
        json={"selections": [{"job_id": job_id, "page_num": 0, "question_num": 1}]},
        headers=_headers(b["access_token"]),
    )

    assert res.status_code == 200


def test_28_17_job을_지우면_인덱스의_그_job_항목도_사라진다(client, isolated_storage):
    """근거: PLAN § 제약 — "job 삭제 때 인덱스의 그 job 항목도 지운다" """
    a, _, job_id = _shared_job(client, isolated_storage, "17", "editor")

    client.delete(f"/api/jobs/{job_id}", headers=_headers(a["access_token"]))

    index = json.loads((isolated_storage / "shares" / "index.json").read_text(encoding="utf-8"))
    assert job_id not in index
