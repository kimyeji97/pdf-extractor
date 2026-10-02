"""
REQ-P06 Phase 5 — R2 목록 메모리 캐시 검증 계약

검증 계약: docs/plans/PLAN-P06-api-latency-during-analysis.md `## 검증 계약`
케이스: P06-05 ~ P06-13

R2를 DB로 쓰므로 목록 1회 = LIST + 파일 수만큼 GET이었다. `s3_service`가 status·workbooks·
covers·templates 목록과 알림 키 목록·본문을 메모리에 두고, 같은 프로세스의 저장·삭제가
캐시를 함께 갱신(write-through)하며, 60초마다 R2 전체를 다시 읽는다.

무대: 테스트는 항상 local 백엔드다(계약 #24). 캐시는 `s3_service`에만 있으므로 이 파일은
`s3_service`를 다시 로드해 캐시를 비우고 `s3_service.r2`를 **가짜 클라이언트**로 바꿔 호출 수를
센다 — 실제 R2에는 붙지 않는다(R2 자격증명은 conftest가 빈 값으로 덮는다).

⚠️ 시계: 60초 재적재(P06-08)는 `time.monotonic`을 monkeypatch 해서 넘긴다 — 구현은 경과 시간을
`time.monotonic()`(모듈 속성 호출)으로 재야 한다.
"""
import importlib
import io
import json
import time
from datetime import datetime, timezone

import pytest
from botocore.exceptions import ClientError

from app.models.schemas import BoundariesStatus, JobStatus, JobStatusFile, JobType


class _FakePaginator:
    def __init__(self, fake):
        self._fake = fake

    def paginate(self, Bucket, Prefix):
        self._fake.lists += 1
        keys = sorted(k for k in self._fake.objects if k.startswith(Prefix))
        yield {"Contents": [{"Key": k} for k in keys]}


class FakeR2:
    """`s3_service`가 쓰는 boto3 S3 클라이언트 메서드만 흉내 낸다. GET·LIST 횟수를 센다."""

    def __init__(self):
        self.objects: dict[str, bytes] = {}
        self.gets = 0
        self.lists = 0

    def reset_counts(self):
        self.gets = 0
        self.lists = 0

    def get_object(self, Bucket, Key):
        self.gets += 1
        if Key not in self.objects:
            raise ClientError({"Error": {"Code": "NoSuchKey", "Message": Key}}, "GetObject")
        return {"Body": io.BytesIO(self.objects[Key])}

    def put_object(self, Bucket, Key, Body, **kwargs):
        self.objects[Key] = Body.encode("utf-8") if isinstance(Body, str) else bytes(Body)

    def delete_object(self, Bucket, Key):
        self.objects.pop(Key, None)

    def delete_objects(self, Bucket, Delete):
        for obj in Delete["Objects"]:
            self.objects.pop(obj["Key"], None)

    def get_paginator(self, name):
        assert name == "list_objects_v2"
        return _FakePaginator(self)


@pytest.fixture
def s3(monkeypatch):
    """캐시가 빈 `s3_service` + 가짜 R2. 모듈을 (다시) 로드해 이전 테스트의 캐시를 지운다.

    conftest가 `R2_ACCOUNT_ID`를 빈 값으로 덮어 엔드포인트가 `https://.r2...`가 되고, 진짜
    `boto3.client`는 임포트 시점에 `Invalid endpoint`로 죽는다 — 그래서 로드 **전에** 클라이언트
    생성 자체를 가짜로 바꾼다.
    """
    import sys

    import boto3

    fake = FakeR2()
    monkeypatch.setattr(boto3, "client", lambda *args, **kwargs: fake)
    if "app.services.s3_service" in sys.modules:
        mod = importlib.reload(sys.modules["app.services.s3_service"])
    else:
        mod = importlib.import_module("app.services.s3_service")
    assert mod.r2 is fake
    return mod, fake


def _status(job_id: str, filename: str = "sample.pdf") -> JobStatusFile:
    return JobStatusFile(
        job_id=job_id,
        status=JobStatus.DONE,
        filename=filename,
        uploaded_at=datetime.now(timezone.utc),
        job_type=JobType.SOURCE,
        boundaries_status=BoundariesStatus.DONE,
    )


def _seed_status(mod, fake, job_id: str, filename: str = "sample.pdf"):
    """외부(다른 프로세스)가 R2에 직접 쓴 것처럼 심는다 — 캐시는 모른다."""
    fake.objects[mod._key(mod.STATUS_PREFIX, f"{job_id}.json")] = (
        _status(job_id, filename).model_dump_json().encode("utf-8")
    )


def _seed_json(fake, key: str, data: dict):
    fake.objects[key] = json.dumps(data).encode("utf-8")


# ── status ────────────────────────────────────────────────

def test_P06_05_list_jobs_두번째_호출은_R2_GET_0회(s3):
    """근거: PLAN § 결정 — "목록(+ 알림 키 목록·알림 본문)을 메모리에 두고" """
    mod, fake = s3
    for jid in ("job-a", "job-b", "job-c"):
        _seed_status(mod, fake, jid)
    first = [j.job_id for j in mod.list_jobs()]
    fake.reset_counts()

    second = [j.job_id for j in mod.list_jobs()]

    assert (second, fake.gets) == (first, 0)


def test_P06_06_put_status가_list_jobs에_바로_반영(s3):
    """근거: PLAN § 결정 — "같은 프로세스의 저장·삭제가 캐시를 함께 갱신(write-through)" """
    mod, fake = s3
    _seed_status(mod, fake, "job-old", filename="before.pdf")
    mod.list_jobs()
    mod.put_status(_status("job-old", filename="after.pdf"))
    mod.put_status(_status("job-new"))
    fake.reset_counts()

    jobs = {j.job_id: j.filename for j in mod.list_jobs()}

    assert (jobs, fake.gets, fake.lists) == ({"job-old": "after.pdf", "job-new": "sample.pdf"}, 0, 0)


def test_P06_07_delete_job이_list_jobs에서_바로_빠진다(s3):
    """근거: PLAN § 결정 — "같은 프로세스의 저장·삭제가 캐시를 함께 갱신(write-through)" """
    mod, fake = s3
    _seed_status(mod, fake, "job-a")
    _seed_status(mod, fake, "job-b")
    mod.list_jobs()

    mod.delete_job("job-a")

    assert [j.job_id for j in mod.list_jobs()] == ["job-b"]


def test_P06_08_외부에서_추가한_job은_60초_뒤_보인다(s3, monkeypatch):
    """근거: PLAN § 결정 — "60초마다 R2 전체 재적재" """
    mod, fake = s3
    now = [1000.0]
    monkeypatch.setattr(time, "monotonic", lambda: now[0])
    _seed_status(mod, fake, "job-a")
    mod.list_jobs()
    _seed_status(mod, fake, "job-external")

    now[0] += 61
    ids = {j.job_id for j in mod.list_jobs()}

    assert ids == {"job-a", "job-external"}


# ── workbooks · covers · templates ────────────────────────

def test_P06_09_문제집_저장_삭제가_목록에_바로_반영(s3):
    """근거: PLAN § 결정 — "같은 프로세스의 저장·삭제가 캐시를 함께 갱신(write-through)" """
    mod, fake = s3
    _seed_json(fake, mod._key(mod.WORKBOOKS_PREFIX, "wb-old.json"),
               {"workbook_id": "wb-old", "created_at": "2026-10-01T00:00:00+00:00"})
    mod.list_workbooks()
    mod.save_workbook("wb-new", {"workbook_id": "wb-new", "created_at": "2026-10-02T00:00:00+00:00"})
    mod.delete_workbook("wb-old")
    fake.reset_counts()

    ids = [w["workbook_id"] for w in mod.list_workbooks()]

    assert (ids, fake.gets, fake.lists) == (["wb-new"], 0, 0)


def test_P06_10_표지_저장_삭제가_목록에_바로_반영(s3):
    """근거: PLAN § 결정 — "같은 프로세스의 저장·삭제가 캐시를 함께 갱신(write-through)" """
    mod, fake = s3
    _seed_json(fake, mod._key(mod.COVERS_PREFIX, "cv-old.json"),
               {"cover_id": "cv-old", "created_at": "2026-10-01T00:00:00+00:00"})
    mod.list_covers()
    mod.save_cover("cv-new", {"cover_id": "cv-new", "created_at": "2026-10-02T00:00:00+00:00"}, b"img")
    mod.delete_cover("cv-old")
    fake.reset_counts()

    ids = [c["cover_id"] for c in mod.list_covers()]

    assert (ids, fake.gets, fake.lists) == (["cv-new"], 0, 0)


def test_P06_11_템플릿_저장_삭제가_목록에_바로_반영(s3):
    """근거: PLAN § 결정 — "같은 프로세스의 저장·삭제가 캐시를 함께 갱신(write-through)" """
    mod, fake = s3
    _seed_json(fake, mod._key(mod.TEMPLATES_PREFIX, "tp-old.json"),
               {"template_id": "tp-old", "created_at": "2026-10-01T00:00:00+00:00"})
    mod.list_templates()
    mod.save_template("tp-new", {"template_id": "tp-new", "created_at": "2026-10-02T00:00:00+00:00"})
    mod.delete_template("tp-old")
    fake.reset_counts()

    ids = [t["template_id"] for t in mod.list_templates()]

    assert (ids, fake.gets, fake.lists) == (["tp-new"], 0, 0)


# ── 알림 ──────────────────────────────────────────────────

def test_P06_12_알림_키_목록이_저장_월삭제를_반영하고_LIST를_다시_안_한다(s3):
    """근거: PLAN § 결정 — "목록(+ 알림 키 목록·알림 본문)을 메모리에 두고" """
    mod, fake = s3
    old = mod.save_notification({"job_id": "job-sep", "created_at": "2026-09-15T00:00:00+00:00"})
    mod.list_notification_keys()
    new = mod.save_notification({"job_id": "job-oct", "created_at": "2026-10-02T00:00:00+00:00"})
    mod.delete_notification_month(old.split("/", 1)[0])
    fake.reset_counts()

    keys = mod.list_notification_keys()

    assert (keys, fake.lists) == ([new], 0)


def test_P06_13_같은_알림_두번째_읽기는_R2_GET_0회(s3):
    """근거: PLAN § 결정 — "목록(+ 알림 키 목록·알림 본문)을 메모리에 두고" """
    mod, fake = s3
    rel = "2026-10/2026-10-02T00-00-00+0000-job-x.json"
    _seed_json(fake, mod._key(mod.NOTIFICATIONS_PREFIX, rel), {"job_id": "job-x"})
    first = mod.read_notification(rel)
    fake.reset_counts()

    second = mod.read_notification(rel)

    assert (second, fake.gets) == (first, 0)
