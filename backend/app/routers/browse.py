"""
GET /api/jobs  - 업로드된 파일 목록 조회
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.schemas import JobStatus
from app.services import storage

router = APIRouter()


class JobSummary(BaseModel):
    job_id: str
    filename: Optional[str] = None
    status: JobStatus
    uploaded_at: Optional[datetime] = None
    page_count: Optional[int] = None


class JobListResponse(BaseModel):
    jobs: List[JobSummary]


@router.get("/jobs", response_model=JobListResponse)
def list_jobs():
    """업로드된 PDF 파일 목록을 최신 순으로 반환"""
    job_files = storage.list_jobs()
    jobs = [
        JobSummary(
            job_id=j.job_id,
            filename=j.filename,
            status=j.status,
            uploaded_at=j.uploaded_at,
            page_count=None,
        )
        for j in job_files
    ]
    return JobListResponse(jobs=jobs)
