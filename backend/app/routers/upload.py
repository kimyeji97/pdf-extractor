"""
POST /api/upload          - presigned URL 요청 (R2 모드 / 로컬 모드 공통)
POST /api/upload/notify   - R2 업로드 완료 알림 (R2 모드 전용)
POST /api/upload/direct   - 파일 직접 수신    (로컬 모드 전용)
GET  /api/files/{key:path} - 파일 서빙        (로컬 모드 전용)
"""
import dataclasses
import logging
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.models.schemas import BoundariesStatus, UploadResponse, JobStatusFile, JobStatus
from app.services import storage
from app.utils.question_parser import detect_question_boundaries

logger = logging.getLogger(__name__)
router = APIRouter()


class UploadRequest(BaseModel):
    filename: Optional[str] = None
    workbook_name: Optional[str] = None
    workbook_types: Optional[list[str]] = None


# ── presigned URL 요청 (모드 공통) ───────────────────────

@router.post("/upload", response_model=UploadResponse)
def request_upload(body: UploadRequest = UploadRequest()):
    """
    R2 모드: 클라이언트가 presigned URL로 직접 R2에 PUT
    로컬 모드: /api/upload/direct 엔드포인트 URL 반환 (multipart POST)
    """
    job_id = str(uuid.uuid4())
    key = storage.original_key(job_id)

    logger.info("[upload] 요청 | job_id=%s filename=%s key=%s", job_id, body.filename, key)

    try:
        upload_url = storage.generate_upload_presigned_url(key)
    except Exception as e:
        logger.error("[upload] presigned URL 생성 실패 | job_id=%s error=%s", job_id, e)
        raise HTTPException(status_code=500, detail=f"업로드 URL 생성 실패: {e}")

    storage.put_status(
        JobStatusFile(
            job_id=job_id,
            status=JobStatus.PENDING,
            filename=body.filename or "unknown.pdf",
            uploaded_at=datetime.now(timezone.utc),
            original_key=key,
            workbook_name=body.workbook_name,
            workbook_types=body.workbook_types,
        )
    )
    logger.info("[upload] status 저장 완료 | job_id=%s", job_id)
    return UploadResponse(job_id=job_id, upload_url=upload_url)


# ── R2 업로드 완료 알림 (R2 모드 전용) ───────────────────

@router.post("/upload/notify")
def notify_upload_complete(job_id: str, background_tasks: BackgroundTasks):
    """
    클라이언트가 R2 presigned URL로 파일 업로드를 완료한 뒤 호출한다.
    백그라운드로 문항 경계 감지를 시작하고 즉시 응답을 반환한다.
    """
    if settings.STORAGE_BACKEND == "local":
        raise HTTPException(status_code=404, detail="R2 모드에서만 사용 가능합니다.")

    status_file = storage.get_status(job_id)
    if status_file is None:
        raise HTTPException(status_code=404, detail="job_id를 찾을 수 없습니다.")

    logger.info("[upload] notify 수신 — 경계 감지 시작 | job_id=%s", job_id)
    background_tasks.add_task(_trigger_boundary_detection, job_id)
    return {"job_id": job_id, "message": "경계 감지 시작"}


# ── 직접 업로드 (로컬 모드 전용) ─────────────────────────

@router.post("/upload/direct")
async def direct_upload(key: str, file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    """
    로컬 개발용. generate_upload_presigned_url이 반환한 URL로
    프론트엔드가 multipart/form-data POST를 보낸다.
    """
    if settings.STORAGE_BACKEND != "local":
        raise HTTPException(status_code=404, detail="로컬 모드에서만 사용 가능합니다.")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기 초과 (최대 10MB)")

    storage.save_upload(content, key)

    # key 형태: "uploads/{job_id}/original.pdf"
    job_id = key.split("/")[1]
    background_tasks.add_task(_trigger_boundary_detection, job_id)

    return {"message": "업로드 완료", "key": key}


def _trigger_boundary_detection(job_id: str) -> None:
    """업로드 완료 직후 백그라운드 실행 — 문항 경계 감지 후 상태 업데이트"""
    logger.info("[boundary] 감지 시작 | job_id=%s", job_id)

    status_file = storage.get_status(job_id)
    if status_file is None:
        logger.warning("[boundary] status 없음 — 종료 | job_id=%s", job_id)
        return

    status_file.boundaries_status = BoundariesStatus.PROCESSING
    storage.put_status(status_file)

    try:
        original = storage.original_key(job_id)
        logger.info("[boundary] R2에서 PDF 다운로드 | job_id=%s key=%s", job_id, original)
        pdf_bytes = storage.read_file(original)
        logger.info("[boundary] PDF 다운로드 완료 | job_id=%s size=%d bytes", job_id, len(pdf_bytes))

        with tempfile.TemporaryDirectory() as tmpdir:
            pdf_path = str(Path(tmpdir) / "original.pdf")
            Path(pdf_path).write_bytes(pdf_bytes)
            boundaries = detect_question_boundaries(pdf_path)

        logger.info("[boundary] 감지 완료 | job_id=%s count=%d", job_id, len(boundaries))

        storage.save_boundaries_cache(
            job_id, [dataclasses.asdict(b) for b in boundaries]
        )

        questions_per_page: dict[str, int] = {}
        for b in boundaries:
            k = str(b.page_index)
            questions_per_page[k] = questions_per_page.get(k, 0) + 1

        status_file.boundaries_status = BoundariesStatus.DONE
        status_file.total_question_count = len(boundaries)
        status_file.questions_per_page = questions_per_page

    except Exception as e:
        logger.error("[boundary] 감지 실패 | job_id=%s error=%s", job_id, e, exc_info=True)
        status_file.boundaries_status = BoundariesStatus.FAILED
        status_file.error = str(e)

    finally:
        storage.put_status(status_file)
        logger.info("[boundary] status 저장 완료 | job_id=%s boundaries_status=%s", job_id, status_file.boundaries_status)


# ── 파일 서빙 (로컬 모드 전용) ────────────────────────────

@router.get("/files/{key:path}")
def serve_file(key: str):
    """
    로컬 개발용. generate_download_presigned_url이 반환한 URL로 접근하면
    result PDF를 그대로 돌려준다.
    """
    if settings.STORAGE_BACKEND != "local":
        raise HTTPException(status_code=404, detail="로컬 모드에서만 사용 가능합니다.")
    try:
        data = storage.read_file(key)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")

    filename = key.split("/")[-1]
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
