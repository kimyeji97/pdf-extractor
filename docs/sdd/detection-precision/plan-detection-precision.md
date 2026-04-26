# plan-detection-precision — 문항 경계 감지 정밀도 개선

> **요구사항**: REQ-15, REQ-23, REQ-24  
> **작성일**: 2026-04-26  
> **관련 spec**: [plan-v3.md](../spec-v3.md)  
> **변경 범위**: 백엔드 전용 (`question_parser.py`, `schemas.py`)

---

## 1. 목표

자동 문항 경계 감지 결과의 세 가지 정밀도 문제를 해소한다.

| 문제 | 현재 동작 | 목표 |
|------|-----------|------|
| y_bottom 과도 포함 | 다음 문항 y_top까지 전부 포함 → 하단 여백 과다 | 마지막 텍스트 bottom + 50pt 이내로 제한 |
| x 좌표 부정확 | 컬럼 분할점 기준 고정 | 문항 번호 텍스트 x0 − 10pt / 텍스트 최대 x1 |
| 오탐지 미감지 | 페이지 전체 크기 영역도 문항으로 등록 | 페이지 크기와 일치하는 경계를 오탐지로 표시 |

---

## 2. 데이터 모델 변경

### `QuestionBoundary` (question_parser.py)

```python
@dataclass
class QuestionBoundary:
    number: int
    page_index: int
    col: int
    y_top: float
    y_bottom: float
    col_x0: float
    col_x1: float
    # ── v3 신규 ──
    title: Optional[str] = None          # 사용자 수정 타이틀
    is_false_positive: bool = False      # 오탐지 여부 (REQ-15)
    is_manual: bool = False              # 수동 추가 문항 여부
    manual_id: Optional[str] = None     # 수동 추가 시 UUID
```

> **하위 호환**: 기존 `boundaries/*.json` 역직렬화 시 신규 필드 누락은 기본값으로 처리.  
> `QuestionBoundary(**b)` 에 `field(default=...)` 가 있으므로 별도 마이그레이션 불필요.

---

## 3. REQ-23: y_bottom 정밀화

**구현 위치**: `question_parser.py` → 경계 계산 완료 직후

```python
def _calc_tight_y_bottom(
    words: list[dict],        # 이 문항에 속하는 pdfplumber 단어 목록
    fallback_y_bottom: float  # 다음 문항 y_top 또는 컬럼 하단
) -> float:
    if not words:
        return fallback_y_bottom
    last_text_bottom = max(w["bottom"] for w in words)
    return min(fallback_y_bottom, last_text_bottom + 50)
```

**적용 시점**: 각 `QuestionBoundary`의 `y_bottom`을 확정하는 루프 내에서 호출.

**영향**:
- 문항 하단 여백 과다 포함 문제 해소.
- 추출 PDF가 더 촘촘하게 배치됨.
- 썸네일 크롭 영역도 동일하게 축소됨.

---

## 4. REQ-24: x 좌표 정밀화

**구현 위치**: `question_parser.py` → `QuestionBoundary` 생성 시점

```python
# 문항 번호 텍스트의 x0 찾기
num_word = next(
    (w for w in page_words if is_question_number_word(w, boundary.number)),
    None
)

if num_word:
    col_x0 = max(0, num_word["x0"] - 10)
else:
    col_x0 = boundary.col_x0  # fallback: 기존 컬럼 분할점

# 해당 문항 내 모든 단어의 최대 x1
col_x1 = max(
    (w["x1"] for w in question_words),
    default=boundary.col_x1
)
```

**영향**:
- 컬럼 경계를 넘지 않는 더 정밀한 크롭.
- 좌우 여백 제거로 문항 내용 집중도 향상.
- 문항 번호 감지 실패 시 기존 로직으로 fallback.

---

## 5. REQ-15: 오탐지 감지

**오탐지 기준**: 감지된 문항 경계(x0, y_top, x1, y_bottom)가 해당 페이지의 전체 크기와 일치.

**구현 위치**: `detect_question_boundaries()` 내부, `QuestionBoundary` 생성 직후

```python
TOLERANCE = 2.0  # pt 단위 허용 오차

def _is_false_positive(
    boundary: QuestionBoundary,
    page_width: float,
    page_height: float,
) -> bool:
    return (
        abs(boundary.col_x0 - 0) < TOLERANCE
        and abs(boundary.y_top - 0) < TOLERANCE
        and abs(boundary.col_x1 - page_width) < TOLERANCE
        and abs(boundary.y_bottom - page_height) < TOLERANCE
    )
```

**오탐지 처리**:
- `is_false_positive = True` 로 마킹. 목록에서 제거하지 않음 (UI에서 하이라이트 표시).
- API 응답에 `is_false_positive` 필드 포함.

---

## 6. API 응답 변경

`GET /api/jobs/{job_id}/pages/{page_num}/questions` 응답의 `QuestionInfo` 모델에 필드 추가:

```python
class QuestionInfo(BaseModel):
    question_num: Optional[int] = None
    manual_id: Optional[str] = None
    question_id: str
    thumbnail_url: str
    bbox: BBox
    col: int
    title: Optional[str] = None          # 신규
    is_false_positive: bool = False      # 신규
    is_manual: bool = False              # 신규
```

---

## 7. 구현 작업 목록

1. `QuestionBoundary` dataclass에 `title`, `is_false_positive`, `is_manual`, `manual_id` 필드 추가
2. `_calc_tight_y_bottom()` 함수 작성
3. 경계 계산 루프에 `_calc_tight_y_bottom()` 적용 (REQ-23)
4. 문항 번호 텍스트 기반 `col_x0 / col_x1` 계산 로직 적용 (REQ-24)
5. `_is_false_positive()` 함수 작성 + `detect_question_boundaries()` 내 적용 (REQ-15)
6. `browse.py`의 `QuestionInfo` 응답 스키마에 신규 필드 추가
7. 기존 경계 캐시 역직렬화 하위 호환 확인 (unit test)
