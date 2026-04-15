"""
GET /api/jobs                                                     - 업로드된 파일 목록 조회
GET /api/jobs/{job_id}/pages                                      - 페이지 목록 + 썸네일 URL
GET /api/jobs/{job_id}/pages/{n}/thumbnail                        - 썸네일 PNG 반환
GET /api/jobs/{job_id}/pages/{n}/questions                        - 페이지 내 문항 목록
GET /api/jobs/{job_id}/pages/{n}/questions/{q}/thumbnail          - 문항 크롭 썸네일
"""
import dataclasses
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.schemas import JobStatus
from app.services import storage
from app.services import thumbnail_service
from app.utils.question_parser import detect_question_boundaries, QuestionBoundary

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


# ── 문항 목록 ──────────────────────────────────────────────

class BBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float


class QuestionInfo(BaseModel):
    question_num: int
    question_id: str        # "{job_id}:{page_num}:{question_num}"
    thumbnail_url: str
    bbox: BBox
    col: int


class QuestionListResponse(BaseModel):
    job_id: str
    page_num: int
    questions: List[QuestionInfo]


@router.get("/jobs/{job_id}/pages/{page_num}/questions", response_model=QuestionListResponse)
def list_questions(job_id: str, page_num: int):
    """
    지정 페이지의 문항 목록과 bbox 반환.
    경계 캐시가 있으면 재사용, 없으면 detect_question_boundaries 실행 후 캐시 저장.
    """
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    # 경계 캐시 확인
    cached = storage.get_boundaries_cache(job_id)
    if cached is not None:
        boundaries = [QuestionBoundary(**b) for b in cached]
    else:
        pdf_bytes = storage.read_file(storage.original_key(job_id))
        with tempfile.TemporaryDirectory() as tmpdir:
            pdf_path = str(Path(tmpdir) / "original.pdf")
            Path(pdf_path).write_bytes(pdf_bytes)
            boundaries = detect_question_boundaries(pdf_path)

        storage.save_boundaries_cache(job_id, [dataclasses.asdict(b) for b in boundaries])

    # 해당 페이지의 문항만 필터링
    page_boundaries = [b for b in boundaries if b.page_index == page_num]

    questions = [
        QuestionInfo(
            question_num=b.number,
            question_id=f"{job_id}:{page_num}:{b.number}",
            thumbnail_url=f"/api/jobs/{job_id}/pages/{page_num}/questions/{b.number}/thumbnail",
            bbox=BBox(x0=b.col_x0, y0=b.y_top, x1=b.col_x1, y1=b.y_bottom),
            col=b.col,
        )
        for b in sorted(page_boundaries, key=lambda x: (x.col, x.y_top))
    ]

    return QuestionListResponse(job_id=job_id, page_num=page_num, questions=questions)


# ── 문항 썸네일 ────────────────────────────────────────────

@router.get("/jobs/{job_id}/pages/{page_num}/questions/{question_num}/thumbnail")
def get_question_thumbnail_endpoint(job_id: str, page_num: int, question_num: int):
    """
    문항 크롭 썸네일 PNG 반환.
    캐시 키: thumbnails/{job_id}/q_{page_num}_{question_num}.png
    경계 캐시가 없으면 404 반환 — 먼저 문항 목록 엔드포인트를 호출해야 한다.
    """
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    # 문항 썸네일 캐시 확인
    cached_thumb = storage.get_question_thumbnail_cache(job_id, page_num, question_num)
    if cached_thumb is not None:
        return Response(content=cached_thumb, media_type="image/png")

    # 경계 정보 조회
    cached_boundaries = storage.get_boundaries_cache(job_id)
    if cached_boundaries is None:
        # 경계 캐시 없으면 직접 감지
        pdf_bytes = storage.read_file(storage.original_key(job_id))
        with tempfile.TemporaryDirectory() as tmpdir:
            pdf_path = str(Path(tmpdir) / "original.pdf")
            Path(pdf_path).write_bytes(pdf_bytes)
            boundaries = detect_question_boundaries(pdf_path)
        storage.save_boundaries_cache(job_id, [dataclasses.asdict(b) for b in boundaries])
    else:
        boundaries = [QuestionBoundary(**b) for b in cached_boundaries]
        pdf_bytes = None

    target = next(
        (b for b in boundaries if b.page_index == page_num and b.number == question_num),
        None,
    )
    if target is None:
        raise HTTPException(status_code=404, detail=f"문항 {question_num}을 찾을 수 없습니다.")

    if pdf_bytes is None:
        pdf_bytes = storage.read_file(storage.original_key(job_id))

    png_bytes = thumbnail_service.get_question_thumbnail(
        pdf_bytes=pdf_bytes,
        page_index=target.page_index,
        x0=target.col_x0,
        y0=target.y_top,
        x1=target.col_x1,
        y1=target.y_bottom,
    )

    storage.save_question_thumbnail_cache(job_id, page_num, question_num, png_bytes)
    return Response(content=png_bytes, media_type="image/png")
