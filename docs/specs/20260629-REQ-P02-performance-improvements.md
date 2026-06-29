# REQ-P02 속도 및 품질 성능 개선

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 |
| 작성자 | kimyeji97 |
| 상태 | open |
| 관련 | 전체 시스템 (Frontend + Backend) |

---

## 1. 배경·목표

**배경**

기능 구현이 일단락된 시점에서 속도 및 품질 관점의 개선 포인트를 식별했다.
현재 코드베이스에는 대형 PDF(50+ 페이지) 처리 시 체감되는 렌더링 지연, 불필요한 I/O 반복, 메모리 릭 가능성 등이 존재한다.

**목표**

- 프론트엔드 렌더링 성능 개선 (PDF 뷰어, 리스트, 미리보기)
- 백엔드 API 응답 속도 개선 (캐싱, 페이지네이션, 중복 I/O 제거)
- 확장성 기반 마련 (비동기 작업 처리, 타임아웃)

---

## 2. 개선 항목

### 우선순위 기준

- **HIGH**: 사용자 체감 효과가 크거나 데이터 누적 시 장애 가능성
- **MEDIUM**: 명확한 개선 효과가 있으나 현재 규모에서는 허용 가능
- **LOW**: 코드 품질·방어적 개선

---

### HIGH — 체감 효과 큰 개선

#### P02-01. PDF 뷰어 페이지 가상화

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/PdfPreviewPanel.jsx` (189-203행) |
| 분류 | Frontend · 렌더링 |

**현재 문제**

모든 PDF 페이지를 `Array.from({ length: numPages })` 로 한꺼번에 렌더링한다.
`react-pdf`의 `<Page>` 컴포넌트는 내부적으로 캔버스 렌더링을 수행하므로, 50페이지 PDF 시 50개 캔버스가 동시에 생성되어 메모리·CPU를 대량 소비한다.

```jsx
// 현재: 전체 페이지 동시 렌더
{numPages &&
  Array.from({ length: numPages }, (_, i) => (
    <div key={i} className="pdf-page-wrapper">
      <Page pageNumber={i + 1} scale={scale} />
    </div>
  ))}
```

**개선 방안**

`react-window` 또는 직접 IntersectionObserver 기반으로 뷰포트 ± 2페이지만 렌더링하는 가상화 적용.

```
렌더링 대상:
  [viewport - 2] [viewport - 1] [현재 viewport] [viewport + 1] [viewport + 2]
  나머지 → placeholder div (높이만 유지)
```

**기대 효과**: 초기 렌더 2~8초 단축, 메모리 사용량 75-90% 감소 (대형 PDF 기준)

---

#### P02-02. 페이지 메타데이터 캐시

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py` (242-264행), `backend/app/services/thumbnail_service.py` (40-50행) |
| 분류 | Backend · I/O |

**현재 문제**

`list_pages()` 호출 시마다 전체 PDF를 스토리지에서 읽어 `get_page_info()`로 페이지 수·크기 등을 추출한다. 이미 `boundaries` 캐시 패턴이 존재하지만, 페이지 메타에는 적용되어 있지 않다.

```python
# 매 호출마다 전체 PDF 다운로드 + 파싱
pdf_bytes = storage.read_file(storage.original_key(job_id))
page_infos = thumbnail_service.get_page_info(pdf_bytes)
```

**개선 방안**

최초 업로드/감지 시 `page_info/{job_id}.json` 으로 캐시 저장. 이후 `list_pages()`는 캐시만 읽는다.

```
저장 시점: 업로드 완료 후 boundary 감지 직후
캐시 키:   page_info/{job_id}.json
내용:      [{ page_num, width, height }, ...]
무효화:    refresh (재감지) 시 함께 갱신
```

**기대 효과**: 페이지 목록 API 응답 시간 ~40% 단축, PDF 재읽기 제거

---

#### P02-03. 목록 API 페이지네이션

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py` (60-82행), `backend/app/routers/workbook.py` (24-40행) |
| 분류 | Backend · API 설계 |

**현재 문제**

`GET /api/jobs` 와 `GET /api/workbooks` 모두 전체 목록을 한 번에 반환한다. 데이터가 누적되면 응답 크기·메모리 사용량이 선형 증가한다.

```python
# 전체 로드 후 필터
job_files = storage.list_jobs()  # 모든 상태 파일 읽기
source_jobs = [to_summary(j) for j in job_files if j.job_type == JobType.SOURCE]
```

**개선 방안**

`skip` / `limit` 쿼리 파라미터 추가 (기본값: skip=0, limit=20).

```
GET /api/jobs?skip=0&limit=20&type=source
GET /api/workbooks?skip=0&limit=20

응답 형식:
{
  "items": [...],
  "total": 150,
  "skip": 0,
  "limit": 20
}
```

프론트엔드도 무한 스크롤 또는 페이지네이션 UI 대응 필요.

**기대 효과**: 1,000+ 건 누적 시 메모리 80% 감소, 응답 속도 일정하게 유지

---

#### P02-04. 백그라운드 작업 비동기 전환

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/extract.py` (65-91행, 119-147행) |
| 분류 | Backend · 동시성 |

**현재 문제**

`_process_extraction`, `_process_extraction_v2` 가 동기 함수로 실행된다.
내부에서 `tempfile`, `Path.write_bytes()`, `storage.upload_file()`, `pdf_service.extract_questions()` 등 모두 블로킹 I/O + CPU-bound 작업이며, FastAPI의 `BackgroundTasks`는 이를 threadpool에서 실행하지만 동시 추출 요청이 많아지면 스레드 고갈 위험이 있다.

```python
def _process_extraction(job_id, status_file):
    with tempfile.TemporaryDirectory() as tmpdir:  # Blocking
        storage.download_file(...)                  # Blocking I/O
        pdf_service.extract_questions(...)          # CPU-bound
        storage.upload_file(...)                    # Blocking I/O
```

**개선 방안**

단계적 접근:
1. **1단계**: CPU-bound 작업을 `concurrent.futures.ProcessPoolExecutor`로 분리
2. **2단계**: 작업 큐 (Celery/RQ 등) 도입으로 워커 분리

현재 ECS Fargate 0.5 vCPU 환경에서는 1단계만으로도 충분할 수 있음.

**기대 효과**: 동시 추출 처리 능력 향상, 이벤트 루프 블로킹 방지

---

### MEDIUM — 명확한 개선 효과

#### P02-05. 문항 리스트 컴포넌트 메모이제이션

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/QuestionListPanel.jsx` (143-171행), `frontend/src/components/QuestionAnalysisPanel.jsx` (217-282행) |
| 분류 | Frontend · 렌더링 |

**현재 문제**

문항 리스트 항목에 `React.memo`가 없어, 체크박스 하나를 클릭하면 전체 리스트가 리렌더된다.
100+ 문항 시 체크박스 반응이 느려질 수 있다.

**개선 방안**

개별 문항 아이템을 별도 컴포넌트로 추출 + `React.memo` 적용.

```jsx
const QuestionItem = React.memo(({ q, isSelected, onToggle }) => (
  <label className={`qlist-item${isSelected ? " qlist-item--checked" : ""}`}>
    <input type="checkbox" checked={isSelected} onChange={() => onToggle?.(q)} />
    <span>{q.title || `문항 ${q.question_num}`}</span>
  </label>
), (prev, next) => prev.isSelected === next.isSelected && prev.q.question_id === next.q.question_id);
```

**기대 효과**: 리스트 인터랙션 60-80% 빨라짐 (대량 문항 시)

---

#### P02-06. 폴링 interval 클린업

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/FilePagePanel.jsx` (255-277행), `frontend/src/views/WorkbookEditorView.jsx` (291-336행) |
| 분류 | Frontend · 메모리 |

**현재 문제**

재감지(refresh) 및 내보내기(export) 폴링 시 `setInterval`로 2초마다 API를 호출하는데, 컴포넌트 언마운트 시 interval이 정리되지 않는다. 탭 전환 반복 시 ghost 폴링이 누적된다.

```javascript
// FilePagePanel.jsx:261 — interval 생성 후 cleanup 없음
const poll = setInterval(async () => {
  const info = await getJobInfo(jobId);
  if (st === "DONE" || st === "FAILED") clearInterval(poll);
}, 2000);
```

**개선 방안**

`useRef`로 interval ID를 관리하고, `useEffect` cleanup에서 해제.

```javascript
const pollRef = useRef(null);

useEffect(() => {
  return () => { if (pollRef.current) clearInterval(pollRef.current); };
}, []);

const handleRefresh = useCallback(async () => {
  if (pollRef.current) clearInterval(pollRef.current);
  pollRef.current = setInterval(async () => { /* ... */ }, 2000);
}, [/* deps */]);
```

**기대 효과**: 메모리 릭 방지, 불필요한 API 호출 제거

---

#### P02-07. 초기화 API 병렬 호출

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/views/WorkbookEditorView.jsx` (162-184행, 345-349행) |
| 분류 | Frontend · 네트워크 |

**현재 문제**

컴포넌트 마운트 시 `getWorkbook()`과 `listCovers()`가 별도 `useEffect`에서 순차 실행된다.
두 API는 독립적이므로 병렬 호출이 가능하다.

**개선 방안**

`Promise.all()` 로 병렬 호출.

```javascript
useEffect(() => {
  Promise.all([
    initialWorkbookId ? getWorkbook(initialWorkbookId) : null,
    listCovers()
  ]).then(([meta, coverData]) => {
    if (meta) { /* restore basket */ }
    if (coverData) setCovers(coverData.covers || []);
  });
}, [initialWorkbookId]);
```

**기대 효과**: 초기 로딩 200-500ms 단축

---

#### P02-08. 문항 썸네일 중복 PDF 읽기 제거

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py` (690-740행) |
| 분류 | Backend · I/O |

**현재 문제**

`get_question_thumbnail_endpoint`에서 boundary 캐시 미스 시 PDF를 두 번 읽는다:
- 710행: boundary 감지를 위해 PDF 읽기
- 728행: 썸네일 생성을 위해 동일 PDF 재읽기

```python
pdf_bytes = storage.read_file(storage.original_key(job_id))  # 1회차
boundaries = detect_question_boundaries(pdf_path)
# ...
if pdf_bytes is None:
    pdf_bytes = storage.read_file(...)  # 2회차 (중복)
```

**개선 방안**

710행에서 읽은 `pdf_bytes`를 728행에서 재사용.

**기대 효과**: 캐시 미스 시 응답 시간 ~20% 단축

---

#### P02-09. adaptive 감지 조건부 실행

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/utils/question_parser.py` (315-476행) |
| 분류 | Backend · 알고리즘 |

**현재 문제**

문항 감지 시 regex 패턴 매칭(Step 3) 후 **항상** adaptive 감지(Step 4)도 실행한다.
regex 감지 커버리지가 이미 충분한 경우에도 전체 페이지를 다시 스캔하는 낭비가 발생한다.

**개선 방안**

regex 감지 결과의 커버리지(예: 전체 페이지의 80% 이상에서 문항 감지)가 충분하면 adaptive 감지를 스킵.

```python
regex_coverage = len(pages_with_questions) / len(pages_data)
if regex_coverage < 0.8:
    adaptive_raw = _run_adaptive_detection(pages_data)  # 보완 실행
```

**기대 효과**: 대형 PDF 감지 시간 ~30% 단축

---

#### P02-10. WorkbookPreview 렌더링 최적화

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/WorkbookPreview.jsx` (47-181행) |
| 분류 | Frontend · 렌더링 |

**현재 문제**

미리보기 캔버스에서 모든 페이지·셀·이미지를 한꺼번에 렌더링한다.
40문항 6단 레이아웃 시 ~91개 DOM 요소가 동시 생성되며, off-screen 이미지도 모두 로드된다.

**개선 방안**

보이는 1-2 페이지만 렌더링 + off-screen 이미지 lazy load.

**기대 효과**: 미리보기 렌더링 30-40% 빨라짐 (대량 선택 시)

---

#### P02-11. API 요청 중복 방지 (Deduplication)

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/api/client.js` |
| 분류 | Frontend · 네트워크 |

**현재 문제**

동일 API를 동시에 여러 번 호출하면 모두 네트워크 요청으로 나간다.
상태 변경으로 인한 리렌더 시 같은 `getAllQuestions(jobId)` 가 중복 발생할 수 있다.

**개선 방안**

진행 중인 요청을 Map으로 관리, 동일 키의 요청은 기존 Promise를 공유.

```javascript
const inflight = new Map();

export async function getAllQuestions(jobId) {
  const key = `getAllQuestions:${jobId}`;
  if (inflight.has(key)) return inflight.get(key);

  const promise = apiFetch(`${BASE_URL}/jobs/${jobId}/questions`)
    .then(res => res.ok ? res.json() : Promise.reject(...))
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}
```

**기대 효과**: 불필요한 중복 API 호출 제거

---

### LOW — 코드 품질·방어적 개선

#### P02-12. 무거운 엔드포인트 타임아웃

| 항목 | 내용 |
|------|------|
| 파일 | 전체 라우터 (`browse.py`, `extract.py` 등) |
| 분류 | Backend · 안정성 |

**현재 문제**

PDF를 다루는 엔드포인트에 타임아웃이 없다. 악의적이거나 비정상적으로 큰 PDF 요청 시 워커가 무한 대기할 수 있다.

**개선 방안**

PDF 처리 엔드포인트에 30초 타임아웃 적용. `asyncio.wait_for()` 또는 미들웨어 레벨 타임아웃.

**기대 효과**: 리소스 고갈 방지

---

#### P02-13. 파생 상태 useMemo 적용

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/QuestionAnalysisPanel.jsx` (93-103행) |
| 분류 | Frontend · 렌더링 |

**현재 문제**

`allCheckable`, `allChecked` 등 파생 값이 매 렌더마다 재계산된다.

```jsx
const allCheckable = questions.filter((q) => !q.is_false_positive);   // 매번 필터
const allChecked = allCheckable.every((q) => checkedIds.has(q.question_id)); // 매번 순회
```

**개선 방안**

`useMemo` 래핑.

**기대 효과**: 미미하나 (sub-100ms), 대량 문항에서 누적 효과

---

#### P02-14. 문항 썸네일 기본 DPI 최적화

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/services/thumbnail_service.py` (26행) |
| 분류 | Backend · 리소스 |

**현재 문제**

문항 썸네일 기본 DPI가 144로, UI 미리보기 용도에는 과도하다. 페이지 썸네일(96 DPI)과도 불일치.

**개선 방안**

기본값을 96으로 낮추고, 고품질이 필요한 경우에만 `dpi=144` 파라미터로 요청.

**기대 효과**: 썸네일 생성 속도 향상, 메모리 절약

---

#### P02-15. MUI 번들 사이즈 최적화

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/package.json` |
| 분류 | Frontend · 번들 |

**현재 문제**

MUI 생태계 (`@mui/material`, `@mui/x-data-grid`, `@mui/lab`, `@emotion/*`) 합계 ~400KB.
실제로 MUI를 많이 쓰는 페이지는 analysis 페이지에 집중되어 있다.

**개선 방안**

1. 미사용 MUI 서브패키지(`@mui/x-data-grid`, `@mui/lab`) 제거 가능 여부 확인
2. 필요 시 동적 import로 코드 스플리팅
3. 장기적으로 custom 컴포넌트로 대체 검토

**기대 효과**: 메인 번들 150-200KB 감소, 초기 로딩 0.5-1초 개선 (느린 네트워크)

---

## 3. 추천 실행 순서

| 단계 | 항목 | 예상 소요 | 비고 |
|------|------|-----------|------|
| **Quick win** | P02-03 페이지네이션, P02-08 중복 읽기, P02-06 폴링 클린업 | 1-2시간 | 간단한 코드 수정 |
| **High impact** | P02-01 PDF 뷰어 가상화, P02-02 페이지 메타 캐시 | 반나절 | 체감 효과 최대 |
| **Scalability** | P02-04 비동기 전환, P02-05 리스트 메모이제이션 | 1일+ | 구조 변경 수반 |
| **Polish** | P02-07, P02-09~P02-15 | 필요 시 | 점진적 적용 |

---

## 4. 미결 질문 (Open Questions)

- P02-01: `react-window` vs 직접 IntersectionObserver 가상화 — 어느 쪽이 react-pdf와 호환성이 더 좋은지 검토 필요
- P02-03: 프론트엔드 UI를 무한 스크롤 vs 페이지 번호 방식 중 선택
- P02-04: 현재 ECS 0.5 vCPU 환경에서 ProcessPoolExecutor 실효성 검토 (vCPU 부족 시 Celery보다 I/O 분리만 적용)
