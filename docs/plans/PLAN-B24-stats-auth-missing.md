# PLAN-B24 · 현황판 통계 API 인증 누락 — 비로그인·타 사용자에게 전체 합산과 파일명 노출

> 출처: 2026-10-02 세션 — REQ-P06 Phase 5 원인 코드 확인 중 발견, 같은 날 사용자 결정("B24로 따로") · 작성: 2026-10-02 · 상태: 🟡 진행

## 배경

`GET /api/stats`·`GET /api/stats/detail`(REQ-F12)에는 **인증 의존성이 없다**(`browse.py`의 두 핸들러에 `current_user`가 없고, 라우터·앱 수준 인증도 없음 — 코드 확인).

- 로그인 없이 호출해도 200이 난다
- 응답은 **모든 사용자의 SOURCE job을 합산**한다 — 일반 사용자도 남의 업로드 수·문항 수·문제집 수를 본다
- `stats/detail`은 대상 job의 **`job_id`·`filename`·`workbook_name`을 그대로 준다** — 남의 파일명이 새고, 그 `job_id`로 다른 API를 두드려 볼 수 있다(다른 API는 소유권 검사로 404)

REQ-27 Phase 2가 조회·수정 6개 엔티티 API에 인증을 걸 때 이 두 엔드포인트가 범위에서 빠진 것으로 보인다(추정). P06 Phase 1의 측정에서
"job 0건 계정도 같은 값"이 나온 것이 이 증상이었다. 오픈(2026-10-06) 전에 막는다.

## 범위

**포함**
- 두 엔드포인트에 인증을 건다(헤더 인증 `get_current_user` — 둘 다 `apiFetch`·`_authHeaders()`로 부르므로 쿠키 인증은 필요 없음)
- `user`는 **본인 소유만** 집계·나열한다. `admin`은 전체(다른 목록 API와 같은 규칙, REQ-27 Phase 2)

**제외**
- 성능 개선 — REQ-P06 Phase 5(메모리 캐시·쪽 목록 저장). 이 REQ는 응답 대상만 바꾼다
- 알림 피드(`/api/notifications`)의 사용자 구분 — 이번에 확인하지 않았다. 같은 문제가 있는지는 별도로 본다

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 처리 위치 | **P06과 분리한 별도 버그 REQ-B24** | P06 Phase 5의 완료 기준 "응답 내용은 바뀌지 않는다"를 유지 — 2026-10-02 사용자 결정 | P06 Phase 5에 포함 · 오픈 후로 미룸 |
| 집계 범위 | `user`는 본인 소유, `admin`은 전체 | `list_jobs`·`list_covers`·`list_templates`와 같은 규칙(REQ-27 Phase 2) — 2026-10-02 사용자 결정(선택지 설명에 명시) | 전체 합산 유지 |

## 미결 질문

- [x] **`workbook_count`의 "본인 것" 기준** — 문제집 메타의 `owner_id`(REQ-B10 `_save_workbook_meta`가 채움)로 거른다. `owner_id`가 없는 옛 문제집은 admin에게만 보인다(계약 #32의 `None` 처리와 같은 결) → 이대로 간다(2026-10-02 사용자 "b24 승인")

## 작업 단계

- [x] **Phase 1** — 두 엔드포인트에 인증 + 소유자 필터 (2026-10-02 `60d43f0`, 케이스 9/9 · 백엔드 326/326)
      완료 기준: 비로그인 401 · `user`는 본인 job만 합산·나열(남의 job_id·파일명이 응답에 없음) · `admin`은 지금과 같은 전체 결과.
      기존 F12·B17 통계 테스트는 `authed_client`(admin)로 옮겨 원래 단언을 그대로 통과(계약 #30)

## 제약·함정

- **기존 라우터에 인증을 얹으면 그 경로를 무인증으로 부르던 기존 테스트가 전부 401로 깨진다**(계약 #30) — `test_stats_detail_api.py`·`test_question_stats_api.py` 등이 `client`(무인증)로 부른다. `authed_client`로 옮긴다
- 프론트는 이미 헤더를 붙인다 — `getStats`는 배경일 때 raw fetch + `_authHeaders()`, 아니면 `apiFetch`, `getStatsDetail`은 `apiFetch`(계약 #26·#31). 프론트 변경 없음
- P06 Phase 5가 같은 함수(`get_stats`·`get_stats_detail`)를 고친다 — 순서를 정해 하나씩 머지한다

## 검증 계약

> 작성: 2026-10-02 · 스펙: 이 계획서(스펙 문서 없음) · 검증: `/testrun B24`
> 새 ID 없이 함께 바꾸는 것: 기존 F12-18~24 · B17-15~17의 픽스처를 `client` → `authed_client`(단언 불변, 계약 #30)

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| B24-01 | `GET /api/stats` | 비로그인 401 | 예외 | PLAN § 작업 단계 — "비로그인 401" | 1 | ✅ |
| B24-02 | `GET /api/stats/detail` | 비로그인 401 | 예외 | PLAN § 작업 단계 — "비로그인 401" | 1 | ✅ |
| B24-03 | `/api/stats` (user) | A·B job이 섞여도 A에겐 `source_count`·`question_count`가 A 것만 | 정상 | PLAN § 작업 단계 — "`user`는 본인 job만 합산·나열" | 1 | ✅ |
| B24-04 | `/api/stats` (user) | `workbook_count`는 본인 `owner_id` 문제집만 | 정상 | PLAN § 작업 단계 — "`user`는 본인 job만 합산·나열" | 1 | ✅ |
| B24-05 | `/api/stats/detail` (user) | `false_positive_count` 상세에 남의 job_id가 없다 | 불변식 | PLAN § 작업 단계 — "남의 job_id·파일명이 응답에 없음" | 1 | ✅ |
| B24-06 | `/api/stats/detail` (user) | `processing_count` 상세(쪽 목록 없는 분기)에도 남의 job이 없다 | 불변식 | PLAN § 작업 단계 — "남의 job_id·파일명이 응답에 없음" | 1 | ✅ |
| B24-07 | `/api/stats` (user) | `owner_id` 없는 옛 job·문제집은 user 합산에서 빠진다 | 경계 | PLAN § 미결 질문 — "`owner_id`가 없는 옛 문제집은 admin에게만 보인다" | 1 | ✅ |
| B24-08 | `/api/stats` (admin) | A·B·소유자 없음 전부 합산 | 정상 | PLAN § 작업 단계 — "`admin`은 지금과 같은 전체 결과" | 1 | ✅ |
| B24-09 | `/api/stats/detail` (admin) | A·B job 모두 나열 | 정상 | PLAN § 작업 단계 — "`admin`은 지금과 같은 전체 결과" | 1 | ✅ |
