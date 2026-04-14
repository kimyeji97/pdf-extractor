"""
스토리지 팩토리

STORAGE_BACKEND=local  → local_storage_service  (로컬 파일시스템)
STORAGE_BACKEND=s3     → s3_service             (AWS S3)

사용법:
    from app.services import storage
    storage.put_status(...)
    storage.get_status(...)
    storage.upload_file(...)
"""
from app.core.config import settings

if settings.STORAGE_BACKEND == "local":
    from app.services.local_storage_service import (   # noqa: F401
        generate_upload_presigned_url,
        generate_download_presigned_url,
        put_status,
        get_status,
        download_file,
        upload_file,
        save_upload,
        read_file,
        original_key,
        result_key,
    )
else:
    from app.services.s3_service import (              # noqa: F401
        generate_upload_presigned_url,
        generate_download_presigned_url,
        put_status,
        get_status,
        download_file,
        upload_file,
        original_key,
        result_key,
    )
    # S3 모드에서는 save_upload / read_file 미사용 (presigned URL로 직접 처리)
    def save_upload(*a, **kw):
        raise NotImplementedError("S3 모드에서는 presigned URL을 사용하세요.")

    def read_file(*a, **kw):
        raise NotImplementedError("S3 모드에서는 presigned URL을 사용하세요.")
