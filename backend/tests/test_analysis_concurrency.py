"""
REQ-B17 Phase 2 — 백그라운드 분석 동시 5개 + `QUEUED` + 서버 시작 시 FAILED·알림 + 통계 검증 계약

검증 계약: docs/plans/PLAN-B17-analysis-oom.md `## 검증 계약`
케이스: B17-06 ~ B17-17

무대:
  - 감지는 `test_notification_hooks.py` 처럼 `_trigger_boundary_detection`(최초 감지 — notify·direct 두 진입점이
    공유)을 직접 부르고, 재감지는 실제 라우트(`POST /api/jobs/{id}/refresh`)로 부른다.
  - 동시성은 **감지 대역이 이벤트를 기다리며 멈추게** 만들고 여러 스레드로 흘려 관찰한다. 대역은
    `stub_detection` 이 이미 바꿔 둔 라우터 모듈 이름(`detect_question_boundaries`)을 다시 덮는다.
    "6번째가 안 들어갔다"는 부정 관찰이라 짧은 유예(`SETTLE`) 뒤에 본다.
  - `QUEUED` 는 아직 enum 에 없다 — 상태 파일을 **raw JSON** 으로 심고 읽어 문자열로 비교해,
    구현 전에는 import 가 아니라 단언(또는 요청)에서 빨갛게 한다.
  - B17-13·16 은 구현 전에도 녹색일 수 있는 **가드**다(바뀌면 안 되는 것을 지킨다).
  - 서버 시작 처리는 `with TestClient(app):`(lifespan)로 관찰한다. 공용 `client` 픽스처는 컨텍스트 없이
    만들어지므로 다른 테스트에는 시작 처리가 끼어들지 않는다.
  - 통계 필드·상세 field 이름 `queued_count` 는 계획서가 정하지 않아 `/testgen` 승인으로 고정했다.

⚠️ 모든 케이스는 끝에서 막아 둔 이벤트를 풀고 스레드를 join 한다 — 세마포어가 모듈 전역이면
   풀지 않은 슬롯이 다음 테스트로 새어 무관한 케이스를 멈춰 세운다.
"""
import json
import threading
import time
from datetime import datetime, timezone

import pytest

from app.routers import browse as browse_router
from app.routers import upload as upload_router
from app.utils.question_parser import QuestionBoundary

LIMIT = 5
SETTLE = 0.3     # "시작하지 않았다"를 보기 위한 유예(초)
TIMEOUT = 5.0


def _write_status(isolated_storage, job_id, boundaries_status, job_type="SOURCE"):
    body = {
        "job_id": job_id,
        "status": "DONE",
        "filename": f"{job_id}.pdf",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "job_type": job_type,
        "boundaries_status": boundaries_status,
    }
    path = isolated_storage / "status" / f"{job_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(body), encoding="utf-8")


def _read_status(isolated_storage, job_id):
    path = isolated_storage / "status" / f"{job_id}.json"
    return json.loads(path.read_text(encoding="utf-8"))["boundaries_status"]


class BlockingDetection:
    """들어온 수를 세고, `release` 가 켜질 때까지 멈춰 있는 감지 대역."""

    def __init__(self):
        self.entered = 0
        self.lock = threading.Condition()
        self.release = threading.Event()

    def __call__(self, pdf_path):
        with self.lock:
            self.entered += 1
            self.lock.notify_all()
        self.release.wait(TIMEOUT)
        return [
            QuestionBoundary(number=1, page_index=0, y_top=0.0, y_bottom=90.0,
                             col=0, col_x0=50.0, col_x1=545.0)
        ]

    def wait_entered(self, n):
        with self.lock:
            return self.lock.wait_for(lambda: self.entered >= n, TIMEOUT)


@pytest.fixture
def blocking(monkeypatch, stub_detection, fake_pdf):
    stub_detection()
    det = BlockingDetection()
    for mod in (upload_router, browse_router):
        monkeypatch.setattr(mod, "detect_question_boundaries", det)
    yield det
    det.release.set()


def _start_uploads(make_job, job_ids):
    threads = []
    for jid in job_ids:
        make_job(jid)
        t = threading.Thread(target=upload_router._trigger_boundary_detection, args=(jid,), daemon=True)
        t.start()
        threads.append(t)
    return threads


def _join(threads):
    for t in threads:
        t.join(TIMEOUT)


# ── B17-06~08 : 최초 감지 동시 5개 ───────────────────────────

def test_B17_06_6건을_흘리면_감지에_들어간_것은_5건(blocking, make_job):
    """근거: PLAN § 작업 단계 — "6번째 분석은 앞 작업 하나가 끝날 때까지 시작하지 않고" """
    threads = _start_uploads(make_job, [f"b17-06-{i}" for i in range(LIMIT + 1)])
    blocking.wait_entered(LIMIT)
    time.sleep(SETTLE)
    entered = blocking.entered
    blocking.release.set()
    _join(threads)

    assert entered == LIMIT


def test_B17_07_기다리는_6번째_job은_QUEUED(blocking, make_job, isolated_storage):
    """근거: PLAN § 작업 단계 — "그동안 `QUEUED`다" """
    ids = [f"b17-07-{i}" for i in range(LIMIT + 1)]
    threads = _start_uploads(make_job, ids)
    blocking.wait_entered(LIMIT)
    time.sleep(SETTLE)
    statuses = [_read_status(isolated_storage, j) for j in ids]
    blocking.release.set()
    _join(threads)

    assert sorted(statuses) == ["PROCESSING"] * LIMIT + ["QUEUED"]


def test_B17_08_막힌_5건을_풀면_6건_모두_DONE(blocking, make_job, isolated_storage):
    """근거: PLAN § 범위 — "초과분은 앞 작업이 끝날 때까지 대기" """
    ids = [f"b17-08-{i}" for i in range(LIMIT + 1)]
    threads = _start_uploads(make_job, ids)
    blocking.wait_entered(LIMIT)
    blocking.release.set()
    _join(threads)

    assert [_read_status(isolated_storage, j) for j in ids] == ["DONE"] * (LIMIT + 1)


# ── B17-09·10 : 재감지도 같은 한도 · QUEUED 중복 차단 ─────────────

def test_B17_09_슬롯이_찬_상태의_재감지는_QUEUED로_기다린다(blocking, make_job, authed_client, isolated_storage):
    """근거: PLAN § 작업 단계 — "(업로드 notify·direct·재감지 공통)" """
    threads = _start_uploads(make_job, [f"b17-09-{i}" for i in range(LIMIT)])
    blocking.wait_entered(LIMIT)
    make_job("b17-09-refresh")
    t = threading.Thread(
        target=authed_client.post, args=("/api/jobs/b17-09-refresh/refresh",), daemon=True
    )
    t.start()
    time.sleep(SETTLE)
    status = _read_status(isolated_storage, "b17-09-refresh")
    blocking.release.set()
    _join(threads + [t])

    assert status == "QUEUED"


def test_B17_10_QUEUED_job에_재감지를_걸면_감지가_돌지_않는다(
    monkeypatch, stub_detection, fake_pdf, authed_client, isolated_storage
):
    """근거: PLAN § 작업 단계 — "재감지는 `QUEUED`일 때도 중복 요청으로 거른다" """
    stub_detection()
    calls = []
    monkeypatch.setattr(browse_router, "detect_question_boundaries", lambda p: calls.append(p) or [])
    _write_status(isolated_storage, "b17-10", "QUEUED")

    authed_client.post("/api/jobs/b17-10/refresh")

    assert calls == []


# ── B17-11 : 세마포어는 prewarm 까지 감싼다 ─────────────────────

def test_B17_11_prewarm에서_5건이_막혀_있으면_6번째_감지가_시작되지_않는다(
    monkeypatch, stub_detection, fake_pdf, make_job
):
    """근거: PLAN § 제약·함정 — "세마포어는 **감지 + prewarm 전체**를 감싸야 한다" """
    stub_detection()
    entered = []
    in_prewarm = threading.Semaphore(0)
    release = threading.Event()

    def fast_detect(pdf_path):
        entered.append(pdf_path)
        return [QuestionBoundary(number=1, page_index=0, y_top=0.0, y_bottom=90.0,
                                 col=0, col_x0=50.0, col_x1=545.0)]

    def blocking_prewarm(*args, **kwargs):
        in_prewarm.release()
        release.wait(TIMEOUT)

    monkeypatch.setattr(upload_router, "detect_question_boundaries", fast_detect)
    monkeypatch.setattr(upload_router.prewarm_service, "prewarm_all_thumbnails", blocking_prewarm)

    threads = _start_uploads(make_job, [f"b17-11-{i}" for i in range(LIMIT + 1)])
    for _ in range(LIMIT):
        in_prewarm.acquire(timeout=TIMEOUT)
    time.sleep(SETTLE)
    count = len(entered)
    release.set()
    _join(threads)

    assert count == LIMIT


# ── B17-12~14 : 서버 시작 시 멈춘 작업 → FAILED + 실패 알림 ───────

def _start_app():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app):
        pass


def test_B17_12_시작_시_QUEUED_PROCESSING은_FAILED(isolated_storage):
    """근거: PLAN § 작업 단계 — "서버 시작 시 `QUEUED`·`PROCESSING` job이 `FAILED`로 바뀌고" """
    _write_status(isolated_storage, "b17-12-q", "QUEUED")
    _write_status(isolated_storage, "b17-12-p", "PROCESSING")

    _start_app()

    assert [_read_status(isolated_storage, j) for j in ("b17-12-q", "b17-12-p")] == ["FAILED", "FAILED"]


@pytest.mark.parametrize("status", ["PENDING", "DONE", "FAILED"])
def test_B17_13_시작_시_PENDING_DONE_FAILED는_그대로(isolated_storage, status):
    """근거: PLAN § 작업 단계 — "`PENDING`·`DONE`·`FAILED` job은 그대로다" """
    _write_status(isolated_storage, "b17-13", status)

    _start_app()

    assert _read_status(isolated_storage, "b17-13") == status


def test_B17_14_시작_시_전환한_job마다_실패_알림_1건(isolated_storage, notif_files, read_notif):
    """근거: PLAN § 작업 단계 — "job마다 감지 실패 알림이 1건 발행되며" """
    _write_status(isolated_storage, "b17-14-q", "QUEUED")
    _write_status(isolated_storage, "b17-14-p", "PROCESSING")
    _write_status(isolated_storage, "b17-14-d", "DONE")

    _start_app()

    got = sorted((read_notif(p)["job_id"], read_notif(p)["severity"]) for p in notif_files())
    assert got == [("b17-14-p", "error"), ("b17-14-q", "error")]


# ── B17-15~17 : 통계 ─────────────────────────────────────────

def test_B17_15_stats_queued_count는_QUEUED_job_수(authed_client, isolated_storage):
    """근거: PLAN § 작업 단계 — "`/api/stats`가 `QUEUED` 개수를" """
    _write_status(isolated_storage, "b17-15-q1", "QUEUED")
    _write_status(isolated_storage, "b17-15-q2", "QUEUED")
    _write_status(isolated_storage, "b17-15-p", "PROCESSING")

    assert authed_client.get("/api/stats").json().get("queued_count") == 2


def test_B17_16_stats_processing_count는_QUEUED를_세지_않는다(authed_client, isolated_storage):
    """근거: PLAN § 결정 — "기존 \"분석중 파일수\"는 `PROCESSING`만 그대로" """
    _write_status(isolated_storage, "b17-16-q", "QUEUED")
    _write_status(isolated_storage, "b17-16-p", "PROCESSING")

    assert authed_client.get("/api/stats").json()["processing_count"] == 1


def test_B17_17_stats_detail_queued_count는_QUEUED_job_목록만(authed_client, isolated_storage):
    """근거: PLAN § 작업 단계 — "`/api/stats/detail`이 그 파일 목록을 준다" """
    _write_status(isolated_storage, "b17-17-q", "QUEUED")
    _write_status(isolated_storage, "b17-17-p", "PROCESSING")

    res = authed_client.get("/api/stats/detail", params={"field": "queued_count"})

    assert [item["job_id"] for item in res.json().get("items", [])] == ["b17-17-q"]
