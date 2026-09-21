# PLAN-B14 · 업로드/추출 생성 경로 무인증 + owner_id 미기입

> 출처: 현재 세션 대화(2026-09-21) · 작성: 2026-09-21 · 상태: ✅ 완료 (Phase 1~3, 2026-09-21)

## 배경

REQ-27 Phase 2가 인증·소유권 검사를 걸 때 "6개 엔티티 조회/수정 API"(job·workbook·cover·
footnote·watermark·template)만 범위로 잡았다. **엔티티를 새로 만드는 생성 경로**
(`upload.py`·`extract.py`)는 범위 밖이라 손대지 않았고, 그 결과 두 가지가 남아 있다.

1. `POST /api/upload`·`/api/upload/notify`·`/api/upload/direct`·`POST /api/extract`·
   `POST /api/extract-v2`가 여전히 `Authorization` 헤더 없이 누구나 호출 가능하다
   (해당 라우터에 `auth_service` import 자체가 없음, 확인됨).
2. 이 경로들이 만드는 `JobStatusFile`에 `owner_id`가 채워지지 않아 `None`으로 저장된다.
   `ensure_owner_or_admin`(`auth_service.py:121`)은 `owner_id is not None` 검사가 있어
   `None`인 레코드는 **admin만 통과**시킨다.

두 가지가 겹쳐서 실제 증상은: 로그인한 일반 사용자가 파일을 올려도 `owner_id`가 안 채워지고,
방금 만든 자기 job을 `GET /api/jobs/{id}`에서 **404**로 못 본다. 업로드/추출 자체도 여전히
로그인 없이 호출 가능해 REQ-27의 원래 목적("인증 전무·CORS `*` 상태를 닫는 것")과 배치된다.

2026-09-18, REQ-27 PR #16 머지 직후 발견해 `docs/TODO.md`에 "우선순위 높음"으로 기록해 뒀다.

## 범위

**포함**
- `POST /api/upload`·`POST /api/upload/notify`·`POST /api/upload/direct`에 로그인 강제
  (`get_current_user` 의존성) + 생성되는 `JobStatusFile`에 `owner_id=current_user["user_id"]` 채움
- `POST /api/extract`·`POST /api/extract-v2`에 로그인 강제 + 새로 만드는 EXPORT
  job/workbook에 `owner_id` 채움. `extract-v2`는 `selections`에 담긴 모든 job_id에 대해
  소유권 검사(하나라도 실패하면 요청 전체 404)
- `GET /api/files/{key:path}`에 로그인 강제(소유권 검사는 제외, 위 결정 표 참조)
- `POST /api/upload/notify`에 로그인 + 소유권 검사(`ensure_owner_or_admin`) 추가
- `POST /api/extract`의 `req.job_id`에 소유권 검사(`ensure_owner_or_admin`) 추가
- `GET /api/status/{job_id}`에 로그인 + 소유권 검사 추가(`/testgen B14` 중 발견한 관련 공백 —
  `GET /api/jobs/{id}`와 같은 정보(상태·download_url)를 담고 있어 같은 수준으로 보호)
- 기존 `owner_id=None` job/workbook 레코드를 admin에게 일괄 귀속하는 1회성 백필
- 프론트 `client.js`의 `uploadPdf()` 로컬 direct-upload 분기(`client.js:249~253` 부근) —
  `fetch(uploadUrl, { method: "POST", body: form })`로 `_authHeaders()` 없이 호출하고 있어
  백엔드가 인증을 요구하는 순간 401이 난다(계약 #26/#31과 같은 "raw fetch 누락" 패턴,
  확인됨 — `requestUploadUrl`·`notifyUploadComplete`·`startExtract`·`startExtractV2`는
  전부 `apiFetch`라 이미 헤더가 붙는다. 문제는 이 한 곳)
- 기존 업로드/추출 테스트가 있다면 `authed_client`로 전환(계약 #30 패턴)

**제외**
- 비로그인 게스트 업로드 플로우 — 이번 대화에서 A안(로그인 강제)이 채택되며 명시적으로 제외됨

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 생성 경로 인증 방식 | **A안** — `upload.py`·`extract.py`에 `get_current_user` 의존성을 걸어 로그인을 강제하고, 생성 시 `owner_id`를 채운다 | REQ-27의 원래 목적이 "인증 전무" 상태를 닫는 것이었고, 사용자가 A안을 명시적으로 선택(`/workplan a안`) | **B안** — 업로드/추출은 비로그인도 허용하되, 로그인된 사용자가 호출한 경우에만 `owner_id`를 채운다(게스트 플로우 유지) |
| `GET /api/files/{key:path}` 접근 제한 | **로그인만 요구**(`get_current_user`), 소유권 검사는 걸지 않는다 | 사용자 결정 | 무인증 유지 / 로그인+소유권 검사(보류) |
| `POST /api/upload/notify` 접근 제한 | **로그인 + 소유권 검사**(`ensure_owner_or_admin`) 둘 다 건다 | 사용자 결정 — 타인이 남의 pending job에 감지를 트리거하는 걸 막기 위함 | 로그인 요구만(소유권 검사 생략) |
| 기존 `owner_id=None` 레코드(REQ-27 Phase 2 머지~이 수정 배포 전 생성분) | **admin에게 일괄 귀속**(REQ-27 Phase 2의 기존 데이터 이관과 동일 패턴) | 사용자 결정 — 기존 이관 패턴과 일관성 | 방치(`None` 유지) |
| `extract-v2` 멀티소스 소유권 | **전체 차단(A안)** — `selections`의 job_id 중 하나라도 본인 소유가 아니면 요청 전체를 404로 거부 | 기존 `ensure_owner_or_admin` 패턴과 일관되고 구현이 단순함. 공유 기능(REQ-28)이 아직 없어 이 상황은 버그이거나 악의적 시도뿐 | **부분 허용(B안)** — 소유 아닌 selection만 조용히 제외. 결과 문항 수가 요청보다 적어져도 에러가 안 남아 계약 #22 계열의 "조용히 틀린 결과" 위험 |
| `POST /api/extract`(v1) 소유권 | **소유권 검사 추가** — `req.job_id`에 `ensure_owner_or_admin`을 건다 | `extract-v2`·`GET /api/jobs/{id}` 등 다른 모든 경로가 이미 이 패턴을 쓴다 — v1만 예외로 두면 일관성이 깨지고, 로그인만 한 타인이 남의 job_id로 추출을 트리거(백그라운드 처리 + 상태 덮어쓰기)할 수 있는 경로가 남는다 | 로그인만 요구(소유권 검사 생략) |
| `GET /api/status/{job_id}` 접근 제한 | **로그인 + 소유권 검사**(`ensure_owner_or_admin`) — `GET /api/jobs/{id}`와 동일 수준 | `/testgen B14` 중 발견한 관련 공백. 상태·download_url을 담고 있어 `GET /api/jobs/{id}`와 사실상 같은 정보를 노출한다 | 로그인만 요구(`GET /api/files`와 같은 수준 — 기각. 이 엔드포인트는 파일 서빙이 아니라 job 조회이므로 browse.py 패턴이 더 맞음) |

> ⚠️ **`GET /api/files/{key:path}` 결정의 잔여 위험** — 소유권 검사가 없으므로, job_id(경로)를
> 아는 **다른 로그인 사용자**는 여전히 타인의 원본/결과 PDF를 내려받을 수 있다. "로그인 안 한
> 외부인"만 막힌다. 사용자가 이 트레이드오프를 알고 선택한 것으로 기록해 둔다.

## 미결 질문

없음 — 이번 대화에서 전부 결정됨.

## 작업 단계

- [x] **Phase 1** — 백엔드: `upload.py`·`extract.py`·`GET /api/files/{key:path}`·
      `GET /api/status/{job_id}`에 인증 걸기 + `owner_id` 채움 + `/upload/notify`·
      `POST /api/extract` 소유권 검사 + 기존 `owner_id=None` 레코드 admin 백필
      완료 기준(줄바꿈 없이 하나씩 — 인용 근거용):
      - 로그인 없이 업로드/추출/파일 다운로드/상태 조회 호출 시 401
      - 타인 소유 pending job에 `/upload/notify`를 걸면 404
      - 타인 소유 job으로 `POST /api/extract`를 호출하면 404
      - 타인 소유 job으로 `GET /api/status/{id}`를 호출하면 404
      - 로그인한 일반 사용자가 올린 job에 `owner_id`가 채워진다
      - 본인 job은 `GET /api/jobs/{id}`·`GET /api/status/{id}`에서 200을 받는다
      - 백필 후 기존 레코드가 admin 소유로 조회된다
      - `extract-v2` selections 중 하나라도 타인 소유 job_id가 섞이면 요청 전체 404

      `/testrun`(2026-09-21) 확인: B14-01~11·13~16 **15/15 통과**. 백필 항목은 새 코드
      없이 REQ-27의 `migration_service.backfill_owner_id()`(범용·재실행 가능)를 배포 후
      재실행하는 것으로 충족 — 전용 케이스를 안 둔 이유(`/testgen` 조사).
      ⚠️ **완료했지만 회귀 하나를 남겼다** — `test_template_extract_wiring.py`(REQ-30)
      8건이 새로 실패한다(존재하지 않는 `job_id="job-src"`를 참조하던 fixture가 새
      소유권 검사의 "job 존재 확인"에 걸림). Phase 3에서 처리한다.
- [x] **Phase 2** — 프론트: `uploadPdf()`의 로컬 direct-upload 분기에 `_authHeaders()` 추가
      완료 기준: 로컬 모드 업로드가 로그인 상태에서 401 없이 완료된다

      `/testrun`(2026-09-21) 확인: B14-12 **1/1 통과**, 프론트 전체 회귀 없음(186/186).
      R2 모드 분기(presigned URL PUT)는 범위 밖이라 손대지 않았다.
- [x] **Phase 3** — 기존 테스트 회귀 확인 + 신규 케이스(일반 사용자 업로드→조회 성공, 타인
      job 404) 추가. **Phase 1이 남긴 것**: `test_template_extract_wiring.py`(REQ-30)의
      selections가 참조하는 `job_id`를 `_make_job`으로 실제 생성하도록 고쳐야 하는
      케이스 8건(위 Phase 1 참조)
      완료 기준: `/testrun` 전체 회귀 없음 + 신규 케이스 전부 녹색

      **이탈**: "신규 케이스" 추가는 하지 않았다 — `/testgen` 조사에서 Phase 1의
      B14-07/08(성공)·B14-09/14/15(타인 404)가 이미 그 시나리오를 정확히 덮고 있어
      중복이었다(사용자 확인). REQ-30 fixture 8건은 `/testrun 30`이 (a)로 분류해
      직접 고쳤다(`_make_job`으로 job-src 생성). `/testrun`(2026-09-21) 최종 확인:
      **REQ-B14 전체 16/16**, 회귀 없음(백엔드 196/196·프론트 186/186). 커밋 `08b6b46`.

## 제약·함정

- **계약 #30** — 기존 라우터에 인증을 새로 걸면 그 라우터를 무인증으로 부르던 기존 테스트가
  전부 401로 깨진다. `authed_client` 픽스처로 일괄 전환할 것.
- **계약 #26/#31** — `apiFetch`를 거치지 않는 raw `fetch` 호출은 `Authorization` 헤더가
  자동으로 안 붙는다. `uploadPdf()`의 로컬 direct-upload 분기가 여기 해당(위 범위절 확인됨).
- `ensure_owner_or_admin`은 `owner_id`가 `None`이면 admin만 통과시킨다 — 인증만 걸고
  `owner_id`를 안 채우면 일반 사용자는 여전히 자기 리소스에 접근 못한다(이번 버그의 정확한
  원인이자, 앞으로 생성 라우터에 인증을 걸 때마다 반복될 수 있는 함정).

## 검증 계약

> 작성: 2026-09-21 · 스펙: 없음(계획서 자체가 1차 소스) · 검증: `/testrun B14`

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| B14-01 | `POST /api/upload` | 인증 없이 호출 시 401 | 예외 | PLAN § Phase 1 완료 기준 — "로그인 없이 업로드/추출/파일 다운로드/상태 조회 호출 시 401" | 1 | ✅ |
| B14-02 | `POST /api/upload/direct` | 인증 없이 호출 시 401 | 예외 | 상동 | 1 | ✅ |
| B14-03 | `POST /api/upload/notify` | 인증 없이 호출 시 401 | 예외 | 상동 | 1 | ✅ |
| B14-04 | `POST /api/extract` | 인증 없이 호출 시 401 | 예외 | 상동 | 1 | ✅ |
| B14-05 | `POST /api/extract-v2` | 인증 없이 호출 시 401 | 예외 | 상동 | 1 | ✅ |
| B14-06 | `GET /api/files/{key:path}` | 인증 없이 호출 시 401 | 예외 | 상동 | 1 | ✅ |
| B14-07 | `POST /api/upload` | 로그인한 사용자가 올린 job의 `owner_id`가 채워짐 | 정상 | PLAN § Phase 1 완료 기준 — "로그인한 일반 사용자가 올린 job에 `owner_id`가 채워진다" | 1 | ✅ |
| B14-08 | `GET /api/jobs/{id}` | 방금 올린 자기 job을 200으로 조회 | 회귀 | PLAN § Phase 1 완료 기준 — "본인 job은 `GET /api/jobs/{id}`·`GET /api/status/{id}`에서 200을 받는다" | 1 | ✅ |
| B14-09 | `POST /api/upload/notify` | 타인 소유 pending job에 걸면 404 | 예외 | PLAN § Phase 1 완료 기준 — "타인 소유 pending job에 `/upload/notify`를 걸면 404" | 1 | ✅ |
| B14-10 | `POST /api/extract-v2` | selections에 타인 소유 job_id가 하나라도 섞이면 요청 전체 404 | 예외 | PLAN § Phase 1 완료 기준 — "`extract-v2` selections 중 하나라도 타인 소유 job_id가 섞이면 요청 전체 404" | 1 | ✅ |
| B14-11 | `POST /api/extract-v2` | selections가 전부 본인 소유 job이면 차단되지 않는다 | 정상 | PLAN § 결정 — "`selections`의 job_id 중 하나라도 본인 소유가 아니면 요청 전체를 404로 거부" (역) | 1 | ✅ |
| B14-12 | `uploadPdf()` (client.js) | 로컬 direct-upload 요청에 Authorization 헤더가 붙는다 | 회귀 | PLAN § 제약·함정 — "로컬 direct-upload 분기가 여기 해당" (계약 #26/#31) | 2 | ✅ |
| B14-13 | `GET /api/status/{job_id}` | 인증 없이 호출 시 401 | 예외 | PLAN § Phase 1 완료 기준 — "로그인 없이 업로드/추출/파일 다운로드/상태 조회 호출 시 401" | 1 | ✅ |
| B14-14 | `POST /api/extract` | 타인 소유 job으로 호출하면 404 | 예외 | PLAN § Phase 1 완료 기준 — "타인 소유 job으로 `POST /api/extract`를 호출하면 404" | 1 | ✅ |
| B14-15 | `GET /api/status/{job_id}` | 타인 소유 job으로 호출하면 404 | 예외 | PLAN § Phase 1 완료 기준 — "타인 소유 job으로 `GET /api/status/{id}`를 호출하면 404" | 1 | ✅ |
| B14-16 | `GET /api/status/{job_id}` | 본인 소유 job으로 호출하면 200 | 회귀 | PLAN § Phase 1 완료 기준 — "본인 job은 `GET /api/jobs/{id}`·`GET /api/status/{id}`에서 200을 받는다" | 1 | ✅ |
