# REQ-F02 이미지 로딩 스켈레톤 딤

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-01 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

이미지가 늦게 뜰 때 빈 영역이 노출되어 레이아웃이 깨진 인상을 줬다.

**목표 / 달성 기준**

- 이미지 로딩 중 해당 영역에 스켈레톤(shimmer) 딤을 표시한다.
- 대상: ① 문제집 썸네일, ② 페이지 미리보기, ③ 문항 이미지 카드.

---

## 2. Scope

**In-scope**

- `<img onLoad/onError>` 기반 `imgLoaded` 상태, `img-skeleton`/shimmer CSS
- `FileListPanel`, `QuestionAnalysisView`(페이지 미리보기), `QuestionAnalysisPanel`(문항 카드)

**Out-of-scope (non-goal)**

- 전체 화면 딤 (REQ-F01)

---

## 3. API·데이터 변경 (UI/UX)

### 동작·상태

각 이미지별 독립 로딩 상태. 로드 전까지 부모 컨테이너에 스켈레톤 클래스.

### 컴포넌트

공통 `img-skeleton` / `@keyframes shimmer` CSS.

### 마이그레이션 메모

없음

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 문제집 썸네일 로딩 | shimmer → 이미지 전환 |
| 2 | 페이지 미리보기 변경 | shimmer → 이미지 |
| 3 | 문항 카드 다수 | 카드별 독립 shimmer |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
