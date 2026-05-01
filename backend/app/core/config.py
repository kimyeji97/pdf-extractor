from typing import Literal
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── 스토리지 백엔드 선택 ──────────────────────────────
    STORAGE_BACKEND: Literal["local", "s3"] = "local"

    # ── Cloudflare R2 (STORAGE_BACKEND=s3 일 때 사용) ────
    # R2_ACCOUNT_ID: Cloudflare 계정 ID
    # R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY: R2 API 토큰
    # R2_BUCKET_NAME: 버킷 이름
    # R2_PUBLIC_DOMAIN: 퍼블릭 버킷 도메인 (설정 시 다운로드 URL에 사용)
    #   예) pub-xxxx.r2.dev  또는  files.example.com (커스텀 도메인)
    # R2_ROOT_PREFIX: 버킷 내 루트 경로 (예: "dev", "prod"). 빈 값이면 버킷 루트에 저장
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_DOMAIN: str = ""
    R2_ROOT_PREFIX: str = ""

    # ── 로컬 스토리지 (STORAGE_BACKEND=local 일 때만 필요) ─
    LOCAL_STORAGE_DIR: str = "./local_storage"
    LOCAL_BASE_URL: str = "http://localhost:8000"

    # ── OCR (Tesseract) ───────────────────────────────────
    TESSERACT_LANG: str = "kor+eng"   # 한국어팩 없으면 "eng"으로 변경

    # ── 공통 ─────────────────────────────────────────────
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
