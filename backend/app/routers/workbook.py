"""
GET  /api/workbooks          - 문제집 이력 목록 (REQ-21)
GET  /api/workbooks/{id}     - 문제집 메타데이터 단건 (REQ-20 편집 복원)
POST /api/workbooks          - 문제집 메타데이터 저장 (extract-v2 완료 후 프론트에서 호출)

저장 트리거:
  extract-v2 DONE 확인 후 프론트엔드가 POST /api/workbooks를 호출하여 저장한다.
  백그라운드 자동 저장이 아닌 프론트 주도 저장 방식을 채택한 이유:
    extract-v2는 PDF만 생성하고 selections/layout 정보를 모르기 때문.
    이 정보는 프론트엔드 상태에만 있어 직접 POST로 전달해야 한다.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.schemas import WorkbookMeta, WorkbookSelectionItem
from app.services import storage

router = APIRouter()


@router.get("/workbooks", response_model=list[WorkbookMeta])
def list_workbooks():
    """
    생성된 문제집 이력 전체를 created_at 내림차순으로 반환한다 (REQ-21).
    WorkbookHistoryView에서 목록을 표시할 때 사용한다.
    """
    raw_list = storage.list_workbooks()
    result = []
    for w in raw_list:
        try:
            # 저장된 JSON dict를 WorkbookMeta 모델로 변환
            # selections 내부의 dict도 WorkbookSelectionItem으로 변환
            w["selections"] = [WorkbookSelectionItem(**s) for s in w.get("selections", [])]
            result.append(WorkbookMeta(**w))
        except Exception:
            continue   # 손상된 파일은 조용히 스킵
    return result


@router.get("/workbooks/{workbook_id}", response_model=WorkbookMeta)
def get_workbook(workbook_id: str):
    """
    문제집 메타데이터 단건 반환 (REQ-20).
    WorkbookEditorView의 "기존 문제집 불러오기"에서 selections, layout 복원에 사용.
    """
    data = storage.get_workbook(workbook_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"문제집 {workbook_id}를 찾을 수 없습니다.")
    data["selections"] = [WorkbookSelectionItem(**s) for s in data.get("selections", [])]
    return WorkbookMeta(**data)


class WorkbookCreateRequest(BaseModel):
    """
    POST /api/workbooks 요청 바디.
    workbook_id, created_at은 서버에서 자동 생성하므로 선택 필드로 처리한다.
    """
    workbook_id: Optional[str] = None
    created_at: Optional[datetime] = None
    layout: str
    selections: list[WorkbookSelectionItem]
    result_job_id: str
    question_count: int
    filename: Optional[str] = None    # REQ-C01: 사용자 입력 파일명


@router.post("/workbooks", response_model=WorkbookMeta, status_code=201)
def create_workbook(body: WorkbookCreateRequest):
    """
    문제집 메타데이터를 저장한다.
    extract-v2 DONE 확인 후 프론트엔드가 호출한다.

    저장 경로: local_storage/workbooks/{workbook_id}.json
    이력 목록(GET /api/workbooks)과 편집 복원(GET /api/workbooks/{id})에서 재사용된다.
    """
    workbook_id = body.workbook_id or str(uuid.uuid4())
    created_at  = body.created_at  or datetime.now(timezone.utc)

    meta = WorkbookMeta(
        workbook_id=workbook_id,
        created_at=created_at,
        layout=body.layout,
        selections=body.selections,
        result_job_id=body.result_job_id,
        question_count=body.question_count,
        filename=body.filename,
    )
    storage.save_workbook(workbook_id, meta.model_dump(mode="json"))
    return meta
