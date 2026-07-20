# REQ-F08 문제집 편집 미리보기 스크롤 방향 변경 (좌우 → 상하)

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-07-16 |
| 작성자 | kimyeji97 |
| 상태 | done |
| 관련 | REQ-17 문제집 캔버스 미리보기 |

---

## 1. 배경·목표

**배경**

문제집 편집 화면 맨 우측 미리보기 영역이 좌우 스크롤로 동작한다. 상하 스크롤로 변경한다.

**목표**

- 우측 미리보기 영역을 세로(상하) 스크롤로 탐색한다.

---

## 2. Scope

**In-scope**

- `WorkbookPreview` 캔버스 컨테이너의 스크롤 방향 변경 (`overflow-x` → `overflow-y`)

**Out-of-scope (non-goal)**

- 레이아웃 계산 로직 변경

---

## 3. 수정 내용

### 원인

`WorkbookPreview`는 `.wbp-page`(`flex-shrink:0`) div들을 나열하고, 나열 방향은 `pages/editor/index.jsx`의 ④ 미리보기 래퍼 `Box`가 결정한다. 기존 래퍼는 `display:flex`(기본 `flex-direction:row`) + `justifyContent:center` + `overflowY:auto`였다. row 방향이라 페이지가 가로로 늘어서고, 한 축이 `auto`이면 CSS 규칙상 다른 축(`overflow-x`)도 `auto`로 강제되어 **좌우 스크롤**이 형성됐다.

### 파일 / 변경

**`frontend/src/pages/editor/index.jsx`** — ④ A4 미리보기 래퍼 `Box`를 세로 스택으로 변경

```jsx
// Before
<Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", justifyContent: "center" }}>
// After
<Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
```

`flexDirection:column`으로 페이지를 세로로 쌓고, `alignItems:center`로 가로 중앙 정렬, `gap:2`로 페이지 간 간격을 준다. `overflowY:auto`는 그대로 두어 세로 스크롤을 유지한다.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 | 검증 |
|---|----------|-----------|------|
| 1 | 여러 페이지 미리보기 | 상하 스크롤로 탐색 | ✅ 5문항·세로2단 → 3페이지, wrapper `flex-direction:column`, scrollHeight 1507 > clientHeight 342 (세로 스크롤) |
| 2 | 페이지 배치 확인 | 세로 나열 흐름 정상 | ✅ 3페이지 동일 left(986), top 417→914→1411 증가 (세로 나열) |

---

## 5. 미결 질문 (Open Questions)

- ~~대상 확정: 문제집 편집 우측 `WorkbookPreview` 캔버스 컨테이너~~ → 대상은 `pages/editor/index.jsx`의 ④ 미리보기 래퍼 `Box` (WorkbookPreview 컴포넌트 자체는 무수정).
- ~~`overflow-x → overflow-y` 전환~~ → `flex-direction`을 row→column으로 바꾸는 것이 핵심이며, `overflowY:auto`는 유지. (페이지가 `previewWidth`=340px 고정이라 패널 폭이 340px보다 좁아지면 소량 가로 오버플로가 남을 수 있음 — 폭 맞춤은 별도 개선 사항.)
