"""
문항 번호 파싱 + PDF 내 문항 경계 감지 (좌표 기반 v2)

━━━ 적응형 감지 버전 이력 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  v0.1  수열 패턴
        · (prefix, suffix, font_cluster) 그룹별 +1 연속 수열 탐색
        · 그룹 점수 = 유효 체인 길이 합계 (커버리지)
        · 한계: 본문 중 우연히 연속되는 숫자도 체인으로 잡힐 수 있음

  v0.2  수열 패턴 + 문항 간 여백 패턴  ← 현재 (ADAPTIVE_DETECTION_VERSION)
        · v0.1 수열 탐색은 동일
        · 추가: 컬럼별 "유의미한 여백(significant gap)" 위치 지도 구성
        · 그룹 점수 = 커버리지 × (1 + 여백 일치 비율)
          → 수열 번호가 큰 여백 직후에 등장할수록 점수 상승
          → 여백 정보가 없으면(밀집 레이아웃) v0.1과 동일하게 동작
        · 효과: 본문 중 우연 수열 오탐 대폭 감소

━━━ 좌표계 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  pdfplumber의 'top'/'bottom' 기준 (페이지 상단=0, 하향 증가)
  → PyMuPDF fitz.Rect 좌표와 직접 호환 가능

━━━ 레이아웃 처리 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - 2단 레이아웃: X좌표 히스토그램으로 컬럼 분할점 자동 감지
  - 읽기 순서  : 왼쪽 컬럼 상→하, 오른쪽 컬럼 상→하
  - Y좌표 클리핑: 같은 컬럼 내 다음 문항 시작점까지만 크롭

━━━ 감지 파이프라인 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. 정규식 방식 (기존): 11개 패턴 + 폰트 크기 필터, 1패스로 통합
  2. 적응형 수열+여백 방식 (v0.2): 형식 무관 수열 탐지 + 여백 신뢰도 보정
  3. OCR fallback: pdf_service.py 레벨에서 처리 (텍스트 추출 불가 스캔본용)
"""

import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Optional

import pdfplumber
import fitz   # PyMuPDF — 배경색 픽셀 분석용

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 적응형 감지 버전
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 이 값을 변경하면 _run_adaptive_detection() 의 채점 방식이 바뀐다.
#   "v0.1" → 수열 패턴만 사용 (커버리지 점수)
#   "v0.2" → 수열 패턴 + 여백 패턴 (커버리지 × 여백 보정)
ADAPTIVE_DETECTION_VERSION: str = "v0.2"

# GapMap 타입 별칭
# key  : (page_index, col_index)
# value: 유의미한 여백(significant gap) 직후 Y좌표 목록 (오름차순)
GapMap = dict[tuple[int, int], list[float]]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. 문항 번호 문자열 파싱
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def parse_question_numbers(raw: str) -> list[int]:
    """
    사용자 입력 문자열을 정수 목록으로 변환한다.

    지원 형식:
      "1,3,5"    → [1, 3, 5]
      "1-5"      → [1, 2, 3, 4, 5]
      "1,3,7-10" → [1, 3, 7, 8, 9, 10]

    쉼표로 분리 후 "-" 포함 여부에 따라 단일 번호 또는 범위로 처리.
    중복 제거 후 오름차순 반환.
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
    """
    문항 하나의 PDF 내 위치 정보.

    크롭 시 필요한 모든 좌표를 담는다:
      - (col_x0, y_top) → 크롭 시작점
      - (col_x1, y_bottom) → 크롭 끝점
      - col: 2단 레이아웃에서 왼쪽(0) / 오른쪽(1) 구분

    v3 신규 필드:
      - title: 사용자가 UI에서 수정한 문항 이름. None이면 "문항 {number}"로 표시
      - is_false_positive: 경계가 페이지 전체 크기와 일치하는 오탐지 여부 (REQ-15)
      - is_manual: 수동으로 추가한 문항인지 여부 (REQ-13)
      - manual_id: 수동 추가 문항의 UUID (is_manual=True일 때만 유효)

    하위 호환: 기존 boundaries/*.json을 역직렬화할 때 신규 필드가 없으면
    dataclass field(default=...)이 적용되어 별도 마이그레이션 없이 로드 가능.
    """
    number: int
    page_index: int           # 0-based 페이지 인덱스
    y_top: float              # 문항 번호 텍스트의 상단 Y좌표 (페이지 상단=0)
    y_bottom: float           # 문항 끝 Y좌표 (다음 문항 y_top 또는 페이지 하단)
    col: int                  # 0=왼쪽 컬럼, 1=오른쪽 컬럼
    col_x0: float             # 소속 컬럼의 왼쪽 X경계 (REQ-24: 문항 번호 x0 - 10pt)
    col_x1: float             # 소속 컬럼의 오른쪽 X경계 (REQ-24: 문항 내 최대 x1)
    # ── v3 신규 필드 (기본값 있음 → 기존 캐시 역직렬화 하위 호환) ──
    title: Optional[str] = field(default=None)          # 사용자 지정 문항 타이틀
    is_false_positive: bool = field(default=False)      # 오탐지 여부 (REQ-15)
    is_manual: bool = field(default=False)              # 수동 추가 문항 여부
    manual_id: Optional[str] = field(default=None)      # 수동 추가 UUID


@dataclass
class CropRegion:
    """
    PyMuPDF fitz.Rect 호환 크롭 영역.

    단일 소스 PDF 처리 시 사용.
    복수 소스 PDF가 필요한 경우 SourcedCropRegion(pdf_service.py)을 사용한다.
    """
    page_index: int
    x0: float
    y0: float   # top (페이지 상단=0)
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

# 한국 수험서/기출문제에서 실제로 사용되는 문항 번호 표기 형식.
# 정규식 패턴 순서는 매칭 우선순위와 무관 — 첫 매칭 시 반환.
#
# ▶ "유제 1-1" 스타일 처리:
#   pdfplumber는 공백을 기준으로 "유제"와 "1-1"을 별도 단어로 분리할 수 있음.
#   아래 패턴들은 "유제1-1"처럼 붙어있는 경우를 커버.
#   두 단어로 분리된 경우는 _merge_prefix_keyword_pairs()가 먼저 합쳐서 처리.
_Q_PATTERNS: list[str] = [
    # ── 유형편 핵심 패턴 ─────────────────────────────
    r"^(\d{1,3})$",                          # "14"          독립 숫자 (가장 일반적)
    r"^(\d{1,3})\.$",                         # "14."
    r"^\[(\d{1,3})\]$",                       # "[14]"
    r"^<(\d{1,3})>$",                         # "<14>"

    # ── 한국어 접두 패턴 ────────────────────────────
    r"^문\s*(\d{1,3})[\..\s]",               # "문14." / "문 14 "
    r"^제\s*(\d{1,3})\s*문",                  # "제14문"
    r"^(\d{1,3})번",                          # "14번"

    # ── 유제/예제/확인예제 — 단순 번호 ───────────────
    r"^확인예제\s*(\d{1,3})(?:[\.|\-]\d{1,3})*",   # "확인예제3" / "확인예제3-1"
    r"^예제\s*(\d{1,3})(?:[\.|\-]\d{1,3})*",        # "예제3" / "예제3-1"
    r"^유제\s*(\d{1,3})(?:[\.|\-]\d{1,3})*",        # "유제3" / "유제3-1" / "유제3-2"

    # ── 수능/모의고사 패턴 ─────────────────────────
    r"^(\d{1,2})\s*\.",                       # "14 ."  (공백 허용)
]

_COMPILED = [re.compile(p) for p in _Q_PATTERNS]

# 접두어 키워드: 이 단어 단독으로는 문항 번호가 아니지만
# 바로 뒤 단어와 합치면 "유제1-1" 등 유효한 패턴이 된다.
_PREFIX_KEYWORDS: frozenset[str] = frozenset({"유제", "예제", "확인예제", "문제"})


def _merge_prefix_keyword_pairs(words: list[dict]) -> list[dict]:
    """
    "유제", "예제", "확인예제" 접두어 단어 + 뒤따르는 번호 단어를 단일 가상 단어로 합친다.

    pdfplumber는 공백 기준으로 단어를 분리하므로 "유제 1-1"이 두 토큰이 되는 경우가 있다.
    이 함수는 같은 줄(y 차이 5pt 이내)에 있는 (접두어, 번호) 쌍을 합쳐서
    "유제1-1" 형태의 하나의 가상 단어 dict를 만든다.

    Examples:
      [{"text": "유제", ...}, {"text": "1-1", ...}]
      → [{"text": "유제1-1", ...}]  # x0/top은 "유제" 것, x1은 "1-1" 것 사용
    """
    if not words:
        return words

    result: list[dict] = []
    i = 0
    while i < len(words):
        w = words[i]
        text = w["text"].strip()

        # 접두어이고 다음 단어가 같은 줄에 있으면 합치기 시도
        if text in _PREFIX_KEYWORDS and i + 1 < len(words):
            nw = words[i + 1]
            # 같은 줄 판단: top 좌표 차이 5pt 이내
            if abs(nw.get("top", 0) - w.get("top", 0)) <= 5:
                # 가상 단어: text만 합치고, 좌표는 두 단어를 포괄하도록 설정
                combined = {
                    **w,
                    "text": text + nw["text"].strip(),
                    "x1": nw.get("x1", w.get("x1", 0)),
                    "bottom": max(w.get("bottom", w.get("top", 0)),
                                  nw.get("bottom", nw.get("top", 0))),
                }
                result.append(combined)
                i += 2
                continue

        result.append(w)
        i += 1
    return result

# 오탐 방지용 유효 범위: 1~500번
# 500 초과는 연도, 쪽번호 등 다른 숫자와 혼동 가능성이 높음
_Q_MIN, _Q_MAX = 1, 500

_Q_FONT_SIZE_MIN = 5


def _extract_question_number(text: str) -> Optional[int]:
    """
    단어 텍스트에서 문항 번호를 추출한다.

    위 11개 패턴을 순서대로 시도하여 첫 매칭 시 번호를 반환.
    유효 범위(_Q_MIN~_Q_MAX) 밖이거나 어떤 패턴도 매칭 안 되면 None.

    Args:
        text: pdfplumber extract_words()에서 추출된 단어 1개
    Returns:
        문항 번호 정수 또는 None
    """
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

    원리:
      한국 수험서는 대부분 2단 레이아웃. 두 컬럼 사이에는 텍스트가 없는 공백 띠가 존재.
      이 공백의 중심을 분할점(split_x)으로 사용하면 좌/우 컬럼을 정확히 구분할 수 있다.

    탐색 전략:
      1. 페이지 중앙 ±20% 구간에 있는 단어의 x0 좌표만 수집
         (중앙에서 너무 먼 단어는 양쪽 컬럼 내부의 텍스트이므로 제외)
      2. 해당 좌표들을 정렬 후 인접 값 사이 최대 공백(gap) 위치를 분할점으로 설정
      3. 공백이 page_width의 3% 미만이면 단단(1-column)으로 판단
         → page_width 반환 (모든 단어가 col=0으로 처리되어 1단처럼 동작)

    Returns:
        분할 x 좌표. 이 값 미만 → 왼쪽 컬럼, 이상 → 오른쪽 컬럼.
    """
    if not words:
        return page_width / 2

    center = page_width / 2
    margin = page_width * 0.20   # 중앙 ±20% 구간

    # 중앙 구간 단어의 x0만 수집하여 정렬
    mid_xs = sorted(
        w["x0"] for w in words
        if center - margin <= w["x0"] <= center + margin
    )

    if len(mid_xs) < 4:
        # 중앙부에 단어가 거의 없으면 이미 두 컬럼이 명확히 분리된 것
        return center

    # 인접 x0 좌표 간 최대 공백 탐색
    max_gap, split = 0.0, center
    for i in range(1, len(mid_xs)):
        gap = mid_xs[i] - mid_xs[i - 1]
        if gap > max_gap:
            max_gap = gap
            split = (mid_xs[i] + mid_xs[i - 1]) / 2  # 공백 중심

    # 3% 미만 공백 → 1단 레이아웃으로 처리 (page_width = "분할점 없음" sentinel)
    if max_gap < page_width * 0.03:
        return page_width

    return split


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. 핵심: 좌표 기반 문항 경계 감지 (단일 패스 통합)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_HEADER_PERCENT = 0.11
_FOOTER_PERCENT = 0.91

def detect_question_boundaries(pdf_path: str) -> list[QuestionBoundary]:
    """
    PDF 전체를 분석하여 모든 문항의 위치(경계)를 감지한다.

    ━━━ 단일 패스 전략 ━━━
    PDF를 한 번만 열어 단어+좌표+폰트 크기를 수집한 뒤 재사용.
    같은 데이터를 ① 폰트 임계값 계산 ② 경계 감지 ③ 연속 수열 보완에 재활용하므로
    파일 I/O 비용이 1회에 그친다.

    ━━━ 처리 순서 ━━━
      1. PDF 1패스: 전체 단어+좌표+폰트 크기 수집 → pages_data, size_counts 구성
      2. 글로벌 폰트 임계값 계산 (문항 번호는 본문보다 크거나 같은 폰트를 사용)
      3. 헤더/푸터 제거 → 컬럼 감지 → 폰트 필터 → 정규식 매칭으로 경계 탐지
      4. 연속 증분 패턴(_run_adaptive_detection)으로 정규식이 놓친 번호 보완
         (pages_data 재사용 — PDF 재오픈 없음)
      5. y_bottom 보정: 같은 컬럼 내 다음 문항 y_top 또는 페이지 하단
      6. 중복 제거: 같은 번호가 여러 페이지에 감지된 경우 최적 1개 선택
      7. 번호 오름차순 정렬하여 반환

    Returns:
        문항 번호 오름차순으로 정렬된 QuestionBoundary 리스트
    """
    raw: list[QuestionBoundary] = []

    # (page_width, page_height, words_list) 튜플을 페이지 순서대로 저장.
    # 폰트 임계값 계산과 경계 감지 두 단계 모두 이 데이터를 공유하여 재사용.
    pages_data: list[tuple[float, float, list[dict]]] = []
    size_counts: Counter[float] = Counter()

    # ── Step 1: PDF 1패스 — 전체 단어+좌표+폰트 수집 ──────────
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_w = page.width
            page_h = page.height
            words = page.extract_words(
                keep_blank_chars=False,
                x_tolerance=3,   # 가로 방향 단어 병합 허용 오차(pt)
                y_tolerance=3,   # 세로 방향 동일 행 판단 오차(pt)
                extra_attrs=["size"],  # 폰트 크기 속성도 함께 추출
            )
            pages_data.append((page_w, page_h, words))

            # 폰트 임계값 계산용: 헤더/푸터(상위 11%, 하위 9%) 제외한 본문만 집계
            # 상단 11%: 장 제목, 학교명 등 / 하단 9%: 쪽번호, 저작권 표시 등
            header_y = page_h * _HEADER_PERCENT
            footer_y = page_h * _FOOTER_PERCENT
            for w in words:
                # 상단/하단에 존재하는 텍스트면 주석 등으로 간주하여 skip
                if not (header_y <= w["top"] <= footer_y):
                    continue
                # 폰트 크기 0이거나 잘못된 값 제외
                size = w.get("size", 0)
                if size <= 1.0:
                    continue
                # 문항 번호처럼 보이는 단어(숫자 패턴 매칭)이고 10pt 이상인 것만 집계
                # → 본문 텍스트(주로 소형)가 아닌 문항 번호 크기 분포를 파악
                if _extract_question_number(w["text"]) is not None and size >= _Q_FONT_SIZE_MIN:
                    size_counts[round(size, 1)] += 1

    # ── Step 2: 글로벌 폰트 임계값 결정 ───────────────────────
    # 문항 번호에 가장 많이 사용된 폰트 크기의 92%를 임계값으로 설정.
    # 92%로 여유를 두는 이유: 동일 폰트도 렌더링 방식에 따라 약간 달라질 수 있음.
    global_font_threshold = _calc_font_threshold(size_counts)

    # ── Step 3: 페이지별 정규식 기반 경계 감지 ────────────────
    # enumerate: (index, value) 튜플 형태로 데이터 반환
    for page_idx, (page_w, page_h, words) in enumerate(pages_data):
        if not words:
            continue

        # 헤더/푸터 영역 제외 (Step 1과 동일 기준)
        header_y = page_h * _HEADER_PERCENT
        footer_y = page_h * _FOOTER_PERCENT
        content_words = [
            w for w in words
            if header_y <= w["top"] <= footer_y
        ]
        if not content_words:
            continue

        # 2단 분할점 감지 → 왼쪽/오른쪽 단어 그룹 분리
        split_x = _detect_column_split(content_words, page_w)

        left_words  = [w for w in content_words if w["x0"] <  split_x]
        right_words = [w for w in content_words if w["x0"] >= split_x]

        # 각 컬럼의 실제 x 범위 계산 (크롭 시 x0/x1 경계로 사용)
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

        for col_idx, col_words in [(0, left_words), (1, right_words)]:
            if not col_words:
                continue

            cx0, cx1 = col_x_bounds[col_idx]
            # Y좌표 오름차순 정렬 → 위에서 아래로 문항 번호 탐색
            sorted_words = sorted(col_words, key=lambda w: w["top"])

            # "유제", "예제" 등 접두어 + 번호 단어 쌍을 하나의 가상 단어로 합치기
            # 예: ["유제", "1-1"] → ["유제1-1"]
            sorted_words = _merge_prefix_keyword_pairs(sorted_words)

            for w in sorted_words:
                w_size = w.get("size", 0)
                if w_size < 1.0:
                    continue
                # 폰트 크기 필터: 문항 번호보다 작은 폰트(본문 텍스트 등)는 제외
                # 임계값이 0이면 모든 크기 허용 (폰트 정보가 없는 PDF 대응)
                if global_font_threshold > 0 and w_size < global_font_threshold:
                    continue

                # 정규식 패턴으로 문항 번호 추출
                q_num = _extract_question_number(w["text"])
                if q_num is not None:
                    raw.append(QuestionBoundary(
                        number=q_num,
                        page_index=page_idx,
                        y_top=w["top"],
                        y_bottom=page_h,   # _fill_y_bottom에서 재계산됨
                        col=col_idx,
                        col_x0=cx0,
                        col_x1=cx1,
                    ))

    # ── Step 4: 연속 증분 패턴으로 정규식 누락 보완 ──────────
    # 정규식 11개 패턴으로 못 찾은 번호를 형식-독립 수열 탐지로 보완한다.
    # pages_data를 그대로 넘기므로 PDF 재오픈 비용 없음.
    adaptive_raw = _run_adaptive_detection(pages_data)
    if adaptive_raw:
        # 이미 정규식으로 찾은 번호는 중복 추가하지 않음
        pattern_nums = {b.number for b in raw}
        raw.extend(b for b in adaptive_raw if b.number not in pattern_nums)

    # ── Step 5: y_bottom 보정 ─────────────────────────────────
    # 현재 문항의 끝 = 같은 컬럼 내 다음 문항의 시작 y좌표 (없으면 페이지 하단)
    page_heights = [ph for _, ph, _ in pages_data]
    _fill_y_bottom(raw, page_heights)

    # ── Step 5-b: 감지 정밀도 개선 (v3 REQ-23/24/15) ─────────
    # _fill_y_bottom으로 y_bottom이 확정된 뒤 단어 범위를 알 수 있으므로 이 시점에 처리.
    # x 좌표 정밀화, y_bottom 조임, 오탐지 마킹을 순서대로 수행.
    _apply_precision_improvements(raw, pages_data)

    # ── Step 5-c: 배경색 필터 — 비백색 배경 오탐지 마킹 ────────
    # x/y 정밀화가 완료된 최종 bbox로 픽셀을 렌더링해야 정확하므로 5-b 이후에 실행.
    _apply_bg_color_filter(raw, pdf_path)

    ## ── Step 6: 중복 제거 + Step 7: 정렬 ────────────────────
    # unique = _deduplicate_boundaries(raw)
    # return sorted(unique, key=lambda b: b.number)

    # ── Step 6: 정렬 ────────────────────
    return sorted(raw, key=lambda b: b.number)


def _calc_font_threshold(size_counts: Counter) -> float:
    """
    집계된 폰트 크기 카운터에서 문항 번호 폰트 임계값을 계산한다.

    전략:
      - 13pt 이상 크기 중 가장 빈번한 것 → 큰 번호 스타일(강조 표시된 문항 번호)
      - 13pt 이상이 없으면 전체 최빈값 사용
      - 결정된 dominant_size의 92%를 임계값으로 반환
        (같은 폰트라도 ±8% 오차를 허용하여 누락 방지)
    """
    if not size_counts:
        return 0.0
    large_counts = {sz: cnt for sz, cnt in size_counts.items() if sz >= 13.0}
    if large_counts:
        dominant_size = max(large_counts, key=large_counts.get)
    else:
        dominant_size = size_counts.most_common(1)[0][0]
    return dominant_size * 0.92


def _deduplicate_boundaries(
    raw: list[QuestionBoundary],
) -> list[QuestionBoundary]:
    """
    같은 문항 번호가 여러 곳에서 감지된 경우 최적의 하나를 선택한다.

    중복 발생 원인:
      - 목차, 답안표 등에도 문항 번호가 인쇄된 경우
      - 정규식 + 연속 수열 두 방식이 같은 번호를 각각 감지한 경우

    선택 전략 (우선순위 순):
      1. "다중문항 페이지" 우선
         → 해당 페이지에 2개 이상의 문항 번호가 있으면 실제 문제 페이지일 확률이 높음
         → 목차 페이지는 번호가 1개씩 흩어져 있는 경향
      2. 동일 우선순위면 먼저 등장한 것 선택 (페이지 순 → 컬럼 순 → y좌표 순)
    """
    # 페이지별 문항 감지 수 집계 (다중문항 페이지 판별용)
    page_q_count: dict[int, int] = defaultdict(int)
    for b in raw:
        page_q_count[b.page_index] += 1

    # 문항 번호별 후보군 수집
    candidates: dict[int, list[QuestionBoundary]] = defaultdict(list)
    for b in raw:
        candidates[b.number].append(b)

    unique: list[QuestionBoundary] = []
    for q_num, cands in candidates.items():
        # 다중문항 페이지 후보 우선 선택
        multi_page_cands = [c for c in cands if page_q_count[c.page_index] >= 2]
        pool = multi_page_cands if multi_page_cands else cands
        # 등장 순서대로 첫 번째 선택
        best = sorted(pool, key=lambda b: (b.page_index, b.col, b.y_top))[0]
        unique.append(best)

    return unique


def _fill_y_bottom(
    boundaries: list[QuestionBoundary],
    page_heights: list[float],
) -> None:
    """
    각 문항의 y_bottom(끝 좌표)을 실제 값으로 채운다. In-place 수정.

    규칙:
      - 같은 (페이지, 컬럼) 그룹 내에서 현재 문항 y_bottom = 다음 문항 y_top
      - 해당 그룹의 마지막 문항은 푸터 시작점(page_height * _FOOTER_PERCENT)까지
        → 페이지 번호, 각주 등 하단 고정 요소를 크롭 영역에서 제외

    이 함수가 필요한 이유:
      감지 단계에서는 문항 번호의 y_top만 알 수 있고,
      끝나는 지점(y_bottom)은 다음 문항이 어디서 시작하는지 봐야 알 수 있기 때문.
    """
    # (page_index, col) 조합별로 그룹화
    groups: dict[tuple[int, int], list[QuestionBoundary]] = defaultdict(list)
    for b in boundaries:
        groups[(b.page_index, b.col)].append(b)

    for (page_idx, _col), group in groups.items():
        # Y좌표 오름차순 정렬 (위에서 아래로)
        sorted_g = sorted(group, key=lambda b: b.y_top)
        page_h = page_heights[page_idx] if page_idx < len(page_heights) else 9999.0
        # 마지막 문항의 상한: 푸터 영역 시작점(_FOOTER_PERCENT)으로 제한
        footer_y = page_h * _FOOTER_PERCENT
        for i, b in enumerate(sorted_g):
            if i + 1 < len(sorted_g):
                b.y_bottom = sorted_g[i + 1].y_top
            else:
                # 마지막 문항: 푸터 직전까지만 (페이지 번호/각주 제외)
                b.y_bottom = footer_y


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5-b. v3 감지 정밀도 개선 (REQ-23, REQ-24, REQ-15)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 오탐지 판정 허용 오차 (pt 단위)
# 페이지 전체 크기와 ±2pt 이내로 일치하면 오탐지로 간주한다.
_FALSE_POSITIVE_TOLERANCE = 2.0

# 배경색 필터 임계값
_BG_WHITE_MIN_RGB   = 230    # R/G/B 각각 이 값 이상인 픽셀을 "흰색"으로 판정 (0~255)
_BG_WHITE_THRESHOLD = 0.60   # bbox 픽셀 중 흰색 비율이 이 값 미만이면 오탐지로 마킹


def _calc_tight_y_bottom(
    question_words: list[dict],
    fallback_y_bottom: float,
) -> float:
    """
    [REQ-23] 문항 내 실제 텍스트 하단 + 50pt 이내로 y_bottom을 조여준다.

    문제:
      _fill_y_bottom은 "다음 문항 y_top까지"를 y_bottom으로 쓰는데,
      두 문항 사이 여백이 클 경우 크롭 영역에 불필요한 빈 공간이 생긴다.

    해결:
      문항에 속하는 단어들의 bottom 좌표 중 최대값에 50pt를 더한 값과
      fallback_y_bottom(다음 문항 y_top 또는 페이지 하단) 중 더 작은 값 사용.
      50pt 여유를 두는 이유: 문항 번호 직후에 오는 그림/표는 텍스트가 없기 때문.

    Args:
        question_words: 해당 문항 영역(y_top ~ fallback_y_bottom) 안의 단어들
        fallback_y_bottom: 다음 문항 y_top 또는 페이지 하단 (상한값)
    """
    if not question_words:
        # 텍스트가 없으면 기존 값 유지 (그림만 있는 문항 등)
        return fallback_y_bottom
    last_text_bottom = max(w["bottom"] for w in question_words)
    return min(fallback_y_bottom, last_text_bottom + 50)


def _is_false_positive(
    boundary: QuestionBoundary,
    page_width: float,
    page_height: float,
) -> bool:
    """
    [REQ-15] 감지된 경계가 페이지 전체 크기와 일치하면 오탐지로 판정한다.

    오탐지 발생 원인:
      pdfplumber가 페이지 전체를 감싸는 테두리 사각형을 인식하거나,
      스캔 본의 검은 외곽선을 텍스트 영역으로 잘못 포함시키는 경우 발생.
      이 경우 경계가 (0, 0) ~ (page_width, page_height)에 매우 근접한다.

    처리 방침:
      is_false_positive=True로 마킹하되 목록에서 제거하지 않는다.
      UI에서 빨간 테두리 + "오탐지 의심" 배지를 표시하여 사용자가 확인할 수 있도록.
    """
    return (
        abs(boundary.col_x0 - 0) < _FALSE_POSITIVE_TOLERANCE
        and abs(boundary.y_top - 0) < _FALSE_POSITIVE_TOLERANCE
        and abs(boundary.col_x1 - page_width) < _FALSE_POSITIVE_TOLERANCE
        and abs(boundary.y_bottom - page_height) < _FALSE_POSITIVE_TOLERANCE
    )


def _is_white_background(page: fitz.Page, bbox: fitz.Rect) -> bool:
    """bbox 영역을 렌더링하여 흰색 픽셀 비율을 계산한다.
    흰색 픽셀: R, G, B 모두 _BG_WHITE_MIN_RGB 이상인 픽셀.
    비율이 _BG_WHITE_THRESHOLD 이상이면 True(흰 배경), 미만이면 False(컬러 배경).
    """
    pix = page.get_pixmap(clip=bbox, colorspace=fitz.csRGB, alpha=False)
    total = pix.width * pix.height
    if total == 0:
        return True
    samples = pix.samples
    white_count = sum(
        1
        for i in range(0, len(samples), 3)
        if samples[i] >= _BG_WHITE_MIN_RGB
        and samples[i + 1] >= _BG_WHITE_MIN_RGB
        and samples[i + 2] >= _BG_WHITE_MIN_RGB
    )
    return (white_count / total) >= _BG_WHITE_THRESHOLD


def _apply_bg_color_filter(
    boundaries: list,
    pdf_path: str,
) -> None:
    """배경이 흰색이 아닌 문항을 is_false_positive=True로 마킹한다.
    이미 is_false_positive=True인 항목은 건너뛴다.
    """
    doc = fitz.open(pdf_path)
    try:
        for b in boundaries:
            if b.is_false_positive:
                continue
            if b.page_index >= len(doc):
                continue
            page = doc[b.page_index]
            bbox = fitz.Rect(b.col_x0, b.y_top, b.col_x1, b.y_bottom)
            if not _is_white_background(page, bbox):
                b.is_false_positive = True
    finally:
        doc.close()


def _apply_precision_improvements(
    boundaries: list[QuestionBoundary],
    pages_data: list[tuple[float, float, list[dict]]],
) -> None:
    """
    [REQ-23, REQ-24, REQ-15] _fill_y_bottom 이후 경계 정밀도를 추가로 개선한다.
    In-place 수정.

    처리 순서 (각 경계별):
      1. [REQ-24] 문항 번호 텍스트 x0 - 10pt → col_x0 재계산
                  문항 내 단어 최대 x1 → col_x1 재계산
      2. [REQ-23] 마지막 텍스트 bottom + 50pt 이내로 y_bottom 조임
      3. [REQ-15] 경계가 페이지 전체 크기와 일치하면 is_false_positive=True 마킹

    이 단계를 _fill_y_bottom 이후에 분리해서 처리하는 이유:
      - REQ-24 x 정밀화와 REQ-23 y_bottom 정밀화 모두 해당 문항의 단어 목록이 필요함
      - 단어 필터링에는 확정된 y_bottom(다음 문항 y_top)이 필요함
      - _fill_y_bottom이 y_bottom을 확정한 이후에만 단어 범위를 정확히 알 수 있음
    """
    for b in boundaries:
        if b.page_index >= len(pages_data):
            continue
        page_w, page_h, all_words = pages_data[b.page_index]

        # 이 문항 영역에 속하는 단어만 추출
        # x: 컬럼 범위 내, y: y_top ~ y_bottom 범위 내
        question_words = [
            w for w in all_words
            if b.col_x0 <= w["x0"] <= b.col_x1
            and b.y_top <= w["top"] <= b.y_bottom
        ]

        # ── REQ-24: x 좌표 정밀화 ────────────────────────────────
        # 문항 번호 텍스트의 x0를 실제 col_x0로 재계산한다.
        # 컬럼 분할점 기반 고정 경계 대신 실제 문항 번호 텍스트 위치 기반으로 정밀화.
        num_word = next(
            (w for w in question_words
             if _extract_question_number(w.get("text", "")) == b.number),
            None,
        )
        if num_word:
            # 문항 번호 텍스트 x0에서 10pt 왼쪽으로 여유를 줘서 번호가 잘리지 않도록
            b.col_x0 = max(0.0, num_word["x0"] - 10)
        # 해당 문항에 속한 모든 단어의 최대 x1을 새 col_x1로 사용
        if question_words:
            b.col_x1 = min(page_w, max(w["x1"] for w in question_words))

        # ── REQ-23: y_bottom 정밀화 ──────────────────────────────
        # 다음 문항 y_top까지 포함했던 넓은 y_bottom을 실제 텍스트 하단에 맞게 줄임.
        # 문항 사이 불필요한 여백을 제거하여 크롭 이미지가 더 촘촘하게 표시됨.
        b.y_bottom = _calc_tight_y_bottom(question_words, b.y_bottom)

        # ── REQ-15: 오탐지 마킹 ──────────────────────────────────
        # x 정밀화 + y 정밀화 후 최종 경계로 오탐지 여부를 판정한다.
        b.is_false_positive = _is_false_positive(b, page_w, page_h)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. 적응형 형식-독립 감지 (v0.1 수열 패턴 / v0.2 수열+여백 패턴)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 숫자를 포함한 단어에서 (prefix, number, suffix) 를 추출하는 정규식.
#
# prefix 가 [^\d]* (비숫자만) 인 이유:
#   "2024" 같은 연도를 prefix="2", num=24 로 오파싱하면 안 되기 때문.
#   숫자로 시작하는 접두사는 허용하지 않아 연도/쪽번호 오탐을 방지한다.
#
# suffix 허용:
#   · . ] ) 번  → "14." "[14]" "(14)" "14번" 등 후처리 형식
#   · -\d+       → "1-1", "1-2" 등 소문항 번호 (유제 1-1 스타일)
#     주의: 이 경우 suffix="-1"이 되어 그룹 키의 일부가 됨.
#     같은 소문항 번호끼리 (유제1-1, 유제2-1, 유제3-1) 연속 수열이 형성됨.
_NUM_RE = re.compile(r"^([^\d]*?)(\d{1,3})((?:-\d+)?[\.\]\)번]*)$")


def _parse_candidate(text: str) -> Optional[tuple[str, int, str]]:
    """
    단어 텍스트를 (prefix, number, suffix) 로 분해한다.

    숫자가 없거나 유효 범위(_Q_MIN~_Q_MAX) 밖이면 None 반환.
    연속 수열 감지의 전처리 단계로, 형식(prefix/suffix)을 보존하여
    같은 형식끼리 그룹핑할 수 있도록 한다.
    """
    t = text.strip()
    m = _NUM_RE.match(t)
    if not m:
        return None
    prefix, num_str, suffix = m.group(1), m.group(2), m.group(3)
    n = int(num_str)
    if not (_Q_MIN <= n <= _Q_MAX):
        return None
    return (prefix, n, suffix)


# ── v0.2: 여백 패턴 ──────────────────────────────────────────

def _build_gap_map(
    pages_data: list[tuple[float, float, list[dict]]],
    min_gap_pt: float = 6.0,
    median_multiplier: float = 3.0,
) -> GapMap:
    """
    [v0.2] 컬럼별 "유의미한 여백(significant gap)" 직후 Y좌표 목록을 구성한다.

    ━━━ 원리 ━━━
    문항과 문항 사이에는 일반 행간보다 현저히 큰 수직 여백이 존재한다.
      - 일반 행간  : 2~5 pt  (같은 문항 내 줄 간격)
      - 문항 간 여백: 10~25 pt (출판사가 의도적으로 삽입)
    이 차이를 이용해 "어디서 문항이 시작되는지"를 위치 단위로 미리 계산한다.

    ━━━ 임계값 결정 전략 ━━━
    고정 임계값(예: 항상 8pt 이상)을 쓰면 밀집 레이아웃에서 오작동.
    대신 컬럼별 동적 임계값을 사용한다:
      threshold = max(min_gap_pt, median(gaps) × median_multiplier)
      · median(gaps): 해당 컬럼의 "전형적인 행간"
      · × 3.0       : 전형 행간의 3배 이상이면 유의미한 여백
      · min_gap_pt  : 최소 보장값 (너무 작은 임계값 방지)

    ━━━ 빽빽한 레이아웃 대응 ━━━
    모든 gap이 작아 임계값을 만족하는 것이 없으면 해당 컬럼 엔트리를 생성하지 않는다.
    호출 측 _whitespace_confidence()는 GapMap에 키가 없으면 0.0을 반환하므로
    v0.2 점수가 자연스럽게 v0.1(gap_ratio=0)과 동일해진다.

    Args:
        pages_data       : detect_question_boundaries에서 수집한 페이지 데이터 (재사용)
        min_gap_pt       : significant gap 최소 크기 (pt). 기본 6pt.
        median_multiplier: 중앙값의 몇 배 이상이면 significant로 판단. 기본 3.0.

    Returns:
        GapMap — {(page_idx, col_idx): [y_after_gap, ...]} (오름차순 정렬)
    """
    gap_map: GapMap = {}

    for page_idx, (page_w, page_h, words) in enumerate(pages_data):
        if not words:
            continue

        # 헤더/푸터 제외 (_run_adaptive_detection과 동일 기준)
        header_y = page_h * 0.11
        footer_y = page_h * 0.91
        content_words = [w for w in words if header_y <= w["top"] <= footer_y]
        if not content_words:
            continue

        split_x     = _detect_column_split(content_words, page_w)
        left_words  = [w for w in content_words if w["x0"] <  split_x]
        right_words = [w for w in content_words if w["x0"] >= split_x]

        for col_idx, col_words in [(0, left_words), (1, right_words)]:
            if len(col_words) < 4:
                # 단어 수가 너무 적으면 gap 통계가 의미 없음 → 스킵
                continue

            # Y좌표 기준 정렬
            sorted_words = sorted(col_words, key=lambda w: w["top"])

            # 인접 단어 간 gap 계산
            # gap = 다음 단어 top - 현재 단어 bottom (양수만 의미 있음)
            raw_gaps: list[tuple[float, float]] = []   # (gap_size, y_after_gap)
            for i in range(1, len(sorted_words)):
                gap_size = sorted_words[i]["top"] - sorted_words[i - 1]["bottom"]
                if gap_size > 0:
                    raw_gaps.append((gap_size, sorted_words[i]["top"]))

            if not raw_gaps:
                continue

            # 동적 임계값: 해당 컬럼 gap 분포의 중앙값 × median_multiplier
            gap_sizes  = sorted(g for g, _ in raw_gaps)
            median_gap = gap_sizes[len(gap_sizes) // 2]
            threshold  = max(min_gap_pt, median_gap * median_multiplier)

            # threshold 이상인 gap 직후 Y좌표 수집
            sig_ys = sorted(y for g, y in raw_gaps if g >= threshold)
            if sig_ys:
                gap_map[(page_idx, col_idx)] = sig_ys

    return gap_map


def _whitespace_confidence(
    chain: list,
    gap_map: GapMap,
    tolerance_pt: float = 5.0,
) -> float:
    """
    [v0.2] 체인 내 각 항목이 significant gap 직후에 등장하는 비율을 반환한다.

    반환값 범위: 0.0 ~ 1.0
      1.0 → 체인의 모든 번호가 큰 여백 직후에 위치 (문항 번호일 가능성 최고)
      0.0 → 아무도 여백 직후에 없음 (우연 수열 가능성)

    판정 방법:
      각 항목의 y_top이 해당 컬럼 gap_map의 Y값 중 하나와 tolerance_pt 이내이면
      "여백 직후에 등장"으로 판정한다.

    여백 정보가 없는 컬럼(gap_map에 키 없음)은 모두 0으로 계산 →
    v0.2 점수가 자연스럽게 v0.1 수준으로 fall-back된다.

    Args:
        chain        : _run_adaptive_detection 체인 엔트리 리스트
                       각 항목: (page_idx, col_idx, y_top, number, cx0, cx1, page_h)
        gap_map      : _build_gap_map()의 반환값
        tolerance_pt : gap Y좌표와의 허용 오차 (pt). 기본 5pt.

    Returns:
        여백 직후 등장 비율 (float, 0.0~1.0)
    """
    if not chain:
        return 0.0

    match_count = 0
    for page_idx, col_idx, y_top, _num, _cx0, _cx1, _ph in chain:
        sig_ys = gap_map.get((page_idx, col_idx))
        if not sig_ys:
            continue  # 이 컬럼엔 significant gap 없음 → 0 처리

        # sig_ys는 정렬된 리스트이므로 이진 탐색으로 가장 가까운 값 확인
        # (성능: 컬럼당 수십 개 수준이므로 선형 탐색도 무방)
        for gap_y in sig_ys:
            if abs(y_top - gap_y) <= tolerance_pt:
                match_count += 1
                break   # 한 gap에 매칭되면 중복 카운트 방지

    return match_count / len(chain)


# ── 공통: 수열 탐색 ──────────────────────────────────────────

def _run_adaptive_detection(
    pages_data: list[tuple[float, float, list[dict]]],
    version: str = ADAPTIVE_DETECTION_VERSION,
) -> list[QuestionBoundary]:
    """
    형식-독립 문항 경계 감지 (내부용). pages_data를 재사용하여 PDF 재오픈 없이 실행.

    ━━━ v0.1: 수열 패턴 ━━━
    핵심 가정: 문항 번호는 문서 전체에서 1씩 증가하는 규칙적인 수열을 이룬다.

    1. 전체 단어를 (prefix, suffix, font_cluster) 키로 그룹핑
         prefix/suffix : 문항 번호를 감싸는 앞뒤 형식 (예: "" / "." → "14.")
         font_cluster  : 폰트 크기 2pt 단위 반올림 — 미세 차이 무시
    2. 각 그룹 내 단어를 페이지→컬럼→Y 순서로 정렬 후 +1 연속 수열 탐색
         유효 체인 = 길이 3 이상 (2개 이하는 우연 가능성)
    3. [v0.1] 그룹 점수 = 유효 체인 길이 합계 (커버리지)
    4. 최고 점수 그룹의 모든 유효 체인 → QuestionBoundary 변환

    ━━━ v0.2: 수열 패턴 + 여백 패턴 ━━━
    v0.1 수열 탐색은 동일. 채점 단계만 다르다.

    3. [v0.2] 그룹 점수 = 커버리지 × (1 + 여백 일치 비율)
         여백 일치 비율 = 체인 항목 중 significant gap 직후 등장 비율
         · 비율 1.0 → 점수 × 2.0  (모두 여백 이후 → 실제 문항 번호)
         · 비율 0.0 → 점수 × 1.0  (여백 근거 없음 → v0.1과 동일)

    효과:
      본문 중 우연한 수열 (예: "3개 항목, 4번째, 5번째")은 여백 직후가 아니므로
      보정 계수가 작아 실제 문항 번호 그룹에 비해 낮은 점수를 받게 된다.

    ━━━ 공통 주의사항 ━━━
    반환된 QuestionBoundary의 y_bottom = page_h (초기값).
    호출 측에서 반드시 _fill_y_bottom() 을 호출해야 한다.

    Args:
        pages_data: [(page_w, page_h, words), ...] — detect_question_boundaries 수집분 재사용
        version   : "v0.1" 또는 "v0.2". 기본값 = ADAPTIVE_DETECTION_VERSION
    """

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # [v0.1 / v0.2 공통] 그룹핑 + 연속 수열 탐색
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    # key  : (prefix, suffix, font_cluster)
    # value: [(page_idx, col_idx, y_top, number, col_x0, col_x1, page_h), ...]
    groups: dict[tuple, list] = defaultdict(list)

    for page_idx, (page_w, page_h, words) in enumerate(pages_data):
        if not words:
            continue

        header_y = page_h * 0.11
        footer_y = page_h * 0.91
        content_words = [w for w in words if header_y <= w["top"] <= footer_y]
        if not content_words:
            continue

        split_x     = _detect_column_split(content_words, page_w)
        left_words  = [w for w in content_words if w["x0"] <  split_x]
        right_words = [w for w in content_words if w["x0"] >= split_x]
        col_x_bounds = {
            0: (min((w["x0"] for w in left_words),  default=0.0), split_x),
            1: (split_x, max((w["x1"] for w in right_words), default=page_w)),
        }

        for col_idx, col_words in [(0, left_words), (1, right_words)]:
            # "유제 1-1" 처럼 두 단어로 분리된 패턴을 하나로 합쳐서 탐지 정확도 향상
            merged_col_words = _merge_prefix_keyword_pairs(
                sorted(col_words, key=lambda w: w["top"])
            )
            for w in merged_col_words:
                parsed = _parse_candidate(w["text"])
                if parsed is None:
                    continue
                prefix, number, suffix = parsed
                # 폰트 크기 2pt 단위 클러스터링 (11.9pt → 12, 12.1pt → 12)
                font_cluster = round(w.get("size", 0) / 2) * 2
                cx0, cx1 = col_x_bounds[col_idx]
                groups[(prefix, suffix, font_cluster)].append(
                    (page_idx, col_idx, w["top"], number, cx0, cx1, page_h)
                )

    if not groups:
        return []

    # 그룹별 연속 수열 탐색
    group_chains: dict[tuple, list[list]] = {}

    for key, entries in groups.items():
        # 읽기 순서 정렬: 페이지 → 컬럼 → Y좌표
        sorted_entries = sorted(entries, key=lambda e: (e[0], e[1], e[2]))

        chains: list[list] = []
        cur: list = []
        prev_num = -1

        for entry in sorted_entries:
            num = entry[3]
            if cur and num == prev_num + 1:
                cur.append(entry)          # +1 → 체인 연장
            else:
                if len(cur) >= 3:
                    chains.append(cur)     # 길이 3 이상만 유효 체인
                cur = [entry]
            prev_num = num

        if len(cur) >= 3:
            chains.append(cur)

        if chains:
            group_chains[key] = chains

    if not group_chains:
        return []

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # [v0.2 전용] 여백 지도(GapMap) 구성
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # pages_data를 재사용하므로 PDF 재오픈 비용 없음.
    # v0.1이면 빈 GapMap을 사용 → _whitespace_confidence()가 항상 0.0 반환
    # → 채점 보정이 없어 v0.1과 완전히 동일하게 동작
    gap_map: GapMap = _build_gap_map(pages_data) if version == "v0.2" else {}

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 그룹 점수 계산
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    group_scores: dict[tuple, float] = {}

    for key, chains in group_chains.items():
        base_score = sum(len(c) for c in chains)   # v0.1: 커버리지

        if version == "v0.2" and gap_map:
            # v0.2: 커버리지 × (1 + 여백 일치 비율)
            #
            # gap_ratio: 전체 체인 항목 중 significant gap 직후 등장 비율
            # = Σ(각 체인의 여백 일치 항목 수) / Σ(각 체인 길이)
            #
            # 예시:
            #   체인1 [1~5번], 5항목 중 4개가 여백 직후 → confidence = 0.8
            #   체인2 [10~14번], 5항목 중 5개가 여백 직후 → confidence = 1.0
            #   gap_ratio = (4+5) / (5+5) = 0.9
            #   최종 점수 = 10 × (1 + 0.9) = 19.0  (v0.1이면 10.0)
            total_gap_matches = sum(
                len(c) * _whitespace_confidence(c, gap_map)
                for c in chains
            )
            gap_ratio = total_gap_matches / base_score
            group_scores[key] = base_score * (1.0 + gap_ratio)
        else:
            # v0.1: 커버리지만 사용
            group_scores[key] = float(base_score)

    if not group_scores:
        return []

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 최고 점수 그룹 선택 → QuestionBoundary 생성
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    best_key = max(group_scores, key=group_scores.get)
    raw: list[QuestionBoundary] = []

    # 최고 그룹의 모든 유효 체인 반환
    # (단일 최장 체인만 반환하면 중간에 형식이 바뀐 구간을 놓칠 수 있음)
    for chain in group_chains[best_key]:
        for page_idx, col_idx, y_top, number, cx0, cx1, page_h in chain:
            raw.append(QuestionBoundary(
                number=number,
                page_index=page_idx,
                y_top=y_top,
                y_bottom=page_h,   # _fill_y_bottom에서 재계산 예정
                col=col_idx,
                col_x0=cx0,
                col_x1=cx1,
            ))

    return raw


def detect_question_boundaries_adaptive(pdf_path: str) -> list[QuestionBoundary]:
    """
    공개 API: 형식-독립 감지만 단독으로 실행할 때 사용.

    일반적인 파이프라인에서는 detect_question_boundaries() 내부에서
    자동으로 호출되므로 직접 호출할 필요 없음.
    단독 테스트나 비교 분석 시 활용.
    """
    pages_data: list[tuple[float, float, list[dict]]] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words(
                keep_blank_chars=False,
                x_tolerance=3,
                y_tolerance=3,
                extra_attrs=["size"],
            )
            pages_data.append((page.width, page.height, words))

    raw = _run_adaptive_detection(pages_data)
    if not raw:
        return []

    page_heights = [ph for _, ph, _ in pages_data]
    _fill_y_bottom(raw, page_heights)
    # unique = _deduplicate_boundaries(raw)
    # return sorted(unique, key=lambda b: b.number)
    return sorted(raw, key=lambda b: b.number)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. 문항 → CropRegion 매핑
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def map_questions_to_regions(
    boundaries: list[QuestionBoundary],
    requested: list[int],
) -> dict[int, list[CropRegion]]:
    """
    요청된 문항 번호를 실제 PDF 크롭 영역(CropRegion) 리스트로 변환한다.

    하나의 문항이 여러 CropRegion을 가질 수 있는 경우:
      - 문항이 2단 레이아웃의 왼쪽 컬럼 끝 + 오른쪽 컬럼 초반에 걸쳐 있을 때
      - 문항이 여러 페이지에 걸쳐 있을 때 (중간 페이지는 전체 포함)

    ━━━ 케이스별 처리 ━━━
      A. 같은 페이지·같은 컬럼  → Y 범위 클리핑 (가장 흔한 케이스)
         현재 문항 y_top ~ 다음 문항 y_top 구간만 크롭
      B. 같은 페이지·다른 컬럼  → 왼쪽 컬럼 잔여 + 오른쪽 컬럼 초반 두 영역
         왼쪽 컬럼: 현재 문항 y_top ~ 컬럼 하단
         오른쪽 컬럼: 컬럼 상단 ~ 다음 문항 y_top (단, y_top > 0일 때)
      C. 다음 문항이 다른 페이지 → 현재 페이지는 컬럼 하단까지, 중간 페이지는 전체
      D. 마지막 문항             → 현재 컬럼 하단(page_height)까지

    Returns:
        {question_number: [CropRegion, ...]} — 요청했지만 감지 못한 번호는 키가 없음
    """
    # 번호로 빠르게 조회하기 위한 딕셔너리
    num_to_b = {b.number: b for b in boundaries}
    sorted_b  = sorted(boundaries, key=lambda b: b.number)

    result: dict[int, list[CropRegion]] = {}

    for q_num in requested:
        if q_num not in num_to_b:
            continue  # 감지되지 않은 번호 → 건너뜀

        cur    = num_to_b[q_num]
        # 현재 문항보다 번호가 큰 것 중 첫 번째 = 다음 문항
        next_b = next((b for b in sorted_b if b.number > q_num), None)

        regions: list[CropRegion] = []

        # ── 케이스 D: 마지막 문항 ────────────────────────────
        if next_b is None:
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))

        # ── 케이스 C: 다음 문항이 다른 페이지 ───────────────
        elif next_b.page_index > cur.page_index:
            # 현재 페이지: 현재 컬럼 y_top ~ y_bottom(= page_h)
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))
            # 중간 페이지(있는 경우): 페이지 전체 포함 (sentinel y1=9999)
            for mid_page in range(cur.page_index + 1, next_b.page_index):
                regions.append(CropRegion(
                    page_index=mid_page,
                    x0=0, y0=0,
                    x1=9999, y1=9999,  # _build_pdf_from_regions에서 전체 페이지로 처리
                ))

        # ── 케이스 A: 같은 페이지·같은 컬럼 ────────────────
        elif next_b.page_index == cur.page_index and next_b.col == cur.col:
            # Y 클리핑: 현재 문항 시작 ~ 다음 문항 시작
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=next_b.y_top,
            ))

        # ── 케이스 B: 같은 페이지·다음 컬럼으로 넘어감 ─────
        elif next_b.page_index == cur.page_index and next_b.col > cur.col:
            # 왼쪽 컬럼 하단까지
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))
            # 오른쪽 컬럼 상단 ~ 다음 문항 시작 (단, 실제 내용이 있을 때만)
            if next_b.y_top > 0:
                regions.append(CropRegion(
                    page_index=cur.page_index,
                    x0=next_b.col_x0, y0=0.0,
                    x1=next_b.col_x1, y1=next_b.y_top,
                ))

        # ── fallback ─────────────────────────────────────────
        else:
            regions.append(CropRegion(
                page_index=cur.page_index,
                x0=cur.col_x0, y0=cur.y_top,
                x1=cur.col_x1, y1=cur.y_bottom,
            ))

        # 높이가 2pt 이하인 영역은 노이즈이므로 제외 (sentinel y1=9999는 예외)
        result[q_num] = [r for r in regions if r.height > 2 or r.y1 == 9999]

    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8. (레거시 호환) 텍스트 기반 경계 감지
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def detect_question_boundaries_from_text(
    pages_text: list[str],
) -> list["_LegacyBoundary"]:
    """
    좌표 없이 텍스트만으로 경계를 감지하는 구버전 함수.

    사용 시점: OCR fallback 결과(텍스트만 있는 스캔본)에서 좌표 정보가 없을 때.
    정확도는 좌표 기반 방식보다 낮음 (Y 클리핑 불가 → 페이지 단위 추출).
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

    # 같은 번호의 첫 등장만 유지
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
    """
    레거시 호환: 좌표 없는 경계에서 페이지 번호 목록만 반환.

    OCR fallback 결과를 페이지 단위로 추출할 때 사용.
    현재 문항 페이지부터 다음 문항 직전 페이지까지의 범위를 반환한다.
    """
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
