# PLAN-C09 · 알림 경로 후속 묶음 — 실패 문구 단일 출처 · `kind` 필터 · 딤 회귀 케이스 · `: connected` 선발송

> 출처: 2026-08-28 세션(TODO 1단계 미결 결정 6건 → 코드 작업이 생긴 4건) · 작성: 2026-08-28 · 상태: ✅ 완료 (Phase 1·2 2026-08-28 · PR #4 main 머지 2026-08-28 `91a911a` · 미결 0건 · Phase 1 육안 1건 미확인)

## 배경

F09(완료 알림)·P04(SSE)·B11(기준선)이 닫히면서 계획서 미결로 남아 있던 것들을 2026-08-28에 전부 결정했다.
그중 코드가 바뀌는 것이 넷인데, 전부 **알림 경로의 소규모 변경**이라 REQ 하나로 묶는다. 각각 놔두면 생기는 문제:

1. **실패 문구가 두 곳에서 갈린다** — 재감지 실패 시 서버 알림은 `"문항 감지에 실패했습니다."`를 `message`로 보내는데
   `work.jsx`는 `onError`에서 자체 문자열 `"재감지에 실패했습니다."`를 쓴다. 벨 팝오버와 화면 배너가 **같은 사건에 다른 문장**을
   보여준다. 계약 #12(라벨 단일 출처)와 같은 계열의 분기.
2. **감지 완료에 생성 이력 목록이 재조회된다** — `useNotificationRefresh`가 알림 종류를 안 보고 "신규가 있으면 재조회"라서
   분석 목록·생성 이력 목록 둘 다 남의 종류 알림에도 목록 API(페이지네이션 + 썸네일)를 돈다. 계약 #27이 막으려던 낭비의 잔여분.
3. **계약 #26(배경 경로는 `apiFetch`를 안 탄다)에 회귀 케이스가 없다** — P04 `/testgen`에서 "로딩 카운터가 노출돼 있지 않아
   측정 방법이 없다"로 미결이 됐던 것. 규칙만 있고 테스트가 없으면 관례를 따르는 리팩터링(`fetch` → `apiFetch`)에 조용히 깨진다.
4. **`EventSource`가 최대 30초 `CONNECTING`으로 보인다** — edge가 첫 바이트까지 응답 헤더를 붙잡아, 첫 keepalive(30s)가
   나가기 전까지 브라우저가 연결을 열지 못한다. 그 사이 알림이 나면 `Last-Event-ID` 복구로 결국 오지만 지연이 최대 30s다.
   구독 직후 코멘트 한 줄을 흘리면 즉시 열린다(P04 실측 2026-08-27).

## 범위

**포함**
- 재감지·생성 실패 화면 문구를 **알림 `message`**로 대체 (`useJobCompletion`의 `onError(notification)`가 이미 알림을 넘긴다)
- `useNotificationRefresh(onFresh, { kind })` — 지정한 `kind`의 신규 알림만 `onFresh`. 분석 목록은 `detection`, 생성 이력은 `export`
- 계약 #26 회귀 케이스 — 스트림 이벤트 뒤 `GlobalDim`이 DOM에 없음 (Provider + `GlobalDim`을 함께 렌더)
- `event_stream()` 구독 직후 `: connected\n\n` 선발송 + dev 실측(`EventSource.readyState`가 즉시 `OPEN`)

**제외**
- **트리거 HTTP 실패**(`refreshJobQuestions` 자체의 reject) 문구 — 알림이 아니라 즉시 응답이라 `message`가 없다. 지금대로 둔다
  (2026-08-28 결정 옵션에서 "트리거 실패도 서버 detail 사용"안을 고르지 않았다)
- 스낵바(`NotificationSnackbar`)는 `kind`로 가리지 않는다 — 스낵바는 "누구의 것이든 끝났다"가 목적이고, F09 Phase 5 정책(최신 1건) 유지
- P04 후속 성능 2건(발행 전 서버 작업 ~6s · 첫 진입 GET 3.8s)과 콜드 원인 조사 — 별도 `P05`로. 이 묶음은 동작 변경만
- 미리보기 URL 캐시 키 분리(R2 CORS) — 알림 경로가 아니다. TODO 2단계 마지막 항목으로 별도
- `useNotifications()` 반환 형태·`client.js` 표면 — 불변(P04-26 · 계약 #26 결정 "카운터 노출 안 함")

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 실패 문구 출처 | **서버 알림 `message` 단일 출처** — 화면은 `onError(n)`의 `n.message`를 그대로 표시 | 계약 #12와 같은 원칙. 문구 변경이 백엔드 한 곳에서 끝난다 (2026-08-28) | 현재 유지(각자 문구) — 같은 사건에 두 문장 / 트리거 실패도 서버 detail — 범위 가장 넓고 알림 아님 |
| `kind` 필터 | **가려 받는다** — 훅 옵션 `{ kind }`, 미지정이면 종전대로 전부 | 목록 2개뿐이라 낭비는 작지만 계약 #27 취지(불필요 재조회 억제)와 일치, 소 규모 (2026-08-28) | 안 가림(현재 유지) — 낭비 소량이지만 규칙이 "신규면 무조건"으로 남음 |
| 딤 측정 방법 | **`GlobalDim` 렌더 여부** — 테스트가 Provider와 `GlobalDim`을 같이 그리고 스트림 이벤트 뒤 `.global-dim`이 없음을 단언 | 표면 변경 0. 사용자가 보는 그것(딤)을 직접 잰다 (2026-08-28) | 테스트용 카운터 export — 표면 변경 / 케이스 안 씀 — 문서 규칙만으론 리팩터링에 조용히 깨짐 |
| `: connected` 선발송 | **넣는다** — `broker.subscribe()` 직후, `Last-Event-ID` 재전송보다 **앞**에 | 목적이 "연결을 즉시 연다"이므로 가장 앞. 비용 0, 백엔드 한 줄. 코멘트 줄이라 `EventSource`는 이벤트로 취급하지 않는다 (P04 미결, 2026-08-28 TODO 2단계 채택) | 재전송 뒤에 보냄 — 복구분이 클 때 그만큼 열림이 늦어짐 / 안 넣음 — 최대 30s CONNECTING 유지 |

## 미결 질문

- [x] **편집 화면(`editor/index.jsx`)의 생성 실패 `onError` 문구** → 확인 결과 자체 문자열 `"PDF 생성에 실패했습니다."`가 있다(서버는
      `"문제집 생성에 실패했습니다."`). **같은 결정 적용 — 두 화면 모두 `n.message`.** (2026-08-28 계획 작성 중 확인)

(미결 0건)

## 작업 단계

- [x] **Phase 1 — 프론트 (실패 문구 · `kind` 필터 · 딤 케이스)**
      - `work.jsx`·`editor/index.jsx` `onError`가 `n.message`를 표시
      - `useNotificationRefresh(onFresh, { kind })` + 두 소비처에 각각 `detection`/`export` 지정
      - 계약 #26 회귀 케이스 추가
      완료 기준: `C09-` 프론트 케이스 통과 + 기존 F09·P04·B11 케이스 회귀 0 (`npm test` 전체 녹색).
      `useNotifications()` 반환 키·`client.js` export 목록 불변.
      **육안**(2026-08-28 `/testgen` 결정 — 페이지 렌더 테스트를 만들지 않는다): dev에서 재감지 실패를 유발해 화면 배너 문구가
      알림 `message`와 같음을 확인(편집 화면 생성 실패도 동일). 훅이 알림 객체를 넘기는 것까지는 C09-05가 잰다.
      ⚠️ **이 육안 항목은 2026-08-28 시점 미확인이다** — 실패를 인위적으로 유발해야 해서 dev 실측(성공 경로)에 넣지 못했다.
      케이스 7건은 녹색. 화면 표시 자체는 미검증으로 남는다.

- [x] **Phase 2 — 백엔드 `: connected` 선발송 + dev 실측**
      - `event_stream()` 구독 직후 `": connected\n\n"` 1회
      - dev 배포(백엔드 이미지 + desired 1) 후 브라우저 콘솔에서 `new EventSource(...).readyState`가 **2초 안에 `OPEN(1)`**
        (종전 실측: 첫 keepalive까지 최대 30s `CONNECTING`). 확인 뒤 desired 0.
      완료 기준: `C09-` 백엔드 케이스 통과(첫 청크가 `: connected`, `Last-Event-ID` 복구분은 그 뒤) + P04-01~08 회귀 0
      (**P04-08은 이 계획서 결정으로 갱신됨** — 첫 청크 `connected`·둘째 `keepalive`·둘 다 `data` 없음, 2026-08-28) + 위 실측 기록.
      ✅ 2026-08-28 충족 — 백엔드 34/34. dev 실측: raw 첫 청크 107ms `": connected\n\n"` · warm `EventSource.onopen`
      762·324·250·196·267ms(전부 2초 내). **콜드 태스크 직후 2회는 ~31s** — heartbeat 주기와 겹치는 edge/터널 warm-up으로
      보이며 P04 미결 ①과 같은 계열, TODO 2단계 "콜드 원인 조사"로 넘겼다.
      예상보다 넓게 깨진 것: P04-07 하나를 예고했으나 같은 수집기를 쓰는 **P04-05·06·10까지 넷**이 깨졌다((a)로 헬퍼 도입).

## 검증 계약

> 작성: 2026-08-28 · 스펙: 이 계획서(§ 범위 · § 결정 · § 작업 단계 · § 제약·함정) · 검증: `/testrun C09`
> 파일: `frontend/src/hooks/useNotificationRefresh.kind.test.jsx` · `hooks/useJobCompletion.message.test.jsx` ·
> `contexts/NotificationContext.dim.test.jsx` · `backend/tests/test_notification_connected.py` (+ `test_notification_stream.py`의 P04-08 갱신)
> 테스트가 고정한 인터페이스: `useNotificationRefresh(onFresh, { kind })` · `event_stream()`의 첫 청크 `": connected\n\n"`.
> 실패 문구의 **화면 표시**는 케이스가 아니라 Phase 1 육안 항목이다(2026-08-28 결정 — 페이지 렌더 무대를 만들지 않는다).

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| C09-01 | `useNotificationRefresh` | `{kind:'detection'}`일 때 `export` 신규 알림 → `onFresh` 0회 | 정상 | PLAN § 범위 — "지정한 `kind`의 신규 알림만 `onFresh`" | 1 | ✅ |
| C09-02 | `useNotificationRefresh` | `{kind:'detection'}`일 때 `detection` 신규 → `onFresh` 1회 | 정상 | PLAN § 범위 — "지정한 `kind`의 신규 알림만 `onFresh`" | 1 | ✅ |
| C09-03 | `useNotificationRefresh` | `kind` 미지정 → 어느 종류든 `onFresh` 1회 | 불변식 | PLAN § 결정 — "미지정이면 종전대로 전부" | 1 | ✅ |
| C09-04 | `useNotificationRefresh` | 여러 건 중 일치 1건 → 1회 · 불일치만 → 0회 | 경계 | PLAN § 범위 — "지정한 `kind`의 신규 알림만 `onFresh`" | 1 | ✅ |
| C09-05 | `useJobCompletion` | `onError`에 알림 객체(`message` 포함)가 그대로 넘어온다 | 정상 | PLAN § 범위 — "`useJobCompletion`의 `onError(notification)`가 이미 알림을 넘긴다" | 1 | ✅ |
| C09-10 | `NotificationProvider`+`GlobalDim` | 기준선 GET·스트림 이벤트 뒤 `.global-dim`이 DOM에 없다 (실제 `client.js`, `fetch` 스텁) | 회귀 | PLAN § 결정 — "스트림 이벤트 뒤 `.global-dim`이 없음을 단언" | 1 | ✅ |
| C09-11 | 同 (양성 대조) | 같은 무대에서 `apiFetch` 경유 GET을 부르면 딤이 뜬다 | 회귀 | PLAN § 제약·함정 — "통과시키려고 `GlobalDim`" | 1 | ✅ |
| C09-20 | `event_stream(None)` | 첫 청크가 `: connected` 코멘트 | 정상 | PLAN § 작업 단계 Phase 2 — "구독 직후 `": connected\n\n"` 1회" | 2 | ✅ |
| C09-21 | `event_stream(Last-Event-ID)` | 첫 청크 `connected`, 둘째부터 복구분 | 정상 | PLAN § 결정 — "`Last-Event-ID` 재전송보다 **앞**에" | 2 | ✅ |
| C09-22 | `event_stream(None)` | `connected`는 1회뿐 — 둘째 청크는 `keepalive` | 불변식 | PLAN § 작업 단계 Phase 2 — "구독 직후 `": connected\n\n"` 1회" | 2 | ✅ |

## 제약·함정

- **`useNotifications()` 반환 형태 불변**(P04-26 · F09 47건). `kind` 필터는 훅 옵션으로만 — 컨텍스트를 건드리지 않는다.
- **`client.js`에 export를 추가하지 않는다** — 딤 측정은 `GlobalDim` DOM으로. 카운터 노출은 2026-08-28 결정에서 기각.
- **알림 스키마의 `kind`는 `detection` | `export`**(`NotificationKind`) — `notification_service`가 저장 시 항상 쓴다(F09 Phase 1부터).
  `kind` 없는 항목은 없으므로 훅은 단순 일치 비교로 충분하다.
- **테스트 무대**: 기존 F09 소비처 테스트는 `contexts/NotificationContext`를 통째로 mock한다(B11에서 13건이 죽은 그 자리). 훅 시그니처에
  옵션을 **추가**하는 것은 그 mock을 깨지 않지만, 소비처 페이지 테스트가 없으므로 `kind` 동작은 훅 단위 테스트로 잡는다.
- **P04-07(`Last-Event-ID` 복구분이 "첫머리")·P04-08(첫 청크 코멘트 == `keepalive`)** — `: connected`가 맨 앞에 오면 **둘 다 첫 청크
  단언이 깨진다.** 스펙 변경(c)이므로 2026-08-28 `/testgen`에서 **P04-08은 이 계획서 결정을 근거로 갱신**했고(2청크 `[connected, keepalive]`),
  P04-07은 `_collect`가 코멘트를 건너뛰지 않으므로 `/testrun`이 (a)로 수집 개수를 조정한다(단언 `["job-after"]`는 유지).
- **`_setLoading`을 도는 raw `fetch`가 하나라도 생기면 딤 케이스가 빨간불** — 그것이 이 케이스의 목적이다. 통과시키려고 `GlobalDim`
  렌더를 빼지 말 것.
- **실패 배너는 `severity === 'error'`인 알림에서만** — `useJobCompletion`이 이미 그 분기로 `onError`를 부른다. 화면이 다시 판정하지 않는다.
