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
    workbook_name: Optional[str] = None          # 업로드 시 사용자 입력 문제집 이름
    workbook_types: Optional[list[str]] = None   # 업로드 시 사용자 입력 문제집 유형 목록


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
    - 자동 감지 문항: question_num 사용
    - 수동 추가 문항: manual_id 사용 (v3 REQ-13)
    - 구형 수동 지정: custom_region 사용
    """
    job_id: str
    page_num: int
    question_id: Optional[str] = None   # 고유 식별자 (UI 표시용)
    question_num: Optional[int] = None
    manual_id: Optional[str] = None     # 수동 추가 문항 UUID (v3 REQ-13)
    custom_region: Optional[RegionCoord] = None
    label: Optional[str] = None          # 문항 라벨. WorkbookSelectionItem.title 과 같은 값이다
    scale: float = 1.0                  # 셀 내 확대/축소 배율 (좌상단 고정, 2026-07-25)
    # ── 아래 2개는 표시 전용 (REQ-B10) ──────────────────
    # 추출 자체에는 쓰이지 않는다. 백엔드가 완료 시 WorkbookSelectionItem 을 채우려면
    # 필요한데 이 요청에만 실려 오기 때문에 받아 둔다.
    # ⚠️ 이 workbook_name 은 **출처** 문제집 이름이다.
    #    ExtractV2Request.workbook_name(= 만들 문제집 이름)과 이름은 같고 뜻이 반대다.
    workbook_name: Optional[str] = None
    source_filename: Optional[str] = None   # 출처 원본 파일명 (이름이 겹칠 때의 구분용 — 계약 #17)


class ExtractV2Request(BaseModel):
    selections: list[SelectionItem] = Field(..., min_length=1)
    # REQ-18: 문제집 생성 시 레이아웃 지정 (미지정 시 2단 기본값)
    layout: Optional[str] = Field(default="2단", description="문제집 레이아웃: '2단', '4단', '6단'")
    # 표지: 저장된 cover_id 지정 시 생성된 PDF 첫 페이지에 표지 삽입
    cover_id: Optional[str] = Field(default=None, description="표지 cover_id (선택)")
    # REQ-B10: **생성될** 문제집 이름. WorkbookMeta 의 filename·name 을 둘 다 이 값으로 채운다
    # (프론트가 종전부터 두 필드에 같은 값을 보내 왔다).
    #
    # ⚠️ **이 필드의 유무가 "메타를 누가 저장하는가"의 신호다.**
    #   있음 → 새 프론트. 백엔드가 생성 성공 시 문제집 메타를 쓴다.
    #   없음 → 구 프론트. 백엔드는 쓰지 않는다(프론트가 POST /api/workbooks 로 직접 쓴다).
    # 이 분기가 없으면 백엔드 배포 후 프론트 배포 전까지 **둘 다 저장해 이력에 2건**이 뜨고,
    # 그중 하나는 이름이 없다. 값이 아니라 **존재 여부**가 의미를 가지므로 기본값을 채우지 말 것.
    workbook_name: Optional[str] = Field(
        default=None, description="생성될 문제집 이름 (있으면 백엔드가 완료 시 메타를 저장)"
    )


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
    workbook_name: Optional[str] = None   # 출처 문제집 이름 (출처 표시용)
    # 출처 원본 파일명. workbook_name은 사용자 자유 입력이라 **고유하지 않다**
    # (실데이터에 서로 다른 두 파일이 똑같이 "테스트03"인 사례 존재). 편집 화면에서
    # 같은 이름의 출처가 섞였을 때 이 값으로 구분해 보여준다. (REQ-D07 Phase 3-5)
    source_filename: Optional[str] = None
    scale: float = 1.0                    # 셀 내 확대/축소 배율 (2026-07-25)


class WorkbookMeta(BaseModel):
    """생성된 문제집의 메타데이터. local_storage/workbooks/{id}.json에 저장."""
    workbook_id: str
    created_at: datetime
    layout: str                           # "세로 2단" / "가로 2단" / "4단" / "6단"
    selections: list[WorkbookSelectionItem]
    result_job_id: str                    # extract-v2가 반환한 export job UUID
    question_count: int
    filename: Optional[str] = None        # 사용자 입력 파일명 (REQ-C01)
    name: Optional[str] = None            # 문제집 이름 (이력 표시용)


class WorkbookSummary(BaseModel):
    """
    문제집 이력 목록용 요약 모델 (REQ-P03-03).
    WorkbookMeta에서 selections를 제외한 형태 — 목록 화면은 selections를 쓰지 않는데
    문항 수십~수백 건이 통째로 실려 응답이 불필요하게 커지기 때문.
    편집 복원에 필요한 selections는 단건 조회(GET /api/workbooks/{id})에서 제공한다.
    """
    workbook_id: str
    created_at: datetime
    layout: str
    result_job_id: str
    question_count: int
    filename: Optional[str] = None
    name: Optional[str] = None


class WorkbookListResponse(BaseModel):
    """페이지네이션된 문제집 이력 목록 (REQ-P03-03)"""
    items: list[WorkbookSummary]
    total: int
    skip: int
    limit: int
