# plan-question-analysis — 문항 분석 메뉴

> **요구사항**: REQ-11, REQ-12, REQ-13, REQ-14, REQ-15  
> **작성일**: 2026-04-26  
> **수정일**: 2026-04-27 (Action Item 반영)  
> **관련 spec**: [plan-v3.md](../spec-v3.md)  
> **변경 범위**: 백엔드 (`browse.py`, `storage.py`) + 프론트엔드 (`QuestionAnalysisView`)  
> **전제**: [plan-detection-precision.md](../detection-precision/plan-detection-precision.md) 완료 (QuestionBoundary 모델 확장)

---

## 1. 목표

파일+페이지 통합 선택 → 문항 관리의 2섹션 흐름에서:
- 재감지, 타이틀 수정, 수동 추가, 삭제, 오탐지 하이라이트를 제공한다.
- 수동 추가 문항은 서버에 영속 저장된다.
- 담기 / PDF 다운로드 기능은 문제집 생성 메뉴로 이관하여 본 메뉴에서는 제거한다.

---

## 2. 레이아웃

1번 섹션과 2번 섹션을 단일 패널로 통합한다.  
파일 선택 후 같은 영역이 페이지 선택 모드로 전환되며 뒤로가기로 복귀한다.

```
┌─────────────────────────────┬───────────────────────────────────────┐
│  섹션 A: 파일+페이지 선택     │  섹션 B: 페이지 미리보기 + 문항 목록    │
│                              │                                       │
│  [파일 선택 모드]             │  [페이지 전체 썸네일]                   │
│  • 파일 목록                  │  ← [수동 추가] 버튼                    │
│  • [재감지] 버튼              │  ─────────────────────────────────── │
│                              │  [문항 목록]                           │
│  파일 선택 후 →               │  [삭제 (N개)] ← 툴바                   │
│  [페이지 선택 모드]            │  ─────────────────────────────────── │
│  ← [뒤로가기]                 │  □ [수동] 수동 문항 1                  │
│  • 페이지 목록                 │  □ 문항 1                             │
│    (페이지별 감지 문항 수만)    │  □ [!] 문항 3  ← 오탐지               │
│  • [재감지] 버튼              │  □ 문항 5                             │
└─────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. 백엔드 설계

### 3.1 저장소 추가 (local_storage_service.py)

```python
# 수동 문항 저장/조회
def get_manual_questions(job_id: str) -> list[dict]
def save_manual_questions(job_id: str, data: list[dict]) -> None

# 수동 문항 썸네일 캐시
def get_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str) -> Optional[bytes]
def save_manual_thumbnail_cache(job_id: str, page_num: int, manual_id: str, data: bytes) -> None
```

저장 경로:
```
local_storage/
├── manual_questions/{job_id}.json
└── thumbnails/{job_id}/manual_{page}_{manual_id}.png
```

`manual_questions/{job_id}.json` 구조:
```json
[
  {
    "manual_id": "manual-550e8400",
    "job_id": "...",
    "page_num": 2,
    "title": "수동 추가 문항",
    "region": { "x0": 42.0, "y0": 120.0, "x1": 310.0, "y1": 380.0 },
    "created_at": "2026-04-26T10:00:00"
  }
]
```

### 3.2 스키마 추가 (schemas.py)

```python
class ManualQuestion(BaseModel):
    manual_id: str
    job_id: str
    page_num: int
    title: str          # 필수
    region: RegionCoord
    created_at: datetime

class ManualQuestionCreate(BaseModel):
    title: str = Field(..., min_length=1)
    region: RegionCoord

class QuestionTitleUpdate(BaseModel):
    title: str = Field(..., min_length=1)
```

### 3.3 API 엔드포인트 추가 (browse.py)

#### REQ-13: 수동 문항 추가

```
POST /api/jobs/{job_id}/pages/{page_num}/questions/manual
Body: ManualQuestionCreate
Response 201: ManualQuestion
```

동작:
1. UUID 생성 → `manual_id`
2. `manual_questions/{job_id}.json`에 append
3. `thumbnail_service`로 해당 영역 크롭 PNG 생성 → 캐시 저장
4. 응답 반환

#### REQ-12: 자동 감지 문항 타이틀 수정

```
PATCH /api/jobs/{job_id}/pages/{page_num}/questions/{question_num}
Body: QuestionTitleUpdate
Response 200: { question_num, title }
```

동작: `boundaries/{job_id}.json`에서 해당 항목의 `title` 필드 업데이트.

#### REQ-12: 수동 문항 타이틀 수정

```
PATCH /api/jobs/{job_id}/pages/{page_num}/questions/manual/{manual_id}
Body: QuestionTitleUpdate
Response 200: ManualQuestion
```

동작: `manual_questions/{job_id}.json`에서 해당 항목 `title` 업데이트.

#### REQ-14: 자동 감지 문항 삭제

```
DELETE /api/jobs/{job_id}/pages/{page_num}/questions/{question_num}
Response: 204 No Content
```

동작:
1. `boundaries/{job_id}.json`에서 해당 항목 제거
2. `questions_per_page`, `total_question_count` 재계산 → status 파일 업데이트
3. 해당 문항 썸네일 캐시 삭제

#### REQ-14: 수동 문항 삭제

```
DELETE /api/jobs/{job_id}/pages/{page_num}/questions/manual/{manual_id}
Response: 204 No Content
```

동작: `manual_questions/{job_id}.json`에서 해당 항목 제거 + 썸네일 캐시 삭제.

#### GET /questions 응답에 수동 문항 병합

```
GET /api/jobs/{job_id}/pages/{page_num}/questions
```

기존 자동 감지 문항 목록에 해당 페이지의 수동 문항을 병합하여 반환.  
정렬: `is_manual=False` (자동) 먼저, 이후 `is_manual=True` (수동). 각 그룹 내에서는 y_top 오름차순.

```python
questions = auto_questions + manual_questions_for_page
```

---

## 4. 프론트엔드 설계

### 4.1 QuestionAnalysisView.jsx

기존 App.jsx의 3패널 레이아웃을 **2섹션 구조**로 재편한다.

- **섹션 A**: 파일+페이지 통합 패널 (FilePagePanel 신규)
- **섹션 B**: 페이지 미리보기 + 문항 목록 패널 (QuestionAnalysisPanel 신규)

### 4.2 섹션 A: 파일+페이지 통합 패널 (FilePagePanel)

파일 선택 전과 후, 두 가지 모드로 동일 영역을 전환한다.

**파일 선택 모드** (초기 상태):
```
[파일 목록]
  file_a.pdf
  file_b.pdf   ← 선택하면 페이지 선택 모드로 전환
  ...

[🔄 재감지]  ← 파일 선택 상태일 때 활성화
```

**페이지 선택 모드** (파일 선택 후):
```
← [뒤로가기]  file_a.pdf

[페이지 목록]
  1페이지 (문항 3개)
  2페이지 (문항 5개)   ← 페이지별 감지된 문항 수만 표시 (썸네일 없음)
  ...

[🔄 재감지]  ← 항상 활성화 (파일 단위 재감지)
```

- **뒤로가기** 클릭 → 파일 선택 모드 복귀, 섹션 B 초기화.
- **재감지** 버튼은 파일 단위 동작. 기존 `POST /api/jobs/{job_id}/refresh` 사용. 완료 시 문항 목록 리로드.

### 4.3 섹션 B: 페이지 미리보기 + 문항 목록 패널

페이지 선택 시 활성화.

**상단**: 해당 페이지 전체 썸네일 미리보기 (대형, 반응형 `max-width: 100%`)

**[수동 추가] 버튼**: 썸네일 영역 우측 상단 또는 바로 위. 클릭 시 드래그 드로우 모드 활성화 → 썸네일 위에서 드래그로 영역 지정.

**하단**: 문항 목록 툴바 + 문항 카드 목록
```
[삭제 (N개)]  ← N은 체크 선택 수. 0개이면 비활성화
```

### 4.4 문항 카드

이미지를 크게 표시하고 타이틀을 이미지 상단에 배치한다.

```
┌─────────────────────────────────────────────────┐
│  □  문항 1                     ← 타이틀 (상단)   │
│     [썸네일 이미지 — 현재 대비 8배]               │
└─────────────────────────────────────────────────┘
```

- **타이틀**: 이미지 상단. 더블클릭 → `<input>` 전환. Enter / blur → `PATCH` 저장. ESC → 취소.
- **이미지**: 반응형 (`max-width: 100%`). lazy loading 적용 (뷰포트 밖 문항은 지연 로드).
- **체크박스**: 분석 메뉴 전용. 선택 → 툴바 삭제 버튼 활성화.
- **수동 배지**: `is_manual=true`인 카드 타이틀 옆 파란 "수동" 배지.
- **오탐지 하이라이트**: `is_false_positive=true`인 카드에 빨간 테두리 + "오탐지 의심" 배지. 클릭 불가 + 안내 텍스트 표시.

> **제거 항목**: 기존 v2의 담기 / PDF 다운로드 버튼은 본 메뉴에서 완전 제거. 문제집 생성 메뉴에서 이용하도록 안내 텍스트 추가.

### 4.5 수동 문항 드래그 추가 (REQ-13)

드로우 모드 활성 시: **섹션 B 상단 페이지 썸네일** 위에서 마우스 드래그 → 영역 지정.

드래그 완료 후 썸네일 **하단에 인라인 폼** 슬라이드 다운:

```
┌──────────────────────────────────────┐
│  [페이지 썸네일 + 드래그 박스 오버레이]  │
└──────────────────────────────────────┘
  타이틀: [____________________] [추가] [취소]
  ※ 타이틀을 입력해주세요  ← 오류 시만 표시
```

[추가] 클릭:
1. 타이틀 비어 있으면 오류 텍스트 표시 (인라인, 모달 없음)
2. `POST /api/jobs/{job_id}/pages/{page_num}/questions/manual` 호출
3. 성공 → 문항 목록에 카드 추가 / 폼 + 드래그 박스 초기화

[취소] 클릭 → 드래그 박스 + 폼 초기화.

### 4.6 삭제 + Undo 토스트 (REQ-14)

- 삭제 버튼 클릭 → 즉시 `DELETE` 호출 → 목록에서 제거.
- 동시에 상단 툴바 영역에 Undo 토스트 표시:
  ```
  "3개 문항이 삭제되었습니다."  [되돌리기]  (3초 후 자동 사라짐)
  ```
- [되돌리기] 클릭 → 삭제된 문항을 다시 `POST` 복원 (boundaries 재삽입 또는 manual 재추가).

---

## 5. API 클라이언트 추가 (client.js)

```js
// 수동 문항 추가
export async function addManualQuestion(jobId, pageNum, { title, region }) {...}

// 타이틀 수정 (자동 감지)
export async function updateQuestionTitle(jobId, pageNum, questionNum, title) {...}

// 타이틀 수정 (수동)
export async function updateManualQuestionTitle(jobId, pageNum, manualId, title) {...}

// 자동 감지 문항 삭제
export async function deleteQuestion(jobId, pageNum, questionNum) {...}

// 수동 문항 삭제
export async function deleteManualQuestion(jobId, pageNum, manualId) {...}
```

---

## 6. 구현 작업 목록

### 백엔드

1. `local_storage_service.py`: 수동 문항 CRUD 메서드 추가
2. `schemas.py`: `ManualQuestion`, `ManualQuestionCreate`, `QuestionTitleUpdate` 추가
3. `browse.py`: `POST /manual` 엔드포인트 추가
4. `browse.py`: `PATCH /{question_num}`, `PATCH /manual/{manual_id}` 추가
5. `browse.py`: `DELETE /{question_num}`, `DELETE /manual/{manual_id}` 추가
6. `browse.py`: `GET /questions` 응답에 수동 문항 병합 로직 추가

### 프론트엔드

7. `client.js`: 수동 문항 / 타이틀 수정 / 삭제 API 함수 추가
8. `FilePagePanel.jsx` 신규 작성 (파일 선택 ↔ 페이지 선택 모드 전환, 재감지 버튼 포함)
9. `QuestionAnalysisView.jsx` 신규 작성 (2섹션 레이아웃 — FilePagePanel + QuestionAnalysisPanel)
10. 문항 카드: 타이틀 상단 배치 + 이미지 대형화(8배, 반응형) + lazy loading
11. **[제거]** 담기 / PDF 다운로드 버튼 제거 + "문제집 생성 탭 이용" 안내 텍스트
12. 문항 카드 체크박스 + 선택 삭제 버튼 구현
13. 타이틀 인라인 편집 구현 (더블클릭 → input 전환)
14. 섹션 B 상단 페이지 썸네일 대형 표시 + 드래그 드로우 모드 + 인라인 타이틀 폼 구현
15. [수동 추가] 버튼 섹션 B로 이동
16. 수동 배지 / 오탐지 하이라이트 스타일 적용
17. Undo 토스트 구현
