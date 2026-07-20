"""
GET    /api/jobs                                                         - 업로드된 파일 목록 조회
GET    /api/jobs/{job_id}                                                - 단일 job 정보 조회
PATCH  /api/jobs/{job_id}                                                - job 메타데이터 수정 (workbook_name, workbook_types)
POST   /api/jobs/{job_id}/refresh                                        - 전체 문서 재감지 (비동기)
GET    /api/jobs/{job_id}/pages                                          - 페이지 목록 + 썸네일 URL
GET    /api/jobs/{job_id}/pages/{n}/thumbnail                            - 썸네일 PNG 반환
GET    /api/jobs/{job_id}/questions                                      - 전체 페이지 문항 일괄 조회 (REQ-P01)
GET    /api/jobs/{job_id}/pages/{n}/questions                            - 문항 목록 (자동+수동 병합)
GET    /api/jobs/{job_id}/pages/{n}/questions/{q}/thumbnail              - 자동 문항 크롭 썸네일
PATCH  /api/jobs/{job_id}/pages/{n}/questions/{q}                        - 자동 문항 타이틀 수정 (REQ-12)
DELETE /api/jobs/{job_id}/pages/{n}/questions/{q}                        - 자동 문항 삭제 (REQ-14)
POST   /api/jobs/{job_id}/pages/{n}/questions/manual                     - 수동 문항 추가 (REQ-13)
PATCH  /api/jobs/{job_id}/pages/{n}/questions/manual/{mid}               - 수동 문항 타이틀 수정 (REQ-12)
DELETE /api/jobs/{job_id}/pages/{n}/questions/manual/{mid}               - 수동 문항 삭제 (REQ-14)
POST   /api/jobs/{job_id}/pages/{n}/questions/bulk-delete                - 자동/수동 문항 벌크 삭제 (REQ-B06)
GET    /api/jobs/{job_id}/pages/{n}/questions/manual/{mid}/thumbnail     - 수동 문항 썸네일
"""
import dataclasses
import tempfile
import uuid
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional

from app.models.schemas import (
    BoundariesStatus, JobStatus, JobType,
    ManualQuestion, ManualQuestionCreate, QuestionTitleUpdate, RegionCoord,
)
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
    workbook_name: Optional[str] = None
    workbook_types: Optional[list[str]] = None


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
            workbook_name=j.workbook_name,
            workbook_types=j.workbook_types,
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
        workbook_name=job.workbook_name,
        workbook_types=job.workbook_types,
    )


# ── job 메타데이터 수정 ──────────────────────────────────────

class JobMetaUpdate(BaseModel):
    workbook_name: Optional[str] = None
    workbook_types: Optional[list[str]] = None


@router.patch("/jobs/{job_id}", response_model=JobSummary)
def update_job_meta(job_id: str, body: JobMetaUpdate):
    """job의 문제집 이름/유형 메타데이터를 수정한다."""
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")
    if body.workbook_name is not None:
        job.workbook_name = body.workbook_name or None
    if body.workbook_types is not None:
        job.workbook_types = body.workbook_types or None
    storage.put_status(job)
    return JobSummary(
        job_id=job.job_id,
        filename=job.filename,
        status=job.status,
        uploaded_at=job.uploaded_at,
        job_type=job.job_type,
        boundaries_status=job.boundaries_status,
        total_question_count=job.total_question_count,
        workbook_name=job.workbook_name,
        workbook_types=job.workbook_types,
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
    """
    문항 목록 API 응답의 단위 항목.
    자동 감지 문항과 수동 추가 문항을 하나의 형식으로 표현한다.
    """
    question_num: Optional[int] = None      # 자동 감지 문항 번호 (수동이면 None)
    manual_id: Optional[str] = None         # 수동 문항 UUID (자동이면 None)
    question_id: str                         # 고유 ID — UI 키값으로 사용
    thumbnail_url: str
    bbox: BBox
    col: int
    # v3 신규 필드 ─────────────────────────────────────────────
    title: Optional[str] = None             # 사용자 지정 타이틀 (None이면 "문항 N" 표시)
    is_false_positive: bool = False          # 오탐지 의심 여부 (REQ-15)
    is_manual: bool = False                  # 수동 추가 문항 여부 (REQ-13)


class QuestionListResponse(BaseModel):
    job_id: str
    page_num: int
    questions: List[QuestionInfo]


# ── 전체 문항 일괄 조회 (REQ-P01) ─────────────────────────────

class PageQuestions(BaseModel):
    page_num: int
    questions: List[QuestionInfo]


class AllQuestionsResponse(BaseModel):
    job_id: str
    total_count: int
    pages: List[PageQuestions]


@router.get("/jobs/{job_id}/questions", response_model=AllQuestionsResponse)
def list_all_questions(job_id: str):
    """
    전체 페이지의 문항을 한 번에 반환한다 (REQ-P01).
    boundaries 캐시·수동 문항·상태 파일을 각 1회만 읽어 N+1 문제를 해결한다.
    """
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    if job.boundaries_status == BoundariesStatus.PROCESSING:
        return AllQuestionsResponse(job_id=job_id, total_count=0, pages=[])

    # 경계 캐시 — 1회 읽기
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

        qpp: dict[str, int] = {}
        for b in boundaries:
            key = str(b.page_index)
            qpp[key] = qpp.get(key, 0) + 1
        job.boundaries_status = BoundariesStatus.DONE
        job.total_question_count = len(boundaries)
        job.questions_per_page = qpp
        storage.put_status(job)

    # 수동 문항 — 1회 읽기
    manual_list = storage.get_manual_questions(job_id)

    # 페이지별 그룹핑
    page_indices: dict[int, list] = {}
    for b in boundaries:
        page_indices.setdefault(b.page_index, []).append(b)

    manual_by_page: dict[int, list] = {}
    for m in manual_list:
        manual_by_page.setdefault(m.get("page_num"), []).append(m)

    all_page_nums = sorted(set(list(page_indices.keys()) + list(manual_by_page.keys())))

    result_pages = []
    total_count = 0
    for page_num in all_page_nums:
        # 자동 감지 문항
        page_boundaries = sorted(page_indices.get(page_num, []), key=lambda x: (x.col, x.y_top))
        auto_questions = [
            QuestionInfo(
                question_num=b.number,
                manual_id=None,
                question_id=f"{job_id}:{page_num}:{b.number}",
                thumbnail_url=f"/api/jobs/{job_id}/pages/{page_num}/questions/{b.number}/thumbnail",
                bbox=BBox(x0=b.col_x0, y0=b.y_top, x1=b.col_x1, y1=b.y_bottom),
                col=b.col,
                title=b.title,
                is_false_positive=b.is_false_positive,
                is_manual=False,
            )
            for b in page_boundaries
        ]

        # 수동 추가 문항
        page_manual = sorted(manual_by_page.get(page_num, []), key=lambda m: m["region"]["y0"])
        manual_questions = [
            QuestionInfo(
                question_num=None,
                manual_id=m["manual_id"],
                question_id=f"{job_id}:{page_num}:manual:{m['manual_id']}",
                thumbnail_url=f"/api/jobs/{job_id}/pages/{page_num}/questions/manual/{m['manual_id']}/thumbnail",
                bbox=BBox(
                    x0=m["region"]["x0"], y0=m["region"]["y0"],
                    x1=m["region"]["x1"], y1=m["region"]["y1"],
                ),
                col=0,
                title=m.get("title"),
                is_false_positive=False,
                is_manual=True,
            )
            for m in page_manual
        ]

        questions = auto_questions + manual_questions
        total_count += len(questions)
        result_pages.append(PageQuestions(page_num=page_num, questions=questions))

    return AllQuestionsResponse(job_id=job_id, total_count=total_count, pages=result_pages)


@router.get("/jobs/{job_id}/pages/{page_num}/questions", response_model=QuestionListResponse)
def list_questions(job_id: str, page_num: int):
    """
    지정 페이지의 문항 목록과 bbox 반환.
    자동 감지 문항과 수동 추가 문항을 병합하여 반환한다 (REQ-13).
    경계 캐시가 있으면 재사용, 없으면 detect_question_boundaries 실행 후 캐시 저장.
    """
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    # 재감지 중이면 캐시 사용 금지 (오래된 데이터 반환 방지)
    if job.boundaries_status == BoundariesStatus.PROCESSING:
        return QuestionListResponse(job_id=job_id, page_num=page_num, questions=[])

    # 경계 캐시 확인 — 있으면 재사용, 없으면 감지 후 저장
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

    # 해당 페이지의 자동 감지 문항만 필터링
    page_boundaries = [b for b in boundaries if b.page_index == page_num]

    # 자동 감지 문항 → QuestionInfo 변환
    auto_questions = [
        QuestionInfo(
            question_num=b.number,
            manual_id=None,
            question_id=f"{job_id}:{page_num}:{b.number}",
            thumbnail_url=f"/api/jobs/{job_id}/pages/{page_num}/questions/{b.number}/thumbnail",
            bbox=BBox(x0=b.col_x0, y0=b.y_top, x1=b.col_x1, y1=b.y_bottom),
            col=b.col,
            title=b.title,
            is_false_positive=b.is_false_positive,
            is_manual=False,
        )
        for b in sorted(page_boundaries, key=lambda x: (x.col, x.y_top))
    ]

    # 수동 추가 문항 병합 (REQ-13)
    # 수동 문항은 서버에 별도 저장됨 — manual_questions/{job_id}.json
    manual_list = storage.get_manual_questions(job_id)
    page_manual = [m for m in manual_list if m.get("page_num") == page_num]
    manual_questions = [
        QuestionInfo(
            question_num=None,
            manual_id=m["manual_id"],
            question_id=f"{job_id}:{page_num}:manual:{m['manual_id']}",
            thumbnail_url=f"/api/jobs/{job_id}/pages/{page_num}/questions/manual/{m['manual_id']}/thumbnail",
            bbox=BBox(
                x0=m["region"]["x0"],
                y0=m["region"]["y0"],
                x1=m["region"]["x1"],
                y1=m["region"]["y1"],
            ),
            col=0,              # 수동 문항은 컬럼 개념 없이 0으로 고정
            title=m.get("title"),
            is_false_positive=False,
            is_manual=True,
        )
        for m in sorted(page_manual, key=lambda m: m["region"]["y0"])
    ]

    # 정렬: 자동 문항 먼저(col, y_top 순), 수동 문항은 그 뒤에 y_top 순
    questions = auto_questions + manual_questions
    return QuestionListResponse(job_id=job_id, page_num=page_num, questions=questions)


# ── 자동 문항 타이틀 수정 (REQ-12) ───────────────────────────

@router.patch("/jobs/{job_id}/pages/{page_num}/questions/{question_num}")
def update_question_title(job_id: str, page_num: int, question_num: int, body: QuestionTitleUpdate):
    """
    자동 감지 문항의 타이틀을 수정한다.
    변경사항은 boundaries/{job_id}.json 캐시에 직접 반영되어 서버에 영속 저장된다.
    """
    cached = storage.get_boundaries_cache(job_id)
    if cached is None:
        raise HTTPException(status_code=404, detail="경계 캐시가 없습니다. 먼저 문항 목록을 조회해 주세요.")

    # 해당 문항 검색 및 타이틀 업데이트
    updated = False
    for b in cached:
        if b.get("page_index") == page_num and b.get("number") == question_num:
            b["title"] = body.title
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail=f"문항 {question_num}을 찾을 수 없습니다.")

    storage.save_boundaries_cache(job_id, cached)
    return {"question_num": question_num, "title": body.title}


# ── 자동 문항 삭제 (REQ-14) ──────────────────────────────────

@router.delete("/jobs/{job_id}/pages/{page_num}/questions/{question_num}", status_code=204)
def delete_question(job_id: str, page_num: int, question_num: int):
    """
    자동 감지 문항을 삭제한다.
    boundaries 캐시에서 제거하고 questions_per_page, total_question_count를 재계산한다.
    문항 썸네일 캐시도 함께 삭제한다.
    """
    cached = storage.get_boundaries_cache(job_id)
    if cached is None:
        raise HTTPException(status_code=404, detail="경계 캐시가 없습니다.")

    original_count = len(cached)
    cached = [
        b for b in cached
        if not (b.get("page_index") == page_num and b.get("number") == question_num)
    ]
    if len(cached) == original_count:
        raise HTTPException(status_code=404, detail=f"문항 {question_num}을 찾을 수 없습니다.")

    storage.save_boundaries_cache(job_id, cached)

    # questions_per_page, total_question_count 재계산
    job = storage.get_status(job_id)
    if job:
        qpp: dict[str, int] = {}
        for b in cached:
            key = str(b.get("page_index", 0))
            qpp[key] = qpp.get(key, 0) + 1
        job.questions_per_page = qpp
        job.total_question_count = len(cached)
        storage.put_status(job)

    # 썸네일 캐시 삭제
    storage.delete_question_thumbnail_cache(job_id, page_num, question_num)


# ── 수동 문항 추가 (REQ-13) ──────────────────────────────────

@router.post("/jobs/{job_id}/pages/{page_num}/questions/manual", status_code=201)
def add_manual_question(job_id: str, page_num: int, body: ManualQuestionCreate):
    """
    수동 드래그로 지정한 영역을 문항으로 추가한다.
    새로고침 후에도 복원되도록 manual_questions/{job_id}.json에 영속 저장한다.

    처리 순서:
      1. UUID 생성 → manual_id
      2. manual_questions/{job_id}.json에 append
      3. 해당 영역 크롭 PNG 생성 → 썸네일 캐시 저장
      4. ManualQuestion 응답 반환
    """
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    manual_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    new_item = {
        "manual_id": manual_id,
        "job_id": job_id,
        "page_num": page_num,
        "title": body.title,
        "region": {
            "x0": body.region.x0,
            "y0": body.region.y0,
            "x1": body.region.x1,
            "y1": body.region.y1,
        },
        "created_at": now,
    }

    # 기존 목록에 추가하여 저장
    manual_list = storage.get_manual_questions(job_id)
    manual_list.append(new_item)
    storage.save_manual_questions(job_id, manual_list)

    # 수동 문항 영역 썸네일 생성 및 캐시 저장
    try:
        pdf_bytes = storage.read_file(storage.original_key(job_id))
        png_bytes = thumbnail_service.get_question_thumbnail(
            pdf_bytes=pdf_bytes,
            page_index=page_num,
            x0=body.region.x0,
            y0=body.region.y0,
            x1=body.region.x1,
            y1=body.region.y1,
        )
        storage.save_manual_thumbnail_cache(job_id, page_num, manual_id, png_bytes)
    except Exception:
        # 썸네일 생성 실패는 문항 추가 자체를 막지 않음
        pass

    return ManualQuestion(
        manual_id=manual_id,
        job_id=job_id,
        page_num=page_num,
        title=body.title,
        region=RegionCoord(**new_item["region"]),
        created_at=datetime.fromisoformat(now),
    )


# ── 수동 문항 타이틀 수정 (REQ-12) ───────────────────────────

@router.patch("/jobs/{job_id}/pages/{page_num}/questions/manual/{manual_id}")
def update_manual_question_title(job_id: str, page_num: int, manual_id: str, body: QuestionTitleUpdate):
    """수동 추가 문항의 타이틀을 수정한다. manual_questions/{job_id}.json에 저장."""
    manual_list = storage.get_manual_questions(job_id)
    updated = False
    for m in manual_list:
        if m.get("manual_id") == manual_id:
            m["title"] = body.title
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail=f"수동 문항 {manual_id}를 찾을 수 없습니다.")

    storage.save_manual_questions(job_id, manual_list)
    return {"manual_id": manual_id, "title": body.title}


# ── 수동 문항 삭제 (REQ-14) ──────────────────────────────────

@router.delete("/jobs/{job_id}/pages/{page_num}/questions/manual/{manual_id}", status_code=204)
def delete_manual_question(job_id: str, page_num: int, manual_id: str):
    """수동 추가 문항을 삭제한다. 썸네일 캐시도 함께 삭제."""
    manual_list = storage.get_manual_questions(job_id)
    original_count = len(manual_list)
    manual_list = [m for m in manual_list if m.get("manual_id") != manual_id]

    if len(manual_list) == original_count:
        raise HTTPException(status_code=404, detail=f"수동 문항 {manual_id}를 찾을 수 없습니다.")

    storage.save_manual_questions(job_id, manual_list)
    storage.delete_manual_thumbnail_cache(job_id, page_num, manual_id)


# ── 문항 벌크(다중) 삭제 (REQ-B06) ───────────────────────────

class BulkDeleteRequest(BaseModel):
    """한 페이지에서 선택된 자동/수동 문항을 한 번에 삭제하기 위한 요청."""
    question_nums: List[int] = []   # 자동 감지 문항 번호
    manual_ids: List[str] = []      # 수동 문항 UUID


@router.post("/jobs/{job_id}/pages/{page_num}/questions/bulk-delete")
def bulk_delete_questions(job_id: str, page_num: int, body: BulkDeleteRequest):
    """
    선택된 자동/수동 문항을 한 번에 삭제한다 (REQ-B06).

    단건 DELETE를 동시에 여러 번 호출하면 boundaries/manual 캐시가 각자 원본을
    읽어 자기 것만 제거 후 되쓰는 read-modify-write 경쟁으로 일부만 삭제된다.
    본 엔드포인트는 캐시별로 read-modify-write를 **1회**만 수행하여 이를 제거한다.

    - 자동 문항: boundaries 캐시에서 (page_index==page_num AND number∈question_nums) 일괄 제거,
      questions_per_page / total_question_count를 1회 재계산.
    - 수동 문항: manual_questions 목록에서 manual_id∈manual_ids 일괄 제거.
    - 관련 썸네일 캐시도 함께 삭제(존재하지 않으면 무시).
    """
    deleted_auto = 0
    deleted_manual = 0

    # ── 자동 문항 일괄 삭제 (boundaries 캐시 1회 read-modify-write) ──
    if body.question_nums:
        cached = storage.get_boundaries_cache(job_id)
        if cached is None:
            raise HTTPException(status_code=404, detail="경계 캐시가 없습니다.")

        target_nums = set(body.question_nums)
        remaining = [
            b for b in cached
            if not (b.get("page_index") == page_num and b.get("number") in target_nums)
        ]
        deleted_auto = len(cached) - len(remaining)

        if deleted_auto:
            storage.save_boundaries_cache(job_id, remaining)

            # questions_per_page, total_question_count 1회 재계산
            job = storage.get_status(job_id)
            if job:
                qpp: dict[str, int] = {}
                for b in remaining:
                    key = str(b.get("page_index", 0))
                    qpp[key] = qpp.get(key, 0) + 1
                job.questions_per_page = qpp
                job.total_question_count = len(remaining)
                storage.put_status(job)

            # 썸네일 캐시 삭제 (idempotent)
            for num in target_nums:
                storage.delete_question_thumbnail_cache(job_id, page_num, num)

    # ── 수동 문항 일괄 삭제 (manual 목록 1회 read-modify-write) ──
    if body.manual_ids:
        manual_list = storage.get_manual_questions(job_id)
        target_ids = set(body.manual_ids)
        remaining_manual = [m for m in manual_list if m.get("manual_id") not in target_ids]
        deleted_manual = len(manual_list) - len(remaining_manual)

        if deleted_manual:
            storage.save_manual_questions(job_id, remaining_manual)
            for mid in target_ids:
                storage.delete_manual_thumbnail_cache(job_id, page_num, mid)

    return {"deleted_auto": deleted_auto, "deleted_manual": deleted_manual}


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


# ── 수동 문항 썸네일 ──────────────────────────────────────────

@router.get("/jobs/{job_id}/pages/{page_num}/questions/manual/{manual_id}/thumbnail")
def get_manual_question_thumbnail(job_id: str, page_num: int, manual_id: str):
    """
    수동 추가 문항의 크롭 썸네일 PNG 반환.
    캐시에 있으면 반환, 없으면 region 좌표로 재생성한다.
    """
    # 캐시 확인
    cached_thumb = storage.get_manual_thumbnail_cache(job_id, page_num, manual_id)
    if cached_thumb is not None:
        return Response(content=cached_thumb, media_type="image/png")

    # 수동 문항 정보 조회
    manual_list = storage.get_manual_questions(job_id)
    target = next((m for m in manual_list if m.get("manual_id") == manual_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail=f"수동 문항 {manual_id}를 찾을 수 없습니다.")

    region = target["region"]
    pdf_bytes = storage.read_file(storage.original_key(job_id))
    png_bytes = thumbnail_service.get_question_thumbnail(
        pdf_bytes=pdf_bytes,
        page_index=page_num,
        x0=region["x0"],
        y0=region["y0"],
        x1=region["x1"],
        y1=region["y1"],
    )
    storage.save_manual_thumbnail_cache(job_id, page_num, manual_id, png_bytes)
    return Response(content=png_bytes, media_type="image/png")
