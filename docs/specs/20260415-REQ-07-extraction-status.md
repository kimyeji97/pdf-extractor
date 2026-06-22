# REQ-07 문항 추출 현황 비동기 조회

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-15 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

업로드 직후 백그라운드에서 문항 경계 감지가 시작된다. 사용자가 파일 목록에서 진행 상태를 확인할 수 있어야 한다.

**목표 / 달성 기준**

- 파일별 감지 상태(대기/진행 중/완료/실패)와 총 감지 문항 수를 표시한다.
- 조회 시점은 사용자의 명시적 새로고침(`GET /api/jobs` 재호출).

---

## 2. Scope

**In-scope**

- `GET /api/jobs` 응답에 `boundaries_status`, `total_question_count` 확장
- `FileListPanel` 상태/문항 수 표기

**Out-of-scope (non-goal)**

- 실시간 진행률 스트리밍 (REQ-E01, 미구현)

---

## 3. API·데이터 변경

### API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/jobs` | 응답 확장: `boundaries_status`, `total_question_count` |

### 데이터 모델·스키마

`JobSummary.boundaries_status`, `JobSummary.total_question_count`.

### 마이그레이션 메모

없음

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 업로드 직후 조회 | 감지 진행/대기 상태 표시 |
| 2 | 감지 완료 후 새로고침 | 완료 상태 + 총 문항 수 표시 |
| 3 | 감지 실패 | 실패 상태 표시 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료). 실시간 진행률은 REQ-E01로 분리.
