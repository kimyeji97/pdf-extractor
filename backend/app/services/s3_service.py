import json
from typing import Optional, List
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from app.models.schemas import JobStatusFile, JobStatus

s3 = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)

BUCKET = settings.S3_BUCKET_NAME
STATUS_PREFIX = "status"
UPLOADS_PREFIX = "uploads"
RESULTS_PREFIX = "results"
THUMBNAILS_PREFIX = "thumbnails"
BOUNDARIES_PREFIX = "boundaries"


# ── Presigned URL ─────────────────────────────────────

def generate_upload_presigned_url(key: str, expires: int = 300) -> str:
    """클라이언트가 S3에 직접 PUT 업로드할 수 있는 presigned URL 생성"""
    return s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": BUCKET, "Key": key, "ContentType": "application/pdf"},
        ExpiresIn=expires,
    )


def generate_download_presigned_url(key: str, expires: int = 3600) -> str:
    """결과 PDF 다운로드용 presigned URL 생성"""
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires,
    )


# ── 상태 파일 (DB 대체) ────────────────────────────────

def put_status(job_status: JobStatusFile) -> None:
    key = f"{STATUS_PREFIX}/{job_status.job_id}.json"
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=job_status.model_dump_json(),
        ContentType="application/json",
    )


def get_status(job_id: str) -> Optional[JobStatusFile]:
    key = f"{STATUS_PREFIX}/{job_id}.json"
    try:
        resp = s3.get_object(Bucket=BUCKET, Key=key)
        data = json.loads(resp["Body"].read())
        return JobStatusFile(**data)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def list_jobs() -> List[JobStatusFile]:
    """S3 status/ 접두사 아래 모든 상태 JSON을 읽어 uploaded_at 내림차순으로 반환"""
    paginator = s3.get_paginator("list_objects_v2")
    keys = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=f"{STATUS_PREFIX}/"):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if key.endswith(".json"):
                keys.append(key)

    jobs: List[JobStatusFile] = []
    for key in keys:
        try:
            resp = s3.get_object(Bucket=BUCKET, Key=key)
            data = json.loads(resp["Body"].read())
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
    key = f"{THUMBNAILS_PREFIX}/{job_id}/page_{page_num}.png"
    try:
        resp = s3.get_object(Bucket=BUCKET, Key=key)
        return resp["Body"].read()
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def save_thumbnail_cache(job_id: str, page_num: int, data: bytes) -> None:
    key = f"{THUMBNAILS_PREFIX}/{job_id}/page_{page_num}.png"
    s3.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType="image/png")


# ── 경계 캐시 ─────────────────────────────────────────────

def get_boundaries_cache(job_id: str) -> Optional[list]:
    """저장된 문항 경계 JSON을 읽어 dict 리스트로 반환. 없으면 None."""
    key = f"{BOUNDARIES_PREFIX}/{job_id}.json"
    try:
        resp = s3.get_object(Bucket=BUCKET, Key=key)
        return json.loads(resp["Body"].read())
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def save_boundaries_cache(job_id: str, data: list) -> None:
    """문항 경계 dict 리스트를 JSON으로 저장."""
    key = f"{BOUNDARIES_PREFIX}/{job_id}.json"
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(data, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )


def get_question_thumbnail_cache(job_id: str, page_num: int, question_num: int) -> Optional[bytes]:
    key = f"{THUMBNAILS_PREFIX}/{job_id}/q_{page_num}_{question_num}.png"
    try:
        resp = s3.get_object(Bucket=BUCKET, Key=key)
        return resp["Body"].read()
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


def save_question_thumbnail_cache(job_id: str, page_num: int, question_num: int, data: bytes) -> None:
    key = f"{THUMBNAILS_PREFIX}/{job_id}/q_{page_num}_{question_num}.png"
    s3.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType="image/png")


# ── 파일 읽기 (bytes 반환) ────────────────────────────────

def read_file(key: str) -> bytes:
    resp = s3.get_object(Bucket=BUCKET, Key=key)
    return resp["Body"].read()


# ── PDF 파일 다운로드 (처리용) ─────────────────────────

def download_file(key: str, local_path: str) -> None:
    s3.download_file(BUCKET, key, local_path)


def upload_file(local_path: str, key: str) -> None:
    s3.upload_file(local_path, BUCKET, key, ExtraArgs={"ContentType": "application/pdf"})


# ── 키 헬퍼 ─────────────────────────────────────────

def original_key(job_id: str) -> str:
    return f"{UPLOADS_PREFIX}/{job_id}/original.pdf"


def result_key(job_id: str) -> str:
    return f"{RESULTS_PREFIX}/{job_id}/result.pdf"
