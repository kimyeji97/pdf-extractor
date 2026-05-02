"""
로컬 파일시스템 기반 스토리지 서비스 (AWS S3 대체 — 개발/테스트 전용)

s3_service.py 와 동일한 인터페이스를 구현한다.
STORAGE_BACKEND=local 일 때 storage.py 팩토리가 이 모듈을 선택한다.

디렉토리 구조 (LOCAL_STORAGE_DIR 기준):
  local_storage/
  ├── uploads/{job_id}/original.pdf
  ├── results/{job_id}/result.pdf
  ├── status/{job_id}.json
  ├── boundaries/{job_id}.json
  ├── thumbnails/{job_id}/page_{n}.png
  ├── thumbnails/{job_id}/q_{page}_{num}.png
  ├── thumbnails/{job_id}/manual_{page}_{manual_id}.png   ← v3 신규
  ├── manual_questions/{job_id}.json                       ← v3 신규
  └── workbooks/{workbook_id}.json                         ← v3 신규
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


def clear_boundaries_cache(job_id: str) -> None:
    """
    저장된 문항 경계 캐시를 삭제한다.
    재감지 요청 시 호출하여 이전 감지 결과를 무효화한다.
    문항 썸네일 캐시도 함께 삭제 — 경계가 바뀌면 썸네일 좌표도 달라지기 때문.
    """
    # 경계 JSON 삭제
    boundary_path = _BASE / "boundaries" / f"{job_id}.json"
    if boundary_path.exists():
        boundary_path.unlink()

    # 이 job의 문항 썸네일 캐시 전체 삭제 (q_*.png 파일만, 페이지 썸네일은 유지)
    thumb_dir = _BASE / "thumbnails" / job_id
    if thumb_dir.exists():
        for f in thumb_dir.glob("q_*.png"):
            f.unlink()


def get_question_thumbnail_cache(job_id: str, page_num: int, question_num: int) -> Optional[bytes]:
    path = _BASE / "thumbnails" / job_id / f"q_{page_num}_{question_num}.png"
    return path.read_bytes() if path.exists() else None


def save_question_thumbnail_cache(job_id: str, page_num: int, question_num: int, data: bytes) -> None:
    path = _ensure(_BASE / "thumbnails" / job_id / f"q_{page_num}_{question_num}.png")
    path.write_bytes(data)


def delete_question_thumbnail_cache(job_id: str, page_num: int, question_num: int) -> None:
    """자동 감지 문항 삭제 시 썸네일 캐시도 함께 제거한다."""
    path = _BASE / "thumbnails" / job_id / f"q_{page_num}_{question_num}.png"
    if path.exists():
        path.unlink()


# ── 수동 문항 캐시 (v3 REQ-13) ──────────────────────────────

def get_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str) -> Optional[bytes]:
    """수동 추가 문항의 크롭 썸네일 PNG를 반환. 없으면 None."""
    path = _BASE / "thumbnails" / job_id / f"manual_{page_num}_{manual_id}.png"
    return path.read_bytes() if path.exists() else None


def save_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str, data: bytes) -> None:
    """수동 추가 문항의 크롭 썸네일 PNG를 캐시에 저장한다."""
    path = _ensure(_BASE / "thumbnails" / job_id / f"manual_{page_num}_{manual_id}.png")
    path.write_bytes(data)


def delete_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str) -> None:
    """수동 문항 삭제 시 썸네일 캐시도 함께 제거한다."""
    path = _BASE / "thumbnails" / job_id / f"manual_{page_num}_{manual_id}.png"
    if path.exists():
        path.unlink()


# ── 수동 문항 영속 저장 (v3 REQ-13) ────────────────────────

def get_manual_questions(job_id: str) -> list:
    """
    수동 추가 문항 목록을 반환한다.
    파일이 없으면 빈 리스트를 반환하여 호출부에서 None 체크 없이 사용 가능하다.
    """
    path = _BASE / "manual_questions" / f"{job_id}.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def save_manual_questions(job_id: str, data: list) -> None:
    """
    수동 추가 문항 목록을 저장한다.
    새로고침 후 복원을 위해 반드시 서버에 영속 저장해야 한다 (REQ-13 요구사항).
    """
    path = _ensure(_BASE / "manual_questions" / f"{job_id}.json")
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


# ── 문제집 메타데이터 (v3 REQ-21~22) ───────────────────────

def get_workbook(workbook_id: str) -> Optional[dict]:
    """문제집 메타데이터 단건 조회. 없으면 None."""
    path = _BASE / "workbooks" / f"{workbook_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_workbook(workbook_id: str, data: dict) -> None:
    """
    문제집 메타데이터를 저장한다.
    extract-v2 DONE 확인 후 프론트엔드가 POST /api/workbooks를 호출하여 저장.
    """
    path = _ensure(_BASE / "workbooks" / f"{workbook_id}.json")
    path.write_text(json.dumps(data, ensure_ascii=False, default=str), encoding="utf-8")


def list_workbooks() -> list:
    """
    저장된 문제집 메타데이터 전체를 created_at 내림차순으로 반환.
    이력 화면(REQ-21)에서 사용한다.
    """
    workbook_dir = _BASE / "workbooks"
    if not workbook_dir.exists():
        return []

    workbooks = []
    for path in workbook_dir.glob("*.json"):
        try:
            workbooks.append(json.loads(path.read_text(encoding="utf-8")))
        except Exception:
            continue

    # created_at 내림차순 정렬 — 최신 문제집이 목록 상단에 오도록
    workbooks.sort(key=lambda w: w.get("created_at", ""), reverse=True)
    return workbooks


# ── 표지 이미지 (covers) ─────────────────────────────────

def list_covers() -> list:
    """저장된 표지 메타데이터 전체를 created_at 내림차순으로 반환."""
    covers_dir = _BASE / "covers"
    if not covers_dir.exists():
        return []
    covers = []
    for path in covers_dir.glob("*.json"):
        try:
            covers.append(json.loads(path.read_text(encoding="utf-8")))
        except Exception:
            continue
    covers.sort(key=lambda c: c.get("created_at", ""), reverse=True)
    return covers


def get_cover_meta(cover_id: str) -> Optional[dict]:
    path = _BASE / "covers" / f"{cover_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_cover(cover_id: str, meta: dict, image_bytes: bytes, ext: str = "jpg") -> None:
    """표지 이미지 + 메타데이터를 저장한다."""
    _ensure(_BASE / "covers" / f"{cover_id}.{ext}").write_bytes(image_bytes)
    _ensure(_BASE / "covers" / f"{cover_id}.json").write_text(
        json.dumps(meta, ensure_ascii=False, default=str), encoding="utf-8"
    )


def get_cover_image(cover_id: str) -> Optional[tuple[bytes, str]]:
    """(이미지 bytes, content_type) 반환. 없으면 None."""
    for ext, ct in [("jpg", "image/jpeg"), ("jpeg", "image/jpeg"), ("png", "image/png")]:
        path = _BASE / "covers" / f"{cover_id}.{ext}"
        if path.exists():
            return path.read_bytes(), ct
    return None


def delete_cover(cover_id: str) -> None:
    covers_dir = _BASE / "covers"
    for path in covers_dir.glob(f"{cover_id}.*"):
        path.unlink(missing_ok=True)


def cover_image_key(cover_id: str, ext: str = "jpg") -> str:
    return f"covers/{cover_id}.{ext}"


def cover_meta_key(cover_id: str) -> str:
    return f"covers/{cover_id}.json"


# ── 키 헬퍼 (s3_service 와 동일) ─────────────────────────

def original_key(job_id: str) -> str:
    return f"uploads/{job_id}/original.pdf"


def result_key(job_id: str) -> str:
    return f"results/{job_id}/result.pdf"
