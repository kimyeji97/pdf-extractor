"""
REQ-F09 Phase 1 — 알림 **조회·읽음 API** 검증 계약

검증 계약: docs/plans/PLAN-F09-completion-notification.md `## 검증 계약`
케이스: F09-04 · F09-05 · F09-09 · F09-10 · F09-11 · F09-12 · F09-13 · F09-14 · F09-17

계획서가 고정한 표면:
    GET  /api/notifications?since=<ISO>   — 알림 피드 (폴링 대상, 1개)
    POST /api/notifications/read          — 읽음 커서 갱신 (전체 읽음)

응답 봉투는 계획서가 정하지 않았으므로 **이 파일이 검증 계약으로 고정한다**:
    {"notifications": [ {job_id, created_at, severity, ...}, ... ], "unread_count": int}

알림 파일은 `write_notif` 픽스처로 **직접 심는다** — 쓰기 훅을 거치지 않는다.
조회 케이스가 쓰기 훅에 의존하면 훅이 깨졌을 때 조회까지 같이 빨개져
`/testrun` 의 원인 분류가 불가능해진다.
"""


# ── 정상 ──────────────────────────────────────────────────

def test_F09_04_since_이후_알림만_반환한다(client, write_notif, days_ago):
    """근거: PLAN § 결정 — "**알림 피드 1개**" """
    write_notif("job-old", days_ago(3))
    write_notif("job-new", days_ago(1))

    res = client.get("/api/notifications", params={"since": days_ago(2).isoformat()})

    assert res.status_code == 200
    assert [n["job_id"] for n in res.json()["notifications"]] == ["job-new"]


def test_F09_05_커서_갱신후_미읽음이_0이_된다(client, write_notif, days_ago):
    """근거: PLAN § 결정 — "**팝오버 열면 전체 읽음**" """
    write_notif("job-a", days_ago(2))
    write_notif("job-b", days_ago(1))
    assert client.get("/api/notifications").json()["unread_count"] == 2

    client.post("/api/notifications/read")

    assert client.get("/api/notifications").json()["unread_count"] == 0


# ── 회귀 ──────────────────────────────────────────────────

def test_F09_09_신규가_없으면_알림_파일을_읽지_않는다(
    client, write_notif, days_ago, monkeypatch, isolated_storage
):
    """근거: PLAN § 제약·함정 — "(평상시 GET 0회)"

    `list_workbooks()` 패턴(전체 glob → 전량 read)을 알림에 베끼면 R2 에서
    매 폴링마다 LIST + N GET 이 돌고 30일치가 쌓일수록 N 이 자란다.
    키 이름만으로 신규를 판정해야 한다 — 평상시 개별 파일 읽기는 0회다.
    """
    from pathlib import Path

    write_notif("job-a", days_ago(2))
    write_notif("job-b", days_ago(1))

    notif_root = isolated_storage / "notifications"
    reads: list[str] = []
    original_read_text = Path.read_text

    def _spy(self, *args, **kwargs):
        if self.is_relative_to(notif_root) and self.name != "read_cursor.json":
            reads.append(self.name)
        return original_read_text(self, *args, **kwargs)

    monkeypatch.setattr(Path, "read_text", _spy)

    # 마지막 알림 이후를 since 로 준다 → 신규 0건
    res = client.get("/api/notifications", params={"since": days_ago(0).isoformat()})

    assert res.status_code == 200
    assert reads == []


# ── 경계 ──────────────────────────────────────────────────

def test_F09_10_보관_경계_29일은_포함_31일은_제외(client, write_notif, days_ago):
    """근거: PLAN § 결정 — "**오늘 기준 최근 30일** (읽음 여부 무관)" """
    write_notif("job-29d", days_ago(29))
    write_notif("job-31d", days_ago(31))

    job_ids = [n["job_id"] for n in client.get("/api/notifications").json()["notifications"]]

    assert job_ids == ["job-29d"]


def test_F09_11_읽은_알림도_30일_내면_반환된다(client, write_notif, days_ago):
    """근거: PLAN § 결정 — "**오늘 기준 최근 30일** (읽음 여부 무관)" """
    write_notif("job-read", days_ago(5))
    client.post("/api/notifications/read")

    res = client.get("/api/notifications")

    assert [n["job_id"] for n in res.json()["notifications"]] == ["job-read"]
    assert res.json()["unread_count"] == 0


def test_F09_12_알림이_없으면_빈_목록을_반환한다(client):
    """근거: PLAN § 결정 — "**알림 피드 1개**"

    저장소가 아예 비어 있는 최초 실행 상태다. 404 나 500 이 아니라 200 + 빈 목록이어야
    앱 첫 진입이 에러 없이 뜬다.
    """
    res = client.get("/api/notifications")

    assert res.status_code == 200
    assert res.json()["notifications"] == []
    assert res.json()["unread_count"] == 0


def test_F09_13_조회시_지난_월_프리픽스가_삭제된다(
    client, write_notif, days_ago, isolated_storage
):
    """근거: PLAN § 결정 — "**조회 시 lazy** — 30일 필터 + 지난 월 프리픽스 통째 삭제"

    이 레포엔 스케줄러·cron 이 없고 배포도 전부 수동이다. 정리 주체를 안 정하면
    조용히 쌓인다 — 그래서 조회가 정리 주체다.
    """
    stale = write_notif("job-stale", days_ago(70))
    stale_month_dir = stale.parent
    fresh = write_notif("job-fresh", days_ago(1))
    assert stale_month_dir.exists()

    client.get("/api/notifications")

    assert not stale_month_dir.exists()
    assert fresh.exists()


def test_F09_17_since_미지정시_30일_전체를_최신_50건까지만_반환한다(
    client, write_notif, days_ago
):
    """근거: PLAN § 결정 2026-08-06 — "**최근 30일 전체 + 최신 50건 상한**"

    평상시 폴링은 `since` 가 붙어 GET 0회지만 **앱 첫 진입은 `since` 가 없어 전량을
    읽는다.** 상한이 없으면 그 순간 LIST + N GET 이 그대로 돈다.
    """
    for i in range(55):
        write_notif(f"job-{i:02d}", days_ago(29 - i * 0.5))

    body = client.get("/api/notifications").json()

    assert len(body["notifications"]) == 50
    # 최신 50건이므로 가장 오래된 5건(job-00~job-04)은 잘려 나간다
    returned = {n["job_id"] for n in body["notifications"]}
    assert "job-54" in returned
    assert "job-00" not in returned


# ── 불변식 ────────────────────────────────────────────────

def test_F09_14_서로_다른_job의_알림이_한_피드에_모두_나온다(
    client, write_notif, days_ago
):
    """근거: PLAN § 결정 — "**모두의 알림**"

    인증이 없어 소유자를 정의할 수 없다. 소유자 필터가 슬쩍 들어가면
    "남이 시작한 게 끝나도 알린다"는 전제가 깨지고 상시 폴링의 근거도 함께 무너진다.
    """
    write_notif("job-alpha", days_ago(3))
    write_notif("job-beta", days_ago(2))
    write_notif("job-gamma", days_ago(1))

    job_ids = {n["job_id"] for n in client.get("/api/notifications").json()["notifications"]}

    assert job_ids == {"job-alpha", "job-beta", "job-gamma"}
