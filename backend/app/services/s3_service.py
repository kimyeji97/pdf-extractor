import json
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


def get_status(job_id: str) -> JobStatusFile | None:
    key = f"{STATUS_PREFIX}/{job_id}.json"
    try:
        resp = s3.get_object(Bucket=BUCKET, Key=key)
        data = json.loads(resp["Body"].read())
        return JobStatusFile(**data)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        raise


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
