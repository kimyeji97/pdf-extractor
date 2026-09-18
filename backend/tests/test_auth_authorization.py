"""
REQ-27 Phase 2 — 기존 API 보호 + 소유권(owner_id) 도입 + 기존 데이터 이관 검증 계약

검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약`
케이스: 27-12 ~ 27-41

계획서가 정하지 않은 것들을 **이 파일이 검증 계약으로 고정한다**:
    타인 소유물 접근 시 상태 코드 → 404 (계획서가 "403/404"를 병기 — 존재 자체를 숨기는
    쪽으로 고정한다)
    마이그레이션 진입점 → app.services.migration_service.backfill_owner_id(admin_user_id) -> dict
        (계획서는 "스크립트 실행"이라고만 명시, 콜러블 시그니처는 미지정 — CLI는 이를
        감싸는 얇은 래퍼로 구현될 것을 전제한다)

인증 헤더: `Authorization: Bearer <access_token>`.

엔티티별 설정 방식(오늘 기준 Phase 2 미구현이므로 아래 케이스는 전부 레드가 정상이다):
  footnote/watermark/cover/template — 인증 토큰으로 실제 POST API를 호출해 생성한다.
    이 API들은 오늘 인증을 요구하지 않으므로, 헤더가 무시되고 owner_id가 안 붙는
    현재 동작이 그대로 "레드"로 드러난다.
  job — 업로드 파이프라인 전체를 돌리는 대신 status 파일에 owner_id를 직접 심는다
    (REQ-27 Phase 1의 test_27_03이 users/{id}.json을 직접 읽은 것과 같은 기법 — job은
    아직 owner_id 필드가 스키마에 없어 JobStatusFile 생성자를 거치면 막히므로 raw JSON을
    직접 쓴다).
  workbook — POST /api/workbooks(최소 바디: layout·selections·result_job_id·question_count)를
    인증 호출로 사용한다. result_job_id는 존재 검증이 없는 단순 참조 문자열이라 임의 값으로 충분하다.
  admin 계정 — 일반 가입 후 users/{user_id}.json의 role을 직접 "admin"으로 패치한다
    (role 승격 API가 이번 범위 밖이므로).
"""
import json
from datetime import datetime, timezone

import pytest


# ── 인증 헬퍼 ─────────────────────────────────────────────

def _signup_and_login(client, email, password="correct-horse-battery-staple"):
    signup = client.post("/api/auth/signup", json={"email": email, "password": password}).json()
    login = client.post("/api/auth/login", json={"email": email, "password": password}).json()
    return {"user_id": signup["user_id"], "access_token": login["access_token"]}


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _make_admin(client, isolated_storage, email, password="correct-horse-battery-staple"):
    signup = client.post("/api/auth/signup", json={"email": email, "password": password}).json()
    user_id = signup["user_id"]
    user_path = isolated_storage / "users" / f"{user_id}.json"
    user = json.loads(user_path.read_text(encoding="utf-8"))
    user["role"] = "admin"
    user_path.write_text(json.dumps(user), encoding="utf-8")
    login = client.post("/api/auth/login", json={"email": email, "password": password}).json()
    return {"user_id": user_id, "access_token": login["access_token"]}


# ── 엔티티별 생성/설정 헬퍼 ────────────────────────────────

def _png_bytes() -> bytes:
    """최소한의 유효 PNG 바이트 (PIL 의존 없이 fitz로 만든다) — 표지·워터마크 업로드용."""
    import fitz

    doc = fitz.open()
    page = doc.new_page(width=50, height=50)
    pix = page.get_pixmap()
    data = pix.tobytes("png")
    doc.close()
    return data


def _create_footnote(client, token, name="각주"):
    res = client.post(
        "/api/footnotes", json={"name": name, "text": "내용"}, headers=_headers(token)
    )
    return res.json()


def _create_watermark(client, token, name="워터마크"):
    res = client.post(
        "/api/watermarks",
        files={"file": ("wm.png", _png_bytes(), "image/png")},
        data={"name": name},
        headers=_headers(token),
    )
    return res.json()


def _create_cover(client, token, name="표지"):
    res = client.post(
        "/api/covers",
        files={"file": ("cover.png", _png_bytes(), "image/png")},
        data={"name": name},
        headers=_headers(token),
    )
    return res.json()


def _create_template(client, token, name="템플릿"):
    footnote = _create_footnote(client, token, name=f"{name}-각주")
    res = client.post(
        "/api/templates",
        json={"name": name, "footnote_id": footnote["footnote_id"]},
        headers=_headers(token),
    )
    return res.json()


def _create_workbook(client, token, job_id, name="문제집"):
    res = client.post(
        "/api/workbooks",
        json={
            "layout": "2col",
            "selections": [{"job_id": job_id, "page_num": 1}],
            "result_job_id": job_id,
            "question_count": 1,
            "name": name,
        },
        headers=_headers(token),
    )
    return res.json()


def _make_job(isolated_storage, job_id, owner_id=None):
    body = {
        "job_id": job_id,
        "status": "DONE",
        "filename": "sample.pdf",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "job_type": "SOURCE",
    }
    if owner_id is not None:
        body["owner_id"] = owner_id
    path = isolated_storage / "status" / f"{job_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(body), encoding="utf-8")


# ── 27-12~17 : 인증 없이 호출 시 401 ─────────────────────────

def test_27_12_인증없이_job_목록_조회시_401(client):
    """근거: PLAN § Phase 2 완료 기준 — "인증 없이 기존 job/workbook/cover/footnote/watermark/template API 호출 시 401" """
    res = client.get("/api/jobs")

    assert res.status_code == 401


def test_27_13_인증없이_workbook_목록_조회시_401(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    res = client.get("/api/workbooks")

    assert res.status_code == 401


def test_27_14_인증없이_cover_목록_조회시_401(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    res = client.get("/api/covers")

    assert res.status_code == 401


def test_27_15_인증없이_footnote_목록_조회시_401(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    res = client.get("/api/footnotes")

    assert res.status_code == 401


def test_27_16_인증없이_watermark_목록_조회시_401(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    res = client.get("/api/watermarks")

    assert res.status_code == 401


def test_27_17_인증없이_template_목록_조회시_401(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    res = client.get("/api/templates")

    assert res.status_code == 401


# ── 27-18~23 : user는 본인 소유 데이터만 목록에 노출된다 ────────

def test_27_18_job_목록은_본인_소유만_보인다(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — "`user` 역할은 본인 소유 데이터만 조회"""
    user_a = _signup_and_login(client, "job-a@example.com")
    user_b = _signup_and_login(client, "job-b@example.com")
    _make_job(isolated_storage, "job-a-1", owner_id=user_a["user_id"])
    _make_job(isolated_storage, "job-b-1", owner_id=user_b["user_id"])

    res = client.get("/api/jobs", headers=_headers(user_a["access_token"]))

    ids = [j["job_id"] for j in res.json()["items"]]
    assert "job-a-1" in ids
    assert "job-b-1" not in ids


def test_27_19_workbook_목록은_본인_소유만_보인다(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "wb-a@example.com")
    user_b = _signup_and_login(client, "wb-b@example.com")
    wb_a = _create_workbook(client, user_a["access_token"], job_id="job-wb-a")
    wb_b = _create_workbook(client, user_b["access_token"], job_id="job-wb-b")

    res = client.get("/api/workbooks", headers=_headers(user_a["access_token"]))

    ids = [w["workbook_id"] for w in res.json()["items"]]
    assert wb_a["workbook_id"] in ids
    assert wb_b["workbook_id"] not in ids


def test_27_20_cover_목록은_본인_소유만_보인다(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "cover-a@example.com")
    user_b = _signup_and_login(client, "cover-b@example.com")
    cover_a = _create_cover(client, user_a["access_token"])
    cover_b = _create_cover(client, user_b["access_token"])

    res = client.get("/api/covers", headers=_headers(user_a["access_token"]))

    ids = [c["cover_id"] for c in res.json()["covers"]]
    assert cover_a["cover_id"] in ids
    assert cover_b["cover_id"] not in ids


def test_27_21_footnote_목록은_본인_소유만_보인다(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "fn-a@example.com")
    user_b = _signup_and_login(client, "fn-b@example.com")
    fn_a = _create_footnote(client, user_a["access_token"])
    fn_b = _create_footnote(client, user_b["access_token"])

    res = client.get("/api/footnotes", headers=_headers(user_a["access_token"]))

    ids = [f["footnote_id"] for f in res.json()["footnotes"]]
    assert fn_a["footnote_id"] in ids
    assert fn_b["footnote_id"] not in ids


def test_27_22_watermark_목록은_본인_소유만_보인다(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "wm-a@example.com")
    user_b = _signup_and_login(client, "wm-b@example.com")
    wm_a = _create_watermark(client, user_a["access_token"])
    wm_b = _create_watermark(client, user_b["access_token"])

    res = client.get("/api/watermarks", headers=_headers(user_a["access_token"]))

    ids = [w["watermark_id"] for w in res.json()["watermarks"]]
    assert wm_a["watermark_id"] in ids
    assert wm_b["watermark_id"] not in ids


def test_27_23_template_목록은_본인_소유만_보인다(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "tpl-a@example.com")
    user_b = _signup_and_login(client, "tpl-b@example.com")
    tpl_a = _create_template(client, user_a["access_token"])
    tpl_b = _create_template(client, user_b["access_token"])

    res = client.get("/api/templates", headers=_headers(user_a["access_token"]))

    ids = [t["template_id"] for t in res.json()["templates"]]
    assert tpl_a["template_id"] in ids
    assert tpl_b["template_id"] not in ids


# ── 27-24~29 : 타인 소유물 삭제 시도 시 404 ───────────────────

def test_27_24_타인_소유_job_삭제시도시_404(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — "타인 소유물 접근 시 403/404" + 제약·함정 — "모든 엔티티에 필수로 넣을 것" """
    user_a = _signup_and_login(client, "del-job-a@example.com")
    user_b = _signup_and_login(client, "del-job-b@example.com")
    _make_job(isolated_storage, "job-del-a", owner_id=user_a["user_id"])

    res = client.delete("/api/jobs/job-del-a", headers=_headers(user_b["access_token"]))

    assert res.status_code == 404


def test_27_25_타인_소유_workbook_삭제시도시_404(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "del-wb-a@example.com")
    user_b = _signup_and_login(client, "del-wb-b@example.com")
    wb = _create_workbook(client, user_a["access_token"], job_id="job-del-wb-a")

    res = client.delete(
        f"/api/workbooks/{wb['workbook_id']}", headers=_headers(user_b["access_token"])
    )

    assert res.status_code == 404


def test_27_26_타인_소유_cover_삭제시도시_404(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "del-cover-a@example.com")
    user_b = _signup_and_login(client, "del-cover-b@example.com")
    cover = _create_cover(client, user_a["access_token"])

    res = client.delete(
        f"/api/covers/{cover['cover_id']}", headers=_headers(user_b["access_token"])
    )

    assert res.status_code == 404


def test_27_27_타인_소유_footnote_삭제시도시_404(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "del-fn-a@example.com")
    user_b = _signup_and_login(client, "del-fn-b@example.com")
    footnote = _create_footnote(client, user_a["access_token"])

    res = client.delete(
        f"/api/footnotes/{footnote['footnote_id']}", headers=_headers(user_b["access_token"])
    )

    assert res.status_code == 404


def test_27_28_타인_소유_watermark_삭제시도시_404(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "del-wm-a@example.com")
    user_b = _signup_and_login(client, "del-wm-b@example.com")
    watermark = _create_watermark(client, user_a["access_token"])

    res = client.delete(
        f"/api/watermarks/{watermark['watermark_id']}", headers=_headers(user_b["access_token"])
    )

    assert res.status_code == 404


def test_27_29_타인_소유_template_삭제시도시_404(client):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "del-tpl-a@example.com")
    user_b = _signup_and_login(client, "del-tpl-b@example.com")
    template = _create_template(client, user_a["access_token"])

    res = client.delete(
        f"/api/templates/{template['template_id']}", headers=_headers(user_b["access_token"])
    )

    assert res.status_code == 404


# ── 27-30~35 : admin은 전체 계정 데이터를 조회할 수 있다 ────────

def test_27_30_admin은_전체_job을_조회한다(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — "`admin` 역할은 전체 조회 가능" """
    user_a = _signup_and_login(client, "adm-job-a@example.com")
    user_b = _signup_and_login(client, "adm-job-b@example.com")
    admin = _make_admin(client, isolated_storage, "adm-job-admin@example.com")
    _make_job(isolated_storage, "adm-job-a1", owner_id=user_a["user_id"])
    _make_job(isolated_storage, "adm-job-b1", owner_id=user_b["user_id"])

    res = client.get("/api/jobs", headers=_headers(admin["access_token"]))

    ids = [j["job_id"] for j in res.json()["items"]]
    assert "adm-job-a1" in ids
    assert "adm-job-b1" in ids


def test_27_31_admin은_전체_workbook을_조회한다(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "adm-wb-a@example.com")
    user_b = _signup_and_login(client, "adm-wb-b@example.com")
    admin = _make_admin(client, isolated_storage, "adm-wb-admin@example.com")
    wb_a = _create_workbook(client, user_a["access_token"], job_id="adm-job-wb-a")
    wb_b = _create_workbook(client, user_b["access_token"], job_id="adm-job-wb-b")

    res = client.get("/api/workbooks", headers=_headers(admin["access_token"]))

    ids = [w["workbook_id"] for w in res.json()["items"]]
    assert wb_a["workbook_id"] in ids
    assert wb_b["workbook_id"] in ids


def test_27_32_admin은_전체_cover를_조회한다(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "adm-cover-a@example.com")
    user_b = _signup_and_login(client, "adm-cover-b@example.com")
    admin = _make_admin(client, isolated_storage, "adm-cover-admin@example.com")
    cover_a = _create_cover(client, user_a["access_token"])
    cover_b = _create_cover(client, user_b["access_token"])

    res = client.get("/api/covers", headers=_headers(admin["access_token"]))

    ids = [c["cover_id"] for c in res.json()["covers"]]
    assert cover_a["cover_id"] in ids
    assert cover_b["cover_id"] in ids


def test_27_33_admin은_전체_footnote를_조회한다(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "adm-fn-a@example.com")
    user_b = _signup_and_login(client, "adm-fn-b@example.com")
    admin = _make_admin(client, isolated_storage, "adm-fn-admin@example.com")
    fn_a = _create_footnote(client, user_a["access_token"])
    fn_b = _create_footnote(client, user_b["access_token"])

    res = client.get("/api/footnotes", headers=_headers(admin["access_token"]))

    ids = [f["footnote_id"] for f in res.json()["footnotes"]]
    assert fn_a["footnote_id"] in ids
    assert fn_b["footnote_id"] in ids


def test_27_34_admin은_전체_watermark를_조회한다(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "adm-wm-a@example.com")
    user_b = _signup_and_login(client, "adm-wm-b@example.com")
    admin = _make_admin(client, isolated_storage, "adm-wm-admin@example.com")
    wm_a = _create_watermark(client, user_a["access_token"])
    wm_b = _create_watermark(client, user_b["access_token"])

    res = client.get("/api/watermarks", headers=_headers(admin["access_token"]))

    ids = [w["watermark_id"] for w in res.json()["watermarks"]]
    assert wm_a["watermark_id"] in ids
    assert wm_b["watermark_id"] in ids


def test_27_35_admin은_전체_template을_조회한다(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    user_a = _signup_and_login(client, "adm-tpl-a@example.com")
    user_b = _signup_and_login(client, "adm-tpl-b@example.com")
    admin = _make_admin(client, isolated_storage, "adm-tpl-admin@example.com")
    tpl_a = _create_template(client, user_a["access_token"])
    tpl_b = _create_template(client, user_b["access_token"])

    res = client.get("/api/templates", headers=_headers(admin["access_token"]))

    ids = [t["template_id"] for t in res.json()["templates"]]
    assert tpl_a["template_id"] in ids
    assert tpl_b["template_id"] in ids


# ── 27-36~41 : 마이그레이션 실행 후 owner_id가 채워진다 ─────────

def test_27_36_마이그레이션후_job_owner_id_채워짐(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — "마이그레이션 스크립트 실행 후 기존 데이터(6종 전부) 각 메타에 owner_id(관리자 계정)가 채워짐" """
    admin = _make_admin(client, isolated_storage, "mig-job-admin@example.com")
    _make_job(isolated_storage, "legacy-job", owner_id=None)

    from app.services import migration_service

    migration_service.backfill_owner_id(admin["user_id"])

    data = json.loads((isolated_storage / "status" / "legacy-job.json").read_text())
    assert data.get("owner_id") == admin["user_id"]


def test_27_37_마이그레이션후_workbook_owner_id_채워짐(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    admin = _make_admin(client, isolated_storage, "mig-wb-admin@example.com")
    from app.services import storage

    storage.save_workbook(
        "legacy-wb",
        {
            "workbook_id": "legacy-wb",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "layout": "2col",
            "selections": [],
            "result_job_id": "legacy-job-ref",
            "question_count": 0,
        },
    )

    from app.services import migration_service

    migration_service.backfill_owner_id(admin["user_id"])

    data = storage.get_workbook("legacy-wb")
    assert data.get("owner_id") == admin["user_id"]


def test_27_38_마이그레이션후_cover_owner_id_채워짐(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    admin = _make_admin(client, isolated_storage, "mig-cover-admin@example.com")
    from app.services import storage

    storage.save_cover(
        "legacy-cover",
        {
            "cover_id": "legacy-cover",
            "name": "레거시 표지",
            "ext": "png",
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        _png_bytes(),
        "png",
    )

    from app.services import migration_service

    migration_service.backfill_owner_id(admin["user_id"])

    data = storage.get_cover_meta("legacy-cover")
    assert data.get("owner_id") == admin["user_id"]


def test_27_39_마이그레이션후_footnote_owner_id_채워짐(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    admin = _make_admin(client, isolated_storage, "mig-fn-admin@example.com")
    from app.services import storage

    storage.save_footnote(
        "legacy-fn",
        {
            "footnote_id": "legacy-fn",
            "name": "레거시 각주",
            "text": "내용",
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    from app.services import migration_service

    migration_service.backfill_owner_id(admin["user_id"])

    data = storage.get_footnote_meta("legacy-fn")
    assert data.get("owner_id") == admin["user_id"]


def test_27_40_마이그레이션후_watermark_owner_id_채워짐(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    admin = _make_admin(client, isolated_storage, "mig-wm-admin@example.com")
    from app.services import storage

    storage.save_watermark(
        "legacy-wm",
        {
            "watermark_id": "legacy-wm",
            "name": "레거시 워터마크",
            "ext": "png",
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        _png_bytes(),
        "png",
    )

    from app.services import migration_service

    migration_service.backfill_owner_id(admin["user_id"])

    data = storage.get_watermark_meta("legacy-wm")
    assert data.get("owner_id") == admin["user_id"]


def test_27_41_마이그레이션후_template_owner_id_채워짐(client, isolated_storage):
    """근거: PLAN § Phase 2 완료 기준 — 상동"""
    admin = _make_admin(client, isolated_storage, "mig-tpl-admin@example.com")
    from app.services import storage

    storage.save_template(
        "legacy-tpl",
        {
            "template_id": "legacy-tpl",
            "name": "레거시 템플릿",
            "cover_id": None,
            "footnote_id": "legacy-fn-ref",
            "watermark_id": None,
            "needs_review": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    from app.services import migration_service

    migration_service.backfill_owner_id(admin["user_id"])

    data = storage.get_template_meta("legacy-tpl")
    assert data.get("owner_id") == admin["user_id"]
