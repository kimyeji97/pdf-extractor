# REQ-P02 클라이언트(Frontend) 성능 개선

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 (2026-07-22 재구성) |
| 작성자 | kimyeji97 |
| 상태 | open |
| 관련 | REQ-P03 서버(Backend) 성능 개선, REQ-F07 문항 분석 PDF 뷰어 |

---

## 1. 배경·목표

**배경**

기능 구현이 일단락된 시점에서 속도·품질 개선 포인트를 식별했다. 대형 PDF(50+ 페이지)에서 체감되는 렌더링 지연, 불필요한 네트워크 반복, 메모리 릭 가능성이 존재한다.

> **재구성 이력 (2026-07-22)**: 본 스펙은 원래 Frontend·Backend 항목이 섞여 있었으나(구 P02-01~15), **P02=클라(Frontend) / P03=서버(Backend)** 로 분리했다. 백엔드 항목 7개(구 P02-02·03·04·08·09·12·14)는 **[REQ-P03](20260716-REQ-P03-thumbnail-response-time.md)로 이관**했고, 남은 클라 항목을 **P02-01~10으로 순차 재번호**했다. 구 번호 대응은 각 항목에 병기한다.

**목표**

- 프론트엔드 렌더링 성능 개선 (PDF 뷰어, 리스트, 미리보기)
- 불필요한 네트워크 요청 제거 (중복 호출, 낭비 호출)
- 메모리 릭 방지 (폴링 클린업)

---

## 2. 개선 항목

### 우선순위 기준

- **HIGH**: 사용자 체감 효과가 크거나 데이터 누적 시 장애 가능성
- **MEDIUM**: 명확한 개선 효과가 있으나 현재 규모에서는 허용 가능
- **LOW**: 코드 품질·방어적 개선

---

### HIGH — 체감 효과 큰 개선

#### P02-01. PDF 뷰어 페이지 가상화  *(구 P02-01)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/PdfPreviewPanel.jsx` |
| 분류 | Frontend · 렌더링 |

**현재 문제**

모든 PDF 페이지를 `Array.from({ length: numPages })` 로 한꺼번에 렌더링한다. `react-pdf`의 `<Page>`는 내부적으로 캔버스를 렌더하므로, 206페이지 PDF(REQ-F07 문항 분석 뷰어 실측)에서 206개 캔버스가 동시 생성되어 메모리·CPU를 대량 소비한다.

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

뷰포트 ± 2페이지만 실제 `<Page>` 렌더, 나머지는 크기 고정 placeholder div. 직접 IntersectionObserver 기반(이미 페이지 추적용 observer가 있음) 또는 `react-window`.

```
[viewport - 2] [viewport - 1] [현재] [viewport + 1] [viewport + 2]
나머지 → placeholder div (height만 유지)
```

> REQ-F07에서 문항 분석 미리보기도 이 뷰어를 공유하므로, 가상화 시 **수동 추가 오버레이(renderPageOverlay)가 placeholder 페이지에서 동작하도록** 좌표계 유지 필요. (F07 계약: `.pdf-page-wrapper` position:relative + `pt = cssPx / scale`)

**기대 효과**: 초기 렌더 2~8초 단축, 메모리 75-90% 감소 (대형 PDF)

---

#### P02-02. 목록 카드 `getPages` 낭비 호출 제거  *(신규 — 클라 성능 분석 Q2-A)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/pages/analysis/index.jsx` (`JobCard`) |
| 분류 | Frontend · 네트워크 |

**현재 문제**

분석 목록 페이지의 각 `JobCard`가 마운트 시 `getPages(job.job_id)`를 호출하지만, 실제로 쓰는 값은 **첫 페이지 썸네일 URL(`data.pages[0].thumbnail_url`) 하나뿐**이다.

```jsx
getPages(job.job_id).then((data) => {
  const url = data.pages?.[0]?.thumbnail_url;   // 이것만 사용
  if (url) setThumbUrl(`${API_ROOT}${url}`);
});
```

그런데 백엔드 `GET /jobs/{id}/pages`(`list_pages`)는 **전체 PDF를 스토리지에서 읽어 전 페이지를 파싱**한다(REQ-P03에서 다룸). 결과적으로 **카드 N개 = 전체 PDF를 N번 다운로드+파싱** → 목록 로딩이 느린 주범.

**개선 방안**

썸네일 URL은 결정적(deterministic)이므로 `/pages` 호출 없이 직접 조립:

```jsx
const thumbUrl = `${API_ROOT}/api/jobs/${job.job_id}/pages/0/thumbnail`;
```

- 카드당 `/pages` 호출 완전 제거. 썸네일 GET만 남김(그마저 REQ-P03 캐시/재read 개선으로 빨라짐).
- `question_count` 등 페이지 목록이 실제로 필요한 곳은 **작업 페이지(work.jsx ① 목록)뿐**이므로 그곳에서만 호출 유지.

**기대 효과**: 목록 진입 시 전체 PDF 재다운로드 N회 → 0회. 카드 로딩 대폭 단축.

---

#### P02-03. API 요청 중복 방지 (Deduplication)  *(구 P02-11)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/api/client.js` |
| 분류 | Frontend · 네트워크 |

**현재 문제**

동일 API를 동시에 여러 번 호출하면 모두 네트워크 요청으로 나간다. 리렌더로 같은 `getAllQuestions(jobId)` / `getPages(jobId)` 가 중복 발생할 수 있다.

> **참고 — StrictMode 이중 요청은 착시**: 개발 모드에서 `main.tsx`의 `<StrictMode>`가 effect를 2회 실행해 모든 요청이 2배로 보이지만, **프로덕션 빌드에서는 발생하지 않는다.** dedup의 목적은 StrictMode가 아니라 리렌더·동시 마운트로 인한 **실질 중복** 제거다.

**개선 방안**

진행 중인 요청을 Map으로 관리, 동일 키는 기존 Promise 공유.

```javascript
const inflight = new Map();
export async function getAllQuestions(jobId) {
  const key = `getAllQuestions:${jobId}`;
  if (inflight.has(key)) return inflight.get(key);
  const p = apiFetch(`${BASE_URL}/jobs/${jobId}/questions`)
    .then(res => res.ok ? res.json() : Promise.reject(...))
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
```

**기대 효과**: 불필요한 중복 API 호출 제거

---

### MEDIUM — 명확한 개선 효과

#### P02-04. 문항 리스트 컴포넌트 메모이제이션  *(구 P02-05)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/QuestionListPanel.jsx`, `frontend/src/components/QuestionAnalysisPanel.jsx` |
| 분류 | Frontend · 렌더링 |

**현재 문제**

문항 리스트 항목에 `React.memo`가 없어 체크박스 하나를 클릭하면 전체 리스트가 리렌더된다. 600+ 문항(실측 `테스트03` 603문항) 시 반응이 느려질 수 있다.

**개선 방안**

개별 문항 아이템을 별도 컴포넌트로 추출 + `React.memo`.

```jsx
const QuestionItem = React.memo(({ q, isSelected, onToggle }) => (
  <label className={`qlist-item${isSelected ? " qlist-item--checked" : ""}`}>
    <input type="checkbox" checked={isSelected} onChange={() => onToggle?.(q)} />
    <span>{q.title || `문항 ${q.question_num}`}</span>
  </label>
), (p, n) => p.isSelected === n.isSelected && p.q.question_id === n.q.question_id);
```

**기대 효과**: 리스트 인터랙션 60-80% 빨라짐 (대량 문항)

---

#### P02-05. 폴링 interval 클린업  *(구 P02-06)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/pages/analysis/work.jsx`(handleRefresh), `frontend/src/pages/editor/index.jsx`(export 폴링) |
| 분류 | Frontend · 메모리 |

**현재 문제**

재감지(refresh)·내보내기(export) 폴링이 `setInterval`로 2초마다 API를 호출하는데, 컴포넌트 언마운트 시 interval이 정리되지 않는다. 탭 전환 반복 시 ghost 폴링이 누적된다.

> 구 스펙은 삭제된 `FilePagePanel`/`WorkbookEditorView`를 참조했으나, 해당 폴링 로직은 현재 `pages/analysis/work.jsx`·`pages/editor/index.jsx`로 이전됨(REQ-F07/데드코드 정리). 대상 파일 갱신.

**개선 방안**

`useRef`로 interval ID 관리, `useEffect` cleanup에서 해제.

```javascript
const pollRef = useRef(null);
useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);
```

**기대 효과**: 메모리 릭 방지, 불필요한 API 호출 제거

---

#### P02-06. 초기화 API 병렬 호출  *(구 P02-07)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/pages/editor/index.jsx` |
| 분류 | Frontend · 네트워크 |

**현재 문제**

편집 페이지 마운트 시 `getWorkbook()`과 `listCovers()`가 별도 `useEffect`에서 순차 실행된다. 독립적이므로 병렬 가능.

**개선 방안**

`Promise.all()` 병렬 호출.

```javascript
useEffect(() => {
  Promise.all([
    initialWorkbookId ? getWorkbook(initialWorkbookId) : null,
    listCovers(),
  ]).then(([meta, coverData]) => { /* restore + setCovers */ });
}, [initialWorkbookId]);
```

**기대 효과**: 초기 로딩 200-500ms 단축

---

#### P02-07. WorkbookPreview 렌더링 최적화  *(구 P02-10)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/WorkbookPreview.jsx` |
| 분류 | Frontend · 렌더링 |

**현재 문제**

미리보기 캔버스에서 모든 페이지·셀·이미지를 한꺼번에 렌더링한다. 40문항 6단 레이아웃 시 ~91개 DOM 요소가 동시 생성되며 off-screen 이미지도 모두 로드된다.

**개선 방안**

보이는 1-2 페이지만 렌더링 + off-screen 이미지 lazy load(`loading="lazy"`).

**기대 효과**: 미리보기 렌더링 30-40% 빨라짐 (대량 선택)

---

### LOW — 코드 품질·방어적 개선

#### P02-08. 파생 상태 useMemo 적용  *(구 P02-13)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/QuestionAnalysisPanel.jsx` |
| 분류 | Frontend · 렌더링 |

**현재 문제**

`allCheckable`, `allChecked` 등 파생 값이 매 렌더마다 재계산된다.

```jsx
const allCheckable = questions;                    // 매번 참조
const allChecked = allCheckable.every((q) => checkedIds.has(q.question_id)); // 매번 순회
```

**개선 방안**: `useMemo` 래핑.

**기대 효과**: 미미하나 대량 문항에서 누적 효과

---

#### P02-09. MUI 번들 사이즈 최적화  *(구 P02-15)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/package.json` |
| 분류 | Frontend · 번들 |

**현재 문제**

MUI 생태계(`@mui/material`, `@mui/x-data-grid`, `@mui/lab`, `@emotion/*`) 합계 ~400KB. `npm run build` 시 메인 번들 982KB(>500KB 경고).

**개선 방안**

1. 미사용 MUI 서브패키지(`@mui/x-data-grid`, `@mui/lab`) 제거 가능 여부 확인
2. 라우트 단위 동적 import 코드 스플리팅(이미 `router.tsx` lazy 적용 — 추가 분리 검토)
3. `manualChunks`로 vendor 분리

**기대 효과**: 메인 번들 150-200KB 감소, 초기 로딩 0.5-1초 개선

---

#### P02-10. StrictMode 이중 요청 제거  *(신규 — 클라 성능 분석 Q1 / ✅ 적용 완료)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/main.tsx` |
| 분류 | Frontend · 개발 편의 |

**현상**

개발 모드에서 `/api/jobs`, `/pages`, `/thumbnail`, `/covers`, `/pages/{n}/questions` 등 모든 요청이 **정확히 2배**로 발사됐다(네트워크 캡처 확인).

**원인**

React `<StrictMode>`가 개발 모드에서 effect를 의도적으로 2회 실행(cleanup 정합성 검증)하기 때문이다. **프로덕션 빌드에서는 이중 실행하지 않아 배포 환경에선 애초에 발생하지 않았다**(성능 문제 아님).

**처리 (커밋 `fef001d`)**

사용자 결정으로 `main.tsx`에서 `<StrictMode>` 래퍼를 **제거**했다. 재로드 시 `/api/jobs`·`/pages`·`/covers`가 각 1회씩만 발사됨을 확인.

> **트레이드오프 (인지)**: StrictMode 제거로 effect cleanup 누락(구독·타이머·리스너)을 dev에서 조기 발견하는 이점을 포기한다. 대신 **P02-05(폴링 interval 클린업)** 등 effect cleanup을 코드 리뷰/수동 점검으로 보완해야 한다. 실질 중복 요청 방지는 P02-03(dedup)이 계속 담당.

---

## 3. 추천 실행 순서

| 단계 | 항목 | 비고 |
|------|------|------|
| **Quick win** | P02-02(getPages 제거), P02-05(폴링 클린업), P02-10(문서화) | 간단·즉효 |
| **High impact** | P02-01(뷰어 가상화), P02-03(dedup) | 체감 효과 최대 |
| **Polish** | P02-04·06·07·08·09 | 점진 적용 |

> 서버측 병목(썸네일 응답 6~10초, `list_pages` 전체 PDF 재read 등)은 **[REQ-P03](20260716-REQ-P03-thumbnail-response-time.md)** 에서 다룬다. P02-02(getPages 제거)와 P03(전체 PDF 재read 제거)은 **함께 적용해야** 목록 로딩이 근본 개선된다.

---

## 4. 미결 질문 (Open Questions)

- P02-01: `react-window` vs 직접 IntersectionObserver 가상화 — react-pdf 호환성 + F07 오버레이 좌표 유지 관점에서 선택
- P02-01: 가상화 시 문항 분석 수동 추가 오버레이가 placeholder 페이지에서 어떻게 동작할지(렌더 전 페이지에 드래그 시 처리)
- P02-09: `@mui/x-data-grid`·`@mui/lab` 실제 사용처 전수 확인 후 제거 가능 여부
