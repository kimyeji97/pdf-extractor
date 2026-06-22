# REQ-15 전체 페이지 크기 오탐지 표시

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-26 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

경계가 페이지 전체 크기와 일치하는 영역은 문항이 아닐 가능성이 높다(오탐지). 사용자가 식별할 수 있도록 표시한다.

**목표 / 달성 기준**

- 경계가 페이지 전체 크기와 ±2pt 이내로 일치하면 `is_false_positive=True`로 마킹한다.
- UI에서 오탐지 의심 배지·체크박스 비활성화·전체 선택 제외로 표시한다.

---

## 2. Scope

**In-scope**

- `_is_false_positive()` 판정 로직 (`_FALSE_POSITIVE_TOLERANCE = 2.0`)
- 문항 응답 `is_false_positive` 필드
- 오탐지 UI 표시

**Out-of-scope (non-goal)**

- 배경색 기반 오탐지 (REQ-25)
- 자동 삭제(마킹만 수행)

---

## 3. API·데이터 변경

### API

문항 목록 응답에 `is_false_positive` 추가.

### 데이터 모델·스키마

`QuestionBoundary.is_false_positive: bool = False`.

### 마이그레이션 메모

기존 캐시는 기본값 `False`로 역직렬화(하위 호환).

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 경계 = 페이지 전체 크기 | `is_false_positive=True`, 오탐지 배지 |
| 2 | 정상 문항 | `is_false_positive=False` |
| 3 | 전체 선택 | 오탐지 항목 제외 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료). 배경색 사유 오탐지는 REQ-25에서 확장.
