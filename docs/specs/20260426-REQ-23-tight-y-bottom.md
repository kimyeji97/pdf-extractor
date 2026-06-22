# REQ-23 y_bottom 정밀화

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-26 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

문항의 하단 경계가 과도하게 넓게 잡혀 다음 문항·여백까지 포함되는 문제가 있었다.

**목표 / 달성 기준**

- `y_bottom = min(다음 문항 y_top, 마지막 텍스트 bottom + 50pt)`로 하단 경계를 조인다.

---

## 2. Scope

**In-scope**

- `_calc_tight_y_bottom()` / `_fill_y_bottom()` 로직
- `_apply_precision_improvements()`에 통합

**Out-of-scope (non-goal)**

- x 경계 정밀화 (REQ-24)

---

## 3. API·데이터 변경

### API

응답 bbox(`y_bottom`) 값이 더 타이트해짐(계약 변경 없음).

### 데이터 모델·스키마

`QuestionBoundary.y_bottom` 계산 규칙 변경.

### 마이그레이션 메모

재감지 시 반영. 기존 캐시 호환.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 같은 컬럼 다음 문항 존재 | `y_bottom`이 다음 문항 `y_top` 이하 |
| 2 | 컬럼 마지막 문항 | `마지막 텍스트 bottom + 50pt`로 제한 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
