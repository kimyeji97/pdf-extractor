"""
POST /api/extract         - 문항 추출 작업 시작 (백그라운드)
GET  /api/status/{job_id} - 작업 상태 조회
POST /api/extract-v2      - 복수 선택 문항 추출 작업 시작 (백그라운드)
"""
import tempfile
import uuid
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import (
    ExtractRequest, ExtractResponse,
    StatusResponse, JobStatus, JobStatusFile, JobType,
    SelectionItem, ExtractV2Request, ExtractV2Response,
)
from app.services import storage, pdf_service

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
    background_tasks.add_task(_process_extraction_v2, req.selections, export_job_id, layout, cover_id)
    return ExtractV2Response(job_id=export_job_id)


def _process_extraction_v2(
    selections: list[SelectionItem],
    export_job_id: str,
    layout: str = "2단",
    cover_id: str | None = None,
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

        except Exception as e:
            export_status.status = JobStatus.FAILED
            export_status.error = str(e)

        finally:
            storage.put_status(export_status)
