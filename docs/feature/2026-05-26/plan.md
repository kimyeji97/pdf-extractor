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
