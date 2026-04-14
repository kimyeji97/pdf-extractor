"""
문항 번호 파싱 + PDF 내 문항 경계 감지

현재: 뼈대 구현 (샘플 PDF 확보 후 구체화 예정)
"""
import re
from dataclasses import dataclass
from typing import Optional


# ── 문항 번호 문자열 파싱 ─────────────────────────────

def parse_question_numbers(raw: str) -> list[int]:
    """
    "1,3,5"  → [1, 3, 5]
    "1-5"    → [1, 2, 3, 4, 5]
    "1,3,7-10" → [1, 3, 7, 8, 9, 10]
    """
    numbers: set[int] = set()
    parts = [p.strip() for p in raw.split(",")]
    for part in parts:
        if "-" in part:
            start, end = part.split("-", 1)
            numbers.update(range(int(start), int(end) + 1))
        else:
            numbers.add(int(part))
    return sorted(numbers)


# ── 문항 경계 감지 ────────────────────────────────────

@dataclass
class QuestionBoundary:
    number: int
    page_index: int          # 0-based pymupdf 페이지 인덱스
    y_top: Optional[float]   # 페이지 내 상단 y 좌표 (pt)
    y_bottom: Optional[float]


# TODO: 샘플 PDF 분석 후 패턴 정교화
# 현재는 일반적인 한국어 기출문제 패턴을 가정
_Q_PATTERNS = [
    r"^(\d{1,2})\.",           # "1. 다음 중..."
    r"^\[(\d{1,2})\]",         # "[1] 다음 중..."
    r"^문\s*(\d{1,2})\.",      # "문1. ..."  / "문 1. ..."
    r"^제\s*(\d{1,2})\s*문",   # "제1문..."
]
_COMPILED = [re.compile(p) for p in _Q_PATTERNS]


def detect_question_boundaries_from_text(
    pages_text: list[str],
) -> list[QuestionBoundary]:
    """
    pdfplumber로 추출한 페이지별 텍스트에서 문항 경계를 감지한다.

    pages_text: 페이지 순서대로 텍스트 리스트 (0-based index)

    Returns:
        정렬된 QuestionBoundary 리스트

    NOTE:
        - 현재는 텍스트 줄 단위 매칭만 구현 (y 좌표 미지원)
        - pdfplumber words/chars API로 y 좌표까지 뽑으면 정확도 향상 가능
        - 샘플 PDF 확보 후 패턴 및 로직 보완 필요
    """
    boundaries: list[QuestionBoundary] = []

    for page_idx, text in enumerate(pages_text):
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            for pattern in _COMPILED:
                m = pattern.match(line)
                if m:
                    q_num = int(m.group(1))
                    boundaries.append(
                        QuestionBoundary(
                            number=q_num,
                            page_index=page_idx,
                            y_top=None,    # TODO: pdfplumber words로 좌표 추출
                            y_bottom=None,
                        )
                    )
                    break  # 한 줄에 하나의 패턴만 매칭

    # 중복 제거 (같은 번호가 여러 번 나오면 첫 번째만 유지)
    seen: set[int] = set()
    unique: list[QuestionBoundary] = []
    for b in boundaries:
        if b.number not in seen:
            seen.add(b.number)
            unique.append(b)

    return sorted(unique, key=lambda b: b.number)


def map_questions_to_pages(
    boundaries: list[QuestionBoundary],
    requested: list[int],
) -> dict[int, list[int]]:
    """
    요청된 문항 번호 → 포함된 페이지 인덱스 목록 매핑.
    한 문항이 여러 페이지에 걸칠 수 있으므로 리스트로 반환.

    Returns:
        {question_number: [page_index, ...]}
    """
    # boundary 정보를 번호→페이지 딕셔너리로 변환
    num_to_page = {b.number: b.page_index for b in boundaries}

    result: dict[int, list[int]] = {}
    for q_num in requested:
        if q_num not in num_to_page:
            continue  # 감지 실패한 문항은 스킵 (Textract fallback에서 재시도)
        start_page = num_to_page[q_num]

        # 다음 문항의 시작 페이지 - 1 까지가 현재 문항 범위
        # TODO: 같은 페이지 내 여러 문항 처리 시 y 좌표 기반 clipping 필요
        next_boundaries = [b for b in boundaries if b.number > q_num]
        end_page = (
            next_boundaries[0].page_index if next_boundaries else start_page
        )

        pages = list(range(start_page, end_page + 1))
        result[q_num] = pages

    return result
