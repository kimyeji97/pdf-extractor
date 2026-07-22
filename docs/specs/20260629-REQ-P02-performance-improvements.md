# REQ-P02 클라이언트(Frontend) 성능 개선

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 (2026-07-22 재구성, 2026-07-22 완료) |
| 작성자 | kimyeji97 |
| 상태 | ✅ 완료 (10개 항목 전체 적용) |
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

#### P02-01. PDF 뷰어 페이지 가상화  *(구 P02-01 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: `PdfPreviewPanel.jsx`에 IntersectionObserver 기반 가상화 구현(직접 구현, react-window 미사용 — F07 오버레이 좌표 계약을 그대로 유지하기 쉬움). `renderedPages` Set으로 뷰포트 근처(rootMargin 1000px) 페이지만 실제 `<Page>` 렌더, 나머지는 크기 유지 placeholder. `scrollToPage` 점프 시 대상 페이지를 먼저 렌더 큐에 넣고 다음 프레임에 위치 계산(대상 "이전" 페이지까지 강제 렌더하면 스크롤 위치가 한 페이지 짧게 계산되는 버그를 실측으로 발견해 수정). 실제 206페이지 문서로 CDP 기반 검증: 초기 캔버스 2~4개(전체 206개 대비), 페이지 점프·자연 스크롤 모두 정상 동작 확인. F07 오버레이(`renderPageOverlay`)는 실제 렌더된 페이지에서만 호출되며, 현재 유일한 소비처(work.jsx)가 `pageSize`를 쓰지 않고 `scale`만 사용해 영향 없음.

---

#### P02-02. 목록 카드 `getPages` 낭비 호출 제거  *(신규 — 클라 성능 분석 Q2-A / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: `analysis/index.jsx`의 `JobCard`에서 `getPages` 호출·`useEffect` 제거, `thumbUrl`을 결정적으로 직접 조립. 기존 "썸네일 없음→아이콘 폴백" UX를 유지하기 위해 `onError` 핸들러로 `thumbFailed` 상태 추가(진짜 로드 실패시에만 아이콘, 그 외엔 스켈레톤→이미지).

---

#### P02-03. API 요청 중복 방지 (Deduplication)  *(구 P02-11 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: `client.js`의 `apiFetch`에 GET 전용 dedup 추가. 동일 URL이 진행 중이면 그 Promise를 공유하고 `Response.clone()`으로 반환해 각 호출자가 독립적으로 `res.json()` 호출 가능. POST 등은 대상 제외. Node로 직접 검증(동시 3회 호출 → 실제 네트워크 1회, 모두 유효한 응답 수신).

---

### MEDIUM — 명확한 개선 효과

#### P02-04. 문항 리스트 컴포넌트 메모이제이션  *(구 P02-05 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: `QuestionListPanel`은 `QuestionItem`(isSelected/question_id 비교), `QuestionAnalysisPanel`은 `QuestionCard`(isChecked/isEditing/editingValue/title 비교)로 항목 추출 + `React.memo`. 인라인 편집 상태를 비교 대상에 포함해 편집 중인 카드만 리렌더되면서도 stale 클로저 오작동 없음(비편집 카드 콜백은 상태를 직접 참조하지 않아 안전). 실제 브라우저로 체크박스·편집 정상 동작 확인.

---

#### P02-05. 폴링 interval 클린업  *(구 P02-06 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: `editor/index.jsx`의 export 폴링은 이미 `exportPollRef` + cleanup useEffect로 처리돼 있었음(기존 구현 확인). `work.jsx`의 재감지 폴링(`handleRefresh` 내 로컬 `const poll = setInterval(...)`)은 언마운트 시 정리되지 않던 것을 확인해 `refreshPollRef` + cleanup useEffect로 동일 패턴 적용.

---

#### P02-06. 초기화 API 병렬 호출  *(구 P02-07 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: `getWorkbook`(REQ-20 복원)과 `listCovers`를 하나의 `useEffect`에서 `Promise.all`로 병렬 호출하도록 병합. 각 promise를 개별 `.catch()`해 한쪽 실패가 다른 쪽 결과에 영향 없도록 기존 에러 격리 동작 유지.

---

#### P02-07. WorkbookPreview 렌더링 최적화  *(구 P02-10 / ✅ 적용 완료)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/WorkbookPreview.jsx` |
| 분류 | Frontend · 렌더링 |

**현재 문제**

미리보기 캔버스에서 모든 페이지·셀·이미지를 한꺼번에 렌더링한다. 40문항 6단 레이아웃 시 ~91개 DOM 요소가 동시 생성되며 off-screen 이미지도 모두 로드된다.

**개선 방안**

보이는 1-2 페이지만 렌더링 + off-screen 이미지 lazy load(`loading="lazy"`).

**기대 효과**: 미리보기 렌더링 30-40% 빨라짐 (대량 선택)

**적용 내용 (2026-07-22)**: 이미지 `loading="lazy"`는 최초 구현부터 이미 적용돼 있었음(별도 조치 불필요). 미적용이던 "보이는 페이지만 렌더링"은 `WorkbookPage` 컴포넌트 + `usePageVisible`(IntersectionObserver, rootMargin 300px)로 구현. 실측: 40문항(20페이지) 기준 DOM에 `wbp-page` 20개 모두 존재하나 실제 이미지 렌더 셀은 5개뿐 — 가상화 정상 동작 확인.

---

### LOW — 코드 품질·방어적 개선

#### P02-08. 파생 상태 useMemo 적용  *(구 P02-13 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: `QuestionAnalysisPanel`의 `allChecked`를 `useMemo([allCheckable, checkedIds])`로 래핑. 인라인 편집 중 매 keystroke 리렌더에서 불필요한 `.every()` 전체 순회 방지. `allCheckable`은 단순 참조 재할당이라 memo 불필요해 그대로 둠.

---

#### P02-09. MUI 번들 사이즈 최적화  *(구 P02-15 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**: 두 패키지 모두 **실제 라우트에서 도달 불가능한 죽은 코드**에서만 쓰이고 있음을 확인 후 제거 — `@mui/lab`(sections/account/*, TabList/TabPanel), `@mui/x-data-grid`(DataGridPagination 계열, 실제 `<DataGrid>` 사용처 없음). 연쇄적으로 `TablePagination.tsx` 오버라이드·`AccountsProvider`·`data/account/*`까지 22개 파일 제거. `npm install`로 반영, `tsc`/`npm run build` 통과, 실제 브라우저로 전체 화면 정상 동작 확인. (번들 크기 감소분은 실측하지 않음 — 죽은 코드 제거가 핵심 목적이었고 tree-shaking 후 실제 절감폭은 스펙의 150-200KB 추정과 다를 수 있음.)

---

#### P02-10. StrictMode 이중 요청 = dev 전용 착시 (유지)  *(신규 — 클라 성능 분석 Q1)*

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/main.tsx` |
| 분류 | Frontend · 문서화(수정 없음) |

**현상**

개발 모드에서 `/api/jobs`, `/pages`, `/thumbnail`, `/covers`, `/pages/{n}/questions` 등 모든 요청이 **정확히 2배**로 발사된다(네트워크 캡처 확인).

**원인·결론**

React `<StrictMode>`가 개발 모드에서 effect를 의도적으로 2회 실행(cleanup 정합성 검증)하기 때문이다. **프로덕션 빌드에서는 이중 실행하지 않아 배포 환경에선 발생하지 않는다.** → **성능 최적화 대상 아님.** 실질 중복은 P02-03(dedup)에서 처리.

**결정: StrictMode ON 유지**

현업 기본값(Vite/CRA/Next 템플릿 기본, React 팀 권장)이며 프로덕션 비용이 0이고, effect cleanup 누락(예: **P02-05 폴링 interval**)을 dev에서 조기 발견하는 안전망 이점이 크다. 이중 요청은 정상 동작으로 이해한다.

> **이력**: 2026-07-22 이중 요청 노이즈 제거 목적으로 `<StrictMode>`를 한 번 제거(커밋 `fef001d`)했으나, 현업 기본값·안전망 이유로 **되돌려 다시 켬**. 본 항목은 "이중 요청을 성능 문제로 오인 금지"를 명시하는 문서화 목적으로 유지한다.

---

## 3. 추천 실행 순서

| 단계 | 항목 | 비고 |
|------|------|------|
| ✅ **Quick win** | P02-02(getPages 제거), P02-05(폴링 클린업), P02-10(문서화) | 완료 |
| ✅ **High impact** | P02-01(뷰어 가상화), P02-03(dedup) | 완료 |
| ✅ **Polish** | P02-04·06·07·08·09 | 완료 |

**전체 완료 (2026-07-22)**: REQ-P02 10개 항목 모두 적용 완료. 실행 순서는 사용자 결정으로 Quick win(02,03,05) → Polish(04,06,07,08,09) → High impact 잔여(01) 순으로 진행(가장 크고 복잡한 P02-01을 마지막에 배치).

> 서버측 병목(썸네일 응답 6~10초, `list_pages` 전체 PDF 재read 등)은 **[REQ-P03](20260716-REQ-P03-thumbnail-response-time.md)** 에서 다룬다. P02-02(getPages 제거)와 P03(전체 PDF 재read 제거)은 **함께 적용해야** 목록 로딩이 근본 개선된다.

---

## 4. 미결 질문 (Open Questions)

- ~~P02-01: `react-window` vs 직접 IntersectionObserver 가상화~~ → **직접 IntersectionObserver 구현으로 결정**. F07 오버레이 좌표 계약(`.pdf-page-wrapper` position:relative, pt=cssPx/scale)을 그대로 유지하기 쉬웠고, 외부 의존성 추가 없이 자체 구현으로 충분히 대응 가능했음.
- ~~P02-01: 가상화 시 문항 분석 수동 추가 오버레이가 placeholder 페이지에서 어떻게 동작할지~~ → **실사용상 문제 없음으로 결론**. 유일한 소비처(work.jsx)의 `renderPageOverlay`가 `pageSize`를 쓰지 않고 `scale`만 사용하며, 오버레이는 실제 렌더된(placeholder 아닌) 페이지에서만 호출됨. 사용자가 상호작용 가능한 시점엔 이미 rootMargin 버퍼로 렌더되어 있어 실질적 공백 없음.
- ~~P02-09: `@mui/x-data-grid`·`@mui/lab` 실제 사용처 전수 확인 후 제거 가능 여부~~ → **전수 확인 완료, 둘 다 죽은 코드에서만 사용 — 제거함**(§P02-09 적용 내용 참조).
