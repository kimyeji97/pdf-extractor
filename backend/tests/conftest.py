"""
공용 픽스처 — 이 레포의 첫 테스트 기반 (REQ-F09 Phase 1, 2026-08-06 도입)

⚠️ 이 파일의 **첫 번째 일은 스토리지 격리**다. 다른 무엇보다 먼저 온다.

    `app.services.storage` 는 **임포트 시점에** `settings.STORAGE_BACKEND` 를 보고
    local ↔ s3 모듈을 고른다. `local_storage_service._BASE` 역시 임포트 시점에
    `settings.LOCAL_STORAGE_DIR` 로 고정된다. 즉 **임포트 후에 설정을 바꿔도 늦다.**

    그래서 아래 os.environ 설정은 어떤 `app.*` 임포트보다 위에 있어야 한다.
    pytest 는 테스트 모듈보다 conftest 를 먼저 임포트하므로 이 위치가 유일하게 안전하다.

    2026-07-31 실측: `backend/.env` 가 `STORAGE_BACKEND=s3` 였고, 그대로 띄우면
    **dev 실데이터(R2)에 붙는다.** 2026-08-07 실측에서 `.env` 가 다시 존재하며
    `STORAGE_BACKEND=s3` 인 것을 확인했다 — 가정이 아니라 현재 상태다.
    환경변수는 .env 파일보다 우선하므로 여기서 강제해야만 막힌다.
"""
import os
import tempfile

# ── 격리 (app 임포트보다 먼저) ─────────────────────────────
_IMPORT_TIME_ROOT = tempfile.mkdtemp(prefix="pdf-extractor-tests-")
os.environ["STORAGE_BACKEND"] = "local"
os.environ["LOCAL_STORAGE_DIR"] = _IMPORT_TIME_ROOT

# R2 자격증명을 빈 값으로 덮는다 — 격리가 뚫렸을 때 조용히 실데이터에
# 붙는 대신 자격증명 부재로 시끄럽게 실패하도록 하는 2차 방어선이다.
#
# ⚠️ `os.environ.pop` 이 아니라 **빈 문자열 대입**이어야 한다.
#    pop 은 os.environ 에서만 지우는데, 값의 출처가 `.env` 파일이면 pydantic 이
#    거기서 다시 읽어 와 방어선이 통째로 무력해진다(2026-08-07 실측: pop 을 쓰던
#    시절 `.env` 의 `R2_BUCKET_NAME=dailystudy-dev` 가 그대로 살아 아래 격리
#    검증이 18건 전부 ERROR 로 떨어졌다). 환경변수는 `.env` 보다 우선하므로
#    빈 값으로 **덮어야** `.env` 가 있든 없든 같은 결과가 된다.
for _k in (
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_DOMAIN",
    "R2_ROOT_PREFIX",
):
    os.environ[_k] = ""

import json  # noqa: E402
from concurrent.futures import Future  # noqa: E402
from datetime import datetime, timedelta, timezone  # noqa: E402
from pathlib import Path  # noqa: E402

import pytest  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.models.schemas import (  # noqa: E402
    BoundariesStatus,
    JobStatus,
    JobStatusFile,
    JobType,
)
from app.services import local_storage_service  # noqa: E402


# ── 격리 검증 (뚫리면 테스트를 아예 못 돌게 한다) ──────────

@pytest.fixture(scope="session", autouse=True)
def _assert_storage_isolated():
    """
    격리가 실패한 채 테스트가 도는 것이 최악이다 — dev R2 에 알림 파일을 쓰고 지운다.
    실패를 조용한 오염이 아니라 **수집 단계의 굉음**으로 만든다.
    """
    assert settings.STORAGE_BACKEND == "local", (
        f"테스트가 s3 백엔드로 떴다 (STORAGE_BACKEND={settings.STORAGE_BACKEND}). "
        "conftest 의 os.environ 설정보다 먼저 app 이 임포트됐다는 뜻이다. 중단한다."
    )
    assert not settings.R2_BUCKET_NAME, (
        f"R2 버킷이 설정된 채로 테스트가 뜬다 (R2_BUCKET_NAME={settings.R2_BUCKET_NAME}). 중단한다."
    )
    yield


@pytest.fixture(autouse=True)
def isolated_storage(tmp_path, monkeypatch):
    """테스트마다 빈 스토리지 루트를 준다 (알림 개수 단언이 테스트 간에 새지 않도록)."""
    monkeypatch.setattr(local_storage_service, "_BASE", tmp_path)
    monkeypatch.setattr(settings, "LOCAL_STORAGE_DIR", str(tmp_path))
    return tmp_path


# ── 알림 파일 헬퍼 ────────────────────────────────────────
#
# 저장 레이아웃은 계획서가 고정했다:
#   notifications/{YYYY-MM}/{ISO}-{job_id}.json  ·  notifications/read_cursor.json

NOTIF_DIR = "notifications"
READ_CURSOR_FILE = "read_cursor.json"


@pytest.fixture
def notif_files(isolated_storage):
    """저장된 알림 파일 목록 (읽음 커서는 알림이 아니므로 제외)."""

    def _list():
        root = isolated_storage / NOTIF_DIR
        if not root.exists():
            return []
        return sorted(
            p for p in root.rglob("*.json") if p.name != READ_CURSOR_FILE
        )

    return _list


@pytest.fixture
def read_notif(isolated_storage):
    """알림 파일 하나를 dict 로 읽는다."""

    def _read(path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    return _read


@pytest.fixture
def write_notif(isolated_storage):
    """
    알림 파일을 직접 심는다 (조회 API 케이스용 — 쓰기 훅을 거치지 않는다).

    조회 케이스가 쓰기 훅에 의존하면 훅이 깨졌을 때 조회 케이스까지 같이 빨개져
    `/testrun` 의 원인 분류가 불가능해진다. 두 계층을 끊어 둔다.
    """

    def _write(job_id: str, created_at: datetime, severity: str = "success", **extra):
        stamp = created_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f%z")
        month = created_at.astimezone(timezone.utc).strftime("%Y-%m")
        path = isolated_storage / NOTIF_DIR / month / f"{stamp}-{job_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        body = {
            "job_id": job_id,
            "created_at": created_at.astimezone(timezone.utc).isoformat(),
            "severity": severity,
            **extra,
        }
        path.write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")
        return path

    return _write


# ── job 헬퍼 ──────────────────────────────────────────────

@pytest.fixture
def make_job():
    """감지·생성 훅이 읽을 status 파일을 만든다."""

    def _make(job_id: str = "job-test", job_type: JobType = JobType.SOURCE) -> JobStatusFile:
        from app.services import storage

        job = JobStatusFile(
            job_id=job_id,
            status=JobStatus.DONE,
            filename="sample.pdf",
            uploaded_at=datetime.now(timezone.utc),
            job_type=job_type,
            boundaries_status=BoundariesStatus.PENDING,
        )
        storage.put_status(job)
        return job

    return _make


@pytest.fixture
def fake_pdf(monkeypatch):
    """
    감지 경로가 PDF 를 실제로 읽지 않게 한다.

    이 Phase 가 검증하는 것은 **알림이 언제 쓰이는가**지 감지 정확도가 아니다.
    (감지 정확도에 성능/구조 트레이드오프를 넣지 않는다는 계약 #11 과도 무관하다 —
    여기서 가짜를 넣는 건 감지 로직이 아니라 그 바깥의 I/O 다.)
    """
    from app.services import storage

    monkeypatch.setattr(storage, "read_file", lambda key: b"%PDF-1.4 fake")
    return b"%PDF-1.4 fake"


@pytest.fixture
def stub_detection(monkeypatch):
    """
    `detect_question_boundaries` 를 지정한 결과/예외로 갈아끼운다.

    라우터들이 `from ... import detect_question_boundaries` 로 **이름을 자기 모듈에
    바인딩**하므로 원본 모듈이 아니라 **각 라우터 모듈의 이름**을 갈아야 한다.

    반환값은 진짜 `QuestionBoundary` 를 쓴다 — 조회 경로가 캐시를 `QuestionBoundary(**b)`
    로 역직렬화하므로 필드가 모자란 대역을 쓰면 알림과 무관한 이유로 빨개진다.
    """
    from app.routers import browse as browse_router
    from app.routers import upload as upload_router
    from app.utils.question_parser import QuestionBoundary

    def _stub(*, count: int = 2, raises: Exception | None = None):
        def _fn(pdf_path):
            if raises is not None:
                raise raises
            return [
                QuestionBoundary(
                    number=i + 1,
                    page_index=0,
                    y_top=float(100 * i),
                    y_bottom=float(100 * i + 90),
                    col=0,
                    col_x0=50.0,
                    col_x1=545.0,
                )
                for i in range(count)
            ]

        for mod in (upload_router, browse_router):
            monkeypatch.setattr(mod, "detect_question_boundaries", _fn)

        # 프리워밍·페이지 메타는 이 Phase 의 관심사가 아니다. 실패해도 무시되는
        # 경로지만, 가짜 PDF 로 예외를 던지면 로그가 시끄러워 원인 판독을 방해한다.
        for mod in (upload_router, browse_router):
            monkeypatch.setattr(
                mod.thumbnail_service, "get_page_info", lambda b: [{"width": 595, "height": 842}]
            )
            monkeypatch.setattr(
                mod.prewarm_service, "prewarm_all_thumbnails", lambda *a, **kw: None
            )

    return _stub


@pytest.fixture
def inline_extract_pool(monkeypatch):
    """
    `_extract_pool` 은 ProcessPoolExecutor 다 — 다른 프로세스에서 돌면
    monkeypatch 가 전달되지 않아 pdf_service 대역이 무시된다. 인라인 실행으로 바꾼다.
    """
    from app.routers import extract as extract_router

    class _InlinePool:
        def submit(self, fn, *args, **kwargs):
            fut: Future = Future()
            try:
                fut.set_result(fn(*args, **kwargs))
            except Exception as exc:  # noqa: BLE001
                fut.set_exception(exc)
            return fut

    monkeypatch.setattr(extract_router, "_extract_pool", _InlinePool())
    return extract_router


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)


@pytest.fixture
def days_ago():
    def _days_ago(n: float) -> datetime:
        return datetime.now(timezone.utc) - timedelta(days=n)

    return _days_ago
