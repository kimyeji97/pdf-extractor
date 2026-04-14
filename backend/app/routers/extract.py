"""
POST /api/extract         - 문항 추출 작업 시작 (백그라운드)
GET  /api/status/{job_id} - 작업 상태 조회
"""
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import (
    ExtractRequest, ExtractResponse,
    StatusResponse, JobStatus, JobStatusFile,
)
from app.services import storage, pdf_service

router = APIRouter()


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

            count = pdf_service.extract_questions(
                input_pdf_path=input_path,
                question_numbers_raw=status_file.question_numbers,
                output_pdf_path=output_path,
            )

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
