# REQ-B08 문제집 편집 문항 선택 목록 스크롤 수정

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-07-16 |
| 작성자 | kimyeji97 |
| 상태 | done |
| 관련 | REQ-B04 문항 목록 스크롤 수정 (동일 원인) |

---

## 1. 배경·목표

**배경**

문제집 편집(WorkbookEditorView) 문항 선택 목록에 REQ-B04와 동일한 스크롤 문제가 있다. 문항이 많아 목록이 넘쳐도 내부 스크롤이 형성되지 않아 하단 문항에 접근할 수 없다.

**목표**

- 문제집 편집 문항 선택 목록이 넘칠 때 해당 영역 내부에서 세로 스크롤된다.

---

## 2. Scope

**In-scope**

- REQ-B04에서 정립한 `flex:1; min-height:0` 높이 체인을 문제집 편집 문항 선택 목록에 적용

**Out-of-scope (non-goal)**

- 문항 선택 로직 변경

---

## 3. 수정 내용

### 원인

문제집 편집 ② 문항 선택 패널은 `QuestionListPanel`(`.qlist-container` / `.qlist-body`)을 사용한다. 이 클래스들의 flex 높이 체인(`flex:1; min-height:0; overflow-y:auto`)은 REQ-B04에서 이미 `App.css`에 정의되어 있었다.

문제는 `pages/editor/index.jsx`에서 `QuestionListPanel`을 감싼 래퍼 `Box`가 `display:flex`가 아니어서(`sx={{ flex: 1, overflow: "hidden" }}`) 자식 `.qlist-container`의 `flex:1; min-height:0`이 발동하지 못한 데 있다. 그 결과 `.qlist-container` 높이가 콘텐츠 기준으로 늘어나 `.qlist-body`에 스크롤 영역이 형성되지 않고, 넘친 문항이 `overflow:hidden`으로 잘려 접근 불가였다.

> 정상 동작하는 문항 분석 화면은 `QuestionAnalysisPanel`(`.qap-container`)을 `display:flex` Paper 아래 **직접** 배치해 flex 체인이 이어진다. 편집 화면은 중간 래퍼 `Box`에서 체인이 끊겼다.

### 파일 / 변경

**`frontend/src/pages/editor/index.jsx`** — ② 문항 선택 래퍼 `Box`를 flex 컬럼으로 변경

```jsx
// Before
<Box sx={{ flex: 1, overflow: "hidden" }}>
  <QuestionListPanel jobId={jobId} selections={basket} onToggle={toggleSelection} />
</Box>
// After
<Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
  <QuestionListPanel jobId={jobId} selections={basket} onToggle={toggleSelection} />
</Box>
```

`App.css`의 `.qlist-container` / `.qlist-body`는 REQ-B04에서 이미 정의되어 있어 수정 불필요.

### 추가 수정 — ① 파일 목록 스크롤 (`FileListPanel`)

① 파일 목록(`FileListPanel`)은 내부 스크롤 컨테이너 자체가 없어(`container` 스타일이 `width:100%`뿐) 파일이 많으면 동일하게 넘쳐 잘렸다. ② 문항 선택과 원인·해법이 다르지만(내부 스크롤 body 신설 필요) 사용자 요청으로 함께 처리했다.

**파일**: `frontend/src/components/FileListPanel.jsx` (인라인 `styles` 객체)

- `container`: `{ width:"100%" }` → `display:flex; flexDirection:column; height:100%; minHeight:0` (부모 flex 컬럼을 채우고 내부 스크롤 활성화)
- `header`, `searchBox`: `flexShrink:0` 추가 (고정 영역)
- `scrollArea` 신규 추가: `flex:1; minHeight:0; overflowY:auto` — 에러·빈 상태·`<ul>` 목록을 감싸는 스크롤 영역
- 렌더에서 error + empty/`<ul>` 블록을 `<div style={styles.scrollArea}>`로 래핑

> 편집 ① 래퍼 `Box`는 이미 `display:flex; flexDirection:column; minHeight:0`이라 부모 조건은 충족된 상태.

**검증**: 창 높이를 360px로 줄여 파일 목록 초과 시 scrollArea scrollHeight 437 > clientHeight 82로 내부 스크롤 형성, 최하단 도달, 페이지 전체는 스크롤되지 않음(bodyScroll false) 확인.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 | 검증 |
|---|----------|-----------|------|
| 1 | 문항 많은 파일 선택 (화면 초과) | 문항 선택 목록 내부에서 세로 스크롤 | ✅ 603문항 파일로 확인 (내부 스크롤 형성, 헤더·타 패널·푸터 고정) |
| 2 | 스크롤 하단 이동 | 마지막 문항까지 접근 가능 | ✅ 최하단 도달, 206페이지 마지막 문항까지 접근 |

---

## 5. 미결 질문 (Open Questions)

- ~~REQ-B04의 `flex:1; min-height:0` 높이 체인을 그대로 적용 가능한지 확인~~ → 적용 가능. App.css 정의는 그대로 두고 래퍼 `Box`만 flex 컬럼으로 전환하면 해결.
- ~~수정 대상 컴포넌트/클래스 식별 (`QuestionPicker`, `pages/editor/index.jsx`)~~ → 실제 대상은 `QuestionListPanel`(`.qlist-*`)이며 수정은 `pages/editor/index.jsx` 래퍼 `Box`. (`QuestionPicker`는 편집 화면에서 미사용)
