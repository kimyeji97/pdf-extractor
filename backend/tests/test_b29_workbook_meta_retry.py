"""
REQ-B29 Phase 1 — 문제집 메타 저장 실패를 재시도하고, 끝내 실패하면 알린다

검증 계약: docs/plans/PLAN-B29-workbook-meta-save-failure.md `## 검증 계약`
케이스: B29-01 ~ B29-08

**PDF 는 만들어졌는데 사용자가 닿을 길이 없고 에러도 없는** 경로가 있었다.
메타 저장이 실패하면 `extract.py` 는 의도적으로 삼키고 `status = DONE` 을 유지하는데
(그 판단 자체는 옳다 — PDF 는 실제로 만들어졌다), `emit_export` 가 **`job.status` 만 보고**
severity 를 정해 **성공 알림**이 나간다. 결과 화면은 문제집 행 기준이라 그 PDF 가 안 뜨고,
REQ-F18 이 생성 화면 다운로드를 걷어내 **유일한 탈출구마저 사라졌다.**

무대는 `test_notification_hooks.py` 의 F09-03 과 같다 — `_process_extraction_v2` 를 직접
부르고 `_save_workbook_meta` 를 대역으로 갈아끼운다. **소스 스캔이 하나도 없다**:
재시도 횟수는 대역의 호출 수로, 알림은 **저장된 파일**을 읽어 본다.

⚠️ `_extract_pool` 은 ProcessPoolExecutor 라 다른 프로세스에서 돌면 monkeypatch 가
   전달되지 않는다 — `inline_extract_pool` 픽스처가 인라인 실행으로 바꾼다.
"""
import json

import pytest

from app.models.schemas import JobStatus, JobType


@pytest.fixture
def run_export(make_job, inline_extract_pool, monkeypatch):
    """
    생성 배경 작업을 돌린다. `_save_workbook_meta` 는 **앞의 `fail_times` 번만 실패**하는
    대역으로 갈아끼우고 호출 수를 센다.

    @returns  (calls, status)  — calls 는 `_save_workbook_meta` 호출 횟수
    """

    def _run(*, fail_times: int = 0, workbook_name: str | None = "테스트 문제집",
             generate_ok: bool = True, job_id: str = "job-export"):
        from app.routers import extract as extract_router
        from app.services import storage

        # 재시도 간격을 0 으로 — 안 그러면 스위트가 실제로 잔다(실측 ~4.6초, `/review` 회차 0).
        # 계획서 § 제약·함정이 "주입 가능하게 하거나 아주 짧게 둘 것" 이라 적어 둔 자리다.
        monkeypatch.setattr(extract_router, "_META_SAVE_WAIT_SEC", 0)

        make_job(job_id, job_type=JobType.EXPORT)

        if generate_ok:
            monkeypatch.setattr(
                extract_router.pdf_service, "extract_questions_v2", lambda *a, **kw: 5
            )
        else:
            def _boom(*a, **kw):
                raise RuntimeError("생성 실패")
            monkeypatch.setattr(extract_router.pdf_service, "extract_questions_v2", _boom)

        calls = {"n": 0}

        def _meta(*a, **kw):
            calls["n"] += 1
            if calls["n"] <= fail_times:
                raise RuntimeError("R2 일시 오류")

        monkeypatch.setattr(extract_router, "_save_workbook_meta", _meta)

        extract_router._process_extraction_v2(
            selections=[],
            export_job_id=job_id,
            layout="2단",
            workbook_name=workbook_name,
        )
        return calls["n"], storage.get_status(job_id)

    return _run


def _only_notification(notif_files) -> dict:
    """저장된 알림이 정확히 1건임을 확인하고 그 내용을 돌려준다."""
    files = notif_files()
    assert len(files) == 1, f"알림이 1건이어야 한다 (실제 {len(files)}건)"
    return json.loads(files[0].read_text(encoding="utf-8"))


# ── 재시도 ────────────────────────────────────────────────

def test_B29_01_한번_실패하고_두번째에_성공하면_성공_알림(run_export, notif_files):
    """근거: PLAN § 작업 단계 — "**두 번째에 성공**하면 알림이 **SUCCESS**" """
    calls, _ = run_export(fail_times=1)

    assert calls == 2                       # 재시도가 실제로 돌았다
    assert _only_notification(notif_files)["severity"] == "success"


def test_B29_05_처음부터_성공하면_재시도하지_않는다(run_export):
    """근거: PLAN § 작업 단계 — "재시도가 일어나지 않는다(호출 1회)" """
    calls, _ = run_export(fail_times=0)

    assert calls == 1


# ── 끝내 실패 ─────────────────────────────────────────────

def test_B29_02_세번_모두_실패하면_실패_알림(run_export, notif_files):
    """근거: PLAN § 작업 단계 — "**3회 모두 실패**하면 알림이 **ERROR**"

    이것이 이 REQ 의 핵심이다 — 종전에는 여기서 **성공 알림**이 나갔다.
    """
    run_export(fail_times=99)

    assert _only_notification(notif_files)["severity"] == "error"


def test_B29_03_세번_모두_실패해도_상태는_DONE(run_export):
    """근거: PLAN § 결정 — "PDF 는 실제로 만들어졌다"

    상태를 FAILED 로 뒤집으면 이력·재다운로드·통계가 전부 "실패한 작업"으로 읽는다.
    """
    _, status = run_export(fail_times=99)

    assert status.status == JobStatus.DONE


def test_B29_04_세번_모두_실패하면_사유가_남는다(run_export):
    """근거: PLAN § 작업 단계 — "`export_status.error` 에 사유가 남으며" """
    _, status = run_export(fail_times=99)

    assert status.error
    assert "메타" in status.error


# ── 구 프론트 경로 (계약 #23) ─────────────────────────────

def test_B29_06_workbook_name_이_없으면_메타를_저장하지_않는다(run_export, notif_files):
    """근거: PLAN § 작업 단계 — "**구 프론트 경로**는 메타 저장을 아예 안 하므로 영향이 없다(계약 #23)"

    저장 주체를 가르는 건 `workbook_name` 의 **유무**다. 알림은 그 분기 **바깥**이라
    구 프론트로 만든 문제집에도 와야 한다.
    """
    calls, _ = run_export(workbook_name=None)

    assert calls == 0
    assert _only_notification(notif_files)["severity"] == "success"


# ── 생성 실패와 섞이지 않는다 ─────────────────────────────

def test_B29_07_생성_실패는_기존_문구를_유지한다(run_export, notif_files):
    """근거: PLAN § 제약·함정 — "같은 알림이 된다"

    `export_status.error` 는 **생성 실패 경로에서도** 채워진다. 그걸 신호로 쓰면
    severity 는 맞게 나오는데 **문구가 뒤바뀐다.**
    """
    run_export(generate_ok=False)

    assert _only_notification(notif_files)["message"] == "문제집 생성에 실패했습니다."


def test_B29_08_메타_저장_실패는_다른_문구를_쓴다(run_export, notif_files):
    """근거: PLAN § 제약·함정 — "같은 알림이 된다"

    PDF 는 만들어졌으므로 "생성에 실패했습니다" 는 **거짓**이다.
    """
    run_export(fail_times=99)

    assert _only_notification(notif_files)["message"] != "문제집 생성에 실패했습니다."


# ── /review 회차 0 반영 ───────────────────────────────────

def test_B29_09_재시도는_같은_workbook_id_로_덮어쓴다(
    make_job, inline_extract_pool, notif_files, monkeypatch
):
    """[B29-09] 재시도가 **멱등**이다 — 같은 `workbook_id` 로 덮어쓴다.

    근거: PLAN § 제약·함정 — "재시도가 **같은 키를 덮어쓴다**"

    `_save_workbook_meta` 가 id 를 **안에서** 만들면 재시도마다 다른 키가 돼서,
    PUT 은 올라갔는데 응답에서 터지는 경우(read timeout·connection reset) 같은 PDF 의
    문제집이 이력에 **2건** 뜬다 — 계약 #23 이 "중복으로도 안 잡힌다" 고 경고한 모양이다.
    """
    from app.routers import extract as extract_router

    monkeypatch.setattr(extract_router, "_META_SAVE_WAIT_SEC", 0)
    make_job("job-export", job_type=JobType.EXPORT)
    monkeypatch.setattr(
        extract_router.pdf_service, "extract_questions_v2", lambda *a, **kw: 5
    )

    seen: list[str | None] = []

    def _meta(*args, **kwargs):
        # 호출부가 positional 로 넘기든 keyword 로 넘기든 잡는다.
        seen.append(kwargs.get("workbook_id") or (args[6] if len(args) > 6 else None))
        if len(seen) < 2:
            raise RuntimeError("R2 일시 오류")

    monkeypatch.setattr(extract_router, "_save_workbook_meta", _meta)

    extract_router._process_extraction_v2(
        selections=[], export_job_id="job-export", layout="2단", workbook_name="테스트 문제집",
    )

    assert len(seen) == 2
    assert seen[0] is not None, "호출부가 workbook_id 를 넘겨야 한다 — 안 넘기면 함수가 매번 새로 만든다"
    assert seen[0] == seen[1], f"재시도가 다른 키를 썼다: {seen}"


def test_B29_10_메타_실패는_제목으로도_드러난다(run_export, notif_files):
    """[B29-10] 힌트가 **`title` 에** 있다 — `message` 는 사용자에게 안 닿는다.

    근거: PLAN § 결정 — "힌트는 `title` 에 섞는다"

    `NotificationSnackbar`·`NotificationBell` 둘 다 `title` 만 그린다 — 생성 화면을 떠난
    사용자(이 REQ 가 상정한 그 사용자)에게 `message` 는 영영 안 보인다.
    """
    run_export(fail_times=99)

    assert "이력 등록 실패" in _only_notification(notif_files)["title"]


def test_B29_11_생성_실패_제목에는_이력_힌트가_없다(run_export, notif_files):
    """[B29-11] 생성 실패는 제목이 그대로다 — 두 실패가 섞이면 안 된다.

    근거: PLAN § 제약·함정 — "같은 알림이 된다"
    """
    run_export(generate_ok=False)

    assert "이력 등록 실패" not in _only_notification(notif_files)["title"]
