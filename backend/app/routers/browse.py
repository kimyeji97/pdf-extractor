"""
GET /api/jobs                               - 업로드된 파일 목록 조회
GET /api/jobs/{job_id}/pages                - 페이지 목록 + 썸네일 URL
GET /api/jobs/{job_id}/pages/{n}/thumbnail  - 썸네일 PNG 반환
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.schemas import JobStatus
from app.services import storage
from app.services import thumbnail_service

router = APIRouter()


# ── 파일 목록 ─────────────────────────────────────────────

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


# ── 페이지 목록 ───────────────────────────────────────────

class PageInfo(BaseModel):
    page_num: int
    thumbnail_url: str
    width: float
    height: float


class PageListResponse(BaseModel):
    job_id: str
    page_count: int
    pages: List[PageInfo]


@router.get("/jobs/{job_id}/pages", response_model=PageListResponse)
def list_pages(job_id: str):
    """선택된 PDF의 전체 페이지 목록과 썸네일 URL 반환"""
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    pdf_bytes = storage.read_file(storage.original_key(job_id))
    page_infos = thumbnail_service.get_page_info(pdf_bytes)

    pages = [
        PageInfo(
            page_num=p["page_num"],
            thumbnail_url=f"/api/jobs/{job_id}/pages/{p['page_num']}/thumbnail",
            width=p["width"],
            height=p["height"],
        )
        for p in page_infos
    ]
    return PageListResponse(job_id=job_id, page_count=len(pages), pages=pages)


# ── 썸네일 ────────────────────────────────────────────────

@router.get("/jobs/{job_id}/pages/{page_num}/thumbnail")
def get_thumbnail(job_id: str, page_num: int, dpi: int = Query(default=96, ge=72, le=300)):
    """썸네일 PNG 반환 — 캐시 우선, 없으면 생성 후 캐시 저장"""
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    # 캐시 확인
    cached = storage.get_thumbnail_cache(job_id, page_num)
    if cached is not None:
        return Response(content=cached, media_type="image/png")

    # 생성
    pdf_bytes = storage.read_file(storage.original_key(job_id))
    try:
        png_bytes = thumbnail_service.get_page_thumbnail(pdf_bytes, page_num, dpi)
    except IndexError:
        raise HTTPException(status_code=404, detail=f"페이지 {page_num}이 존재하지 않습니다.")

    # 캐시 저장 (dpi=96 기본값인 경우만)
    if dpi == 96:
        storage.save_thumbnail_cache(job_id, page_num, png_bytes)

    return Response(content=png_bytes, media_type="image/png")
