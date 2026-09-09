# PLAN-F12 · 문항분석 현황판 (오탐·미탐지·수동 개수 + 탐지율)

> 출처: 현재 세션 대화 · 작성: 2026-09-08 · 상태: ✅ 완료 (Phase 1~3, 2026-09-09)

## 배경

문항 감지 알고리즘은 완벽하지 않다 — 오탐(잘못 잡힌 경계, `is_false_positive`)이나 미탐지(아예
못 잡은 페이지)가 생기고, 사용자는 수동으로 문항을 추가/삭제해 보정한다. 지금 목록 화면의
`StatCards`는 "업로드한 문제집 수·감지된 문항 수·생성한 문제집 수"만 보여줘서, 감지 품질(어느
문서에 오탐/미탐지가 있는지, 전체적으로 얼마나 정확한지)을 알려면 문서를 하나씩 열어봐야 한다.

TODO(2026-08-28) 신규 항목 ⑥로 번호 없이 남아 있다가 2026-09-03 `REQ-F12`로 번호가 부여됐고,
"어느 화면인지"·"통계 API 필요 여부" 두 미결로 착수 보류 상태였다(`docs/PROGRESS.md` "미착수 —
번호만 부여된 것" 표). 이 계획서는 그 두 미결을 포함해 대화에서 정리한 내용을 담는다.

## 범위

**포함**
- 목록 화면(`analysis/index.jsx`)에 감지 품질 통계 위젯 5타일: 분석중 파일수 · 미탐지 페이지 수 ·
  오탐 문항 수 · 수동 문항 수 · 문항 탐지율
- 타일 클릭 시 우측 아코디언에 해당 통계의 상세(파일·페이지 리스트) 표시 — 생성 이력 화면(D09)의
  아코디언 패턴 재사용
- 아코디언에서 파일 클릭 → 해당 문서 작업 화면(`work.jsx`)으로 이동
- 아코디언에서 페이지 클릭 → 작업 화면 진입 + 해당 페이지로 스크롤·포커스(`work.jsx` 신규 기능)
- 백엔드: job 상태 파일에 통계 캐시 필드 추가, 감지 완료·문항 삭제·수동 문항 추가/삭제·재감지
  시점마다 재계산해 저장 — 매 요청 재계산 아님
- `/api/stats` 확장 — job 캐시 필드를 합산해 응답에 포함

**제외**
- 작업 화면(`work.jsx`) 헤더에 통계 배치 — 대화 초반 제안이었으나 기각(아래 결정 표)
- 매 요청마다 전체 boundaries를 다시 읽어 실시간 집계하는 방식 — 기각(아래 결정 표)
- 오탐 플래그(`is_false_positive`)를 사용자가 수동으로 해제(un-flag)하는 기능 — 이번 논의에서
  다루지 않음, 기존 그대로 삭제만 가능

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 화면 위치 | 목록 화면(`analysis/index.jsx`) | 사용자가 여러 문서를 한눈에 보는 대시보드를 원함. 오탐/미탐지가 job 단위 데이터인 것 자체는 위치보다 "집계 방식"으로 풀림(아래) | 작업 화면(`work.jsx`) 헤더 — 문서 단위 통계라 자연스러워 보였지만, 목적은 전체 현황 조망이었음 |
| 집계 방식 | job 단위로 감지 완료·문항 변경 시점마다 캐시 저장 → `/api/stats`가 job 캐시를 합산만 함 | 기존 `total_question_count` 필드가 이미 이 패턴(감지 완료 시 계산, 문항 삭제·수동 추가/삭제 시 재계산)을 쓰고 있어 확장이 자연스러움. `is_false_positive`는 사용자가 해제하는 API가 없어 감지 완료·삭제·재감지 시점에만 갱신하면 충분함 | 매 요청마다 전체 boundaries·수동 문항을 다시 읽어 실시간 집계 — job·문항이 늘수록 `/api/stats`가 느려짐 |
| 미탐지 페이지 정의 | 자동 + 수동 합쳐 문항이 0개인 페이지 수 | 사용자 확정 | — |
| 문항 탐지율 공식 | `(total_question_count(자동) − 오탐 수 − 수동 수) / total_question_count(자동)` | TODO 원문(2026-08-28, "전체 문항수 − (오탐지+수동)의 비율") 그대로, 대화에서 재확인. `total_question_count`는 자동 감지분만 세고 수동은 포함하지 않는다(코드 확인 사실) — 분모는 이 값 그대로 씀 | — |
| 분석중 파일수 정의 | `boundaries_status == PROCESSING`인 job 개수 | 사용자 확정 | — |
| 아코디언 클릭 이동 범위 | 파일 클릭 → 작업 화면 이동 / 페이지 클릭 → 작업 화면 진입 + 해당 페이지로 스크롤·포커스 | 사용자 확정 | — |
| 기존 `StatCards`와의 관계 | 새 5타일 위젯이 **대체**한다(업로드한 문제집 수·감지된 문항 수·생성한 문제집 수 3타일은 없어짐) | 사용자 확정 | 3타일은 유지하고 5타일을 별도로 추가 |
| 통계 집계 대상 | `SOURCE` job만 — `EXPORT`(생성 결과)는 제외 | 사용자 확정: "문항 분석 메뉴에만 존재하니까" — 문항 감지·오탐·수동 편집은 애초에 `SOURCE` job에서만 일어나는 개념 | `EXPORT` job도 포함 |
| `detection_rate` 분모 0 처리 | 자동 감지 문항 총합이 0이면(전부 삭제됐거나 원래 0개) API는 `null`을 반환하고 프론트는 "—"(계측 불가)로 표시 | 0/0은 0%가 아니라 "측정 불가"다 — 0%로 보이면 "문항이 전혀 없음"과 "감지가 완전히 실패함"이 화면에서 구별되지 않는다 | 0.0(0%)으로 표시 — Phase 1 최초 구현이 크래시 방지용으로 잠정 채택했던 값, 이번에 뒤집힘 |
| 아코디언 상세 데이터 출처 | 전용 엔드포인트 `GET /api/stats/detail?field=<processing_count\|undetected_page_count\|false_positive_count\|manual_count>` 신설. 응답 `{ field, items: [{ job_id, filename, workbook_name, count, pages }] }` — `pages`는 `false_positive_count`·`manual_count`·`undetected_page_count`일 때만 채우고(해당 지표가 걸린 페이지 번호 목록), `processing_count`는 `count`·`pages` 둘 다 `null`(페이지 개념이 없음). `SOURCE` job만, 그 field 값이 0보다 큰 job만 포함 | `/testgen` 착수 중 발견 — `GET /api/jobs`(`JobSummary`)엔 이 4필드가 없어 아코디언을 채울 수 없었다. `/api/jobs`를 확장하는 대신 전용 엔드포인트로 간 이유: ①`/api/jobs`는 검색·페이지네이션(기본 20·최대 100건)용이라 "조건에 맞는 전체"를 가져오는 용도와 계약이 다르다 ②페이지 단위 상세까지 필요한데 파일마다 `GET .../questions`를 또 부르면 N+1이 된다(REQ-P01이 이미 푼 문제를 되풀이) ③`JobSummary`는 다른 화면도 겸용이라 통계 전용 필드를 얹으면 그 화면과 무관한 필드가 섞인다 | `GET /api/jobs`에 4필드 추가 + 필터 파라미터로 대응 |

## 미결 질문

(없음 — `detection_rate` 0-분모 처리 2026-09-09 확정, 위 결정 표로 이동)

## 작업 단계

- [x] **Phase 1** — 백엔드 통계 캐시
      `JobStatusFile`에 `false_positive_count`·`manual_count`·`total_pages`·
      `undetected_page_count`(자동+수동 합쳐 문항 0개인 페이지 수, 위 결정 표의 정의 그대로)
      필드 추가. `total_pages`는 감지 완료 시 1회 정해지면 문항 편집으로 바뀌지 않는다(PDF
      페이지 수 자체이므로) — 감지 완료 지점에서만 설정. 나머지 세 필드는 감지 완료(최초
      감지·재감지)·`delete_question`·`add_manual_question`·`delete_manual_question`·
      bulk-delete 지점마다 boundaries·manual 목록으로부터 **전량 재계산**해 저장(기존
      `total_question_count` 갱신과 같은 방식 — 델타 누적이 아니다). `/api/stats`
      (`StatsResponse`)에 `processing_count`·`undetected_page_count`·`false_positive_count`·
      `manual_count`·`detection_rate`를 추가 — `SOURCE` job 캐시 필드만 합산(`EXPORT` 제외,
      위 결정 표). `detection_rate`는 분모(자동 감지 총합)가 0이면 `null`(위 결정 표).
      완료 기준: 문항 삭제·수동 추가/삭제·재감지 각 지점에서 네 캐시 필드가 정확한 값으로
      갱신됨을 확인. `/api/stats` 응답이 기존 job들의 캐시 합산값과 일치. 분모 0일 때
      `detection_rate`가 `null`.

- [x] **Phase 2** — 목록 화면 통계 위젯 + 아코디언 (+ 상세 조회 API 신설)
      **백엔드**: `GET /api/stats/detail?field=...` 신설(위 결정 표 계약 그대로) — job 캐시
      필드가 0보다 큰 `SOURCE` job만 골라, `false_positive_count`/`manual_count`는 boundaries·
      manual 목록에서 해당 페이지 번호를 뽑고, `undetected_page_count`는 `total_pages`에서
      자동+수동이 있는 페이지를 뺀 나머지를 뽑는다. `processing_count`는 job 목록 필터만.
      **프론트**: 기존 `StatCards`(3타일)를 새 5타일 위젯으로 **대체**. 타일 클릭 시 우측
      아코디언(D09의 리사이즈 가능한 우측 패널 매커니즘 재사용 — 내용은 PDF 미리보기가 아니라
      이 API가 준 파일·페이지 목록)이 펼쳐진다. 아코디언에서 파일 클릭 → `work.jsx`로 이동.
      문항 탐지율 타일은 상세 API의 `field` 4종에 없으므로 클릭해도 아코디언이 열리지 않는다.
      완료 기준: 5개 타일 값이 `/api/stats` 응답과 일치. 타일 클릭 시 아코디언이 열리고
      `/api/stats/detail` 응답 그대로의 파일·페이지 목록이 보임. 파일 클릭 시 해당 작업
      화면으로 이동.

- [x] **Phase 3** — `work.jsx` 페이지 진입 스크롤
      아코디언에서 페이지 클릭 시 전달할 대상 페이지 정보(예: 쿼리 파라미터)를 `work.jsx`가
      읽어 해당 페이지로 자동 스크롤·포커스.
      완료 기준: 아코디언에서 특정 페이지를 클릭해 진입하면 그 페이지가 뷰포트에 보이는
      상태로 화면이 열림.

## 제약·함정

- F11 진입 가드(`isRefreshBlocked`/`useAnalysisEntryGuard`, `frontend/src/utils/jobStatus.js`)는
  `boundaries_status`가 `PENDING`·`PROCESSING`일 때 작업 화면 진입을 막는다 — "분석중 파일수"
  타일의 아코디언에서 그 파일을 클릭하면 F12가 따로 막지 않아도 이 가드가 자동으로 진입을
  차단한다. F12에서 이 동작을 우회하거나 중복 구현하지 않는다.
- `is_false_positive`는 감지 알고리즘이 한 번만 매기고 사용자가 해제하는 API가 없다(코드 확인
  사실, `backend/app/routers/browse.py`에 토글 엔드포인트 없음) — 오탐 캐시는 감지 완료·문항
  삭제·재감지 시점에만 갱신하면 되고, 수동 문항 추가/삭제는 오탐 수에 영향 없다.
- `total_question_count`는 자동 감지 문항만 세고 수동 문항은 포함하지 않는다 — 문항 탐지율
  분모로 쓸 때 이 정의를 그대로 따른다(위 결정 표).

## 검증 계약

> 작성: 2026-09-08 · 계획서: 본 문서 (별도 스펙 없음) · 검증: `/testrun F12`
> 테스트: `backend/tests/test_question_stats_cache.py`(F12-01~12) ·
> `backend/tests/test_question_stats_api.py`(F12-13~17) ·
> `backend/tests/test_stats_detail_api.py`(F12-18~24) ·
> `frontend/src/pages/analysis/index.test.jsx`(F12-25~35) ·
> `frontend/src/utils/targetPage.test.js`(F12-36~38) ·
> `frontend/src/pages/analysis/workPageScroll.test.js`(F12-39~40, 소스 스캔 — `work.jsx`는
> 렌더 무대가 없다, PLAN-B12 § 제약·함정과 동일 결론)

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| F12-01 | `_trigger_boundary_detection` | 감지 완료 시 `total_pages`가 PDF 페이지 수로 저장됨 | 정상 | PLAN § 작업 단계 Phase 1 — "`total_pages`는 감지 완료 시 1회 정해지면 문항 편집으로 바뀌지 않는다" | 1 | ✅ |
| F12-02 | `delete_question` | 문항 삭제 후에도 `total_pages` 값이 그대로 유지됨 | 회귀 | 위와 동일 | 1 | ✅ |
| F12-03 | `_trigger_boundary_detection` | 오탐 포함 boundaries로 감지 완료 시 `false_positive_count`가 오탐 개수와 일치 | 정상 | PLAN § 제약·함정 — "`is_false_positive`는 감지 알고리즘이 한 번만 매기고" | 1 | ✅ |
| F12-04 | `delete_question` | 오탐 문항 삭제 후 `false_positive_count`가 감소 | 정상 | PLAN § 제약·함정 — "오탐 캐시는 감지 완료·문항 삭제·재감지 시점에만 갱신하면 되고" | 1 | ✅ |
| F12-05 | `add_manual_question` | 수동 문항 추가는 `false_positive_count`를 바꾸지 않음 | 회귀 | PLAN § 제약·함정 — "수동 문항 추가/삭제는 오탐 수에 영향 없다." | 1 | ✅ |
| F12-06 | `add_manual_question` | 수동 문항 추가 시 `manual_count`가 1 증가 | 정상 | PLAN § 작업 단계 Phase 1 — "`add_manual_question`·" | 1 | ✅ |
| F12-07 | `delete_manual_question` | 수동 문항 삭제 시 `manual_count`가 1 감소 | 정상 | PLAN § 작업 단계 Phase 1 — "`delete_manual_question`·" | 1 | ✅ |
| F12-08 | `bulk_delete_questions` | 벌크 삭제로 여러 수동 문항 제거 시 `manual_count`가 한 번에 정확히 감소 | 정상 | PLAN § 작업 단계 Phase 1 — "bulk-delete 지점마다" | 1 | ✅ |
| F12-09 | `_trigger_boundary_detection` | 문항이 0개인 페이지가 있으면 `undetected_page_count`에 반영 | 정상 | PLAN § 결정 — "자동 + 수동 합쳐 문항이 0개인 페이지 수" | 1 | ✅ |
| F12-10 | `add_manual_question` | 미탐지 페이지에 수동 문항 추가 시 `undetected_page_count`가 감소 | 정상 | 위와 동일 | 1 | ✅ |
| F12-11 | `delete_question` | 페이지의 마지막 자동 문항 삭제 시 `undetected_page_count`가 증가 | 정상 | 위와 동일 | 1 | ✅ |
| F12-12 | `_run_refresh_detection` | 재감지 완료 시 오탐수·미탐지수가 새 boundaries 기준으로 갱신됨(옛 캐시 값 안 남음) | 회귀 | PLAN § 작업 단계 Phase 1 — "감지 완료(최초 감지·재감지)" | 1 | ✅ |
| F12-13 | `GET /api/stats` | 여러 `SOURCE` job의 오탐수·수동수·미탐지수를 합산해 응답 | 정상 | PLAN § 작업 단계 Phase 1 — "`SOURCE` job 캐시 필드만 합산" | 1 | ✅ |
| F12-14 | `GET /api/stats` | `processing_count`가 `boundaries_status == PROCESSING`인 job 개수와 일치 | 정상 | PLAN § 결정 — "`boundaries_status == PROCESSING`인 job 개수" | 1 | ✅ |
| F12-15 | `GET /api/stats` | `detection_rate`가 결정 표 공식과 일치 | 정상 | PLAN § 결정 — "`(total_question_count(자동) − 오탐 수 − 수동 수) / total_question_count(자동)`" | 1 | ✅ |
| F12-16 | `GET /api/stats` | `EXPORT` job은 이 5개 필드 합산에서 제외됨 | 예외 | PLAN § 결정 — "`SOURCE` job만 — `EXPORT`(생성 결과)는 제외" | 1 | ✅ |
| F12-17 | `GET /api/stats` | 자동 감지 문항 총합이 0이면 `detection_rate`가 `null` | 경계 | PLAN § 결정 — "API는 `null`을 반환하고 프론트는 "—"(계측 불가)로 표시" | 1 | ✅ |
| F12-18 | `GET /api/stats/detail` | `field=processing_count` → `PROCESSING` job만, `count`·`pages`는 `null` | 정상 | PLAN § 결정 — "`processing_count`는 `count`·`pages` 둘 다 `null`(페이지 개념이 없음)" | 2 | ✅ |
| F12-19 | `GET /api/stats/detail` | `field=false_positive_count` → 오탐 있는 job의 `count`·오탐 페이지 번호 목록 | 정상 | PLAN § 결정 — "`false_positive_count`·`manual_count`·`undetected_page_count`일 때만 채우고(해당 지표가 걸린 페이지 번호 목록)" | 2 | ✅ |
| F12-20 | `GET /api/stats/detail` | `field=manual_count` → 수동 문항 있는 job의 `count`·수동 페이지 번호 목록 | 정상 | 위와 동일 | 2 | ✅ |
| F12-21 | `GET /api/stats/detail` | `field=undetected_page_count` → `pages`가 실제 미탐지 페이지 번호와 일치, `count == len(pages)` | 정상 | 위와 동일 | 2 | ✅ |
| F12-22 | `GET /api/stats/detail` | 해당 field 값이 0인 job은 목록에서 빠짐 | 경계 | PLAN § 결정 — "그 field 값이 0보다 큰 job만 포함" | 2 | ✅ |
| F12-23 | `GET /api/stats/detail` | `EXPORT` job은 제외 | 회귀 | PLAN § 결정 — "`SOURCE` job만" | 2 | ✅ |
| F12-24 | `GET /api/stats/detail` | 잘못된/누락된 `field` 값은 4xx | 예외 | PLAN § 결정 — "`field=<processing_count\|undetected_page_count\|false_positive_count\|manual_count>`" | 2 | ✅ |
| F12-25 | 목록 화면 통계 위젯 | 5개 타일 값이 `/api/stats` 응답과 일치 | 정상 | PLAN § Phase 2 — "완료 기준: 5개 타일 값이 `/api/stats` 응답과 일치" | 2 | ✅ |
| F12-26 | 목록 화면 통계 위젯 | 기존 `StatCards` 3타일은 더 이상 렌더되지 않음 | 회귀 | PLAN § Phase 2 — "기존 `StatCards`(3타일)를 새 5타일 위젯으로 **대체**." | 2 | ✅ |
| F12-27 | 목록 화면 통계 위젯 | `detection_rate`가 `null`이면 "—"로 표시(0%로 안 보임) | 경계 | PLAN § 결정 — "API는 `null`을 반환하고 프론트는 "—"(계측 불가)로 표시" | 2 | ✅ |
| F12-28 | 목록 화면 통계 위젯 | 타일 클릭 시 아코디언이 열리고 해당 field로 `/api/stats/detail`을 호출 | 정상 | PLAN § Phase 2 — "타일 클릭 시 아코디언이 열리고" | 2 | ✅ |
| F12-29 | 목록 화면 통계 위젯 | 같은 타일 재클릭 시 아코디언이 닫힘 | 정상 | PLAN § 범위 — "타일 클릭 시 우측 아코디언에 해당 통계의 상세(파일·페이지 리스트) 표시" | 2 | ✅ |
| F12-30 | 목록 화면 통계 위젯 | 아코디언의 파일 클릭 시 해당 작업 화면으로 이동 | 정상 | PLAN § Phase 2 — "아코디언에서 파일 클릭 → `work.jsx`로 이동." | 2 | ✅ |
| F12-31 | 목록 화면 통계 위젯 | 문항 탐지율 타일은 클릭해도 아코디언이 열리지 않음 | 예외 | PLAN § Phase 2 — "문항 탐지율 타일은 상세 API의 `field` 4종에 없으므로 클릭해도 아코디언이 열리지 않는다." | 2 | ✅ |
| F12-32 | 목록 화면 통계 위젯 | 다른 타일을 클릭하면 아코디언 내용이 새 field 목록으로 교체됨(이전 목록 안 남음) | 회귀 | PLAN § 결정 — "아코디언 상세 데이터 출처" | 2 | ✅ |
| F12-33 | 아코디언(`analysis/index.jsx`) | 오탐/수동/미탐지 항목의 개별 페이지 번호가 클릭 가능한 요소로 렌더됨 | 정상 | PLAN § 결정 — "페이지 클릭 → 작업 화면 진입 + 해당 페이지로 스크롤·포커스" | 3 | ✅ |
| F12-34 | 아코디언 | 페이지 클릭 시 `/analysis/{job_id}?page={N}`(1-based)으로 이동 | 정상 | 위와 동일 | 3 | ✅ |
| F12-35 | 아코디언 | `pages`가 `null`인 항목(분석중 파일수)엔 페이지 클릭 요소가 없음 | 경계 | PLAN § 결정 — "`processing_count`는 `count`·`pages` 둘 다 `null`(페이지 개념이 없음)" | 3 | ✅ |
| F12-36 | `resolveTargetPage()` | `page` 파라미터 없으면 `null` 반환 | 정상 | PLAN § 작업 단계 Phase 3 — "전달할 대상 페이지 정보(예: 쿼리 파라미터)를 `work.jsx`가 읽어" | 3 | ✅ |
| F12-37 | `resolveTargetPage()` | `page`가 가리키는 페이지가 목록에 있으면 그 페이지 객체 반환 | 정상 | 위와 동일 | 3 | ✅ |
| F12-38 | `resolveTargetPage()` | `page`가 목록에 없는 번호를 가리키면 `null` 반환 | 예외 | 위와 동일 | 3 | ✅ |
| F12-39 | `work.jsx`(소스 스캔) | `resolveTargetPage`를 import해서 쓴다 | 정상 | PLAN § 작업 단계 Phase 3 — "`work.jsx`가 읽어 해당 페이지로 자동 스크롤·포커스" | 3 | ✅ |
| F12-40 | `work.jsx`(소스 스캔) | `pages` 로드 이펙트 안에서 `handlePageClick`을 대상 페이지로 호출하는 배선이 있다 | 정상 | 위와 동일 | 3 | ✅ |
