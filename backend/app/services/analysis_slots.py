"""
백그라운드 분석(문항 감지 + 썸네일 프리워밍) 동시 실행 한도 (REQ-B17 Phase 2)

업로드·재감지마다 백그라운드 작업이 하나씩 붙는데 한도가 없어, 큰 PDF 여러 개가 겹치면 1GB 태스크가
OOM 으로 죽었다(2026-09-28 dev). 초과분은 `QUEUED` 로 두고 슬롯이 날 때까지 기다린다.

⚠️ **태스크가 1개라는 전제다** — 세마포어도, 시작 시 전환(`fail_interrupted`)도 프로세스 단위다.
   태스크를 여럿 띄우면 전역 동시 수는 `태스크 수 × MAX_CONCURRENT` 가 되고, 새 태스크가 뜰 때
   다른 태스크가 돌리던 정상 작업까지 FAILED 로 찍는다(PLAN-B17 § 운영 환경 참고).
"""
import logging
import os
import sys
import threading
from concurrent.futures import ProcessPoolExecutor

from app.models.schemas import BoundariesStatus
from app.services import notification_service, storage

logger = logging.getLogger(__name__)

# ponytail: 인프로세스 세마포어 — 태스크를 여럿 띄우면 작업별 소유 태스크·하트비트로 바꿀 것
MAX_CONCURRENT = 5
slots = threading.BoundedSemaphore(MAX_CONCURRENT)

# 감지 계산만 별도 프로세스에서 (REQ-P06 Phase 6) — 같은 프로세스 스레드로 돌면 GIL 을 다퉈 분석 중 API 가
# 느려졌다(피크 ① questions_all p90 1.41s, /health 0.09 → 0.33s). 크기 = 슬롯 수라 슬롯을 잡은 작업은 바로 돈다.
# ⚠️ 자식은 `pdf_path → 경계 목록` 만 계산한다. 상태·캐시·알림 쓰기는 부모에서 — s3_service 메모리 캐시는
#    같은 프로세스의 저장만 안다. 테스트는 conftest 의 `inline_detect_pool` 이 인라인으로 바꾼다.
# 우선순위는 가장 낮게 — 프로세스로 나누자 감지 5건이 vCPU 2개를 다 써(CPU 57% → 99%) API 가 CPU 를 다퉜다.
# CPU 가 바쁠 때 API 가 먼저 받고, 감지는 남는 CPU 를 쓴다.
# 썸네일 프리워밍(PyMuPDF 렌더링 + 썸네일 R2 저장)도 이 풀에서 돈다 — 부모에 두면 API 와 GIL 을 다툰다.
def _init_worker() -> None:
    os.nice(19)
    s3 = sys.modules.get("app.services.s3_service")
    if s3 is not None:   # fork 로 복사된 부모의 boto3 연결 풀을 나눠 쓰지 않는다
        s3.r2 = s3._make_client()


detect_pool = ProcessPoolExecutor(max_workers=MAX_CONCURRENT, initializer=_init_worker)

_INTERRUPTED_MESSAGE = "서버가 재시작되어 분석이 중단되었습니다. 재감지해 주세요."


def fail_interrupted() -> None:
    """
    서버 시작 시 `QUEUED`·`PROCESSING` 으로 남은 job 을 `FAILED` 로 바꾸고 실패 알림을 보낸다.

    둘 다 인메모리 백그라운드 작업이라 프로세스가 죽으면 이어받을 주체가 없다. `PENDING`(업로드 notify 전)은
    재시작돼도 notify 가 오면 진행되므로 건드리지 않는다.
    """
    for job in storage.list_jobs():
        if job.boundaries_status not in (BoundariesStatus.QUEUED, BoundariesStatus.PROCESSING):
            continue
        job.boundaries_status = BoundariesStatus.FAILED
        job.error = _INTERRUPTED_MESSAGE
        storage.put_status(job)
        notification_service.emit_detection(job)
        logger.warning("[startup] 중단된 분석을 FAILED 로 전환 | job_id=%s", job.job_id)
