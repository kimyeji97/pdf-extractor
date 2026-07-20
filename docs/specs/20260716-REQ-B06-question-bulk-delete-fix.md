# REQ-B06 문항 목록 벌크(다중) 삭제 수정

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-07-16 |
| 작성자 | kimyeji97 |
| 상태 | done |
| 관련 | REQ-14 문항 벌크 삭제, REQ-B07 오탐 문항 체크박스 삭제 |

---

## 1. 배경·목표

**배경**

문항 분석 화면에서 문항 목록의 벌크(다중 선택) 삭제가 동작하지 않는다.

**목표**

- 문항 목록에서 여러 문항을 선택하여 한 번에 삭제할 수 있다.
- 자동 문항과 수동 문항을 함께 삭제할 수 있다.

---

## 2. Scope

**In-scope**

- 문항 목록 벌크 삭제 흐름 수정 (프론트 선택 상태 + 삭제 호출)
- 삭제 후 목록·경계 캐시 갱신

**Out-of-scope (non-goal)**

- 단건 삭제 로직 변경
- 문항 감지 알고리즘 변경

---

## 3. 근본 원인

**read-modify-write 경쟁 상태.** 프론트 `handleDeleteSelected`가 선택 문항을 `Promise.all`로 **동시** 삭제 호출했다. 백엔드 `delete_question` / `delete_manual_question`은 각각 "캐시 전체 읽기 → 해당 1건 제거 → 전체 되쓰기" 구조라, 동시 요청들이 **같은 원본 스냅샷**을 읽고 각자 자기 것만 뺀 뒤 저장 → 마지막 쓰기만 살아남아 **1건만 실제 삭제**됐다. UI는 낙관적으로 전부 지운 듯 보이나 새로고침 시 나머지가 되살아났다.

## 4. API·데이터 변경

### 신규 엔드포인트

```
POST /api/jobs/{job_id}/pages/{page_num}/questions/bulk-delete
Body: { "question_nums": int[], "manual_ids": str[] }
Res : { "deleted_auto": int, "deleted_manual": int }
```

캐시별 read-modify-write를 **1회씩만** 수행해 경쟁 상태를 설계로 제거한다. 단건 DELETE 엔드포인트는 변경하지 않는다(다른 흐름 유지, out-of-scope 준수).

---

## 5. 수정 내용

### 백엔드 — `app/routers/browse.py`

`bulk_delete_questions` 엔드포인트 + `BulkDeleteRequest` 모델 신설:

- **자동 문항**: boundaries 캐시를 1회 읽어 `(page_index==page_num AND number∈question_nums)` 일괄 제거 → 1회 저장. `questions_per_page` / `total_question_count`를 1회 재계산해 status 갱신. 관련 썸네일 캐시 삭제(idempotent).
- **수동 문항**: manual_questions 목록을 1회 읽어 `manual_id∈manual_ids` 일괄 제거 → 1회 저장. 썸네일 캐시 삭제.
- 자동+수동 혼합을 한 요청에서 원자적으로 처리.

### 프론트 — `components/QuestionAnalysisPanel.jsx`, `api/client.js`

- `bulkDeleteQuestions(jobId, pageNum, questionNums, manualIds)` 클라이언트 함수 추가.
- `handleDeleteSelected`: 선택 항목을 자동(`question_num`) / 수동(`manual_id`)으로 분리해 **벌크 1회 호출**로 교체(기존 `Promise.all` 단건 동시 호출 제거). 실패 시 서버 상태로 목록 복원.

---

## 6. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 문항 2개+ 선택 후 삭제 | 선택 문항 **모두** 삭제 (새로고침 후에도 유지) |
| 2 | 자동+수동 혼합 선택 삭제 | 양쪽 모두 삭제 |
| 3 | 삭제 후 목록 갱신 | 남은 문항만 표시, total_question_count 정확 |
| 4 | 오탐 문항 포함 선택 삭제 (B07) | 오탐 문항도 함께 삭제 |

---

## 7. 미결 질문 (Open Questions)

- ~~삭제 방식: 단건 DELETE 반복 vs 벌크 엔드포인트 신설~~ → **벌크 엔드포인트 신설** 채택(경쟁 상태를 직렬화 대신 설계로 제거, 카운트 1회 재계산·성능 우위).
- ~~대상 범위: 자동+수동 혼합 허용~~ → 한 요청에서 `question_nums`/`manual_ids` 분리 전달로 혼합 원자 처리.
- ~~오탐 문항 포함 처리 (B07 연계)~~ → 오탐도 자동 문항이라 `question_nums`에 포함되어 동일 경로로 삭제. B07의 개별 선택 활성화와 정합.
- ~~삭제 후 경계 캐시 무효화·재조회~~ → 엔드포인트가 boundaries 캐시를 직접 갱신(재저장)하므로 별도 무효화 불필요. 프론트는 낙관적 제거 유지(Undo 시 refetch).
