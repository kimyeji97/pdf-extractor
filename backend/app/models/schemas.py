from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    DONE = "DONE"
    FAILED = "FAILED"


class JobType(str, Enum):
    SOURCE = "SOURCE"   # 사용자가 업로드한 원본 PDF
    EXPORT = "EXPORT"   # extract-v2로 생성된 결과 PDF


class BoundariesStatus(str, Enum):
    PENDING    = "PENDING"     # 감지 대기 중
    PROCESSING = "PROCESSING"  # 감지 진행 중
    DONE       = "DONE"        # 감지 완료
    FAILED     = "FAILED"      # 감지 실패


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
    # ── 신규 필드 ───────────────────────────────
    job_type: JobType = JobType.SOURCE
    boundaries_status: Optional[BoundariesStatus] = None
    total_question_count: Optional[int] = None
    questions_per_page: Optional[dict] = None   # { "0": 5, "1": 3, ... }


# ── v2 추출 요청 ──────────────────────────────────────────

class RegionCoord(BaseModel):
    """PDF 좌표계(pt) 기준 사각형 영역. 수동 선택 시 사용."""
    x0: float
    y0: float
    x1: float
    y1: float


class SelectionItem(BaseModel):
    """
    추출 단위 1건.
    - 자동 감지 문항: question_num 필수, custom_region 없음
    - 수동 지정 영역: custom_region 필수, question_num 없음
    둘 중 하나는 반드시 있어야 한다.
    """
    job_id: str
    page_num: int
    question_num: Optional[int] = None
    custom_region: Optional[RegionCoord] = None
    label: Optional[str] = None  # UI 표시용 (예: "수동 선택")


class ExtractV2Request(BaseModel):
    selections: list[SelectionItem] = Field(..., min_length=1)
    # REQ-18: 문제집 생성 시 레이아웃 지정 (미지정 시 2단 기본값)
    layout: Optional[str] = Field(default="2단", description="문제집 레이아웃: '2단', '4단', '6단'")


class ExtractV2Response(BaseModel):
    job_id: str
    message: str = "추출 작업이 시작되었습니다."


# ── v3 수동 문항 (REQ-13) ──────────────────────────────────────

class ManualQuestion(BaseModel):
    """서버에 영속 저장된 수동 추가 문항. GET /questions 응답에 자동 문항과 함께 반환."""
    manual_id: str            # UUID — 수동 문항 고유 식별자
    job_id: str
    page_num: int
    title: str                # 수동 추가 시 사용자가 입력한 타이틀 (필수)
    region: RegionCoord       # 드래그로 지정한 PDF 좌표계 영역
    created_at: datetime


class ManualQuestionCreate(BaseModel):
    """POST /questions/manual 요청 바디"""
    title: str = Field(..., min_length=1, description="문항 타이틀 (필수)")
    region: RegionCoord       # 드래그로 지정한 PDF 좌표계 영역


class QuestionTitleUpdate(BaseModel):
    """PATCH /questions/{q} 또는 PATCH /questions/manual/{mid} 요청 바디"""
    title: str = Field(..., min_length=1, description="새 타이틀 (필수)")


# ── v3 문제집 (REQ-16~22) ─────────────────────────────────────

class WorkbookSelectionItem(BaseModel):
    """문제집에 포함된 문항 1건의 식별 정보."""
    question_id: Optional[str] = None     # 고유 식별자 — "{job_id}:{page_num}:{num}" 또는 manual_id
    job_id: str
    page_num: int
    question_num: Optional[int] = None    # 자동 감지 문항 번호
    manual_id: Optional[str] = None       # 수동 추가 문항 UUID
    title: Optional[str] = None           # 저장 당시 타이틀 스냅샷


class WorkbookMeta(BaseModel):
    """생성된 문제집의 메타데이터. local_storage/workbooks/{id}.json에 저장."""
    workbook_id: str
    created_at: datetime
    layout: str                           # "세로 2단" / "가로 2단" / "4단" / "6단"
    selections: list[WorkbookSelectionItem]
    result_job_id: str                    # extract-v2가 반환한 export job UUID
    question_count: int
