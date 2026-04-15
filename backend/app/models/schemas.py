from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    DONE = "DONE"
    FAILED = "FAILED"


# ── 업로드 ──────────────────────────────────────────
class UploadResponse(BaseModel):
    job_id: str
    upload_url: str          # S3 presigned PUT URL (클라이언트가 직접 업로드)
    message: str = "업로드 URL이 생성되었습니다."


# ── 추출 요청 ────────────────────────────────────────
class ExtractRequest(BaseModel):
    job_id: str
    question_numbers: str = Field(
        ...,
        description="추출할 문항 번호. 예: '1,3,5' 또는 '1-5' 또는 '1,3,7-10'",
        examples=["1,3,5", "1-5", "1,3,7-10"],
    )


class ExtractResponse(BaseModel):
    job_id: str
    message: str = "추출 작업이 시작되었습니다."


# ── 상태 조회 ────────────────────────────────────────
class StatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    download_url: Optional[str] = None   # DONE 상태일 때만 반환
    error: Optional[str] = None          # FAILED 상태일 때만 반환
    extracted_count: Optional[int] = None


# ── S3 상태 파일 스키마 (내부용) ──────────────────────
class JobStatusFile(BaseModel):
    job_id: str
    status: JobStatus
    filename: Optional[str] = None       # 업로드 시 원본 파일명
    uploaded_at: Optional[datetime] = None  # 업로드 시각
    original_key: Optional[str] = None   # S3 key of uploaded PDF
    result_key: Optional[str] = None     # S3 key of result PDF
    question_numbers: Optional[str] = None
    extracted_count: Optional[int] = None
    error: Optional[str] = None
