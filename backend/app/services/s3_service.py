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
"""
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from app.models.schemas import JobStatusFile, JobStatus

logger = logging.getLogger(__name__)

_endpoint = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

r2 = boto3.client(
    "s3",
    endpoint_url=_endpoint,
    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
    region_name="auto",
    config=Config(signature_version="s3v4", max_pool_connections=50),
)

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
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(STATUS_PREFIX, f"{job_status.job_id}.json"),
        Body=job_status.model_dump_json(),
        ContentType="application/json",
        CacheControl=_CC_NO_CACHE,
    )


def get_status(job_id: str) -> Optional[JobStatusFile]:
    data = _get_json_or_none(_key(STATUS_PREFIX, f"{job_id}.json"))
    return JobStatusFile(**data) if data is not None else None


def list_jobs() -> List[JobStatusFile]:
    """status/ 접두사 아래 모든 상태 JSON을 읽어 uploaded_at 내림차순으로 반환"""
    prefix = _key(STATUS_PREFIX) + "/"
    paginator = r2.get_paginator("list_objects_v2")
    keys = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            k = obj["Key"]
            if k.endswith(".json"):
                keys.append(k)

    jobs: List[JobStatusFile] = []
    for data in _get_json_many(keys):
        if data is None:
            continue
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

def get_question_thumbnail_cache(job_id: str, page_num: int, question_num: int) -> Optional[bytes]:
    return _get_bytes_or_none(_key(THUMBNAILS_PREFIX, job_id, f"q_{page_num}_{question_num}.png"))


def save_question_thumbnail_cache(job_id: str, page_num: int, question_num: int, data: bytes) -> None:
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(THUMBNAILS_PREFIX, job_id, f"q_{page_num}_{question_num}.png"),
        Body=data,
        ContentType="image/png",
        CacheControl=_CC_IMMUTABLE,
    )


def delete_question_thumbnail_cache(job_id: str, page_num: int, question_num: int) -> None:
    _delete(_key(THUMBNAILS_PREFIX, job_id, f"q_{page_num}_{question_num}.png"))


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
    _put_json(_key(WORKBOOKS_PREFIX, f"{workbook_id}.json"), data)


def list_workbooks() -> list:
    """workbooks/ 접두사 아래 모든 문제집 메타데이터를 created_at 내림차순으로 반환"""
    prefix = _key(WORKBOOKS_PREFIX) + "/"
    paginator = r2.get_paginator("list_objects_v2")
    keys = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            k = obj["Key"]
            if k.endswith(".json"):
                keys.append(k)

    workbooks = [w for w in _get_json_many(keys) if w is not None]

    workbooks.sort(key=lambda w: w.get("created_at", ""), reverse=True)
    return workbooks


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


def list_covers() -> list:
    prefix = _key(COVERS_PREFIX) + "/"
    paginator = r2.get_paginator("list_objects_v2")
    keys = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            if obj["Key"].endswith(".json"):
                keys.append(obj["Key"])
    covers = []
    for k in keys:
        try:
            covers.append(_get_json(k))
        except Exception:
            continue
    covers.sort(key=lambda c: c.get("created_at", ""), reverse=True)
    return covers


def get_cover_meta(cover_id: str) -> Optional[dict]:
    return _get_json_or_none(_key(COVERS_PREFIX, f"{cover_id}.json"))


def save_cover(cover_id: str, meta: dict, image_bytes: bytes, ext: str = "jpg") -> None:
    ct = "image/png" if ext == "png" else "image/jpeg"
    r2.put_object(
        Bucket=BUCKET,
        Key=_key(COVERS_PREFIX, f"{cover_id}.{ext}"),
        Body=image_bytes,
        ContentType=ct,
        CacheControl=_CC_IMMUTABLE,
    )
    _put_json(_key(COVERS_PREFIX, f"{cover_id}.json"), meta)


def get_cover_image(cover_id: str) -> Optional[tuple]:
    for ext, ct in [("jpg", "image/jpeg"), ("jpeg", "image/jpeg"), ("png", "image/png")]:
        data = _get_bytes_or_none(_key(COVERS_PREFIX, f"{cover_id}.{ext}"))
        if data is not None:
            return data, ct
    return None


def delete_cover(cover_id: str) -> None:
    for ext in ["jpg", "jpeg", "png", "json"]:
        _delete(_key(COVERS_PREFIX, f"{cover_id}.{ext}"))


# ── job / 문제집 삭제 ─────────────────────────────────────

def delete_job(job_id: str) -> None:
    """
    job과 연관된 오브젝트를 전부 삭제한다 (원본·결과·상태·경계·썸네일·수동문항·페이지캐시).

    source/export 어느 쪽이든 키 구조가 같아 한 함수로 처리한다.
    """
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
    _delete(_key(WORKBOOKS_PREFIX, f"{workbook_id}.json"))


def cover_image_key(cover_id: str, ext: str = "jpg") -> str:
    return _key(COVERS_PREFIX, f"{cover_id}.{ext}")


def cover_meta_key(cover_id: str) -> str:
    return _key(COVERS_PREFIX, f"{cover_id}.json")


# ── 키 헬퍼 ─────────────────────────────────────────

def original_key(job_id: str) -> str:
    return _key(UPLOADS_PREFIX, job_id, "original.pdf")


def result_key(job_id: str) -> str:
    return _key(RESULTS_PREFIX, job_id, "result.pdf")
