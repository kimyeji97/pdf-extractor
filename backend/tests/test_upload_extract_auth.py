"""
REQ-B14 — 업로드/추출 생성 경로 무인증 + owner_id 미기입 검증 계약

검증 계약: docs/plans/PLAN-B14-upload-extract-auth-owner-id.md `## 검증 계약`
케이스: B14-01 ~ B14-11, B14-13 ~ B14-16 (B14-12는 프론트 —
frontend/src/api/client.uploadAuth.test.js)

B14-13~16은 `/testgen B14` 진행 중 사용자와 함께 정리한 두 미결 — `POST /api/extract`(v1)의
`req.job_id`와 `GET /api/status/{job_id}` 모두 `GET /api/jobs/{id}`와 같은 수준
(로그인 + 소유권 검사)으로 보호하기로 했다(계획서 § 결정 참조).

오늘 기준(구현 전) 아래 케이스는 전부 레드가 정상이다 — `upload.py`·`extract.py`에
`auth_service` 의존성 자체가 없다.

401 케이스(B14-01~06)는 각 엔드포인트가 요구하는 최소 유효 파라미터를 함께 보낸다 —
그래야 관측된 401이 진짜 인증 실패이지 다른 422로 새는 게 아님을 보장한다. `Depends()`는
함수 본문보다 먼저 해석되므로, 인증이 걸리면 본문의 다른 가드(가령 로컬/R2 모드 분기)보다
항상 먼저 401을 던진다 — 그래서 이 여섯 케이스는 `STORAGE_BACKEND` 상태와 무관하게
안정적으로 관측 가능하다.

B14-09(notify 소유권)만 예외다. `/api/upload/notify`는 로컬 모드에서 인증 통과 후에도
본문 첫 줄에서 "R2 모드에서만 사용 가능합니다" 404를 던진다(기존 동작, 이 REQ 범위 밖) —
테스트 환경이 conftest 격리로 강제 local이라, 이 가드를 넘기지 않으면 소유권 검사가 던지는
404와 겹쳐서 **가짜로 통과하는 테스트**가 된다(소유권 검사가 없어도 이 가드가 항상 먼저
404를 던지므로). `settings.STORAGE_BACKEND`만 "s3"로 monkeypatch해 가드를 넘긴다 —
`app.services.storage`는 임포트 시점에 이미 local 백엔드로 고정돼 있으므로(conftest 격리)
실제 파일 I/O는 그대로 로컬 tmp 디렉터리로 간다.

job/사용자 픽스처는 `test_auth_authorization.py`(REQ-27 Phase 2)의 `_signup_and_login`·
`_headers`·`_make_job`을 그대로 가져다 쓴다 — `test_notification_connected.py`가
`test_notification_stream`에서 헬퍼를 가져다 쓰는 것과 같은 선례.
"""
from app.core.config import settings

from tests.test_auth_authorization import _headers, _make_job, _signup_and_login


# ── B14-01~06 : 인증 없이 호출 시 401 ────────────────────────

def test_B14_01_인증없이_upload_요청시_401(client):
    """근거: PLAN § Phase 1 완료 기준 — "로그인 없이 업로드/추출/파일 다운로드/상태 조회 호출 시 401" """
    res = client.post("/api/upload", json={})

    assert res.status_code == 401


def test_B14_02_인증없이_upload_direct_호출시_401(client):
    """근거: PLAN § Phase 1 완료 기준 — 상동"""
    res = client.post(
        "/api/upload/direct?key=uploads/b14-direct/original.pdf",
        files={"file": ("sample.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )

    assert res.status_code == 401


def test_B14_03_인증없이_upload_notify_호출시_401(client):
    """근거: PLAN § Phase 1 완료 기준 — 상동"""
    res = client.post("/api/upload/notify?job_id=whatever")

    assert res.status_code == 401


def test_B14_04_인증없이_extract_요청시_401(client):
    """근거: PLAN § Phase 1 완료 기준 — 상동"""
    res = client.post("/api/extract", json={"job_id": "whatever", "question_numbers": "1"})

    assert res.status_code == 401


def test_B14_05_인증없이_extract_v2_요청시_401(client):
    """근거: PLAN § Phase 1 완료 기준 — 상동"""
    res = client.post(
        "/api/extract-v2",
        json={"selections": [{"job_id": "whatever", "page_num": 0}]},
    )

    assert res.status_code == 401


def test_B14_06_인증없이_파일다운로드_요청시_401(client):
    """근거: PLAN § Phase 1 완료 기준 — 상동"""
    res = client.get("/api/files/uploads/whatever/original.pdf")

    assert res.status_code == 401


# ── B14-07~08 : 로그인한 사용자가 올린 job은 본인이 조회 가능 ───

def test_B14_07_로그인한_사용자가_올린_job에_owner_id가_채워진다(client):
    """근거: PLAN § Phase 1 완료 기준 — "로그인한 일반 사용자가 올린 job에 `owner_id`가 채워진다" """
    from app.services import storage

    user = _signup_and_login(client, "b14-owner@example.com")

    res = client.post("/api/upload", json={}, headers=_headers(user["access_token"]))
    job_id = res.json()["job_id"]

    job = storage.get_status(job_id)
    assert job.owner_id == user["user_id"]


def test_B14_08_본인이_올린_job을_GET_jobs에서_200으로_조회한다(client):
    """근거: PLAN § Phase 1 완료 기준 — "본인 job은 `GET /api/jobs/{id}`·`GET /api/status/{id}`에서 200을 받는다" """
    user = _signup_and_login(client, "b14-view@example.com")
    upload_res = client.post("/api/upload", json={}, headers=_headers(user["access_token"]))
    job_id = upload_res.json()["job_id"]

    res = client.get(f"/api/jobs/{job_id}", headers=_headers(user["access_token"]))

    assert res.status_code == 200


# ── B14-09 : 타인 소유 pending job에 notify 시도 시 404 ────────

def test_B14_09_타인_소유_pending_job에_notify하면_404(client, isolated_storage, monkeypatch):
    """근거: PLAN § Phase 1 완료 기준 — "타인 소유 pending job에 `/upload/notify`를 걸면 404"

    로컬 모드에서 이 엔드포인트는 원래도 "R2 모드에서만" 404를 던진다 — 소유권 검사를
    실제로 관측하려면 그 가드를 넘겨야 한다(모듈 docstring 참조).
    """
    monkeypatch.setattr(settings, "STORAGE_BACKEND", "s3")
    owner = _signup_and_login(client, "b14-notify-owner@example.com")
    intruder = _signup_and_login(client, "b14-notify-intruder@example.com")
    _make_job(isolated_storage, "b14-notify-job", owner_id=owner["user_id"])

    res = client.post(
        "/api/upload/notify?job_id=b14-notify-job",
        headers=_headers(intruder["access_token"]),
    )

    assert res.status_code == 404


# ── B14-10~11 : extract-v2 멀티소스 소유권 ─────────────────────

def test_B14_10_extract_v2_selections에_타인소유_job이_섞이면_전체_404(
    client, isolated_storage
):
    """근거: PLAN § Phase 1 완료 기준 — "`extract-v2` selections 중 하나라도 타인 소유 job_id가 섞이면 요청 전체 404" """
    user = _signup_and_login(client, "b14-mixed-a@example.com")
    other = _signup_and_login(client, "b14-mixed-b@example.com")
    _make_job(isolated_storage, "b14-mixed-mine", owner_id=user["user_id"])
    _make_job(isolated_storage, "b14-mixed-theirs", owner_id=other["user_id"])

    res = client.post(
        "/api/extract-v2",
        json={
            "selections": [
                {"job_id": "b14-mixed-mine", "page_num": 0, "question_num": 1},
                {"job_id": "b14-mixed-theirs", "page_num": 0, "question_num": 1},
            ]
        },
        headers=_headers(user["access_token"]),
    )

    assert res.status_code == 404


def test_B14_11_extract_v2_selections가_전부_본인소유면_차단되지_않는다(
    client, isolated_storage, monkeypatch, inline_extract_pool
):
    """근거: PLAN § 결정 — "`selections`의 job_id 중 하나라도 본인 소유가 아니면 요청 전체를 404로 거부" (역)"""
    from app.routers import extract as extract_router

    monkeypatch.setattr(extract_router.pdf_service, "extract_questions_v2", lambda *a, **kw: 1)
    user = _signup_and_login(client, "b14-allmine@example.com")
    _make_job(isolated_storage, "b14-allmine-job", owner_id=user["user_id"])

    res = client.post(
        "/api/extract-v2",
        json={"selections": [{"job_id": "b14-allmine-job", "page_num": 0, "question_num": 1}]},
        headers=_headers(user["access_token"]),
    )

    assert res.status_code == 200


# ── B14-13 : status 조회도 인증 없이 401 ─────────────────────

def test_B14_13_인증없이_status_조회시_401(client):
    """근거: PLAN § Phase 1 완료 기준 — "로그인 없이 업로드/추출/파일 다운로드/상태 조회 호출 시 401" """
    res = client.get("/api/status/whatever")

    assert res.status_code == 401


# ── B14-14 : v1 extract도 소유권 검사를 받는다 ────────────────

def test_B14_14_타인_소유_job으로_extract_호출하면_404(client, isolated_storage):
    """근거: PLAN § Phase 1 완료 기준 — "타인 소유 job으로 `POST /api/extract`를 호출하면 404" """
    owner = _signup_and_login(client, "b14-extract-owner@example.com")
    intruder = _signup_and_login(client, "b14-extract-intruder@example.com")
    _make_job(isolated_storage, "b14-extract-job", owner_id=owner["user_id"])

    res = client.post(
        "/api/extract",
        json={"job_id": "b14-extract-job", "question_numbers": "1"},
        headers=_headers(intruder["access_token"]),
    )

    assert res.status_code == 404


# ── B14-15~16 : status도 GET /api/jobs/{id}와 같은 수준으로 보호된다 ──

def test_B14_15_타인_소유_job의_status_조회시_404(client, isolated_storage):
    """근거: PLAN § Phase 1 완료 기준 — "타인 소유 job으로 `GET /api/status/{id}`를 호출하면 404" """
    owner = _signup_and_login(client, "b14-status-owner@example.com")
    intruder = _signup_and_login(client, "b14-status-intruder@example.com")
    _make_job(isolated_storage, "b14-status-job", owner_id=owner["user_id"])

    res = client.get(
        "/api/status/b14-status-job", headers=_headers(intruder["access_token"])
    )

    assert res.status_code == 404


def test_B14_16_본인_소유_job의_status_조회시_200(client, isolated_storage):
    """근거: PLAN § Phase 1 완료 기준 — "본인 job은 `GET /api/jobs/{id}`·`GET /api/status/{id}`에서 200을 받는다" """
    user = _signup_and_login(client, "b14-status-self@example.com")
    _make_job(isolated_storage, "b14-status-self-job", owner_id=user["user_id"])

    res = client.get(
        "/api/status/b14-status-self-job", headers=_headers(user["access_token"])
    )

    assert res.status_code == 200
