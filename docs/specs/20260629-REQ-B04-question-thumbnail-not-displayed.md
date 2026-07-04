# REQ-B04 문항 분석 화면 문항 이미지 미표시 수정

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 |
| 작성자 | kimyeji97 |
| 상태 | done |
| 관련 | REQ-03 문항 목록 조회·선택, REQ-D01 문항 이미지 대형화 |

---

## 1. 배경·목표

**배경**

문항 분석 화면(③ 문항 목록)에서 문항 이미지가 표시되지 않는다. DOM에 img 태그는 존재하나 스켈레톤 플레이스홀더만 무한히 표시된다.

**원인**

`QuestionAnalysisPanel.jsx`의 `CardImg` 컴포넌트에서 `loading="lazy"` 속성과 `display: none` 초기 스타일이 데드락을 발생시킨다.

1. `loaded` 상태 초기값 `false` → img에 인라인 `display: none` 적용
2. `loading="lazy"`는 Intersection Observer 기반으로 뷰포트에 진입해야 로딩 시작
3. `display: none`인 요소는 레이아웃에서 제외되어 뷰포트 교차 판정 불가
4. 이미지 미로딩 → `onLoad` 미호출 → `loaded` 영원히 `false` → `display: none` 유지

**추가 배경 — 문항 목록 스크롤 불가**

이미지 표시 문제와 함께, ③ 문항 목록(`.qap-container`)에 문항이 많을 때 목록이 세로로 넘쳐도 **스크롤이 되지 않아** 하단 문항에 접근할 수 없었다.

원인은 flex 자식에 `height: 100%`를 사용한 데 있다. flex 컨테이너의 자식은 부모의 확정 높이를 `height: 100%`로 안정적으로 상속받지 못하고, flex의 기본값인 `min-height: auto` 때문에 콘텐츠 크기 아래로 줄어들지 못해 `overflow` 스크롤 영역이 형성되지 않는다.

**목표 / 달성 기준**

- 문항 분석 화면에서 문항 크롭 이미지가 정상 표시된다.
- 스켈레톤은 이미지 로딩 중에만 표시되고, 로딩 완료 시 실제 이미지로 전환된다.
- ③ 문항 목록 영역이 넘칠 경우 해당 영역 내부에서 세로 스크롤된다(전체 페이지 스크롤이 아닌 패널 내부 스크롤).

---

## 2. Scope

**In-scope**

- `QuestionAnalysisPanel.jsx` `CardImg` 컴포넌트의 `loading="lazy"` 제거
- 문항 목록 스크롤을 위한 flex 높이 체인 수정
  - `App.css`: `.qap-container` / `.qlist-container` / `.qlist-body` flex 컬럼 + `flex:1; min-height:0; overflow`
  - `pages/analysis/work.jsx`, `pages/editor/index.jsx`, `pages/history/index.jsx`: 루트/행 Box `height:100%` → `flex:1; minHeight:0`

**Out-of-scope (non-goal)**

- `QuestionPicker.jsx`의 문항 이미지 (해당 없음 — `display: none` 미사용으로 정상 동작)
- 다른 화면의 이미지 로딩 방식 변경

---

## 3. API·데이터 변경

### API

없음 (프론트엔드 전용 수정)

### 데이터 모델·스키마

없음

### 마이그레이션 메모

없음

---

## 4. 수정 내용

### 4.1 문항 이미지 미표시

**파일**: `frontend/src/components/QuestionAnalysisPanel.jsx`

**변경**: `CardImg` 컴포넌트의 img 태그에서 `loading="lazy"` 속성 제거

```jsx
// Before
<img
  src={src}
  alt={alt}
  loading="lazy"
  onLoad={() => setLoaded(true)}
  style={{ display: loaded ? "block" : "none" }}
/>

// After
<img
  src={src}
  alt={alt}
  onLoad={() => setLoaded(true)}
  style={{ display: loaded ? "block" : "none" }}
/>
```

`loading` 속성의 기본값은 `"eager"`로, 요소의 display 상태와 무관하게 즉시 로딩한다. 로딩 완료 시 `onLoad` → `loaded=true` → `display: block`으로 전환되어 스켈레톤이 사라지고 실제 이미지가 표시된다.

### 4.2 문항 목록 스크롤

**원인**: flex 자식에 `height: 100%`를 사용하면 부모의 확정 높이가 상속되지 않고, flex 기본값 `min-height: auto`가 콘텐츠 크기 이하로의 축소를 막아 내부 `overflow` 스크롤 영역이 형성되지 않는다.

**해결 원칙**: 높이를 `height: 100%`가 아닌 flex 참여 방식(`flex: 1; min-height: 0`)으로 전달한다. `min-height: 0`이 flex 자식의 기본 `min-height: auto`를 덮어써 콘텐츠보다 작게 축소될 수 있게 하고, 그 결과 `overflow-y: auto` 영역에 스크롤이 생긴다.

**파일 / 변경**:

- `frontend/src/App.css` — 스크롤 컨테이너 flex 체인 정리

```css
.qap-container,
.qlist-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.qlist-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
```

- `frontend/src/pages/analysis/work.jsx`, `pages/editor/index.jsx`, `pages/history/index.jsx` — 루트/3패널 행 Box 높이 전달 방식 교체

```jsx
// Before
<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
// After
<Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
```

> 참고: App.css는 실제 진입점(`main.tsx` → RouterProvider → `pages/`)에서 import되지 않아 위 클래스가 무스타일로 렌더되고 있었다. `main.tsx`에 `import './App.css'`를 추가해 스타일이 적용되도록 했다.

---

## 5. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 페이지 선택 → 문항 목록 로드 | 스켈레톤 → 문항 크롭 이미지 정상 전환 |
| 2 | 문항이 많은 페이지 (10개+) | 모든 문항 이미지 정상 표시 |
| 3 | 수동 추가 문항 | 수동 문항 이미지도 정상 표시 |
| 4 | 페이지 전환 | 이전 페이지 이미지 정리 후 새 페이지 이미지 정상 표시 |
| 5 | 문항이 많은 페이지(화면 높이 초과) | ③ 문항 목록 영역 내부에서 세로 스크롤 동작, 전체 페이지는 스크롤되지 않음 |
| 6 | 문항 목록 스크롤 하단 이동 | 마지막 문항 카드까지 접근 가능 |

---

## 6. 미결 질문 (Open Questions)

- 없음
