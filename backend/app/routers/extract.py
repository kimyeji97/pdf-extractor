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
from app.routers.template import is_empty
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

def _resolve_assets(req: ExtractV2Request) -> tuple[str | None, str | None, str | None]:
    """요청의 표지·각주·워터마크를 **요청 시점에** 확정하고 참조가 살아 있는지 검증한다.

    두 가지를 여기서 한다 — 둘 다 백그라운드가 아니라 **이 동기 핸들러**에서 해야 한다.

    ① **resolve** — `template_id`가 있으면 그 템플릿의 슬롯 3개로 푼다. 여기서 확정하므로
       이후 템플릿을 고쳐도 **진행 중인 생성엔 영향이 없다**(계획서 § 결정 "참조 해석 시점").
       `template_id`가 없으면 직접 id를 그대로 쓴다 — 구 프론트 호환 경로다.

    ② **검증(E)** — 끊어진 참조면 400. `template_id` 경로만이 아니라 **직접 id 경로에도**
       적용한다: "표지를 골랐는데 표지 없이 나온 PDF"가 실패보다 나쁘기 때문이다 —
       사용자는 다운로드해 열기 전까지 모른다(계획서 § 결정 "E의 적용 범위").

    ⚠️ 백그라운드에 들어간 뒤에는 알릴 방법이 알림뿐이고 이미 PDF가 만들어진 뒤라
       되돌리기 번거롭다. 그래서 **진입 전에** 거절하고, export job 도 만들지 않는다.
    """
    if req.template_id:
        template = storage.get_template_meta(req.template_id)
        if template is None:
            raise HTTPException(status_code=400, detail="템플릿을 찾을 수 없습니다.")
        if is_empty(template):
            raise HTTPException(
                status_code=400,
                detail="이 템플릿은 구성이 비어 있습니다. 템플릿 관리에서 구성을 확인해 주세요.",
            )
        cover_id = template.get("cover_id")
        footnote_id = template.get("footnote_id")
        watermark_id = template.get("watermark_id")
    else:
        cover_id, footnote_id, watermark_id = req.cover_id, req.footnote_id, req.watermark_id

    if cover_id and storage.get_cover_meta(cover_id) is None:
        raise HTTPException(status_code=400, detail="표지를 찾을 수 없습니다. 삭제되었을 수 있습니다.")
    if footnote_id and storage.get_footnote_meta(footnote_id) is None:
        raise HTTPException(status_code=400, detail="각주를 찾을 수 없습니다. 삭제되었을 수 있습니다.")
    if watermark_id and storage.get_watermark_meta(watermark_id) is None:
        raise HTTPException(status_code=400, detail="워터마크를 찾을 수 없습니다. 삭제되었을 수 있습니다.")

    return cover_id, footnote_id, watermark_id


@router.post("/extract-v2", response_model=ExtractV2Response)
def start_extract_v2(req: ExtractV2Request, background_tasks: BackgroundTasks):
    """
    복수 job/page/question 선택으로부터 새 PDF 추출.
    새 export_job_id를 생성하여 PENDING 상태로 저장 후 백그라운드 태스크 시작.
    req.layout 으로 그리드 레이아웃 지정 가능 (REQ-18).
    """
    # ⚠️ **job 생성보다 먼저 검증한다.** 거절인데 job 만 남으면 결과 목록에 영원히
    #    PENDING 인 유령이 쌓인다 (계획서 Phase 1 완료 기준).
    cover_id, footnote_id, watermark_id = _resolve_assets(req)

    export_job_id = str(uuid.uuid4())

    export_status = JobStatusFile(
        job_id=export_job_id,
        status=JobStatus.PENDING,
        job_type=JobType.EXPORT,
    )
    storage.put_status(export_status)

    # layout 파라미터를 백그라운드 태스크로 전달 (기본값 "2단")
    layout = req.layout or "2단"
    background_tasks.add_task(
        _process_extraction_v2, req.selections, export_job_id, layout, cover_id,
        req.workbook_name, footnote_id, watermark_id, req.template_id,
    )
    return ExtractV2Response(job_id=export_job_id)


def _save_workbook_meta(
    selections: list[SelectionItem],
    export_job_id: str,
    layout: str,
    workbook_name: str,
    template_id: str | None = None,
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
        # REQ-30: 이력 → 편집 복원 시 템플릿을 되살리는 근거.
        template_id=template_id,
    )
    storage.save_workbook(meta.workbook_id, meta.model_dump(mode="json"))


def _process_extraction_v2(
    selections: list[SelectionItem],
    export_job_id: str,
    layout: str = "2단",
    cover_id: str | None = None,
    workbook_name: str | None = None,
    footnote_id: str | None = None,
    watermark_id: str | None = None,
    template_id: str | None = None,
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
                footnote_id,
                watermark_id,
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
                    _save_workbook_meta(
                        selections, export_job_id, layout, workbook_name, template_id
                    )
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
