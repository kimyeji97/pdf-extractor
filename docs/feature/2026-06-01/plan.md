# plan — 문항 분석 UX 개선 (로딩 딤·레이아웃·수동 추가 잠금)

> **작성일**: 2026-06-01  
> **관련 REQ**: REQ-F01 ~ REQ-F05  
> **변경 범위**: 프론트엔드 전용 (백엔드 변경 없음)

---

## 1. 작업 목표 및 원인 요약

| Task | 목표 | 원인 |
|------|------|------|
| TASK-1 | API 통신 중 전체 화면 딤 처리 | 데이터 로딩 중 사용자 중복 클릭 가능, 진행 상태 불명확 |
| TASK-2 | 이미지 로딩 중 해당 영역 스켈레톤 딤 | 이미지가 늦게 뜰 때 빈 영역이 노출되어 레이아웃 깨짐 인상 |
| TASK-3 | 섹션 비율 조정 | 3섹션이 너무 좁아 문항 이미지 확인 불편 |
| TASK-4 | 3섹션 문항 카드 스크롤 | 문항 수가 많으면 카드가 화면 밖으로 넘쳐 스크롤 불가 |
| TASK-5 | 수동 추가 모드 중 1·3섹션 잠금 | 수동 추가 진행 중 다른 섹션 조작 시 상태 충돌 발생 가능 |

---

## 2. 구현 방식

### TASK-1 · API 통신 전체 화면 딤 (REQ-F01)

**방식**: React Context로 전역 `isApiLoading` 상태 관리.  
`client.js`의 모든 fetch 호출 전후에 상태를 토글.  
`App.jsx`에서 `GlobalDim` 컴포넌트를 최상단에 렌더링.

**신규 파일**: `frontend/src/components/GlobalDim.jsx`

```jsx
// GlobalDim.jsx — isApiLoading이 true일 때 전체 화면에 반투명 오버레이 표시
export function GlobalDim({ visible }) {
  if (!visible) return null;
  return (
    <div className="global-dim">
      <div className="global-dim-spinner" />
    </div>
  );
}
```

**CSS (기존 global CSS에 추가)**
```css
.global-dim {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.global-dim-spinner {
  width: 40px; height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

**`client.js` 수정 방식**  
Context 직접 import 대신, `client.js`에 `setLoadingCallback` 등록 함수를 두고  
`App.jsx`에서 마운트 시 콜백을 등록하는 방식으로 순환 의존성 회피.

```js
// client.js
let _onLoadingChange = null;
export function setLoadingCallback(fn) { _onLoadingChange = fn; }

let _activeCount = 0;
function setLoading(delta) {
  _activeCount = Math.max(0, _activeCount + delta);
  _onLoadingChange?.(_activeCount > 0);
}

// 각 fetch 함수 공통 래퍼
async function apiFetch(url, options) {
  setLoading(+1);
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(await res.text());
    return res;
  } finally {
    setLoading(-1);
  }
}
```

> 병렬 요청이 여러 개일 경우 카운터(`_activeCount`)로 모두 완료될 때 딤 해제.

**수정 파일**
- `frontend/src/api/client.js` — `apiFetch` 래퍼 도입, `setLoadingCallback` 추가
- `frontend/src/App.jsx` — `useState(false)`, `setLoadingCallback` 등록, `<GlobalDim>` 렌더
- `frontend/src/components/GlobalDim.jsx` — 신규

---

### TASK-2 · 이미지 로딩 스켈레톤 딤 (REQ-F02)

**방식**: 각 `<img>` 태그에 `onLoad`/`onError` 핸들러로 `imgLoaded` 상태 관리.  
이미지가 로드되기 전까지 부모 컨테이너에 스켈레톤 클래스 적용.

**공통 CSS**
```css
.img-skeleton {
  background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }
```

**대상별 적용 위치**

| 대상 | 파일 | 적용 방법 |
|------|------|----------|
| ① 문제집 썸네일 | `FileListPanel.jsx` | 파일 아이템 내 썸네일 `<img>`에 `onLoad` 상태 토글, 로딩 중 `img-skeleton` 클래스 |
| ② 페이지 미리보기 | `QuestionAnalysisView.jsx` (`.qav-preview-img`) | `<img onLoad>` → `previewLoaded` state, 로딩 중 동일 크기 스켈레톤 div 표시 |
| ③ 문항 이미지 카드 | `QuestionAnalysisPanel.jsx` (`.qap-card-img > img`) | 각 카드 내 `imgLoaded` state, 로딩 중 `qap-card-img`에 `img-skeleton` 추가 |

**수정 파일**
- `frontend/src/components/FileListPanel.jsx`
- `frontend/src/views/QuestionAnalysisView.jsx`
- `frontend/src/components/QuestionAnalysisPanel.jsx`
- `frontend/src/styles/` (또는 기존 global CSS) — 스켈레톤 공통 CSS 추가

---

### TASK-3 · 섹션 비율 조정 (REQ-F03)

**현재 구조** (`QuestionAnalysisView.jsx:34`)
```js
const [panelWidths, setPanelWidths] = useState({ section1: 220, section2: 300 });
// section3: flex: 1, minWidth: 0
```

**변경 목표**
- 1섹션: 너비 고정 유지 (현재 220px, 드래그 리사이즈 가능)
- 3섹션: `minWidth = section1 너비 × 2.5` (동적 계산)
- 2섹션: `flex: 1` (나머지 공간 자동)

**변경 방법**  
`section3`의 `style` prop에 `minWidth`를 동적으로 바인딩:

```jsx
// 변경 전
<div className="panel qav-section-3" style={{ flex: 1, minWidth: 0 }}>

// 변경 후
<div
  className="panel qav-section-3"
  style={{ flex: 1, minWidth: panelWidths.section1 * 2.5 }}
>
```

`section2`는 이미 드래그 리사이즈 고정 너비이므로, 2섹션 `style`에서 `minWidth`를 제거하고 `flex: 1`로 변경:

```jsx
// 변경 전
<div className="panel qav-section-2" style={{ width: panelWidths.section2, minWidth: 160, flexShrink: 0 }}>

// 변경 후
<div className="panel qav-section-2" style={{ flex: 1, minWidth: 160, overflow: "hidden" }}>
```

> resize handle에서 section2 드래그는 제거하거나 section1 핸들만 유지.  
> section2 width 제어는 flex로 대체되므로 `panelWidths.section2` 상태 불필요.

**수정 파일**
- `frontend/src/views/QuestionAnalysisView.jsx`

---

### TASK-4 · 3섹션 문항 카드 스크롤 (REQ-F04)

**현재 구조**  
`QuestionAnalysisView.jsx`에서 3섹션 전체가 `flex: 1`이지만,  
내부 `<QuestionAnalysisPanel>`의 `.qap-list`에 `overflow` 설정이 없어 넘침 발생.

**변경 방법**

`QuestionAnalysisView.jsx`에서 3섹션 패널을 flex column으로 구성하고,  
`QuestionAnalysisPanel`을 `height: 100%`로 채우도록 설정:

```jsx
// 3섹션 panel-body
<div className="panel-body" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
  <QuestionAnalysisPanel ... />
</div>
```

`QuestionAnalysisPanel.jsx`에서 `.qap-container`와 `.qap-list`에 스크롤 설정:

```css
/* QuestionAnalysisPanel.jsx 인라인 또는 CSS */
.qap-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.qap-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;   /* flex child가 overflow를 존중하도록 필수 */
}
```

> `.qap-toolbar`는 상단 고정, `.qap-list`만 스크롤.

**수정 파일**
- `frontend/src/views/QuestionAnalysisView.jsx`
- `frontend/src/components/QuestionAnalysisPanel.jsx` (스타일)

---

### TASK-5 · 수동 추가 모드 중 1·3섹션 잠금 (REQ-F05)

**현재 구조**  
`drawMode` state가 수동 추가 모드 여부를 관리.  
1섹션(파일·페이지), 3섹션(문항 목록)은 `drawMode`와 무관하게 인터랙션 가능.

**변경 방법**  
`drawMode === true`일 때 1섹션과 3섹션에 잠금 오버레이 적용:

```jsx
// 1섹션, 3섹션 공통 래퍼에 추가
<div
  className={`panel qav-section-1${drawMode ? " panel--locked" : ""}`}
  style={{ width: panelWidths.section1, minWidth: 160, flexShrink: 0 }}
>
```

**CSS**
```css
.panel--locked {
  pointer-events: none;
  position: relative;
}
.panel--locked::after {
  content: "";
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.55);
  z-index: 10;
  border-radius: inherit;
}
```

> `pointer-events: none`으로 클릭·드래그 차단.  
> `::after` 반투명 오버레이로 시각적으로 비활성 상태 표현.  
> `drawMode`를 `false`로 만드는 [종료] 버튼 클릭 시 즉시 해제.

**수정 파일**
- `frontend/src/views/QuestionAnalysisView.jsx`
- `frontend/src/styles/` (또는 기존 CSS) — `.panel--locked` 추가

---

## 3. 구현 순서

```
TASK-3 (섹션 비율)           — QuestionAnalysisView.jsx, 레이아웃만 변경. 의존성 없음.
TASK-4 (3섹션 스크롤)        — TASK-3 이후 (flex 구조 확정 후 overflow 설정)
TASK-5 (수동 추가 잠금)      — TASK-3/4 이후 (panel--locked CSS가 flex 구조에 의존)
TASK-2 (이미지 스켈레톤 딤)  — 독립적. TASK-3~5와 병행 가능.
TASK-1 (API 전체 딤)         — 마지막. client.js 수정이 다른 컴포넌트에 영향 없음.
```

---

## 4. 상세 작업 분류

| Task | 서브태스크 | 파일 | 담당 | 규모 |
|------|-----------|------|------|------|
| TASK-1 | `apiFetch` 래퍼 + `setLoadingCallback` | `client.js` | FE | 중 |
| TASK-1 | `GlobalDim` 컴포넌트 신규 | `GlobalDim.jsx` | FE | 소 |
| TASK-1 | `App.jsx` 콜백 등록 + `<GlobalDim>` 렌더 | `App.jsx` | FE | 소 |
| TASK-2 | 문제집 썸네일 스켈레톤 | `FileListPanel.jsx` | FE | 소 |
| TASK-2 | 페이지 미리보기 스켈레톤 | `QuestionAnalysisView.jsx` | FE | 소 |
| TASK-2 | 문항 이미지 카드 스켈레톤 | `QuestionAnalysisPanel.jsx` | FE | 소 |
| TASK-3 | 3섹션 minWidth 동적 바인딩, 2섹션 flex 전환 | `QuestionAnalysisView.jsx` | FE | 소 |
| TASK-4 | `.qap-list` overflow-y: auto + flex 구조 | `QuestionAnalysisView.jsx`, `QuestionAnalysisPanel.jsx` | FE | 소 |
| TASK-5 | `drawMode` 시 1·3섹션 `panel--locked` 적용 | `QuestionAnalysisView.jsx` | FE | 소 |

---

## 5. 완료 기준

### TASK-1
- [ ] 파일 목록 조회(`GET /api/jobs`) 중 화면 전체에 반투명 딤 + 스피너 표시
- [ ] API 완료 즉시 딤 해제
- [ ] 병렬 요청 2개 이상일 때 모두 완료 후 해제

### TASK-2
- [ ] 문제집 썸네일: 로딩 중 shimmer 애니메이션, 로드 완료 후 이미지 표시
- [ ] 페이지 미리보기: 페이지 선택 변경 시 shimmer → 이미지 전환
- [ ] 문항 이미지: 각 카드 독립적으로 shimmer 동작

### TASK-3
- [ ] 1섹션 너비 220px 유지 (드래그 리사이즈 동작)
- [ ] 3섹션 최소 너비 = `panelWidths.section1 × 2.5` (기본 550px)
- [ ] 2섹션이 남은 공간 채움 (창 리사이즈 시 유연하게 반응)

### TASK-4
- [ ] 문항 수가 많아도 3섹션 내에서 스크롤 가능
- [ ] 툴바(전체선택·삭제)는 상단 고정
- [ ] 화면 전체가 아닌 `.qap-list` 영역만 스크롤

### TASK-5
- [ ] [수동 추가] 클릭 후 1섹션·3섹션에 반투명 오버레이 표시
- [ ] 잠금 상태에서 1섹션 파일 클릭, 3섹션 체크박스·삭제 동작 안 함
- [ ] [종료] 클릭 즉시 잠금 해제 및 정상 인터랙션 복원
