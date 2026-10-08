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

    # ── 인증 (REQ-27, ADR-0005) ────────────────────────────
    # JWT 서명 키. 운영 배포 시 반드시 .env/Secrets Manager로 재정의할 것 —
    # 기본값은 로컬 개발용이고 절대 이 값으로 배포하지 않는다.
    JWT_SECRET_KEY: str = "dev-insecure-secret-change-me"
    # 이미지·파일 GET용 access 쿠키의 Secure 속성 (REQ-B15). 로컬 http 개발에서만 False로 끈다.
    AUTH_COOKIE_SECURE: bool = True

    # ── 운영 구간 (REQ-F19 Phase 3) ─────────────────────────
    # 예약 작업(켜짐/꺼짐)을 읽을 ECS 서비스 — 예: service/pdf-extractor-cluster/pdf-extractor-backend-prod-svc.
    # 비우면(로컬·dev) 조회하지 않고 운영 구간은 빈 목록이다. 태스크 역할에 DescribeScheduledActions 권한이 필요하다
    SCHEDULE_RESOURCE_ID: str = ""
    SCHEDULE_AWS_REGION: str = "ap-northeast-2"

    # ── CORS (REQ-27 Phase 3) ───────────────────────────────
    # 허용 origin 목록. PLAN-27 § 결정 — "CORS 허용 도메인 | dev 프론트 도메인 +
    # 로컬 개발(localhost:5173) 포함". 그 외 origin은 CORSMiddleware가 차단한다.
    CORS_ALLOWED_ORIGINS: list[str] = [
        "https://dailystudy-workbook-dev.yejicraft-cf.com",
        "http://localhost:5173",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
