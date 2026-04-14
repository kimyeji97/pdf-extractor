from typing import Literal
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── 스토리지 백엔드 선택 ──────────────────────────────
    STORAGE_BACKEND: Literal["local", "s3"] = "local"

    # ── AWS (STORAGE_BACKEND=s3 일 때만 필요) ────────────
    AWS_REGION: str = "ap-northeast-2"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = ""

    # ── 로컬 스토리지 (STORAGE_BACKEND=local 일 때만 필요) ─
    LOCAL_STORAGE_DIR: str = "./local_storage"
    LOCAL_BASE_URL: str = "http://localhost:8000"

    # ── OCR (Tesseract) ───────────────────────────────────
    TESSERACT_LANG: str = "kor+eng"   # 한국어팩 없으면 "eng"으로 변경

    # ── 공통 ─────────────────────────────────────────────
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    class Config:
        env_file = ".env"
        extra = "ignore"   # .env에 알 수 없는 키(TESSDATA_PREFIX 등)가 있어도 무시


settings = Settings()
