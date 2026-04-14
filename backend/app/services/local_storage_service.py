"""
로컬 파일시스템 기반 스토리지 서비스 (AWS S3 대체 — 개발/테스트 전용)

s3_service.py 와 동일한 인터페이스를 구현한다.
STORAGE_BACKEND=local 일 때 storage.py 팩토리가 이 모듈을 선택한다.

디렉토리 구조 (LOCAL_STORAGE_DIR 기준):
  local_storage/
  ├── uploads/{job_id}/original.pdf
  ├── results/{job_id}/result.pdf
  └── status/{job_id}.json
"""
import json
import shutil
from pathlib import Path

from app.core.config import settings
from app.models.schemas import JobStatusFile, JobStatus

_BASE = Path(settings.LOCAL_STORAGE_DIR)


def _ensure(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


# ── Presigned URL (로컬에선 업로드 API 경유) ───────────────

def generate_upload_presigned_url(key: str, expires: int = 300) -> str:
    """
    로컬에서는 presigned URL 대신 /api/upload/direct 엔드포인트 URL을 반환한다.
    클라이언트는 이 URL로 multipart/form-data POST를 보내면 된다.
    """
    base = settings.LOCAL_BASE_URL.rstrip("/")
    return f"{base}/api/upload/direct?key={key}"


def generate_download_presigned_url(key: str, expires: int = 3600) -> str:
    """로컬 파일 서빙 URL 반환"""
    base = settings.LOCAL_BASE_URL.rstrip("/")
    return f"{base}/api/files/{key}"


# ── 상태 파일 ─────────────────────────────────────────────

def put_status(job_status: JobStatusFile) -> None:
    path = _ensure(_BASE / "status" / f"{job_status.job_id}.json")
    path.write_text(job_status.model_dump_json(), encoding="utf-8")


def get_status(job_id: str) -> JobStatusFile | None:
    path = _BASE / "status" / f"{job_id}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return JobStatusFile(**data)


# ── 파일 업/다운로드 ──────────────────────────────────────

def download_file(key: str, local_path: str) -> None:
    src = _BASE / key
    shutil.copy2(src, local_path)


def upload_file(local_path: str, key: str) -> None:
    dst = _ensure(_BASE / key)
    shutil.copy2(local_path, dst)


def save_upload(file_bytes: bytes, key: str) -> None:
    """direct upload 엔드포인트에서 호출 — presigned PUT 대체"""
    dst = _ensure(_BASE / key)
    dst.write_bytes(file_bytes)


def read_file(key: str) -> bytes:
    """파일 서빙 엔드포인트에서 호출"""
    return (_BASE / key).read_bytes()


# ── 키 헬퍼 (s3_service 와 동일) ─────────────────────────

def original_key(job_id: str) -> str:
    return f"uploads/{job_id}/original.pdf"


def result_key(job_id: str) -> str:
    return f"results/{job_id}/result.pdf"
