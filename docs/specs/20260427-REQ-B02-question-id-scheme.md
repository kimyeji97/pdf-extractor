# REQ-B02 문항 식별자 체계 통일

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-27 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

문제집 생성 시 미리보기와 다른 문항이 다운로드되는 버그가 있었다. 프론트 선택과 백엔드 생성이 문항을 서로 다른 기준으로 식별했기 때문이다.

**목표 / 달성 기준**

- 문항 식별자를 `{job_id}_{page_num}_{title}` 형식으로 통일하고 미리보기·선택·생성 전 구간에 적용한다.
- 미리보기와 생성 결과가 항상 일치한다.

> 설계 결정: [ADR 0002](../adr/0002-question-id-composite-key.md)

---

## 2. Scope

**In-scope**

- `browse.py` `QuestionInfo.question_id` 추가
- `pdf_service.py` `question_id` 기반 탐색
- `schemas.py` `WorkbookSelectionItem.question_id`
- 프론트 `QuestionListPanel`, `client.js`, `WorkbookEditorView`

**Out-of-scope (non-goal)**

- 이력 저장 버그 (REQ-B01)

---

## 3. API·데이터 변경

### API

문항 응답·문제집 선택 항목에 `question_id` 포함.

### 데이터 모델·스키마

`question_id = "{job_id}_{page_num}_{title}"`. 기존 캐시에서 결정적으로 파생.

### 마이그레이션 메모

별도 저장소 없음. 캐시 하위 호환.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 미리보기 문항으로 PDF 생성 | 미리보기와 동일 문항 출력 |
| 2 | 다중 파일/페이지 교차 선택 | 각 문항이 정확히 식별 |

---

## 5. 미결 질문 (Open Questions)

- 같은 페이지 내 동일 타이틀 충돌 방지(타이틀 유일성)는 운영 규칙으로 관리. (해결됨)
