"""
POST /api/upload          - presigned URL 요청 (S3 모드 / 로컬 모드 공통)
POST /api/upload/direct   - 파일 직접 수신    (로컬 모드 전용)
GET  /api/files/{key:path} - 파일 서빙        (로컬 모드 전용)
"""
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response

from app.core.config import settings
from app.models.schemas import UploadResponse, JobStatusFile, JobStatus
from app.services import storage

router = APIRouter()


# ── presigned URL 요청 (모드 공통) ───────────────────────

@router.post("/upload", response_model=UploadResponse)
def request_upload():
    """
    S3 모드: 클라이언트가 presigned URL로 직접 S3에 PUT
    로컬 모드: /api/upload/direct 엔드포인트 URL 반환 (multipart POST)
    """
    job_id = str(uuid.uuid4())
    key = storage.original_key(job_id)

    try:
        upload_url = storage.generate_upload_presigned_url(key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"업로드 URL 생성 실패: {e}")

    storage.put_status(
        JobStatusFile(
            job_id=job_id,
            status=JobStatus.PENDING,
            original_key=key,
        )
    )
    return UploadResponse(job_id=job_id, upload_url=upload_url)


# ── 직접 업로드 (로컬 모드 전용) ─────────────────────────

@router.post("/upload/direct")
async def direct_upload(key: str, file: UploadFile = File(...)):
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
    return {"message": "업로드 완료", "key": key}


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
