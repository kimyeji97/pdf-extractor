# REQ-B05 PDF 뷰어 툴바 버그 수정 (이전/다음 버튼 무동작 + 툴바 스크롤 포함)

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-07-16 |
| 작성자 | kimyeji97 |
| 상태 | done |
| 관련 | REQ-F06 생성 이력 PDF 뷰어, REQ-F07 문항 분석 PDF 뷰어 |

---

## 1. 배경·목표

**배경**

REQ-F06으로 도입한 PDF 뷰어(`PdfPreviewPanel`) 툴바에 두 가지 결함이 있다.

1. 툴바 > 페이지 번호 영역의 이전/다음 페이지 버튼을 클릭해도 동작하지 않는다. 페이지 번호를 직접 입력해야만 스크롤 이동된다.
2. 툴바가 페이지 이동용 스크롤 영역에 포함되어 함께 스크롤된다. 툴바는 고정되어야 한다.

**목표**

- 이전/다음 버튼 클릭 시 해당 페이지로 스크롤 이동한다.
- 툴바는 스크롤 영역에서 분리되어 상단에 고정된다.

---

## 2. Scope

**In-scope**

- `PdfPreviewPanel` 툴바 이전/다음 버튼 핸들러 수정
- 툴바를 스크롤 컨테이너에서 분리

**Out-of-scope (non-goal)**

- 뷰어의 렌더링/줌 로직 변경
- 백엔드 API 변경

---

## 3. 근본 원인

두 결함 모두 **동일한 깨진 flex 높이 체인**에서 비롯됐다. `PdfPreviewPanel`의 `.pdf-viewer`는 `flex:1`로 부모가 flex 컬럼일 것을 전제하는데, 생성 이력 페이지의 래퍼 `Box`(`sx={{ flex:1, overflow:hidden }}`)가 `display:flex`가 아니었다.

그 결과 `.pdf-viewer` 높이가 콘텐츠만큼(약 3465px) 늘어나 `.pdf-scroll-container`가 스크롤 컨테이너로 작동하지 못하고, 실제 스크롤이 **window** 수준에서 일어났다.

- **툴바 스크롤(2)**: 툴바가 window 스크롤에 딸려 올라감.
- **이전/다음 무동작(1)**: IntersectionObserver의 `root`가 스크롤되지 않으니 모든 페이지가 항상 교차 → `currentPage`가 1에 고정 → `goPrev`는 disabled, `goNext`는 매번 1로 리셋.

추가로, 스크롤 컨테이너를 정상화한 뒤에도 `scrollToPage`의 `element.scrollIntoView({behavior:"smooth"})`가 **동작하지 않았다** — 스크롤 조상 자동 선택이 모호하고, smooth 애니메이션이 react-pdf `Page`의 지속적 리페인트에 취소됐다.

## 4. 수정 내용

### (1) 높이 체인 복구 — `pages/history/index.jsx`

미리보기 래퍼 `Box`를 flex 컬럼으로 변경 → `.pdf-viewer`가 높이 바운드를 받아 `.pdf-scroll-container`가 실제 스크롤러가 됨.

```jsx
// Before
<Box sx={{ flex: 1, overflow: "hidden" }}>
// After
<Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
```

이 하나로 툴바 고정(2) + `currentPage` 추적 정상화 → 이전/다음 활성화(1)의 대부분이 해결된다.

### (2) 페이지 스크롤 방식 교체 — `components/PdfPreviewPanel.jsx`

`scrollToPage`가 `scrollIntoView`(smooth) 대신 **스크롤 컨테이너를 명시적으로 즉시 스크롤**하도록 변경.

```jsx
const top = el.getBoundingClientRect().top
          - container.getBoundingClientRect().top
          + container.scrollTop;
container.scrollTo({ top, behavior: "instant" });
```

`behavior:"smooth"`는 이 뷰어(react-pdf 리페인트)에서 취소되어 스크롤되지 않으므로 `"instant"`로 확정.

---

## 5. 테스트 시나리오

| # | 시나리오 | 기대 결과 | 검증 |
|---|----------|-----------|------|
| 1 | 다음 버튼 클릭 | 다음 페이지로 스크롤 이동 | ✅ scrollTop 0→862(2페이지), currentPage 2로 추적 |
| 2 | 이전 버튼 클릭 | 이전 페이지로 스크롤 이동 | ✅ scrollTop 862→12(1페이지), Prev 활성화 확인 |
| 3 | 페이지 목록 스크롤 | 툴바는 고정, 페이지만 스크롤 | ✅ 컨테이너 스크롤(→1145) 시 툴바 top 123 불변, window 미스크롤 |

---

## 6. 미결 질문 (Open Questions)

- ~~문항 분석과 생성 이력이 `PdfPreviewPanel`을 공유/분기~~ → 현재 뷰어는 생성 이력에서만 사용. 컴포넌트(`PdfPreviewPanel`)는 무수정 재사용 가능하며, **소비처가 flex 컬럼 부모를 제공**해야 한다는 계약만 지키면 됨(REQ-F07에서 동일 적용 필요).
- ~~이전/다음 버튼이 scrollIntoView를 못 부르는 원인~~ → currentPage 미추적(높이 체인) + smooth scrollIntoView 취소. 컨테이너 직접 `scrollTo("instant")`로 해결.
- ~~툴바 분리: sticky vs 별도 flex 행~~ → 툴바는 이미 스크롤 컨테이너 밖 `flex-shrink:0` 행이었음. 높이 체인만 복구하면 별도 sticky 불필요.
