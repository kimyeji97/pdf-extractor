"""
POST /api/extract         - 문항 추출 작업 시작 (백그라운드)
GET  /api/status/{job_id} - 작업 상태 조회
POST /api/extract-v2      - 복수 선택 문항 추출 작업 시작 (백그라운드)
"""
import tempfile
import uuid
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import (
    ExtractRequest, ExtractResponse,
    StatusResponse, JobStatus, JobStatusFile, JobType,
    SelectionItem, ExtractV2Request, ExtractV2Response,
    WorkbookMeta, WorkbookSelectionItem,
)
from app.services import storage, pdf_service, notification_service

router = APIRouter()

# CPU-bound PDF 처리(pdfplumber 파싱 + PyMuPDF 렌더링)를 메인 프로세스의 GIL 밖으로
# 분리한다 (REQ-P03-04). BackgroundTasks는 sync 함수를 threadpool에서 실행할 뿐이라
# CPU 작업이 GIL을 점유하는 동안 메인 이벤트 루프·다른 요청 처리가 지연될 수 있었다.
# ECS Fargate 0.5 vCPU 환경을 고려해 워커 수는 2로 제한.
_extract_pool = ProcessPoolExecutor(max_workers=2)


# ── 추출 요청 ─────────────────────────────────────────────

@router.post("/extract", response_model=ExtractResponse)
def start_extract(req: ExtractRequest, background_tasks: BackgroundTasks):
    status_file = storage.get_status(req.job_id)
    if status_file is None:
        raise HTTPException(status_code=404, detail="job_id를 찾을 수 없습니다.")
    if status_file.status not in (JobStatus.PENDING,):
        raise HTTPException(
            status_code=409,
            detail=f"이미 처리 중이거나 완료된 작업입니다. (현재 상태: {status_file.status})"
        )

    status_file.status = JobStatus.PROCESSING
    status_file.question_numbers = req.question_numbers
    storage.put_status(status_file)

    background_tasks.add_task(_process_extraction, req.job_id, status_file)
    return ExtractResponse(job_id=req.job_id)


# ── 상태 조회 ─────────────────────────────────────────────

@router.get("/status/{job_id}", response_model=StatusResponse)
def get_status(job_id: str):
    status_file = storage.get_status(job_id)
    if status_file is None:
        raise HTTPException(status_code=404, detail="job_id를 찾을 수 없습니다.")

    download_url = None
    if status_file.status == JobStatus.DONE and status_file.result_key:
        download_url = storage.generate_download_presigned_url(status_file.result_key)

    return StatusResponse(
        job_id=job_id,
        status=status_file.status,
        download_url=download_url,
        error=status_file.error,
        extracted_count=status_file.extracted_count,
    )


# ── 백그라운드 처리 ───────────────────────────────────────

def _process_extraction(job_id: str, status_file: JobStatusFile) -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = str(Path(tmpdir) / "original.pdf")
        output_path = str(Path(tmpdir) / "result.pdf")

        try:
            storage.download_file(status_file.original_key, input_path)

            # CPU-bound 파싱/크롭을 별도 프로세스로 분리 (REQ-P03-04)
            count = _extract_pool.submit(
                pdf_service.extract_questions,
                input_path,
                status_file.question_numbers,
                output_path,
            ).result()

            res_key = storage.result_key(job_id)
            storage.upload_file(output_path, res_key)

            status_file.status = JobStatus.DONE
            status_file.result_key = res_key
            status_file.extracted_count = count

        except Exception as e:
            status_file.status = JobStatus.FAILED
            status_file.error = str(e)

        finally:
            storage.put_status(status_file)


# ── v2 추출 요청 ─────────────────────────────────────────────

@router.post("/extract-v2", response_model=ExtractV2Response)
def start_extract_v2(req: ExtractV2Request, background_tasks: BackgroundTasks):
    """
    복수 job/page/question 선택으로부터 새 PDF 추출.
    새 export_job_id를 생성하여 PENDING 상태로 저장 후 백그라운드 태스크 시작.
    req.layout 으로 그리드 레이아웃 지정 가능 (REQ-18).
    """
    export_job_id = str(uuid.uuid4())

    export_status = JobStatusFile(
        job_id=export_job_id,
        status=JobStatus.PENDING,
        job_type=JobType.EXPORT,
    )
    storage.put_status(export_status)

    # layout 파라미터를 백그라운드 태스크로 전달 (기본값 "2단")
    layout = req.layout or "2단"
    cover_id = req.cover_id
    background_tasks.add_task(
        _process_extraction_v2, req.selections, export_job_id, layout, cover_id, req.workbook_name
    )
    return ExtractV2Response(job_id=export_job_id)


def _save_workbook_meta(
    selections: list[SelectionItem],
    export_job_id: str,
    layout: str,
    workbook_name: str,
) -> None:
    """
    생성 **성공** 직후 문제집 메타를 저장한다 (REQ-B10).

    종전에는 프론트가 폴링으로 DONE을 확인한 뒤 POST /api/workbooks 를 호출해 저장했는데,
    그 폴링이 화면 수명에 묶여 있어 **생성 중 화면을 떠나면 PDF만 남고 메타가 사라졌다**
    (이력에 안 뜨고 결과물은 고아가 된다). 저장 주체를 서버로 옮겨 프론트 수명과 분리한다.
    → CLAUDE.md 계약 #22.

    실패 시에는 호출되지 않는다 — 이력에 미완성 항목이 노출되지 않게 하려는 의도적 선택이다.
    """
    meta = WorkbookMeta(
        workbook_id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc),
        layout=layout,
        selections=[
            WorkbookSelectionItem(
                question_id=s.question_id,
                job_id=s.job_id,
                page_num=s.page_num,
                question_num=s.question_num,
                manual_id=s.manual_id,
                title=s.label,              # 추출 라벨과 저장 타이틀은 같은 값이다
                workbook_name=s.workbook_name,
                source_filename=s.source_filename,
                scale=s.scale,
            )
            for s in selections
        ],
        result_job_id=export_job_id,
        question_count=len(selections),
        # 프론트가 종전부터 두 필드에 같은 값을 보내 왔다. 서버도 그대로 따른다.
        filename=workbook_name,
        name=workbook_name,
    )
    storage.save_workbook(meta.workbook_id, meta.model_dump(mode="json"))


def _process_extraction_v2(
    selections: list[SelectionItem],
    export_job_id: str,
    layout: str = "2단",
    cover_id: str | None = None,
    workbook_name: str | None = None,
) -> None:
    export_status = storage.get_status(export_job_id)
    export_status.status = JobStatus.PROCESSING
    storage.put_status(export_status)

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            # CPU-bound 파싱/크롭/그리드 빌드를 별도 프로세스로 분리 (REQ-P03-04)
            count = _extract_pool.submit(
                pdf_service.extract_questions_v2,
                selections,
                export_job_id,
                tmpdir,
                layout,
                cover_id,
            ).result()
            export_status.status = JobStatus.DONE
            export_status.result_key = storage.result_key(export_job_id)
            export_status.extracted_count = count

            # workbook_name 의 **유무**가 저장 주체를 가른다 (REQ-B10 Phase 1 결정):
            #   있음 → 새 프론트. 여기서 저장한다(프론트는 저장하지 않는다).
            #   없음 → 구 프론트. 저장하지 않는다(프론트가 POST /api/workbooks 로 직접 저장).
            # 이 분기가 없으면 백엔드 배포 후 프론트 배포 전까지 양쪽이 모두 저장해
            # 같은 문제집이 이력에 2건 뜨고, 그중 하나는 이름이 없다.
            if workbook_name:
                try:
                    _save_workbook_meta(selections, export_job_id, layout, workbook_name)
                except Exception as e:
                    # 메타 저장 실패가 "PDF 생성 실패"로 둔갑하면 안 된다 — PDF는 이미 만들어졌다.
                    # 상태는 DONE으로 두고 사유만 남긴다.
                    export_status.error = f"문제집 메타 저장 실패: {e}"

        except Exception as e:
            export_status.status = JobStatus.FAILED
            export_status.error = str(e)

        finally:
            storage.put_status(export_status)

            # 완료 알림 (REQ-F09). ⚠️ `if workbook_name:` **바깥**이다 —
            # 그 분기는 메타 저장 주체를 가르는 것(계약 #23)이지 알림과는 목적이 다르다.
            # 안쪽에 넣으면 구 프론트로 만든 문제집은 영원히 알림이 안 온다.
            notification_service.emit_export(export_status, workbook_name)
