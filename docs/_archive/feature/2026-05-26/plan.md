# plan — workbook_types API 누락 수정 + 배경색 기반 문항 후처리 필터

> **작성일**: 2026-05-26  
> **변경 범위**: 백엔드 (`browse.py`, `upload.py`, `question_parser.py`), 프론트엔드 영향 없음 (기존 코드 그대로 동작)

---

## 1. workbook_types API 누락 수정

### 문제

`JobStatusFile`에는 `workbook_types: Optional[list[str]]`가 저장되지만,  
응답 모델인 `JobSummary`에 해당 필드가 없어 세 엔드포인트 모두 반환하지 않는다.

| 엔드포인트 | 문제 |
|---|---|
| `GET /api/jobs` | `to_summary()` 에서 `workbook_types` 미포함 |
| `GET /api/jobs/{job_id}` | `JobSummary(...)` 생성 시 `workbook_types` 미포함 |
| `PATCH /api/jobs/{job_id}` | 수정 후 반환하는 `JobSummary(...)` 에서 `workbook_types` 미포함 |

**FE 영향**:
- `FileListPanel.jsx` — 유형 태그 표시, 검색 필터(`job.workbook_types` 기반) 항상 빈 배열
- `FilePagePanel.jsx` — 유형 편집 인풋 초기값 항상 비어 있음

### 수정 방법

**`backend/app/routers/browse.py`**

```python
# 1. JobSummary 모델에 필드 추가
class JobSummary(BaseModel):
    ...
    workbook_name: Optional[str] = None
    workbook_types: Optional[list[str]] = None   # ← 추가

# 2. list_jobs() — to_summary() 에 추가
def to_summary(j) -> JobSummary:
    return JobSummary(
        ...
        workbook_name=j.workbook_name,
        workbook_types=j.workbook_types,   # ← 추가
    )

# 3. get_job() 응답에 추가
return JobSummary(
    ...
    workbook_name=job.workbook_name,
    workbook_types=job.workbook_types,   # ← 추가
)

# 4. update_job_meta() 응답에 추가
return JobSummary(
    ...
    workbook_name=job.workbook_name,
    workbook_types=job.workbook_types,   # ← 추가
)
```

### 검증 포인트

- [ ] `POST /api/upload` → `GET /api/jobs` 응답에 `workbook_types` 포함 확인
- [ ] `PATCH /api/jobs/{id}` 응답에 수정된 `workbook_types` 반영 확인
- [ ] FE `FileListPanel`에서 유형 태그 표시 및 검색 필터 정상 동작 확인

---

## 2. 배경색 기반 문항 후처리 필터

### 목표

컬러 배경(예: 지문/설명 박스, 단원 소개 페이지)에 있는 영역이 문항으로 오탐지되는 것을 방지한다.  
추출 전 페이지 단위로 거르면 정상 문항도 누락될 수 있으므로, **문항 경계 감지 후 각 bbox별로 배경색을 검사**한다.

### 방식 선택: 후처리(post-extraction) 필터

| 방식 | 장점 | 단점 |
|---|---|---|
| 페이지 전처리 (페이지 흰색 임계값) | 구현 간단 | 페이지 일부만 색지인 경우 정상 문항까지 제거 |
| **문항 후처리 (bbox 픽셀 분석)** ✅ | 문항 단위로 정밀하게 필터 | 경계 감지는 모두 실행됨 (성능 소폭 증가) |

후처리 방식을 선택한다. 이미 `is_false_positive` 필드가 존재하므로 기존 오탐지 처리 흐름에 자연스럽게 통합 가능하다.

### 구현 위치

`backend/app/utils/question_parser.py`  
→ `detect_question_boundaries()` 반환 직전, 또는 `_trigger_boundary_detection()`(upload.py) 의 경계 감지 직후.

**권장**: `question_parser.py` 내부에서 처리해 단일 책임 유지.

### 핵심 로직

```python
import fitz
import numpy as np

WHITE_THRESHOLD = 0.60   # bbox 픽셀 중 흰색 비율이 이 값 미만이면 is_false_positive=True
WHITE_MIN_RGB   = 230    # R/G/B 각각 이 값 이상이면 "흰색"으로 판정 (0~255)

def _is_white_background(page: fitz.Page, bbox: fitz.Rect) -> bool:
    """bbox 영역의 배경이 흰색 계열인지 확인한다."""
    pix = page.get_pixmap(clip=bbox, colorspace=fitz.csRGB, alpha=False)
    if pix.width == 0 or pix.height == 0:
        return True   # 빈 영역은 통과
    samples = np.frombuffer(pix.samples, dtype=np.uint8).reshape(-1, 3)
    white_ratio = np.all(samples >= WHITE_MIN_RGB, axis=1).mean()
    return white_ratio >= WHITE_THRESHOLD
```

`detect_question_boundaries()` 후처리 단계에서 PDF를 열어둔 채 각 boundary를 검사:

```python
# detect_question_boundaries() 내부 — 기존 반환 직전에 삽입
doc = fitz.open(pdf_path)
for b in boundaries:
    if b.is_false_positive:          # 이미 기존 오탐지 로직에서 마킹된 것은 스킵
        continue
    page = doc[b.page_index]
    bbox = fitz.Rect(b.col_x0, b.y_top, b.col_x1, b.y_bottom)
    if not _is_white_background(page, bbox):
        b.is_false_positive = True   # 배경색이 어두우면 오탐지로 표시
doc.close()
```

> `is_false_positive=True`로 마킹만 하고 삭제하지 않는다.  
> UI에서 사용자가 확인 후 개별 삭제하는 기존 흐름을 그대로 유지한다.

### 임계값 튜닝 가이드

| 파라미터 | 기본값 | 조정 기준 |
|---|---|---|
| `WHITE_THRESHOLD` | 0.60 | 낮추면 민감도↑(더 많이 필터), 올리면 보수적↑(흰색이 많아야 통과) |
| `WHITE_MIN_RGB` | 230 | 낮추면 연한 노란/회색도 흰색으로 인정 |

실제 문서(컬러 박스 혼재 문제집)로 테스트 후 조정 권장.

### 성능 고려

- `get_pixmap(clip=bbox)` 은 bbox 영역만 렌더링하므로 전체 페이지 렌더보다 빠름
- 문항 수가 많은 PDF(~100문항)에서도 추가 소요 시간 < 1초 예상 (DPI 기본값 72 사용)
- `_trigger_boundary_detection()` 은 이미 백그라운드 태스크이므로 응답 지연 없음

### 데이터 모델 변경 없음

`QuestionBoundary.is_false_positive` 필드는 이미 존재.  
`boundaries/{job_id}.json` 캐시 포맷 변경 없음. 하위 호환 유지.

### 검증 포인트

- [ ] 흰 배경 문항: `is_false_positive = False` 유지 확인
- [ ] 컬러 배경(지문 박스 등) 영역: `is_false_positive = True` 마킹 확인
- [ ] `WHITE_THRESHOLD = 0.60` 기준으로 오탐지/정탐지 비율 확인 후 조정
- [ ] 빈 bbox(`width=0` 또는 `height=0`) 예외 처리 확인
- [ ] 100페이지 이상 PDF 처리 시간 측정

---

## 구현 순서

1. **`browse.py`** — `JobSummary` + 세 곳의 `JobSummary(...)` 생성에 `workbook_types` 추가 (5분)
2. **`question_parser.py`** — `_is_white_background()` 함수 추가 + `detect_question_boundaries()` 후처리 삽입
3. 임계값 튜닝 (실제 문서 테스트)

---

## 상세 작업 순서

### TASK-1 · workbook_types 응답 누락 수정

> **BE 전용** — FE는 이미 `job.workbook_types`를 사용하는 코드가 준비돼 있어 API 수정만으로 자동 동작.
>
> | 컴포넌트 | 기존 코드 | 현재 동작 | 수정 후 |
> |---|---|---|---|
> | `FileListPanel.jsx:52` | `(job.workbook_types \|\| []).join(", ")` | 항상 빈 문자열 | 저장된 유형 표시 |
> | `FileListPanel.jsx:119` | `job.workbook_types.join(", ")` | 렌더 안 됨 | 유형 태그 렌더 |
> | `FileListPanel.jsx:201` | `(job.workbook_types \|\| []).join(" ")` | 유형 검색 무효 | 유형 검색 동작 |
> | `FilePagePanel.jsx:41` | `(job.workbook_types \|\| []).join(", ")` | 항상 빈 문자열 | 편집 인풋 초기값 복원 |
> | `FilePagePanel.jsx:84` | `job.workbook_types?.length > 0` | 유형 미표시 | 유형 표시 |
>
> **수정 파일**: `backend/app/routers/browse.py` (1개 파일, 4곳)

---

#### TASK-1-1 · `JobSummary` 모델에 필드 추가

**위치**: 41~51행 `class JobSummary`

```python
# 변경 전 (50행)
    workbook_name: Optional[str] = None

# 변경 후
    workbook_name: Optional[str] = None
    workbook_types: Optional[list[str]] = None
```

---

#### TASK-1-2 · `list_jobs()` — `to_summary()` 에 필드 추가

**위치**: 63~74행 `def to_summary(j)`

```python
# 변경 전 (73행)
            workbook_name=j.workbook_name,
        )

# 변경 후
            workbook_name=j.workbook_name,
            workbook_types=j.workbook_types,
        )
```

---

#### TASK-1-3 · `get_job()` 응답에 필드 추가

**위치**: 88~97행 `def get_job()`

```python
# 변경 전 (96행)
        workbook_name=job.workbook_name,
    )

# 변경 후
        workbook_name=job.workbook_name,
        workbook_types=job.workbook_types,
    )
```

---

#### TASK-1-4 · `update_job_meta()` 응답에 필드 추가

**위치**: 118~127행 `def update_job_meta()` 반환 `JobSummary`

```python
# 변경 전 (126행)
        workbook_name=job.workbook_name,
    )

# 변경 후
        workbook_name=job.workbook_name,
        workbook_types=job.workbook_types,
    )
```

---

#### TASK-1 완료 기준

- `GET /api/jobs` 응답의 각 item에 `"workbook_types": [...]` 포함
- `GET /api/jobs/{id}` 응답에 `"workbook_types": [...]` 포함
- `PATCH /api/jobs/{id}` 응답에 수정된 `workbook_types` 반영
- FE `FileListPanel` 유형 태그 렌더링 확인 (새로고침 후 표시)
- FE `FileListPanel` 검색창에 유형 입력 시 필터링 동작 확인

---

### TASK-2 · 배경색 후처리 필터

> **BE + FE** — BE에서 배경색 이유로 `is_false_positive = True`로 마킹하면,  
> FE의 기존 오탐지 UI(배지·체크박스 비활성화)는 자동으로 동작한다.  
> 단, 설명 메시지(268행)가 "페이지 전체 크기와 경계가 일치합니다"로 하드코딩돼 있어 **FE 1줄 수정 필요**.
>
> | 구분 | 파일 | 이미 동작 여부 |
> |---|---|---|
> | "오탐지 의심" 배지 표시 | `QuestionAnalysisPanel.jsx:228-229` | ✅ 자동 |
> | 체크박스 비활성화 | `QuestionAnalysisPanel.jsx:221-222` | ✅ 자동 |
> | 전체 선택에서 제외 | `QuestionAnalysisPanel.jsx:78` | ✅ 자동 |
> | `qap-card--fp` CSS 클래스 | `QuestionAnalysisPanel.jsx:211` | ✅ 자동 |
> | 설명 메시지 | `QuestionAnalysisPanel.jsx:268` | ❌ 내용 수정 필요 |
>
> **수정 파일**: `backend/app/utils/question_parser.py` (BE) + `frontend/src/components/QuestionAnalysisPanel.jsx` (FE)

---

#### TASK-2-1 · `fitz` import 추가

**위치**: 38행 `import pdfplumber` 바로 아래

```python
# 변경 전
import pdfplumber

# 변경 후
import pdfplumber
import fitz   # PyMuPDF — 배경색 픽셀 분석용
```

---

#### TASK-2-2 · 배경색 필터 상수 추가

**위치**: 572행 `_FALSE_POSITIVE_TOLERANCE = 2.0` 바로 아래

```python
# 기존
_FALSE_POSITIVE_TOLERANCE = 2.0

# 추가
_FALSE_POSITIVE_TOLERANCE = 2.0

# 배경색 필터 임계값 (배경색 오탐지 마킹용)
_BG_WHITE_MIN_RGB   = 230    # R/G/B 각각 이 값 이상인 픽셀을 "흰색"으로 판정 (0~255)
_BG_WHITE_THRESHOLD = 0.60   # bbox 픽셀 중 흰색 비율이 이 값 미만이면 오탐지로 마킹
```

---

#### TASK-2-3 · `_is_white_background()` 헬퍼 함수 추가

**위치**: 624행 `def _is_false_positive(...)` 함수 정의 바로 앞 (624행 앞에 삽입)

> `_is_false_positive()`와 같은 "오탐지 판정" 영역에 함께 두어 응집도 유지.

```python
def _is_white_background(page: fitz.Page, bbox: fitz.Rect) -> bool:
    """
    bbox 영역을 렌더링하여 흰색 픽셀 비율을 계산한다.

    흰색 픽셀: R, G, B 모두 _BG_WHITE_MIN_RGB 이상인 픽셀.
    비율이 _BG_WHITE_THRESHOLD 이상이면 True(흰 배경), 미만이면 False(컬러 배경).

    numpy 미사용: pix.samples bytes를 3바이트씩 직접 순회.
    DPI 기본값(72)에서 100문항 기준 추가 소요 시간 < 1초.
    """
    pix = page.get_pixmap(clip=bbox, colorspace=fitz.csRGB, alpha=False)
    total = pix.width * pix.height
    if total == 0:
        return True  # 빈 영역은 흰색으로 간주 (오탐지 마킹 안 함)
    samples = pix.samples  # bytes, RGB 순서, 픽셀당 3바이트
    white_count = sum(
        1
        for i in range(0, len(samples), 3)
        if samples[i] >= _BG_WHITE_MIN_RGB
        and samples[i + 1] >= _BG_WHITE_MIN_RGB
        and samples[i + 2] >= _BG_WHITE_MIN_RGB
    )
    return (white_count / total) >= _BG_WHITE_THRESHOLD
```

---

#### TASK-2-4 · `_apply_bg_color_filter()` 함수 추가

**위치**: `_apply_precision_improvements()` 함수 정의 끝(682행) 바로 아래

> `_apply_precision_improvements()`와 대칭 구조로, Step 5-c 역할을 담당하는 독립 함수.

```python
def _apply_bg_color_filter(
    boundaries: list[QuestionBoundary],
    pdf_path: str,
) -> None:
    """
    [배경색 필터] bbox 영역의 배경이 흰색이 아닌 문항을 is_false_positive=True로 마킹한다.

    이미 is_false_positive=True인 항목(REQ-15 오탐지)은 건너뛴다.
    삭제하지 않고 마킹만 하여 UI에서 사용자가 확인 후 처리할 수 있도록 유지한다.

    fitz.open을 한 번만 호출하여 모든 boundary를 처리한 뒤 닫는다.
    """
    doc = fitz.open(pdf_path)
    try:
        for b in boundaries:
            if b.is_false_positive:
                continue  # 이미 오탐지 마킹된 항목은 스킵
            if b.page_index >= len(doc):
                continue  # 페이지 범위 초과 방어
            page = doc[b.page_index]
            bbox = fitz.Rect(b.col_x0, b.y_top, b.col_x1, b.y_bottom)
            if not _is_white_background(page, bbox):
                b.is_false_positive = True
    finally:
        doc.close()
```

---

#### TASK-2-5 · `detect_question_boundaries()` 에 Step 5-c 삽입

**위치**: 463행 `_apply_precision_improvements(raw, pages_data)` 바로 아래

```python
# 변경 전 (460~470행)
    # ── Step 5-b: 감지 정밀도 개선 (v3 REQ-23/24/15) ─────────
    _apply_precision_improvements(raw, pages_data)

    ## ── Step 6: 중복 제거 + Step 7: 정렬 ────────────────────
    # ...
    # ── Step 6: 정렬 ────────────────────
    return sorted(raw, key=lambda b: b.number)

# 변경 후
    # ── Step 5-b: 감지 정밀도 개선 (v3 REQ-23/24/15) ─────────
    _apply_precision_improvements(raw, pages_data)

    # ── Step 5-c: 배경색 필터 — 비백색 배경 오탐지 마킹 ────────
    # x/y 정밀화가 완료된 최종 bbox로 픽셀을 렌더링해야 정확하므로 5-b 이후에 실행.
    _apply_bg_color_filter(raw, pdf_path)

    ## ── Step 6: 중복 제거 + Step 7: 정렬 ────────────────────
    # ...
    # ── Step 6: 정렬 ────────────────────
    return sorted(raw, key=lambda b: b.number)
```

---

---

#### TASK-2-6 · FE — 오탐지 설명 메시지 수정

**위치**: `frontend/src/components/QuestionAnalysisPanel.jsx` 268행

현재 메시지는 REQ-15(페이지 전체 크기 일치) 전용으로 작성돼 있어  
배경색 이유로 마킹된 문항에는 맞지 않는 안내가 표시된다.

```jsx
// 변경 전 (268행)
  이 문항은 페이지 전체 크기와 경계가 일치합니다. 오탐지일 수 있습니다.

// 변경 후
  오탐지일 수 있습니다. 문항 이미지를 확인 후 필요하면 삭제하세요.
```

> 이유 구분(페이지 크기 vs 배경색)이 필요하면 추후 `false_positive_reason` 필드를  
> BE/FE에 추가하는 방향으로 확장 가능. 현 단계에서는 메시지 일반화로 충분하다.

---

#### TASK-2 완료 기준

**BE**
- 흰 배경 문항 → `is_false_positive = False` 유지 확인
- 컬러 배경 영역(지문/설명 박스 등) → `is_false_positive = True` 마킹 확인
- `boundaries/{job_id}.json` 캐시 포맷 변경 없음 (하위 호환)
- 기존 REQ-15 오탐지 항목이 중복 처리되지 않음 확인
- 빈 bbox(`width=0` 또는 `height=0`) 시 `True` 반환 (통과) 확인
- 100문항 이상 PDF 추가 처리 시간 측정 후 기록

**FE**
- 오탐지 마킹된 문항 카드에 "오탐지 의심" 배지 + 수정된 설명 메시지 표시 확인
- 체크박스 비활성화 및 전체 선택에서 제외 확인

---

### 전체 작업 분류 요약

| Task | 서브태스크 | 담당 | 파일 | 규모 |
|---|---|---|---|---|
| TASK-1 | 1-1 `JobSummary` 필드 추가 | **BE** | `browse.py:50` | 1줄 |
| TASK-1 | 1-2 `to_summary()` 필드 추가 | **BE** | `browse.py:73` | 1줄 |
| TASK-1 | 1-3 `get_job()` 응답 필드 추가 | **BE** | `browse.py:96` | 1줄 |
| TASK-1 | 1-4 `update_job_meta()` 응답 필드 추가 | **BE** | `browse.py:126` | 1줄 |
| TASK-2 | 2-1 `import fitz` 추가 | **BE** | `question_parser.py:38` | 1줄 |
| TASK-2 | 2-2 배경색 상수 추가 | **BE** | `question_parser.py:572` | 2줄 |
| TASK-2 | 2-3 `_is_white_background()` 추가 | **BE** | `question_parser.py:624` 앞 | 신규 함수 |
| TASK-2 | 2-4 `_apply_bg_color_filter()` 추가 | **BE** | `question_parser.py:682` 뒤 | 신규 함수 |
| TASK-2 | 2-5 Step 5-c 호출 삽입 | **BE** | `question_parser.py:463` 뒤 | 2줄 |
| TASK-2 | 2-6 오탐지 설명 메시지 수정 | **FE** | `QuestionAnalysisPanel.jsx:268` | 1줄 |

> **TASK-1은 BE 전용** — FE는 코드 변경 없이 자동으로 동작한다.  
> **TASK-2는 BE 5단계 + FE 1줄** — FE의 나머지 오탐지 UI는 이미 구현돼 있다.

---

### 임계값 튜닝 절차 (TASK-2 완료 후)

1. 컬러 배경이 포함된 실제 문제집 PDF 3종 이상 준비
2. `_BG_WHITE_THRESHOLD = 0.60` 기본값으로 실행 → 마킹 결과 확인
3. 정상 문항이 마킹되는 경우 → 값을 **낮춤** (예: 0.50)
4. 컬러 영역이 통과되는 경우 → 값을 **높임** (예: 0.70)
5. 최종 값을 `_BG_WHITE_THRESHOLD` 상수에 반영하고 주석에 근거 기재
