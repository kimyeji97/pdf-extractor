# REQ-P01 문제집 생성 메뉴 문항 조회 성능 개선 + 페이지 선택 UX 개선

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 |
| 작성자 | kimyeji97 |
| 상태 | open |
| 관련 | REQ-16 문제집 문항 탐색·선택 |

---

## 1. 배경·목표

**배경**

문제집 생성 메뉴(② 문항 선택)에 두 가지 문제가 있다.

### 문제 A — API 성능

파일을 선택하면 모든 페이지의 문항을 개별 API로 건건이 조회한다.

현재 호출 흐름:
```
getPages(jobId)                                      → 1 API
Promise.all(pages.map(pg => getPageQuestions(jobId, pg.page_num)))  → N API
─── 총: 1 + N API 호출 (30페이지 = 31회 HTTP 요청) ───
```

백엔드에서는 매 호출마다 동일한 파일을 반복 읽는다:
- `status/{job_id}.json` — N회 (1회면 충분)
- `boundaries/{job_id}.json` — N회 (대형 JSON, 전체 역직렬화 후 1페이지분만 사용)
- `manual_questions/{job_id}.json` — N회 (1회면 충분)

이로 인해 파일 선택 시 수 초의 지연이 발생하며, 페이지 수가 많을수록 비례하여 악화된다.

### 문제 B — 페이지 선택 UX

현재 페이지 필터가 칩 버튼(마우스 클릭) 방식이라 대량 페이지를 빠르게 지정하기 어렵다.
목적은 빠르고 간편하게 여러 페이지를 지정하는 것이므로 키보드 입력이 더 효율적이다.

**목표 / 달성 기준**

- 파일 선택 시 문항 전체 목록을 **1회 API 호출**로 조회한다.
- 체감 로딩 시간을 현재 대비 대폭 단축한다.
- 페이지 선택을 **텍스트 입력** 방식으로 변경하여 빠른 지정을 지원한다.

---

## 2. Scope

**In-scope**

- 백엔드: 전체 문항 일괄 조회 엔드포인트 신규 추가
- 프론트엔드: `QuestionListPanel`에서 신규 API 사용
- 프론트엔드: 페이지 필터를 칩 버튼 → 텍스트 입력 방식으로 변경

**Out-of-scope (non-goal)**

- 기존 `GET /api/jobs/{id}/pages/{n}/questions` 엔드포인트 제거 (문항 분석 화면에서 사용 중)
- 문항 분석 화면(QuestionAnalysisPanel) 변경

---

## 3. API·데이터 변경

### API

**신규 엔드포인트**:

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/jobs/{job_id}/questions` | 전체 페이지 문항 일괄 조회 |

**응답 형식**:

```json
{
  "job_id": "abc-123",
  "total_count": 45,
  "pages": [
    {
      "page_num": 0,
      "questions": [
        {
          "question_num": 1,
          "manual_id": null,
          "question_id": "abc-123:0:1",
          "thumbnail_url": "/api/jobs/abc-123/pages/0/questions/1/thumbnail",
          "bbox": { "x0": 0, "y0": 50, "x1": 300, "y1": 400 },
          "col": 0,
          "title": "문항 1",
          "is_false_positive": false,
          "is_manual": false
        }
      ]
    },
    {
      "page_num": 1,
      "questions": [...]
    }
  ]
}
```

### 데이터 모델·스키마

**신규 응답 모델** (`browse.py`):

```python
class PageQuestions(BaseModel):
    page_num: int
    questions: List[QuestionInfo]

class AllQuestionsResponse(BaseModel):
    job_id: str
    total_count: int
    pages: List[PageQuestions]
```

### 마이그레이션 메모

- 기존 `GET /api/jobs/{id}/pages/{n}/questions` 유지 (하위호환)
- 프론트엔드만 호출 대상 전환

---

## 4. 수정 내용

### 4-1. 백엔드 — 일괄 조회 엔드포인트 추가

**파일**: `backend/app/routers/browse.py`

`GET /api/jobs/{job_id}/questions` 신규 추가:

1. `storage.get_status(job_id)` — **1회**
2. `storage.get_boundaries_cache(job_id)` — **1회**
3. `storage.get_manual_questions(job_id)` — **1회**
4. 전체 경계 데이터를 페이지별로 그룹핑
5. 수동 문항 병합
6. 페이지별 문항 리스트를 한 번에 반환

기존 `list_questions()`와 동일한 변환 로직 재사용 (QuestionInfo 구성, 정렬, 오탐지 처리).

### 4-2. 프론트엔드 — API 클라이언트 함수 추가

**파일**: `frontend/src/api/client.js`

```javascript
export async function getAllQuestions(jobId) {
  const res = await apiFetch(`${BASE_URL}/jobs/${jobId}/questions`);
  if (!res.ok) throw new Error("전체 문항 조회 실패");
  return res.json();
}
```

### 4-3. 프론트엔드 — QuestionListPanel 수정

**파일**: `frontend/src/components/QuestionListPanel.jsx`

#### API 호출 변경

변경 전 (N+1 호출):
```javascript
const pagesData = await getPages(jobId);
const results = await Promise.all(
  pages.map(async (pg) => {
    const d = await getPageQuestions(jobId, pg.page_num);
    return { pageNum: pg.page_num, questions: d.questions || [] };
  })
);
```

변경 후 (1회 호출):
```javascript
const data = await getAllQuestions(jobId);
const results = (data.pages || [])
  .filter((g) => g.questions.length > 0);
```

#### 페이지 필터 UX 변경

**변경 전**: 페이지별 칩 버튼(마우스 클릭) + 번호 입력 보조 필드

**변경 후**: 텍스트 입력 필드 1개로 통합

입력 형식 (1-based 페이지 번호):

| 형식 | 예시 | 의미 |
|------|------|------|
| 구간 | `3-10` | 3페이지 이상 10페이지 이하 |
| 개별 | `1,3,5,7` | 1, 3, 5, 7페이지 |
| 혼합 | `1-5,8,10-12` | 1~5페이지 + 8페이지 + 10~12페이지 |

동작:
- 입력 후 Enter → 해당 페이지 문항만 필터링하여 표시
- 입력이 비어있으면 → 전체 페이지 문항 표시 (필터 없음)
- 존재하지 않는 페이지 번호는 무시
- 총 페이지 수를 placeholder에 안내 (예: `"페이지 입력 (1-30) — 예: 1-5,8,10"`)

**제거 대상**:
- `qlist-filter-chips` 칩 버튼 영역 전체 제거
- `togglePageFilter()` 함수 제거
- `selectedPages` Set 상태 → 파싱 결과 Set으로 대체

**파싱 함수** (`parsePageInput`):
```javascript
function parsePageInput(input) {
  const pages = new Set();
  input.split(",").forEach((token) => {
    const trimmed = token.trim();
    const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = parseInt(range[2], 10);
      for (let i = start; i <= end; i++) pages.add(i - 1); // 1-based → 0-based
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n) && n > 0) pages.add(n - 1);
    }
  });
  return pages;
}
```

---

## 5. 성능 비교

| 항목 | Before | After |
|------|--------|-------|
| HTTP 요청 수 (30p 기준) | 31회 | 1회 |
| 상태 파일 I/O | 30회 | 1회 |
| 경계 캐시 I/O + 역직렬화 | 30회 | 1회 |
| 수동 문항 파일 I/O | 30회 | 1회 |
| 네트워크 라운드트립 | 31 RTT | 1 RTT |

---

## 6. 테스트 시나리오

### 성능 (API)

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 문제집 생성 > 파일 선택 | 문항 목록이 단일 요청으로 즉시 로드됨 |
| 2 | 30페이지 이상 PDF | 이전 대비 체감 로딩 시간 대폭 단축 |
| 3 | 문항 0건 페이지 포함 PDF | 0건 페이지는 목록에서 제외됨 (기존 동작 유지) |
| 4 | 수동 문항 포함 | 수동 문항이 해당 페이지에 정상 병합됨 |
| 5 | 재감지 중(PROCESSING) 파일 선택 | 빈 문항 목록 반환 (기존 동작 유지) |
| 6 | 기존 문항 분석 화면 | 기존 per-page API 정상 동작 (영향 없음) |

### 페이지 선택 UX

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 7 | `3-10` 입력 후 Enter | 3~10페이지 문항만 표시 |
| 8 | `1,3,5` 입력 후 Enter | 1, 3, 5페이지 문항만 표시 |
| 9 | `1-5,8,10-12` 입력 후 Enter | 1~5 + 8 + 10~12페이지 문항 표시 |
| 10 | 빈 입력 상태 | 전체 페이지 문항 표시 (필터 없음) |
| 11 | 존재하지 않는 번호 (`999`) | 무시, 유효한 페이지만 필터 |
| 12 | 입력 지우고 Enter | 필터 해제, 전체 표시 |

---

## 7. 미결 질문 (Open Questions)

- 없음
