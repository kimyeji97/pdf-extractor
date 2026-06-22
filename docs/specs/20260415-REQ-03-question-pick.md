# REQ-03 문항 목록 조회·선택

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-15 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

페이지를 선택하면 감지된 문항을 크롭 이미지로 확인하고 다중 선택할 수 있어야 한다.

**목표 / 달성 기준**

- 페이지 선택 시 감지된 문항 목록이 크롭 미리보기로 나열된다.
- 문항을 멀티 선택(체크박스)할 수 있다.
- 문항 감지 0건 페이지는 "감지된 문항 없음"을 표시한다.

---

## 2. Scope

**In-scope**

- `GET /api/jobs/{id}/pages/{n}/questions` 문항 목록+좌표
- `GET .../questions/{q}/thumbnail` 문항 크롭 PNG
- `QuestionPicker` 다중 선택

**Out-of-scope (non-goal)**

- 선택 바스켓 표기·제거 (REQ-04)
- PDF 내보내기 (REQ-06)

---

## 3. API·데이터 변경

### API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/jobs/{id}/pages/{n}/questions` | 감지된 문항 목록 + bbox 좌표 |
| GET | `/api/jobs/{id}/pages/{n}/questions/{q}/thumbnail` | 문항 크롭 PNG |

### 데이터 모델·스키마

문항: `question_number`, bbox(`col_x0`, `y_top`, `col_x1`, `y_bottom`).

### 마이그레이션 메모

없음

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 문항 있는 페이지 선택 | 문항 크롭 이미지 나열 |
| 2 | 여러 문항 체크 | 다중 선택 상태 유지 |
| 3 | 문항 0건 페이지 | "감지된 문항 없음" 표시 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
