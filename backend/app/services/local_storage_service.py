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
from typing import Optional, List

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


def get_status(job_id: str) -> Optional[JobStatusFile]:
    path = _BASE / "status" / f"{job_id}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return JobStatusFile(**data)


def list_jobs() -> List[JobStatusFile]:
    """status/ 디렉토리의 모든 상태 파일을 읽어 uploaded_at 내림차순으로 반환"""
    status_dir = _BASE / "status"
    if not status_dir.exists():
        return []

    jobs: List[JobStatusFile] = []
    for path in status_dir.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            jobs.append(JobStatusFile(**data))
        except Exception:
            continue

    jobs.sort(
        key=lambda j: j.uploaded_at.isoformat() if j.uploaded_at else "",
        reverse=True,
    )
    return jobs


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


# ── 썸네일 캐시 ───────────────────────────────────────────

def get_thumbnail_cache(job_id: str, page_num: int) -> Optional[bytes]:
    path = _BASE / "thumbnails" / job_id / f"page_{page_num}.png"
    return path.read_bytes() if path.exists() else None


def save_thumbnail_cache(job_id: str, page_num: int, data: bytes) -> None:
    path = _ensure(_BASE / "thumbnails" / job_id / f"page_{page_num}.png")
    path.write_bytes(data)


# ── 경계 캐시 ─────────────────────────────────────────────

def get_boundaries_cache(job_id: str) -> Optional[list]:
    """저장된 문항 경계 JSON을 읽어 dict 리스트로 반환. 없으면 None."""
    path = _BASE / "boundaries" / f"{job_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_boundaries_cache(job_id: str, data: list) -> None:
    """문항 경계 dict 리스트를 JSON으로 저장."""
    path = _ensure(_BASE / "boundaries" / f"{job_id}.json")
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def get_question_thumbnail_cache(job_id: str, page_num: int, question_num: int) -> Optional[bytes]:
    path = _BASE / "thumbnails" / job_id / f"q_{page_num}_{question_num}.png"
    return path.read_bytes() if path.exists() else None


def save_question_thumbnail_cache(job_id: str, page_num: int, question_num: int, data: bytes) -> None:
    path = _ensure(_BASE / "thumbnails" / job_id / f"q_{page_num}_{question_num}.png")
    path.write_bytes(data)


# ── 키 헬퍼 (s3_service 와 동일) ─────────────────────────

def original_key(job_id: str) -> str:
    return f"uploads/{job_id}/original.pdf"


def result_key(job_id: str) -> str:
    return f"results/{job_id}/result.pdf"
