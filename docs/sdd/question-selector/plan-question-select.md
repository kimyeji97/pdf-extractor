# plan-question-select — 문항 선택 및 선택 바스켓

> **요구사항**: REQ-03, REQ-04, REQ-05  
> **작성일**: 2026-04-15  
> **관련 spec**: [spec.md](../spec.md)

---

## 1. 목표

선택된 페이지에서 감지된 문항을 미리보기(크롭 이미지)로 나열하고, 멀티 선택한다.
선택된 문항들은 바스켓에 누적되며, 파일/페이지를 바꿔가며 계속 추가할 수 있다.

---

## 2. 백엔드

### 2.1 신규 엔드포인트

#### (A) 페이지 내 문항 목록

```
GET /api/jobs/{job_id}/pages/{page_num}/questions
```

**처리 흐름**: 원본 PDF 다운로드 → `detect_question_boundaries()` 실행 → 해당 페이지 문항 필터링

**Response**
```json
{
  "job_id":   "uuid",
  "page_num": 0,
  "questions": [
    {
      "question_num":    1,
      "question_id":    "uuid:0:1",
      "thumbnail_url":  "/api/jobs/{job_id}/pages/0/questions/1/thumbnail",
      "bbox": {
        "x0": 36.0, "y0": 120.5,
        "x1": 297.0, "y1": 310.0
      },
      "col": 0
    }
  ]
}
```

- `question_id`: `{job_id}:{page_num}:{question_num}` — 바스켓 중복 방지 키
- `bbox`: PyMuPDF 좌표계 (pt 단위, 좌상단 원점)
- `col`: 0=왼쪽 컬럼, 1=오른쪽 컬럼

#### (B) 문항 크롭 썸네일

```
GET /api/jobs/{job_id}/pages/{page_num}/questions/{question_num}/thumbnail
```

- Response: `image/png`
- 처리: `CropRegion` → `_insert_cropped_page()` 로직 재사용 → PNG 변환
- 캐시: `thumbnails/{job_id}/q_{page}_{qnum}.png`

### 2.2 문항 감지 캐시

`detect_question_boundaries()`는 전체 PDF를 스캔하므로 비용이 높다.
동일 `job_id`에 대한 결과를 `local_storage/boundaries/{job_id}.json` (또는 S3)에 캐시한다.

```python
# backend/app/services/boundary_cache_service.py (신규)

def get_cached_boundaries(job_id: str) -> list[QuestionBoundary] | None:
    ...

def save_boundaries_cache(job_id: str, boundaries: list[QuestionBoundary]) -> None:
    ...
```

**캐시 키**: `job_id` (PDF가 업로드 후 불변이므로 만료 없음)

### 2.3 변경/신규 파일

| 파일 | 변경 내용 |
|------|-----------|
| `backend/app/routers/browse.py` | `GET /api/jobs/{id}/pages/{n}/questions` 추가 |
| `backend/app/routers/browse.py` | `GET /api/jobs/{id}/pages/{n}/questions/{q}/thumbnail` 추가 |
| `backend/app/services/boundary_cache_service.py` | **신규** — 문항 경계 캐시 |
| `backend/app/services/thumbnail_service.py` | `get_question_thumbnail()` 추가 |
| `backend/app/services/local_storage_service.py` | 경계 캐시 저장/조회 함수 추가 |
| `backend/app/services/s3_service.py` | S3 경계 캐시 저장/조회 함수 추가 |

---

## 3. 프론트엔드

### 3.1 신규 컴포넌트

#### QuestionPicker (`src/components/QuestionPicker.jsx`)

**props**
```js
{
  jobId:      string,
  pageNum:    number,
  basket:     SelectedQuestion[],    // 현재 바스켓 상태 (중복 체크용)
  onAddToBasket:    (question) => void,
  onRemoveFromBasket: (questionId) => void,
}
```

**레이아웃**
```
┌──────────────────────────────────────────────────────┐
│  ← 페이지 목록으로  |  페이지 1  |  감지된 문항: 5개  │
├──────────────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐                 │
│  │[문항 1] │  │[문항 2] │  │[문항 3] │  ...           │
│  │ ☑ 선택  │  │ □ 선택  │  │ ☑ 선택  │               │
│  └────────┘  └────────┘  └────────┘                 │
└──────────────────────────────────────────────────────┘
```

- 문항 카드: 크롭 썸네일 이미지 + 문항 번호 + 체크박스
- 이미 바스켓에 담긴 문항: 체크박스 활성화 상태로 표시
- 체크 → `onAddToBasket`, 체크 해제 → `onRemoveFromBasket`

#### SelectionBasket (`src/components/SelectionBasket.jsx`)

**props**
```js
{
  basket:   SelectedQuestion[],
  onRemove: (questionId) => void,
  onExport: () => void,
}
```

**SelectedQuestion 타입**
```js
{
  questionId:  string,   // "{job_id}:{page_num}:{question_num}"
  jobId:       string,
  pageNum:     number,
  questionNum: number,
  filename:    string,
  thumbnailUrl: string,
}
```

**레이아웃 (화면 하단 고정 패널)**
```
┌──────────────────────────────────────────────────────────┐
│  선택된 문항 (3개)                        [PDF 다운로드] │
├──────────────────────────────────────────────────────────┤
│  [썸네일] 파일A.pdf / p.1 / 문항1  [×]                  │
│  [썸네일] 파일A.pdf / p.3 / 문항7  [×]                  │
│  [썸네일] 파일B.pdf / p.2 / 문항3  [×]                  │
└──────────────────────────────────────────────────────────┘
```

- 고정 하단 (`position: fixed; bottom: 0`)
- 항목이 없으면 최소화 상태 (얇은 탭 형태)
- `[×]` 클릭 → `onRemove(questionId)`
- `[PDF 다운로드]` → `onExport()` (REQ-06, plan-pdf-export.md에서 처리)

### 3.2 상태 관리 (App.jsx)

```js
// 바스켓은 App.jsx에서 전역으로 관리 (파일/페이지 이동 시 유지)
const [basket, setBasket] = useState([]);

const addToBasket = (question) => {
  setBasket(prev => {
    const exists = prev.some(q => q.questionId === question.questionId);
    return exists ? prev : [...prev, question];
  });
};

const removeFromBasket = (questionId) => {
  setBasket(prev => prev.filter(q => q.questionId !== questionId));
};
```

### 3.3 API 클라이언트 추가

```js
// src/api/client.js 에 추가
export async function getPageQuestions(jobId, pageNum) {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}/pages/${pageNum}/questions`);
  if (!res.ok) throw new Error("문항 목록 조회 실패");
  return res.json();
}

// 문항 썸네일은 <img src={thumbnailUrl} /> 로 직접 사용
```

---

## 4. 작업 순서 (Task Breakdown)

| # | 작업 | 레이어 | 우선순위 |
|---|------|--------|----------|
| 1 | `boundary_cache_service` 구현 (로컬) | Backend | P0 |
| 2 | `boundary_cache_service` 구현 (S3) | Backend | P1 |
| 3 | `GET /api/jobs/{id}/pages/{n}/questions` 엔드포인트 | Backend | P0 |
| 4 | `get_question_thumbnail()` 구현 | Backend | P0 |
| 5 | `GET .../questions/{q}/thumbnail` 엔드포인트 | Backend | P0 |
| 6 | `getPageQuestions()` API 클라이언트 함수 | Frontend | P1 |
| 7 | `QuestionPicker` 컴포넌트 구현 | Frontend | P1 |
| 8 | `SelectionBasket` 컴포넌트 구현 | Frontend | P1 |
| 9 | App.jsx에 바스켓 전역 상태 추가 | Frontend | P1 |
| 10 | App.jsx에 `QUESTION_PICK` 단계 연결 | Frontend | P1 |

---

## 5. 수용 조건 (Acceptance Criteria)

- [ ] `GET /api/jobs/{id}/pages/{n}/questions` 가 해당 페이지의 감지 문항 목록을 반환한다.
- [ ] 문항 크롭 썸네일이 정확한 영역을 보여준다 (좌우 컬럼 구분 포함).
- [ ] 같은 `job_id`의 두 번째 페이지 조회 시 경계 감지를 재실행하지 않는다 (캐시 사용).
- [ ] 문항을 멀티 선택 후 다른 페이지로 이동해도 바스켓이 유지된다.
- [ ] 같은 문항을 두 번 선택해도 바스켓에 중복 추가되지 않는다.
- [ ] 바스켓에서 `[×]` 클릭 시 해당 문항이 제거되고 `QuestionPicker`의 체크박스도 해제된다.
