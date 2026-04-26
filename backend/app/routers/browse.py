"""
GET  /api/jobs                                                     - 업로드된 파일 목록 조회
GET  /api/jobs/{job_id}                                            - 단일 job 정보 조회 (boundaries_status 포함)
POST /api/jobs/{job_id}/refresh                                    - 전체 문서 재감지 (비동기)
GET  /api/jobs/{job_id}/pages                                      - 페이지 목록 + 썸네일 URL
GET  /api/jobs/{job_id}/pages/{n}/thumbnail                        - 썸네일 PNG 반환
GET  /api/jobs/{job_id}/pages/{n}/questions                        - 페이지 내 문항 목록
GET  /api/jobs/{job_id}/pages/{n}/questions/{q}/thumbnail          - 문항 크롭 썸네일
"""
import dataclasses
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.schemas import BoundariesStatus, JobStatus, JobType
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
    job_type: JobType = JobType.SOURCE
    boundaries_status: Optional[BoundariesStatus] = None
    total_question_count: Optional[int] = None


class JobListResponse(BaseModel):
    source_jobs: List[JobSummary]
    export_jobs: List[JobSummary]


@router.get("/jobs", response_model=JobListResponse)
def list_jobs():
    """업로드된 PDF 파일 목록을 최신 순으로 반환 (원본/결과 분리)"""
    job_files = storage.list_jobs()

    def to_summary(j) -> JobSummary:
        return JobSummary(
            job_id=j.job_id,
            filename=j.filename,
            status=j.status,
            uploaded_at=j.uploaded_at,
            page_count=None,
            job_type=j.job_type,
            boundaries_status=j.boundaries_status,
            total_question_count=j.total_question_count,
        )

    source_jobs = [to_summary(j) for j in job_files if j.job_type == JobType.SOURCE]
    export_jobs = [to_summary(j) for j in job_files if j.job_type == JobType.EXPORT]

    return JobListResponse(source_jobs=source_jobs, export_jobs=export_jobs)


@router.get("/jobs/{job_id}", response_model=JobSummary)
def get_job(job_id: str):
    """단일 job의 상태 정보 반환 (boundaries_status 포함 — 재감지 폴링용)"""
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")
    return JobSummary(
        job_id=job.job_id,
        filename=job.filename,
        status=job.status,
        uploaded_at=job.uploaded_at,
        job_type=job.job_type,
        boundaries_status=job.boundaries_status,
        total_question_count=job.total_question_count,
    )


# ── 문서 전체 재감지 (비동기) ────────────────────────────────

class RefreshResponse(BaseModel):
    job_id: str
    boundaries_status: BoundariesStatus
    message: str = "재감지가 시작되었습니다."


@router.post("/jobs/{job_id}/refresh", response_model=RefreshResponse)
def refresh_job_questions(job_id: str, background_tasks: BackgroundTasks):
    """
    전체 문서 재감지 요청 (비동기).

    동작:
      1. boundaries_status를 PROCESSING으로 즉시 업데이트 후 반환 (논블로킹)
      2. 백그라운드에서 기존 캐시 삭제 → 전체 PDF 재분석 → 캐시 저장
      3. 완료/실패 시 boundaries_status 업데이트 (DONE / FAILED)

    프론트에서는:
      - POST 후 즉시 PROCESSING 응답을 받음
      - GET /api/jobs/{job_id} 를 폴링하여 DONE/FAILED 확인
      - DONE 이 되면 해당 페이지 문항 목록 다시 로드
    """
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    # 이미 처리 중이면 중복 요청 방지
    if job.boundaries_status == BoundariesStatus.PROCESSING:
        return RefreshResponse(
            job_id=job_id,
            boundaries_status=BoundariesStatus.PROCESSING,
            message="이미 재감지가 진행 중입니다.",
        )

    # 즉시 PROCESSING 상태로 업데이트 → 프론트 폴링 기준점
    job.boundaries_status = BoundariesStatus.PROCESSING
    storage.put_status(job)

    # 백그라운드에서 실제 감지 실행
    background_tasks.add_task(_run_refresh_detection, job_id)

    return RefreshResponse(job_id=job_id, boundaries_status=BoundariesStatus.PROCESSING)


def _run_refresh_detection(job_id: str) -> None:
    """
    백그라운드 태스크: 캐시 초기화 후 전체 PDF 재감지.

    1. 기존 경계 캐시 + 문항 썸네일 캐시 삭제
    2. 원본 PDF로 detect_question_boundaries 재실행
    3. 새 결과를 캐시에 저장
    4. questions_per_page, total_question_count 갱신
    5. boundaries_status = DONE 또는 FAILED 저장
    """
    job = storage.get_status(job_id)
    if job is None:
        return

    try:
        # Step 1: 기존 캐시 무효화
        storage.clear_boundaries_cache(job_id)

        # Step 2: PDF 재분석
        pdf_bytes = storage.read_file(storage.original_key(job_id))
        with tempfile.TemporaryDirectory() as tmpdir:
            pdf_path = str(Path(tmpdir) / "original.pdf")
            Path(pdf_path).write_bytes(pdf_bytes)
            boundaries = detect_question_boundaries(pdf_path)

        # Step 3: 새 결과 캐시 저장
        storage.save_boundaries_cache(job_id, [dataclasses.asdict(b) for b in boundaries])

        # Step 4: 페이지별 문항 수 집계 → questions_per_page 갱신
        qpp: dict[str, int] = {}
        for b in boundaries:
            key = str(b.page_index)
            qpp[key] = qpp.get(key, 0) + 1

        job.boundaries_status = BoundariesStatus.DONE
        job.total_question_count = len(boundaries)
        job.questions_per_page = qpp

    except Exception as e:
        job.boundaries_status = BoundariesStatus.FAILED
        job.error = str(e)

    finally:
        storage.put_status(job)


# ── 페이지 목록 ───────────────────────────────────────────

class PageInfo(BaseModel):
    page_num: int
    thumbnail_url: str
    width: float
    height: float
    question_count: Optional[int] = None


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

    qpp = job.questions_per_page or {}   # { "0": 5, "1": 3, ... }

    pages = [
        PageInfo(
            page_num=p["page_num"],
            thumbnail_url=f"/api/jobs/{job_id}/pages/{p['page_num']}/thumbnail",
            width=p["width"],
            height=p["height"],
            question_count=qpp.get(str(p["page_num"])),
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
    question_num: Optional[int] = None     # 자동 감지: 번호 있음 / 수동: None
    question_id: str                        # "{job_id}:{page_num}:{question_num}"
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

    # 재감지 중이면 캐시 사용 금지 (오래된 데이터 반환 방지)
    if job.boundaries_status == BoundariesStatus.PROCESSING:
        return QuestionListResponse(job_id=job_id, page_num=page_num, questions=[])

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

        # boundaries_status 갱신 (처음 감지 완료)
        qpp: dict[str, int] = {}
        for b in boundaries:
            key = str(b.page_index)
            qpp[key] = qpp.get(key, 0) + 1
        job.boundaries_status = BoundariesStatus.DONE
        job.total_question_count = len(boundaries)
        job.questions_per_page = qpp
        storage.put_status(job)

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
