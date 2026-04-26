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
        list_jobs,
        download_file,
        upload_file,
        save_upload,
        read_file,
        get_thumbnail_cache,
        save_thumbnail_cache,
        get_boundaries_cache,
        save_boundaries_cache,
        clear_boundaries_cache,
        get_question_thumbnail_cache,
        save_question_thumbnail_cache,
        delete_question_thumbnail_cache,
        # v3 신규: 수동 문항
        get_manual_thumbnail_cache,
        save_manual_thumbnail_cache,
        delete_manual_thumbnail_cache,
        get_manual_questions,
        save_manual_questions,
        # v3 신규: 문제집
        get_workbook,
        save_workbook,
        list_workbooks,
        original_key,
        result_key,
    )
else:
    from app.services.s3_service import (              # noqa: F401
        generate_upload_presigned_url,
        generate_download_presigned_url,
        put_status,
        get_status,
        list_jobs,
        download_file,
        upload_file,
        read_file,
        get_thumbnail_cache,
        save_thumbnail_cache,
        get_boundaries_cache,
        save_boundaries_cache,
        clear_boundaries_cache,
        get_question_thumbnail_cache,
        save_question_thumbnail_cache,
        original_key,
        result_key,
    )
    # S3 모드에서는 save_upload 미사용 (presigned URL로 직접 처리)
    def save_upload(*a, **kw):
        raise NotImplementedError("S3 모드에서는 presigned URL을 사용하세요.")

    # S3 모드에서 v3 신규 메서드 미구현 stub (추후 S3 구현 시 교체)
    def delete_question_thumbnail_cache(*a, **kw): pass
    def get_manual_thumbnail_cache(*a, **kw): return None
    def save_manual_thumbnail_cache(*a, **kw): pass
    def delete_manual_thumbnail_cache(*a, **kw): pass
    def get_manual_questions(*a, **kw): return []
    def save_manual_questions(*a, **kw): pass
    def get_workbook(*a, **kw): return None
    def save_workbook(*a, **kw): pass
    def list_workbooks(*a, **kw): return []
