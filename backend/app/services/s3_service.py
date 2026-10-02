"""
Cloudflare R2 스토리지 서비스 (S3 호환 API 사용)

STORAGE_BACKEND=s3 일 때 storage.py 팩토리가 이 모듈을 선택한다.
R2 버킷 + R2_ROOT_PREFIX 조합으로 환경(dev/prod)을 구분한다.

버킷 구조 ({root}/ 는 R2_ROOT_PREFIX, 빈 값이면 생략):
  {root}/uploads/{job_id}/original.pdf
  {root}/results/{job_id}/result.pdf
  {root}/status/{job_id}.json
  {root}/boundaries/{job_id}.json
  {root}/thumbnails/{job_id}/page_{n}.png
  {root}/thumbnails/{job_id}/q_{page}_{num}.png
  {root}/thumbnails/{job_id}/manual_{page}_{manual_id}.png
  {root}/manual_questions/{job_id}.json
  {root}/workbooks/{workbook_id}.json
  {root}/notifications/{YYYY-MM}/{ISO}-{job_id}.json
  {root}/notifications/read_cursor.json
"""
import json
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Optional, List
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from app.models.schemas import JobStatusFile, JobStatus
from app.utils import notification_key as nkey

logger = logging.getLogger(__name__)

_endpoint = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

def _make_client():
    """R2 클라이언트. 감지 풀 자식은 시작 시 이걸로 새로 만든다 — fork 로 복사된 부모의 연결 풀을 나눠 쓰지 않게 (REQ-P06)."""
    return boto3.client(
        "s3",
        endpoint_url=_endpoint,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4", max_pool_connections=50),
    )


r2 = _make_client()

BUCKET = settings.R2_BUCKET_NAME
_ROOT = settings.R2_ROOT_PREFIX.strip("/")

STATUS_PREFIX = "status"
UPLOADS_PREFIX = "uploads"
RESULTS_PREFIX = "results"
THUMBNAILS_PREFIX = "thumbnails"
BOUNDARIES_PREFIX = "boundaries"
PAGE_INFO_PREFIX = "page_info"
MANUAL_QUESTIONS_PREFIX = "manual_questions"
WORKBOOKS_PREFIX = "workbooks"
NOTIFICATIONS_PREFIX = nkey.NOTIFICATIONS_PREFIX

# Cache-Control 정책
# Cloudflare CDN이 커스텀 도메인으로 서빙할 때 이 헤더를 따른다.
_CC_IMMUTABLE  = "public, max-age=31536000, immutable"  # 썸네일 — 내용 불변
_CC_RESULT_PDF = "public, max-age=86400"                # 결과 PDF — 1일
_CC_NO_CACHE   = "no-store"                             # status/boundaries — 캐싱 금지


def _key(*parts: str) -> str:
    """R2_ROOT_PREFIX를 포함한 전체 오브젝트 키를 반환한다."""
    path = "/".join(p.strip("/") for p in parts if p)
    return f"{_ROOT}/{path}" if _ROOT else path


# ── 내부 헬퍼 ─────────────────────────────────────────────

def _put_json(key: str, data, cache_control: str = _CC_NO_CACHE) -> None:
    r2.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(data, ensure_ascii=False, default=str).encode("utf-8"),
        ContentType="application/json",
        CacheControl=cache_control,
    )


def _get_json(key: str):
    resp = r2.get_object(Bucket=BUCKET, Key=key)
    return json.loads(resp["Body"].read())


def _get_json_or_none(key: str):
    try:
        return _get_json(key)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def _delete(key: str) -> None:
    try:
        r2.delete_object(Bucket=BUCKET, Key=key)
    except ClientError:
        pass


def _delete_prefix(prefix: str) -> int:
    """접두사 아래 모든 오브젝트를 삭제하고 삭제 건수를 반환한다.

    썸네일처럼 job당 수백 개가 쌓이는 경로를 지울 때 사용한다.
    delete_objects는 요청당 1,000개가 상한이라 배치로 나눠 보낸다.
    """
    paginator = r2.get_paginator("list_objects_v2")
    deleted = 0
    batch: List[dict] = []

    def _flush():
        nonlocal deleted, batch
        if not batch:
            return
        r2.delete_objects(Bucket=BUCKET, Delete={"Objects": batch, "Quiet": True})
        deleted += len(batch)
        batch = []

    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            batch.append({"Key": obj["Key"]})
            if len(batch) >= 1000:
                _flush()
    _flush()
    return deleted


def _get_bytes_or_none(key: str) -> Optional[bytes]:
    try:
        resp = r2.get_object(Bucket=BUCKET, Key=key)
        return resp["Body"].read()
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


_LIST_FETCH_WORKERS = 12


def _get_json_many(keys: List[str]) -> List[Optional[dict]]:
    """
    여러 JSON 오브젝트를 병렬로 읽는다 (REQ-P03-03).

    목록 조회는 키 1건당 R2 GET 1회라 순차 처리하면 건수에 비례해 왕복이 쌓인다.
    페이지네이션을 넣어도 정렬을 위해 전체를 읽어야 하는 건 그대로이므로,
    지연을 줄이려면 이 단계를 병렬화해야 한다.
    실패한 키는 None으로 남겨 호출부가 건너뛴다(손상 파일 무시 정책 유지).
    """
    if not keys:
        return []

    def _read(k: str) -> Optional[dict]:
        try:
            return _get_json(k)
        except Exception:
            return None

    workers = min(_LIST_FETCH_WORKERS, len(keys))
    with ThreadPoolExecutor(max_workers=workers) as ex:
        return list(ex.map(_read, keys))


# ── 목록 메모리 캐시 (REQ-P06) ─────────────────────────
#
# R2를 DB로 쓰므로 목록 1회 = LIST + 파일 수만큼 GET 이었다(현황판 6.4s). 접두사별로 key→JSON 을
# 메모리에 두고, 이 모듈의 저장·삭제가 함께 갱신(write-through)하며, _RELOAD_SEC 마다 R2 전체를
# 다시 읽어 외부 변경(같은 dev R2 에 붙은 로컬 uvicorn 등)을 맞춘다. 재적재는 뒤에서 돌고 그동안
# 조회는 기존 목록을 받는다 — 조회가 재적재를 기다리면 60초마다 요청 하나가 ~1s 를 문다(2026-10-02 실측).
# 재적재 도중의 저장·삭제는 _pending 에 적어 두었다가 새 목록에 다시 얹는다(안 그러면 방금 쓴 것이 사라진다).
# ponytail: 프로세스 1개(uvicorn 워커 1 · ECS 태스크 1) 전제 — 늘리면 다른 프로세스 쓰기가 최대
# _RELOAD_SEC 늦게 보인다. 그때는 R2 인덱스 파일(PLAN-P06 기각안)을 다시 볼 것.

_RELOAD_SEC = 60
_cache_lock = threading.Lock()
_dir_cache: dict = {}            # prefix → (loaded_at, {key: data})
_reloading: set = set()          # 지금 R2 에서 다시 읽고 있는 prefix
_pending: dict = {}              # prefix → {key: data | _DELETED} — 재적재 도중의 쓰기
_DELETED = object()
_notif_bodies: dict = {}         # 알림 본문은 한 번 쓰면 안 바뀐다 → 상대 키별로 계속 둔다


def _list_keys(prefix: str, suffix: str = ".json") -> List[str]:
    paginator = r2.get_paginator("list_objects_v2")
    return [
        obj["Key"]
        for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix)
        for obj in page.get("Contents", [])
        if obj["Key"].endswith(suffix)
    ]


def _cached_dir(prefix: str, read_bodies: bool = True) -> dict:
    """prefix 아래 JSON 의 {key: data}. 반환값은 캐시 그 자체라 호출부는 읽기만 한다.

    처음 한 번만 R2 를 기다린다. 그 뒤로는 _RELOAD_SEC 가 지나도 기존 목록을 바로 주고 재적재는 뒤에서 돈다.
    """
    with _cache_lock:
        entry = _dir_cache.get(prefix)
        if entry is not None:
            if time.monotonic() - entry[0] >= _RELOAD_SEC and prefix not in _reloading:
                _reloading.add(prefix)
                threading.Thread(target=_reload_quietly, args=(prefix, read_bodies), daemon=True).start()
            return entry[1]
        _reloading.add(prefix)
    return _reload(prefix, read_bodies)


def _reload(prefix: str, read_bodies: bool) -> dict:
    try:
        keys = _list_keys(prefix)
        datas = _get_json_many(keys) if read_bodies else [None] * len(keys)
        items = {k: d for k, d in zip(keys, datas) if d is not None or not read_bodies}
    except Exception:
        with _cache_lock:
            _reloading.discard(prefix)
            _pending.pop(prefix, None)
        raise
    with _cache_lock:
        for key, data in _pending.pop(prefix, {}).items():
            if data is _DELETED:
                items.pop(key, None)
            else:
                items[key] = data
        _dir_cache[prefix] = (time.monotonic(), items)
        _reloading.discard(prefix)
    return items


def _reload_quietly(prefix: str, read_bodies: bool) -> None:
    try:
        _reload(prefix, read_bodies)
    except Exception:  # noqa: BLE001 — 실패하면 기존 목록이 남고 다음 조회가 다시 시도한다
        logger.exception("[R2] 목록 재적재 실패 | prefix=%s", prefix)


def _cache_write(prefix: str, key: str, data) -> None:
    with _cache_lock:
        entry = _dir_cache.get(prefix)
        if entry is not None:   # 아직 안 읽은 접두사는 첫 목록 조회가 R2 에서 읽는다
            if data is _DELETED:
                entry[1].pop(key, None)
            else:
                entry[1][key] = data
        if prefix in _reloading:
            _pending.setdefault(prefix, {})[key] = data


def _cache_put(prefix: str, key: str, data) -> None:
    _cache_write(prefix, key, data)


def _cache_drop(prefix: str, key: str) -> None:
    _cache_write(prefix, key, _DELETED)


def _cached_meta(prefix_name: str, item_id: str) -> Optional[dict]:
    """단건 메타 — 목록 캐시가 올라와 있고 거기 있으면 캐시에서, 아니면 R2 에서 (REQ-P06).

    캐시에 없다고 None 을 주지 않는다 — 다른 프로세스가 방금 만든 것일 수 있다(재적재 전).
    """
    prefix = _key(prefix_name) + "/"
    key = _key(prefix_name, f"{item_id}.json")
    with _cache_lock:
        entry = _dir_cache.get(prefix)
        data = entry[1].get(key) if entry is not None else None
    if data is not None:
        return dict(data)
    return _get_json_or_none(key)


def _dir_values(prefix: str, sort_key: str) -> list:
    """캐시된 dict 들의 복사본을 sort_key 내림차순으로 — 호출부가 고쳐도 캐시는 안 바뀐다."""
    items = [dict(d) for d in list(_cached_dir(prefix).values())]
    items.sort(key=lambda d: d.get(sort_key, ""), reverse=True)
    return items


# ── Presigned / 다운로드 URL ──────────────────────────────

def generate_upload_presigned_url(key: str, expires: int = 300) -> str:
    """클라이언트가 R2에 직접 PUT 업로드할 수 있는 presigned URL 생성"""
    url = r2.generate_presigned_url(
        "put_object",
        Params={"Bucket": BUCKET, "Key": key, "ContentType": "application/pdf"},
        ExpiresIn=expires,
    )
    logger.info("[R2] upload presigned URL generated | bucket=%s key=%s expires=%ds", BUCKET, key, expires)
    return url


def generate_download_presigned_url(key: str, expires: int = 3600) -> str:
    """결과 PDF 다운로드 URL 생성.

    R2_PUBLIC_DOMAIN 이 설정되면 퍼블릭 URL, 아니면 R2 presigned URL 반환.
    """
    if settings.R2_PUBLIC_DOMAIN:
        return f"https://{settings.R2_PUBLIC_DOMAIN}/{key}"
    return r2.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires,
    )


# ── 상태 파일 (DB 대체) ────────────────────────────────

def put_status(job_status: JobStatusFile) -> None:
    key = _key(STATUS_PREFIX, f"{job_status.job_id}.json")
    body = job_status.model_dump_json()
    r2.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=body,
        ContentType="application/json",
        CacheControl=_CC_NO_CACHE,
    )
    _cache_put(_key(STATUS_PREFIX) + "/", key, json.loads(body))


def get_status(job_id: str) -> Optional[JobStatusFile]:
    data = _get_json_or_none(_key(STATUS_PREFIX, f"{job_id}.json"))
    return JobStatusFile(**data) if data is not None else None


def list_jobs() -> List[JobStatusFile]:
    """status/ 아래 모든 상태를 uploaded_at 내림차순으로 반환 (메모리 캐시, REQ-P06)"""
    jobs: List[JobStatusFile] = []
    for data in list(_cached_dir(_key(STATUS_PREFIX) + "/").values()):
        try:
            jobs.append(JobStatusFile(**data))
        except Exception:
            continue

    jobs.sort(
        key=lambda j: j.uploaded_at.isoformat() if j.uploaded_at else "",
        reverse=True,
    )
    return jobs


# ── 썸네일 캐시 ─────────────────────────────────────────

def get_thumbnail_cache(job_id: str, page_num: int) -> Optional[bytes]:
    return _get_bytes_or_none(_key(THUMBNAILS_PREFIX, job_id, f"page_{page_num}.png"))


def save_thumbnail_cache(job_id: str, page_num: int, data: bytes) -> None:
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(THUMBNAILS_PREFIX, job_id, f"page_{page_num}.png"),
        Body=data,
        ContentType="image/png",
        CacheControl=_CC_IMMUTABLE,
    )


# ── 페이지 메타 캐시 (REQ-P03-02) ─────────────────────────

def get_page_info_cache(job_id: str) -> Optional[list]:
    return _get_json_or_none(_key(PAGE_INFO_PREFIX, f"{job_id}.json"))


def save_page_info_cache(job_id: str, data: list) -> None:
    _put_json(_key(PAGE_INFO_PREFIX, f"{job_id}.json"), data)


def clear_page_info_cache(job_id: str) -> None:
    _delete(_key(PAGE_INFO_PREFIX, f"{job_id}.json"))


# ── 경계 캐시 ─────────────────────────────────────────────

def get_boundaries_cache(job_id: str) -> Optional[list]:
    return _get_json_or_none(_key(BOUNDARIES_PREFIX, f"{job_id}.json"))


def save_boundaries_cache(job_id: str, data: list) -> None:
    _put_json(_key(BOUNDARIES_PREFIX, f"{job_id}.json"), data)


def clear_boundaries_cache(job_id: str) -> None:
    """경계 캐시와 연관 문항 썸네일 캐시를 삭제한다."""
    _delete(_key(BOUNDARIES_PREFIX, f"{job_id}.json"))

    prefix = _key(THUMBNAILS_PREFIX, job_id, "q_")
    paginator = r2.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        objects = [{"Key": obj["Key"]} for obj in page.get("Contents", [])]
        if objects:
            r2.delete_objects(Bucket=BUCKET, Delete={"Objects": objects})


# ── 자동 감지 문항 썸네일 ──────────────────────────────────


def _q_thumb_name(page_num: int, question_num: int, k: int) -> str:
    """k=0 은 옛 이름 그대로(기존 캐시 호환), k≥1 만 접미사 (ADR-0006)."""
    return f"q_{page_num}_{question_num}.png" if k == 0 else f"q_{page_num}_{question_num}_{k}.png"

def get_question_thumbnail_cache(job_id: str, page_num: int, question_num: int, k: int = 0) -> Optional[bytes]:
    return _get_bytes_or_none(_key(THUMBNAILS_PREFIX, job_id, _q_thumb_name(page_num, question_num, k)))


def save_question_thumbnail_cache(job_id: str, page_num: int, question_num: int, data: bytes, k: int = 0) -> None:
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(THUMBNAILS_PREFIX, job_id, _q_thumb_name(page_num, question_num, k)),
        Body=data,
        ContentType="image/png",
        CacheControl=_CC_IMMUTABLE,
    )


def delete_question_thumbnail_cache(job_id: str, page_num: int, question_num: int, k: int = 0) -> None:
    _delete(_key(THUMBNAILS_PREFIX, job_id, _q_thumb_name(page_num, question_num, k)))


# ── 수동 문항 썸네일 ──────────────────────────────────────

def get_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str) -> Optional[bytes]:
    return _get_bytes_or_none(_key(THUMBNAILS_PREFIX, job_id, f"manual_{page_num}_{manual_id}.png"))


def save_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str, data: bytes) -> None:
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(THUMBNAILS_PREFIX, job_id, f"manual_{page_num}_{manual_id}.png"),
        Body=data,
        ContentType="image/png",
        CacheControl=_CC_IMMUTABLE,
    )


def delete_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str) -> None:
    _delete(_key(THUMBNAILS_PREFIX, job_id, f"manual_{page_num}_{manual_id}.png"))


# ── 수동 문항 영속 저장 ────────────────────────────────────

def get_manual_questions(job_id: str) -> list:
    return _get_json_or_none(_key(MANUAL_QUESTIONS_PREFIX, f"{job_id}.json")) or []


def save_manual_questions(job_id: str, data: list) -> None:
    _put_json(_key(MANUAL_QUESTIONS_PREFIX, f"{job_id}.json"), data)


# ── 문제집 메타데이터 ──────────────────────────────────────

def get_workbook(workbook_id: str) -> Optional[dict]:
    return _get_json_or_none(_key(WORKBOOKS_PREFIX, f"{workbook_id}.json"))


def save_workbook(workbook_id: str, data: dict) -> None:
    key = _key(WORKBOOKS_PREFIX, f"{workbook_id}.json")
    _put_json(key, data)
    _cache_put(_key(WORKBOOKS_PREFIX) + "/", key, json.loads(json.dumps(data, default=str)))


def list_workbooks() -> list:
    """workbooks/ 아래 모든 문제집 메타데이터를 created_at 내림차순으로 반환 (메모리 캐시, REQ-P06)"""
    return _dir_values(_key(WORKBOOKS_PREFIX) + "/", "created_at")


# ── 파일 읽기 (bytes 반환) ────────────────────────────────

def read_file(key: str) -> bytes:
    resp = r2.get_object(Bucket=BUCKET, Key=key)
    return resp["Body"].read()


# ── PDF 파일 다운로드/업로드 (백엔드 처리용) ──────────────

def download_file(key: str, local_path: str) -> None:
    r2.download_file(BUCKET, key, local_path)


def upload_file(local_path: str, key: str) -> None:
    r2.upload_file(local_path, BUCKET, key, ExtraArgs={
        "ContentType": "application/pdf",
        "CacheControl": _CC_RESULT_PDF,
    })


# ── 표지 이미지 (covers) ─────────────────────────────────

COVERS_PREFIX = "covers"
FOOTNOTES_PREFIX = "footnotes"
WATERMARKS_PREFIX = "watermarks"
TEMPLATES_PREFIX = "templates"
USERS_PREFIX = "users"


def list_covers() -> list:
    return _dir_values(_key(COVERS_PREFIX) + "/", "created_at")   # 메모리 캐시 (REQ-P06)


def get_cover_meta(cover_id: str) -> Optional[dict]:
    return _cached_meta(COVERS_PREFIX, cover_id)


def save_cover(cover_id: str, meta: dict, image_bytes: bytes, ext: str = "jpg") -> None:
    ct = "image/png" if ext == "png" else "image/jpeg"
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(COVERS_PREFIX, f"{cover_id}.{ext}"),
        Body=image_bytes,
        ContentType=ct,
        CacheControl=_CC_IMMUTABLE,
    )
    key = _key(COVERS_PREFIX, f"{cover_id}.json")
    _put_json(key, meta)
    _cache_put(_key(COVERS_PREFIX) + "/", key, json.loads(json.dumps(meta, default=str)))


def get_cover_image(cover_id: str) -> Optional[tuple]:
    for ext, ct in [("jpg", "image/jpeg"), ("jpeg", "image/jpeg"), ("png", "image/png")]:
        data = _get_bytes_or_none(_key(COVERS_PREFIX, f"{cover_id}.{ext}"))
        if data is not None:
            return data, ct
    return None


def delete_cover(cover_id: str) -> None:
    for ext in ["jpg", "jpeg", "png", "json"]:
        _delete(_key(COVERS_PREFIX, f"{cover_id}.{ext}"))
    _cache_drop(_key(COVERS_PREFIX) + "/", _key(COVERS_PREFIX, f"{cover_id}.json"))


# ── 각주 (footnotes, REQ-29) — 표지와 같은 모양이되 이미지 대신 텍스트를 저장 ──

def list_footnotes() -> list:
    return _dir_values(_key(FOOTNOTES_PREFIX) + "/", "created_at")   # 메모리 캐시 (REQ-P06)


def get_footnote_meta(footnote_id: str) -> Optional[dict]:
    return _cached_meta(FOOTNOTES_PREFIX, footnote_id)


def save_footnote(footnote_id: str, meta: dict) -> None:
    key = _key(FOOTNOTES_PREFIX, f"{footnote_id}.json")
    _put_json(key, meta)
    _cache_put(_key(FOOTNOTES_PREFIX) + "/", key, json.loads(json.dumps(meta, default=str)))


def delete_footnote(footnote_id: str) -> None:
    key = _key(FOOTNOTES_PREFIX, f"{footnote_id}.json")
    _delete(key)
    _cache_drop(_key(FOOTNOTES_PREFIX) + "/", key)


# ── 워터마크 (watermarks, REQ-29) — 표지와 동일한 이미지 업로드 방식 ──────

def list_watermarks() -> list:
    return _dir_values(_key(WATERMARKS_PREFIX) + "/", "created_at")   # 메모리 캐시 (REQ-P06)


def get_watermark_meta(watermark_id: str) -> Optional[dict]:
    return _cached_meta(WATERMARKS_PREFIX, watermark_id)


def save_watermark(watermark_id: str, meta: dict, image_bytes: bytes, ext: str = "jpg") -> None:
    ct = "image/png" if ext == "png" else "image/jpeg"
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(WATERMARKS_PREFIX, f"{watermark_id}.{ext}"),
        Body=image_bytes,
        ContentType=ct,
        CacheControl=_CC_IMMUTABLE,
    )
    key = _key(WATERMARKS_PREFIX, f"{watermark_id}.json")
    _put_json(key, meta)
    _cache_put(_key(WATERMARKS_PREFIX) + "/", key, json.loads(json.dumps(meta, default=str)))


def get_watermark_image(watermark_id: str) -> Optional[tuple]:
    for ext, ct in [("jpg", "image/jpeg"), ("jpeg", "image/jpeg"), ("png", "image/png")]:
        data = _get_bytes_or_none(_key(WATERMARKS_PREFIX, f"{watermark_id}.{ext}"))
        if data is not None:
            return data, ct
    return None


def delete_watermark(watermark_id: str) -> None:
    for ext in ["jpg", "jpeg", "png", "json"]:
        _delete(_key(WATERMARKS_PREFIX, f"{watermark_id}.{ext}"))
    _cache_drop(_key(WATERMARKS_PREFIX) + "/", _key(WATERMARKS_PREFIX, f"{watermark_id}.json"))


# ── job / 문제집 삭제 ─────────────────────────────────────

# ── 알림 (REQ-F09) ───────────────────────────────────────
#
# 키 형식은 app/utils/notification_key.py 가 단일 출처다 (local_storage_service 와 공유).
# 폴링이 LIST 만으로 신규를 판정하도록 키 이름에 타임스탬프를 박는다 —
# list_workbooks() 처럼 전량을 읽으면 폴링마다 LIST + N GET 이 돈다.

def save_notification(data: dict) -> str:
    """알림 1건을 오브젝트 1개로 저장하고 상대 키를 반환한다."""
    created_at = data.get("created_at")
    if isinstance(created_at, str):
        dt = nkey.to_utc(datetime.fromisoformat(created_at))
    elif isinstance(created_at, datetime):
        dt = nkey.to_utc(created_at)
    else:
        dt = datetime.now(timezone.utc)

    body = {**data, "created_at": dt.isoformat()}
    rel = nkey.build_relpath(dt, str(body.get("job_id", "unknown")))
    key = _key(NOTIFICATIONS_PREFIX, rel)
    _put_json(key, body)
    _cache_put(_key(NOTIFICATIONS_PREFIX) + "/", key, None)
    _notif_bodies[rel] = json.loads(json.dumps(body, default=str))
    return rel


def list_notification_keys() -> List[str]:
    """알림 상대 키 목록. 오브젝트 본문은 읽지 않는다 (키만 메모리 캐시, REQ-P06)."""
    prefix = _key(NOTIFICATIONS_PREFIX) + "/"
    rels = (k[len(prefix):] for k in list(_cached_dir(prefix, read_bodies=False)))
    return sorted(rel for rel in rels if "/" in rel)


def read_notification(relpath: str) -> Optional[dict]:
    body = _notif_bodies.get(relpath)
    if body is None:
        body = _get_json_or_none(_key(NOTIFICATIONS_PREFIX, relpath))
        if body is not None:
            _notif_bodies[relpath] = body
    return dict(body) if body is not None else None


def delete_notification_month(month: str) -> None:
    month_prefix = _key(NOTIFICATIONS_PREFIX, month) + "/"
    _delete_prefix(month_prefix)
    notif_prefix = _key(NOTIFICATIONS_PREFIX) + "/"
    with _cache_lock:
        entry = _dir_cache.get(notif_prefix)
        stale = [k for k in entry[1] if k.startswith(month_prefix)] if entry is not None else []
    for k in stale:
        _cache_drop(notif_prefix, k)
    for rel in [r for r in _notif_bodies if r.startswith(month + "/")]:
        _notif_bodies.pop(rel, None)


def get_read_cursor() -> Optional[str]:
    data = _get_json_or_none(_key(NOTIFICATIONS_PREFIX, nkey.READ_CURSOR_NAME))
    return data.get("cursor") if data else None


def save_read_cursor(cursor: str) -> None:
    _put_json(_key(NOTIFICATIONS_PREFIX, nkey.READ_CURSOR_NAME), {"cursor": cursor})


def delete_job(job_id: str) -> None:
    """
    job과 연관된 오브젝트를 전부 삭제한다 (원본·결과·상태·경계·썸네일·수동문항·페이지캐시).

    source/export 어느 쪽이든 키 구조가 같아 한 함수로 처리한다.
    """
    _cache_drop(_key(STATUS_PREFIX) + "/", _key(STATUS_PREFIX, f"{job_id}.json"))
    for key in (
        _key(STATUS_PREFIX, f"{job_id}.json"),
        _key(BOUNDARIES_PREFIX, f"{job_id}.json"),
        _key(PAGE_INFO_PREFIX, f"{job_id}.json"),
        _key(MANUAL_QUESTIONS_PREFIX, f"{job_id}.json"),
    ):
        _delete(key)

    for prefix in (
        _key(UPLOADS_PREFIX, job_id) + "/",
        _key(RESULTS_PREFIX, job_id) + "/",
        _key(THUMBNAILS_PREFIX, job_id) + "/",
    ):
        _delete_prefix(prefix)

    logger.info("[R2] job deleted | job_id=%s", job_id)


def delete_workbook(workbook_id: str) -> None:
    key = _key(WORKBOOKS_PREFIX, f"{workbook_id}.json")
    _delete(key)
    _cache_drop(_key(WORKBOOKS_PREFIX) + "/", key)


def cover_image_key(cover_id: str, ext: str = "jpg") -> str:
    return _key(COVERS_PREFIX, f"{cover_id}.{ext}")


def cover_meta_key(cover_id: str) -> str:
    return _key(COVERS_PREFIX, f"{cover_id}.json")


# ── 키 헬퍼 ─────────────────────────────────────────

def original_key(job_id: str) -> str:
    return _key(UPLOADS_PREFIX, job_id, "original.pdf")


def result_key(job_id: str) -> str:
    return _key(RESULTS_PREFIX, job_id, "result.pdf")


# ── 템플릿 (templates, REQ-30) — 표지·각주·워터마크 조합의 **참조**만 담는다 ──
#
# 값을 복사하지 않고 id 3개만 가리킨다 (ADR-0004). 그래서 이미지 짝이 없고
# JSON 하나로 끝난다 — `covers`·`watermarks` 와 달리 `{id}.json` 만 존재한다.

def list_templates() -> list:
    return _dir_values(_key(TEMPLATES_PREFIX) + "/", "created_at")   # 메모리 캐시 (REQ-P06)


def get_template_meta(template_id: str) -> Optional[dict]:
    return _get_json_or_none(_key(TEMPLATES_PREFIX, f"{template_id}.json"))


def save_template(template_id: str, meta: dict) -> None:
    key = _key(TEMPLATES_PREFIX, f"{template_id}.json")
    _put_json(key, meta)
    _cache_put(_key(TEMPLATES_PREFIX) + "/", key, json.loads(json.dumps(meta, default=str)))


def delete_template(template_id: str) -> None:
    key = _key(TEMPLATES_PREFIX, f"{template_id}.json")
    _delete(key)
    _cache_drop(_key(TEMPLATES_PREFIX) + "/", key)


# ── 사용자 (users, REQ-27) — 각주와 같은 모양(오브젝트 1건 = 레코드 1건) ──

def list_users() -> list:
    prefix = _key(USERS_PREFIX) + "/"
    paginator = r2.get_paginator("list_objects_v2")
    keys = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            if obj["Key"].endswith(".json"):
                keys.append(obj["Key"])
    users = []
    for k in keys:
        try:
            users.append(_get_json(k))
        except Exception:
            continue
    return users


def get_user(user_id: str) -> Optional[dict]:
    return _get_json_or_none(_key(USERS_PREFIX, f"{user_id}.json"))


def save_user(user_id: str, meta: dict) -> None:
    _put_json(_key(USERS_PREFIX, f"{user_id}.json"), meta)
