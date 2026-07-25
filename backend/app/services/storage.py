"""
스토리지 팩토리

STORAGE_BACKEND=local  → local_storage_service  (로컬 파일시스템, 개발용)
STORAGE_BACKEND=s3     → s3_service             (Cloudflare R2)

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
        get_page_info_cache,
        save_page_info_cache,
        clear_page_info_cache,
        get_question_thumbnail_cache,
        save_question_thumbnail_cache,
        delete_question_thumbnail_cache,
        get_manual_thumbnail_cache,
        save_manual_thumbnail_cache,
        delete_manual_thumbnail_cache,
        get_manual_questions,
        save_manual_questions,
        get_workbook,
        save_workbook,
        list_workbooks,
        list_covers,
        get_cover_meta,
        save_cover,
        get_cover_image,
        delete_cover,
        delete_job,
        delete_workbook,
        cover_image_key,
        cover_meta_key,
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
        get_page_info_cache,
        save_page_info_cache,
        clear_page_info_cache,
        get_question_thumbnail_cache,
        save_question_thumbnail_cache,
        delete_question_thumbnail_cache,
        get_manual_thumbnail_cache,
        save_manual_thumbnail_cache,
        delete_manual_thumbnail_cache,
        get_manual_questions,
        save_manual_questions,
        get_workbook,
        save_workbook,
        list_workbooks,
        list_covers,
        get_cover_meta,
        save_cover,
        get_cover_image,
        delete_cover,
        delete_job,
        delete_workbook,
        cover_image_key,
        cover_meta_key,
        original_key,
        result_key,
    )

    def save_upload(*a, **kw):
        raise NotImplementedError("R2 모드에서는 presigned URL을 사용하세요.")
