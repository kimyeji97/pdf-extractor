# PLAN-B23 · 결과 PDF 상태 조회가 401 — `getStatus` raw fetch에 인증 헤더 누락

> 출처: `docs/TODO.md` §10 원문(2026-09-30 추가, 다른 세션 — 원 대화는 transcript에 없음) + 2026-09-30 세션 raw fetch 전수 확인 ·
> 작성: 2026-09-30 · 상태: 🟡 진행 (Phase 1 완료 2026-09-30 — Phase 2 dev 확인 남음)

## 배경

생성 화면에서 PDF를 생성한 뒤 결과 상태 폴링(`GET /api/status/{job_id}`)이 **401 "인증이 필요합니다."**로 실패한다.
결과 화면도 같은 호출을 쓴다(TODO §10: 호출처 `editor/index.jsx` 생성 폴링 · `history/index.jsx` 결과 화면 2곳).

원인(코드 확인): 백엔드 `get_status`는 `get_current_user`(Authorization 헤더)를 요구하는데, 프론트 `getStatus`는 계약 #26의
**raw fetch**라 `apiFetch`가 자동으로 붙이는 인증 헤더가 없다. REQ-27 Phase 4가 같은 계열(`getJobInfo`·`uploadCover`·`uploadWatermark`)에
`_authHeaders()`를 붙이며 계약 #31을 만들었는데 **이 함수를 놓쳤다.** 에러 없이 조용히 새는 계열이라 테스트·빌드로는 안 잡혔다.

전수 확인(2026-09-30): `client.js`에서 `apiFetch`를 안 거치는 함수는 8개이고, 인증 헤더가 없는 것은 셋 —
`getStatus`(**보호 라우트 → 깨짐**) · `listNotifications`·`markNotificationsRead`(백엔드가 인증을 걸지 않음 — F09 "모두의 알림" 피드라 정상).
SSE `EventSource`는 헤더를 붙일 수 없지만 `/notifications/stream`도 무인증이라 해당 없음.

## 범위

**포함**
- `getStatus`가 인증 헤더를 싣는다
- 재발 방지: `client.js`의 raw fetch 함수가 인증 헤더를 쓰거나 무인증 예외 목록에 있는지 검사하는 소스 스캔 테스트

**제외**
- 알림 경로(`listNotifications`·`markNotificationsRead`·SSE)에 인증 붙이기 — 백엔드가 무인증이라 지금 깨지지 않는다. 알림을 사용자별로 나누는 건
  F09 "모두의 알림" 결정을 바꾸는 일이라 이 버그 수정 범위가 아니다

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 재발 방지 | `client.js` **소스 스캔 테스트** — raw fetch 함수는 `_authHeaders()`를 쓰거나 무인증 **예외 목록**에 있어야 한다 | 계약 #31은 문서라 이번처럼 조용히 놓친다. 새 raw fetch를 추가할 때 헤더를 붙이거나 "무인증"이라고 명시해야만 통과하게 강제한다 (2026-09-30 사용자 결정) | `getStatus` 단위 테스트만 — 다음 함수에서 같은 누락이 다시 난다 |
| 고치는 방식 | `getStatus`는 raw fetch 그대로 두고 **`_authHeaders()`를 직접 붙인다** | 계약 #31(보호 라우트를 부르는 raw fetch는 헤더를 직접 붙인다) — `getJobInfo` 등과 같은 방식 | **`apiFetch`로 바꾸기** — 폴링마다 `GlobalDim`이 켜진다(계약 #26) · **백엔드 `/status`를 무인증으로** — 인증을 건 REQ-27을 되돌린다 |

## 미결 질문

- [x] **`get_status`의 소유자 확인** — ~~인증은 요구하지만 `ensure_owner_or_admin`을 부르지 않는다~~
      → 2026-09-30 **사실이 아니었다(작성 오류 정정)** — `get_status`는 조회 직후 `ensure_owner_or_admin`을 부른다. 초안 작성 때 함수 첫 몇 줄만 보고
      판단했다. 소유권은 이미 막혀 있어 범위에 넣을 것이 없다
- [x] **재발 방지 장치** — 계약 #31이 있었는데도 놓쳤다. 보호 라우트를 부르는 raw fetch에 인증 헤더가 있는지 **자동으로 검사**할지
      → 2026-09-30 **`client.js` 소스 스캔 테스트를 추가한다**(사용자 결정): raw fetch를 쓰는 함수는 모두 `_authHeaders()`를 쓰거나, 무인증 엔드포인트임을
      밝힌 **예외 목록**에 이름이 있어야 한다. 예외는 지금 `listNotifications`·`markNotificationsRead`(백엔드 무인증 — F09 "모두의 알림")
      · `logout`(백엔드 무인증 — access 쿠키만 지운다. 2026-09-30 /testgen에서 누락 발견, 사용자 승인으로 추가)

## 작업 단계

- [x] **Phase 1** — 프론트: `getStatus`에 인증 헤더
      완료 기준: `getStatus` 요청에 `Authorization` 헤더가 실린다. 기존 raw fetch 성격(`GlobalDim`을 켜지 않음)은 유지한다.
      `client.js`의 raw fetch 함수는 모두 `_authHeaders()`를 쓰거나 무인증 예외 목록(`listNotifications`·`markNotificationsRead`·`logout`)에 있다
      → ✅ 2026-09-30 `2c19016`: B23-01~03 통과(`/testrun` — 틀린 구현 3종 각각에서 해당 케이스만 빨강 확인, B23-03 주석 오인 (a) 수정) · 프론트 206/206 · `npm run build` 성공
- [ ] **Phase 2** — dev 배포 후 확인 (코드 작업 아님)
      완료 기준: 생성 화면에서 PDF 생성 → 상태 폴링이 200으로 완료까지 가고, 결과 화면이 상태를 불러온다

## 검증 계약

> 작성: 2026-09-30 · 스펙: 이 계획서 · 검증: `/testrun B23` · 코드: `frontend/src/api/client.statusAuth.test.js`
> Phase 2(dev 확인)는 코드 작업이 아니라 케이스 없음

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| B23-01 | `getStatus` | 토큰이 있으면 `Authorization: Bearer <토큰>`을 싣는다 | 정상 | PLAN § 작업 단계 — "`getStatus` 요청에 `Authorization` 헤더가 실린다" | 1 | ✅ |
| B23-02 | `getStatus` | 로딩 콜백(`setLoadingCallback`)을 켜지 않는다 — raw fetch 유지 | 회귀 | PLAN § 작업 단계 — "기존 raw fetch 성격(`GlobalDim`을 켜지 않음)은 유지한다" | 1 | ✅ |
| B23-03 | `client.js` 소스 스캔 | raw fetch export 함수는 `_authHeaders()`를 부르거나 무인증 예외(`listNotifications`·`markNotificationsRead`·`logout`)에 있다 | 불변식 | PLAN § 작업 단계 — "`client.js`의 raw fetch 함수는 모두 `_authHeaders()`를 쓰거나 무인증 예외 목록" | 1 | ✅ |

## 제약·함정

- 계약 #26: 상시·배경 경로(폴링)는 `apiFetch`를 거치지 않는다 — 거치면 폴링마다 전역 딤이 번쩍인다
- 계약 #31: 라우터에 인증을 새로 걸 때는 그 엔드포인트를 부르는 raw fetch도 함께 확인한다. 이번이 그 누락이다
- 프론트만 바뀐다 — dev 반영은 `scripts/deploy/frontend-deploy.sh`(백엔드 재배포 불필요)
