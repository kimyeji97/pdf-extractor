"""
문항 번호 파싱 + PDF 내 문항 경계 감지 (좌표 기반 v2)

좌표계:
  pdfplumber 'top'/'bottom' 기준 (페이지 상단=0, 하향 증가)
  → PyMuPDF fitz.Rect 좌표와 직접 호환

레이아웃 처리:
  - 2단 레이아웃: X좌표 히스토그램으로 분할점 자동 감지
  - 읽기 순서: 좌 컬럼 상→하, 우 컬럼 상→하
  - Y좌표 클리핑: 같은 페이지 내 다중 문항 분리

확장성:
  _PIPELINE 목록에 새 감지기(ML, Vision LLM 등)를 추가하면
  heuristic 실패 시 자동 fallback 됩니다.
"""

import re
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

import pdfplumber


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. 문항 번호 문자열 파싱
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def parse_question_numbers(raw: str) -> list[int]:
    """
    "1,3,5"    → [1, 3, 5]
    "1-5"      → [1, 2, 3, 4, 5]
    "1,3,7-10" → [1, 3, 7, 8, 9, 10]
    """
    numbers: set[int] = set()
    for part in [p.strip() for p in raw.split(",")]:
        if not part:
            continue
        if "-" in part:
            start, end = part.split("-", 1)
            numbers.update(range(int(start.strip()), int(end.strip()) + 1))
        else:
            numbers.add(int(part))
    return sorted(numbers)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. 데이터 구조
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass
class QuestionBoundary:
    """문항 하나의 위치 정보"""
    number: int
    page_index: int           # 0-based
    y_top: float              # 문항 시작 y (페이지 상단=0)
    y_bottom: float           # 문항 끝 y   (다음 문항 y_top 또는 페이지 높이)
    col: int                  # 0=왼쪽, 1=오른쪽
    col_x0: float             # 컬럼 왼쪽 경계
    col_x1: float             # 컬럼 오른쪽 경계


@dataclass
class CropRegion:
    """PyMuPDF fitz.Rect 호환 크롭 영역"""
    page_index: int
    x0: float
    y0: float   # top
    x1: float
    y1: float   # bottom

    @property
    def width(self) -> float:
        return self.x1 - self.x0

    @property
    def height(self) -> float:
        return self.y1 - self.y0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. 문항 번호 패턴 (유형편 분석 기반 + 일반 기출)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_Q_PATTERNS: list[str] = [
    # ── 유형편 핵심 패턴 ─────────────────────────────
    r"^(\d{1,3})$",                # "14"          독립 숫자 (가장 일반적)
    r"^(\d{1,3})\.$",              # "14."
    r"^\[(\d{1,3})\]$",            # "[14]"
    r"^<(\d{1,3})>$",              # "<14>"

    # ── 한국어 접두 패턴 ────────────────────────────
    r"^문\s*(\d{1,3})[\..\s]",     # "문14." / "문 14 "
    r"^제\s*(\d{1,3})\s*문",       # "제14문"
    r"^(\d{1,3})번",               # "14번"

    # ── 개념편 패턴 ─────────────────────────────────
    r"^확인예제\s*(\d{1,3})",       # "확인예제3"
    r"^예제\s*(\d{1,3})",           # "예제3"
    r"^유제\s*(\d{1,3})",           # "유제3"

    # ── 수능/모의고사 패턴 ─────────────────────────
    r"^(\d{1,2})\s*\.",            # "14 ."  (공백 허용)
]

_COMPILED = [re.compile(p) for p in _Q_PATTERNS]

# 문항 번호 유효 범위 (오탐 방지)
_Q_MIN, _Q_MAX = 1, 500


def _extract_question_number(text: str) -> Optional[int]:
    """텍스트에서 문항 번호 추출. 없으면 None."""
    t = text.strip()
    if not t:
        return None
    for pattern in _COMPILED:
        m = pattern.match(t)
        if m:
            n = int(m.group(1))
            if _Q_MIN <= n <= _Q_MAX:
                return n
    return None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. 2단 레이아웃 자동 감지
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _detect_column_split(words: list[dict], page_width: float) -> float:
    """
    X좌표 히스토그램에서 페이지 중앙부 공백 구간을 찾아 컬럼 분할점을 반환한다.

    전략:
      1. 페이지 중앙 ±20% 구간의 x0 값 수집
      2. 해당 구간 내 최대 공백(gap) 위치를 분할점으로 설정
      3. 공백이 page_width의 3% 미만이면 단단(1-column) 으로 판단
         → page_width 반환 (모든 단어가 col=0 으로 처리)

    Returns:
        분할 x 좌표. 이 값보다 오른쪽이 오른쪽 컬럼.
    """
    if not words:
        return page_width / 2

    center = page_width / 2
    margin = page_width * 0.20

    # 중앙 구간 x0 수집
    mid_xs = sorted(
        w["x0"] for w in words
        if center - margin <= w["x0"] <= center + margin
    )

    if len(mid_xs) < 4:
        # 중앙부에 단어가 거의 없음 → 명확한 2단 분리
        return center

    # 최대 공백 탐색
    max_gap, split = 0.0, center
    for i in range(1, len(mid_xs)):
        gap = mid_xs[i] - mid_xs[i - 1]
        if gap > max_gap:
            max_gap = gap
            split = (mid_xs[i] + mid_xs[i - 1]) / 2

    # 공백이 너무 작으면 단단 레이아웃
    if max_gap < page_width * 0.03:
        return page_width  # 전체를 왼쪽 컬럼으로

    return split


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. 핵심: 좌표 기반 문항 경계 감지
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _compute_global_font_threshold(pdf_path: str) -> float:
    """
    1패스: PDF 전체에서 문항 번호 후보의 폰트 크기 분포를 분석하여
    글로벌 최소 크기 임계값을 반환한다.

    전략:
      - 헤더/푸터 영역(상단 11%, 하단 9%) 제외 후 분석
        → 9%가 아닌 11%로 섹션 타이틀(34pt, y≈80) 제외
      - visible 글자(size > 1.0)만 대상
      - 가장 많이 등장하는 "큰 폰트 클러스터"를 지배적 문항 폰트로 인정
        → 높이 10pt 이상의 사이즈 중 출현 빈도 최대 → 그 사이즈의 95%를 임계값으로

    Returns:
        글로벌 폰트 임계값. 정보가 없으면 0.0 (필터 비적용).
    """
    from collections import Counter

    size_counts: Counter[float] = Counter()

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_h = page.height
            header_y = page_h * 0.11   # 11%: 섹션 타이틀 제외
            footer_y = page_h * 0.91

            words = page.extract_words(
                keep_blank_chars=False,
                x_tolerance=3,
                y_tolerance=3,
                extra_attrs=["size"],
            )
            for w in words:
                if not (header_y <= w["top"] <= footer_y):
                    continue
                size = w.get("size", 0)
                if size <= 1.0:
                    continue
                if _extract_question_number(w["text"]) is not None:
                    # 10pt 이상만 집계 (본문 폰트 이상의 크기)
                    if size >= 10.0:
                        size_counts[round(size, 1)] += 1

    if not size_counts:
        return 0.0

    # 13pt 이상 중에서 가장 빈도 높은 크기 = 지배적 문항 폰트
    # (10~12pt는 본문/주석 크기로 답안표·페이지번호가 많이 포함됨)
    large_counts = {sz: cnt for sz, cnt in size_counts.items() if sz >= 13.0}

    if large_counts:
        dominant_size = max(large_counts, key=large_counts.get)
    else:
        # 13pt 이상 없으면 전체 최빈값 사용
        dominant_size = size_counts.most_common(1)[0][0]

    # 지배적 크기의 92%를 임계값으로
    # (같은 번호가 1~2pt 다른 크기로 렌더링될 경우 허용)
    return dominant_size * 0.92


def detect_question_boundaries(pdf_path: str) -> list[QuestionBoundary]:
    """
    pdfplumber의 extract_words()로 단어별 좌표를 추출하고
    2단 레이아웃(좌→우, 상→하)을 고려하여 문항 경계를 감지한다.

    처리 순서:
      1. 각 페이지에서 단어 + 좌표 + 폰트 크기 추출
      2. 헤더/푸터 영역 제외 (상단 9%, 하단 9%)
      3. 적응형 폰트 필터: 페이지별 최대 폰트의 90% 이상만 후보로 허용
         → 실제 문항 번호(large font)와 답안표/페이지번호(small font) 구분
      4. X좌표 히스토그램으로 컬럼 분할점 자동 감지
      5. 컬럼별 상→하 순서로 문항 번호 패턴 매칭
      6. y_bottom 보정 (다음 문항 y_top 또는 페이지 높이)
      7. 중복 제거 (같은 번호 → 첫 번째 출현만 유지)

    Returns:
        문항 번호 오름차순으로 정렬된 QuestionBoundary 리스트
    """
    # ── 1패스: 글로벌 폰트 임계값 계산 ──────────────────
    global_font_threshold = _compute_global_font_threshold(pdf_path)

    raw: list[QuestionBoundary] = []

    with pdfplumber.open(pdf_path) as pdf:
        page_heights = [p.height for p in pdf.pages]

        for page_idx, page in enumerate(pdf.pages):
            page_w = page.width
            page_h = page.height

            # ── 폰트 크기 포함 추출 ────────────────────
            words = page.extract_words(
                keep_blank_chars=False,
                x_tolerance=3,
                y_tolerance=3,
                extra_attrs=["size"],
            )
            if not words:
                continue

            # ── 헤더/푸터 제거 (상단 11%, 하단 9%) ─────
            # 11%: 섹션 타이틀 헤더(y≈80, 9.7%) 제외
            header_y = page_h * 0.11
            footer_y = page_h * 0.91
            content_words = [
                w for w in words
                if header_y <= w["top"] <= footer_y
            ]
            if not content_words:
                continue

            min_size_threshold = global_font_threshold

            # ── 컬럼 분할 ──────────────────────────────
            split_x = _detect_column_split(content_words, page_w)

            left_words  = [w for w in content_words if w["x0"] <  split_x]
            right_words = [w for w in content_words if w["x0"] >= split_x]

            col_x_bounds = {
                0: (
                    min((w["x0"] for w in left_words),  default=0.0),
                    split_x,
                ),
                1: (
                    split_x,
                    max((w["x1"] for w in right_words), default=page_w),
                ),
            }

            # ── 컬럼별 문항 번호 감지 (좌→우, 각 컬럼 내 상→하) ──
            for col_idx, col_words in [(0, left_words), (1, right_words)]:
                if not col_words:
                    continue

                cx0, cx1 = col_x_bounds[col_idx]
                sorted_words = sorted(col_words, key=lambda w: w["top"])

                for w in sorted_words:
                    # 폰트 크기 필터
                    w_size = w.get("size", 0)
                    if w_size < 1.0:
                        continue  # invisible 문자
                    if min_size_threshold > 0 and w_size < min_size_threshold:
                        continue  # 작은 폰트 (답안표, 페이지번호 등)

                    q_num = _extract_question_number(w["text"])
                    if q_num is not None:
                        raw.append(QuestionBoundary(
                            number=q_num,
                            page_index=page_idx,
                            y_top=w["top"],
                            y_bottom=page_h,   # 임시값
                            col=col_idx,
                            col_x0=cx0,
                            col_x1=cx1,
                        ))

    # ── y_bottom 채우기 ────────────────────────────────
    _fill_y_bottom(raw, page_heights)

    # ── 중복 제거 (다중문항 페이지 우선 선택) ────────
    unique = _deduplicate_boundaries(raw)

    return sorted(unique, key=lambda b: b.number)


def _deduplicate_boundaries(
    raw: list[QuestionBoundary],
) -> list[QuestionBoundary]:
    """
    같은 문항 번호가 여러 번 감지된 경우 최적의 하나를 선택한다.

    선택 전략 (우선순위 순):
      1. "다중문항 페이지" 우선 — 해당 페이지에 2개 이상의 문항 번호가 있으면 실제 문제 페이지일 확률이 높음
         (표지/TOC 페이지는 보통 문항 번호가 하나뿐)
      2. 같은 우선순위면 먼저 등장한 것 선택 (페이지 순, 컬럼 순, y 순)
    """
    # 페이지별 감지된 문항 번호 수 집계
    page_q_count: dict[int, int] = defaultdict(int)
    for b in raw:
        page_q_count[b.page_index] += 1

    # 각 번호의 후보들을 모아 최선의 것을 선택
    from collections import defaultdict as _dd
    candidates: dict[int, list[QuestionBoundary]] = _dd(list)
    for b in raw:
        candidates[b.number].append(b)

    unique: list[QuestionBoundary] = []
    for q_num, cands in candidates.items():
        # 다중문항 페이지(>=2개)에 있는 후보 우선
        multi_page_cands = [c for c in cands if page_q_count[c.page_index] >= 2]
        pool = multi_page_cands if multi_page_cands else cands

        # pool 내에서 첫 등장 (페이지 오름차순 → 컬럼 오름차순 → y 오름차순)
        best = sorted(pool, key=lambda b: (b.page_index, b.col, b.y_top))[0]
        unique.append(best)

    return unique


def _fill_y_bottom(
    boundaries: list[QuestionBoundary],
    page_heights: list[float],
) -> None:
    """
    같은 (page_index, col) 그룹 안에서
    현재 문항의 y_bottom = 다음 문항의 y_top (마지막이면 페이지 높이).
    """
    groups: dict[tuple[int, int], list[QuestionBoundary]] = defaultdict(list)
    for b in boundaries:
        groups[(b.page_index, b.col)].append(b)

    for (page_idx, _col), group in groups.items():
        sorted_g = sorted(group, key=lambda b: b.y_top)
        page_h = page_heights[page_idx] if page_idx < len(page_heights) else 9999.0
        for i, b in enumerate(sorted_g):
            b.y_bottom = sorted_g[i + 1].y_top if i + 1 < len(sorted_g) else page_h


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. 문항 → CropRegion 매핑
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def map_questions_to_regions(
    boundaries: list[QuestionBoundary],
    requested: list[int],
) -> dict[int, list[CropRegion]]:
    """
    요청된 문항 번호 → CropRegion 리스트 매핑.

    케이스별 처리:
      A. 같은 페이지·같은 컬럼  → Y 범위 클리핑 (가장 흔한 케이스)
      B. 같은 페이지·다른 컬럼  → 왼쪽 컬럼 잔여 + 오른쪽 컬럼 초반
      C. 다음 문항이 다른 페이지 → 현재 컬럼 끝(페이지 높이)까지
      D. 마지막 문항             → 현재 컬럼 끝까지

    Returns:
        {question_number: [CropRegion, ...]}
    """
    num_to_b = {b.number: b for b in boundaries}
    sorted_b  = sorted(boundaries, key=lambda b: b.number)

    result: dict[int, list[CropRegion]] = {}

    for q_num in requested:
        if q_num not in num_to_b:
            continue

        cur  = num_to_b[q_num]
        next_b = next((b for b in sorted_b if b.number > q_num), None)

        regions: list[CropRegion] = []

        # ── 케이스 분기 ────────────────────────────────
        if next_b is None:
            # D: 마지막 문항
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))

        elif next_b.page_index > cur.page_index:
            # C: 다음 문항이 다른 페이지
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))
            # 중간 페이지 전체 포함 (문항이 여러 페이지에 걸친 경우)
            for mid_page in range(cur.page_index + 1, next_b.page_index):
                regions.append(CropRegion(
                    page_index=mid_page,
                    x0=0, y0=0,
                    x1=9999, y1=9999,  # pdf_service에서 페이지 전체로 처리
                ))

        elif next_b.page_index == cur.page_index and next_b.col == cur.col:
            # A: 같은 페이지·같은 컬럼 → Y 클리핑
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=next_b.y_top,
            ))

        elif next_b.page_index == cur.page_index and next_b.col > cur.col:
            # B: 같은 페이지·다음 컬럼으로 넘어감
            # 현재 컬럼 잔여 영역
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))
            # 다음 컬럼의 시작부터 다음 문항 y_top 까지
            if next_b.y_top > 0:
                regions.append(CropRegion(
                    page_index=cur.page_index,
                    x0=next_b.col_x0, y0=0.0,
                    x1=next_b.col_x1, y1=next_b.y_top,
                ))

        else:
            # 기타 fallback
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))

        # 유효한 높이 가진 영역만 저장
        result[q_num] = [r for r in regions if r.height > 2 or r.y1 == 9999]

    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. (레거시 호환) 텍스트 기반 경계 감지
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def detect_question_boundaries_from_text(
    pages_text: list[str],
) -> list["_LegacyBoundary"]:
    """
    좌표 없이 텍스트만으로 경계를 감지하는 구버전 함수.
    OCR fallback 결과(텍스트만 있을 때) 에서 사용.
    """
    @dataclass
    class _LegacyBoundary:
        number: int
        page_index: int
        y_top: None = None
        y_bottom: None = None

    boundaries: list[_LegacyBoundary] = []
    for page_idx, text in enumerate(pages_text):
        for line in text.splitlines():
            q_num = _extract_question_number(line.strip())
            if q_num is not None:
                boundaries.append(_LegacyBoundary(
                    number=q_num,
                    page_index=page_idx,
                ))

    seen: set[int] = set()
    unique = []
    for b in boundaries:
        if b.number not in seen:
            seen.add(b.number)
            unique.append(b)
    return sorted(unique, key=lambda b: b.number)


def map_questions_to_pages(
    boundaries: list,
    requested: list[int],
) -> dict[int, list[int]]:
    """레거시 호환: 좌표 없는 경계 → 페이지 목록 매핑"""
    num_to_page = {b.number: b.page_index for b in boundaries}
    sorted_b = sorted(boundaries, key=lambda b: b.number)

    result: dict[int, list[int]] = {}
    for q_num in requested:
        if q_num not in num_to_page:
            continue
        start_page = num_to_page[q_num]
        next_b = next((b for b in sorted_b if b.number > q_num), None)
        end_page = next_b.page_index if next_b else start_page
        result[q_num] = list(range(start_page, end_page + 1))
    return result
