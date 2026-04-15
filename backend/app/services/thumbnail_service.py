"""
PyMuPDF 기반 썸네일 생성 서비스

PDF bytes를 받아 특정 페이지의 PNG 썸네일 또는 전체 페이지 메타데이터를 반환한다.
파일 I/O나 캐시 로직은 포함하지 않는다 — 호출 측(browse.py)이 담당한다.
"""
import fitz  # PyMuPDF


def get_page_thumbnail(pdf_bytes: bytes, page_num: int, dpi: int = 96) -> bytes:
    """지정한 페이지를 PNG bytes로 렌더링하여 반환"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[page_num]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    return pix.tobytes("png")


def get_page_info(pdf_bytes: bytes) -> list[dict]:
    """모든 페이지의 번호·width·height(pt 단위) 목록 반환"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return [
        {
            "page_num": i,
            "width": page.rect.width,
            "height": page.rect.height,
        }
        for i, page in enumerate(doc)
    ]
