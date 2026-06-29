# REQ-B04 문항 분석 화면 문항 이미지 미표시 수정

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 |
| 작성자 | kimyeji97 |
| 상태 | open |
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

**목표 / 달성 기준**

- 문항 분석 화면에서 문항 크롭 이미지가 정상 표시된다.
- 스켈레톤은 이미지 로딩 중에만 표시되고, 로딩 완료 시 실제 이미지로 전환된다.

---

## 2. Scope

**In-scope**

- `QuestionAnalysisPanel.jsx` `CardImg` 컴포넌트의 `loading="lazy"` 제거

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

---

## 5. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 페이지 선택 → 문항 목록 로드 | 스켈레톤 → 문항 크롭 이미지 정상 전환 |
| 2 | 문항이 많은 페이지 (10개+) | 모든 문항 이미지 정상 표시 |
| 3 | 수동 추가 문항 | 수동 문항 이미지도 정상 표시 |
| 4 | 페이지 전환 | 이전 페이지 이미지 정리 후 새 페이지 이미지 정상 표시 |

---

## 6. 미결 질문 (Open Questions)

- 없음
