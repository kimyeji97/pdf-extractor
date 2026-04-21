"""
Tesseract OCR fallback 서비스  (AWS Textract 대체 — 완전 무료)

pdfplumber로 텍스트 추출에 실패한 경우(이미지형 PDF, 스캔본 등) 사용.

의존성:
  pip: pytesseract pillow
  시스템: tesseract-ocr  tesseract-ocr-kor  (apt)

t2.micro 적합성:
  - Tesseract는 CPU 전용, 메모리 사용량 < 200MB → 1GB RAM 환경에서 안전
  - EasyOCR / PaddleOCR은 딥러닝 모델(수백 MB)로 OOM 위험 → 사용 안 함
  - 비용 없음, 인터넷 불필요
"""
import fitz                  # pymupdf — PDF → 이미지
import pytesseract
from PIL import Image
import io
from typing import Optional

from app.core.config import settings
from app.utils.question_parser import QuestionBoundary, detect_question_boundaries_from_text

# Tesseract 설정
# lang: kor(한국어) + eng(영어 숫자·기호 인식)
# --psm 6: 단일 블록 텍스트로 가정 → 기출문제 레이아웃에 적합
# --oem 3: LSTM 엔진 사용 (기본값, 가장 정확)
_TESS_CONFIG = "--psm 6 --oem 3"
_TESS_LANG = settings.TESSERACT_LANG   # .env의 TESSERACT_LANG 으로 제어


def extract_boundaries(
    pdf_path: str,
    page_indices: Optional[list[int]] = None,
) -> list[QuestionBoundary]:
    """
    PDF를 페이지별 이미지로 변환 후 Tesseract OCR → 문항 경계 감지.

    Args:
        pdf_path: 원본 PDF 경로
        page_indices: OCR 대상 페이지 인덱스 목록 (0-based).
                      None이면 전체 페이지 처리.
    """
    pages_text = _pdf_to_tesseract_texts(pdf_path, page_indices=page_indices)
    return detect_question_boundaries_from_text(pages_text)


# ── 내부 헬퍼 ─────────────────────────────────────────

def _pdf_to_tesseract_texts(
    pdf_path: str,
    page_indices: Optional[list[int]] = None,
) -> list[str]:
    """
    PDF 각 페이지 → PIL Image → pytesseract → 텍스트

    Args:
        pdf_path: 원본 PDF 경로
        page_indices: 처리할 페이지 인덱스 목록. None이면 전체.

    Returns:
        페이지별 텍스트 리스트. page_indices를 지정한 경우에도
        detect_question_boundaries_from_text가 page_index를 올바르게
        참조하도록 전체 페이지 수만큼 슬롯을 확보하고 미처리 페이지는 ""로 채운다.

    DPI 200: Tesseract 권장 최솟값(150) 이상, t2.micro 메모리 내 처리 가능한 상한
    A4 200DPI ≈ 1654×2339px → PIL Image 메모리 ~15MB/페이지 → 충분히 안전
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    target_set = set(page_indices) if page_indices is not None else set(range(total_pages))

    texts: list[str] = [""] * total_pages

    for page_num in range(total_pages):
        if page_num not in target_set:
            continue
        page = doc[page_num]
        mat = fitz.Matrix(200 / 72, 200 / 72)   # 200 DPI
        pix = page.get_pixmap(matrix=mat)

        # PNG bytes → PIL Image (pytesseract 입력 형식)
        img = Image.open(io.BytesIO(pix.tobytes("png")))

        text = pytesseract.image_to_string(img, lang=_TESS_LANG, config=_TESS_CONFIG)
        texts[page_num] = text

    doc.close()
    return texts
