# PLAN-B11 · 알림 기준선이 피드 도착 전에 잡혀 새로고침마다 직전 알림이 토스트로 뜬다

> 출처: 2026-08-27 세션(P04 Phase 3 브라우저 실측 중 사용자 발견) · 작성: 2026-08-27 · 상태: ✅ 완료 (Phase 1 2026-08-27 · Phase 2 2026-08-28, 브랜치 `feat/B11-notification-baseline` 푸시·dev 배포됨, main 미머지 · 미결 1건은 후속)

## 배경

dev 사이트를 새로고침하면 **직전 알림이 스낵바로 다시 뜬다.** 벨 뱃지 숫자는 늘지 않는다(서버 `unread_count`라 정상).
사용자 관찰: "새로고침하면 직전 토스트가 뜸 (하지만 벨에 숫자는 증가 안함)".

원인은 기준선을 잡는 **시점**이다. 계약 #27은 "기준선은 렌더 중에 잡는다"고 했고 세 소비처가 그렇게 한다 —
그런데 앱 첫 렌더에서 `notifications`는 **아직 빈 배열**이다(기준선 `GET /api/notifications`가 돌아오기 전).
그래서 기준선 `Set`이 비어 있고, GET이 돌아온 순간 최근 30일치 50건이 전부 "신규"로 보인다.
스낵바는 그중 최신 1건만 띄우도록 돼 있어(2026-08-07 결정) 증상이 "직전 알림 1건"으로만 드러났다 —
**"30일치 스낵바가 쏟아진다"는 사고의 축소판**이고, 계약 #27이 막으려던 바로 그 경우다.

**P04 회귀가 아니다.** 스낵바 코드는 F09 Phase 5(`1fe5e66`) 그대로이고, 폴링 시절에도 첫 폴링은 마운트 뒤에 돌아왔다.
2026-08-10 육안 검증에서는 **보고도 정상으로 오해했다**("방금 끝난 게 떠서 그런 줄") — 절차에 "새로고침 후 토스트 0건"이 없었다.

같은 방식으로 기준선을 잡는 곳이 셋이다 — 증상이 확인된 것은 스낵바 하나이고 나머지는 **검증 대상**이다:

| 소비처 | 기준선 | 빈 기준선일 때 예상 결과 |
|--------|--------|------------------------|
| `NotificationSnackbar` | 첫 렌더 `Set(notifications)` | ✅ 확인됨 — 새로고침마다 최신 1건 토스트 |
| `useNotificationRefresh` | 첫 렌더 `Set(notifications)` | 새로고침마다 목록 재조회 **1회 추가**(GET 도착분이 전부 신규로 보임) |
| `useJobCompletion` | `jobId`가 들어오는 렌더 `Set(notifications)` | **작업 진행 중 새로고침**하면 GET 도착분에 그 job의 옛 알림이 있을 때 즉시 완료 → 편집 화면이면 자동 다운로드까지 튈 수 있다 |

## 범위

**포함**
- 세 소비처가 **기준선 GET이 돌아온 뒤**에만 기준선을 잡도록 한다
- 새로고침 시 토스트 0건 · 목록 재조회 추가 0회 · 진행 중 job이 즉시 완료로 튀지 않음을 테스트로 고정

**제외**
- 알림 저장 구조·피드 API·`unread_count` 계산 — 서버는 맞게 동작하고 있다(뱃지가 안 느는 것이 증거)
- 스낵바 정책(최신 1건만, 6초) — 2026-08-07 결정 유지
- SSE 전달 경로(P04) — 이 버그와 무관하고, `EventSource`가 30초 CONNECTING인 문제는 P04 미결(`: connected`)에 있다

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 결함의 성격 | 기준선 **시점** 버그, P04 회귀 아님 | 스낵바 코드가 F09 Phase 5 그대로. 계약 #27의 "렌더 중"은 **데이터가 있는 렌더**를 전제한 문구였다 | "P04에서 GET 응답 처리가 바뀌었다" — `merge`는 F09 `poll`의 병합 로직을 그대로 옮겼다 |
| 신호 방식 | **(D) `useNotificationsReady()` 훅 추가** — `useNotifications()` 반환 형태 불변, 세 소비처는 `ready`가 참이 되는 렌더에서 기준선을 잡는다 | 표면 계약(P04-26·F09 47건)을 안 깨고 "언제"를 데이터 소유자가 알려준다 (2026-08-27) | (A) 반환값에 `ready` 추가 — P04-26·F09 표면 불변을 깬다 / (B) 응답 항목에 `baseline` 표식 — 데이터에 UI 상태가 섞이고 `Last-Event-ID` 복구분과 구분이 애매 / (C) 첫 비어있지 않은 렌더 추정 — 새 설치에서 첫 알림을 놓친다, 신호가 아니라 추정 |
| 기준선 GET 실패 시 | **실패해도 즉시 `ready`** — 그 뒤 첫 이벤트부터 전부 신규 취급 | 스낵바·재조회·완료 훅이 계속 산다. 복구분이 몰려와도 스낵바 정책(최신 1건)이 이미 상한이고, 실패 자체가 드물다 (2026-08-27) | 성공까지 안 켬 — 재시도 로직 없이는 영영 침묵, "끝났는데 반응 없음"이 조용히 생김 / 1회 재시도 후 켬 — 범위·케이스 증가 |
| 적용 범위 | **세 소비처 모두** `ready` 게이트 — `NotificationSnackbar`·`useNotificationRefresh`·`useJobCompletion` | `useJobCompletion`은 지금 재현되지 않지만(`jobId`가 클릭으로만 들어옴) "생성 중 복원" 류 기능이 들어오면 조용히 깨진다(자동 다운로드 튐). 한 줄 비용, 세 곳이 같은 규칙이면 계약 #27에 적기 쉽다 (2026-08-27) | 재현되는 둘만 — 변경 최소지만 규칙이 두 갈래가 된다 |

## 미결 질문

- [x] **"기준선 GET 도착"을 소비처가 어떻게 아는가.** → **(D)** (2026-08-27, 결정 표). 후보였던 것:
      - **(D) `NotificationContext`에 `useNotificationsReady()` 훅을 추가**하고 세 소비처는 `ready`가 참이 되는 렌더에서
        기준선을 잡는다. `useNotifications()`의 반환 형태 `{notifications, unreadCount}`는 **불변**(P04-26·F09 표면 계약 유지).
        → 권장. 표면을 안 깨고, "언제"를 데이터 소유자가 알려준다.
      - (A) `useNotifications()` 값에 `ready`를 추가 — P04-26(반환 키 고정)과 F09 표면 불변을 깬다. 기각 후보.
      - (B) 기준선 GET 응답 항목에 `baseline: true` 표식 — 데이터에 UI 상태를 섞고, 재연결 `Last-Event-ID` 복구분과 구분이 애매하다.
      - (C) "`notifications`가 처음 비어 있지 않게 되는 렌더"를 기준선으로 — 피드가 진짜 빈 새 설치에서는 첫 실제 알림이
        기준선으로 먹혀 토스트를 한 번 놓친다. 신호가 아니라 추정이다.
- [x] **기준선 GET이 실패하면** `ready`를 언제 켜는가. → **실패해도 즉시 켠다** (2026-08-27, 결정 표). 실패 시 영영 안 켜면 스낵바가 영영 침묵하고, 바로 켜면 그 뒤 첫 이벤트는
      정상 토스트지만 재연결 복구분(`Last-Event-ID`)이 한꺼번에 오면 쏟아진다. F09·P04 계획서 어디에도 답이 없다.
- [x] **`useJobCompletion`의 실제 영향** → **현재 재현 불가** — `exportJobId`(편집)·`refreshing`(작업 화면) 모두 `useState(null/false)`로 시작해 클릭으로만 값이 들어오고 새로고침으로 복원되지 않는다. 그래도 **범위에 포함**(2026-08-27, 결정 표). 원문:
      `jobId`가 기준선 GET 이전 렌더에 들어오는 화면이 있는지(F11 진입 차단·편집 화면 생성 중 복원)를 먼저 확인한다.
      재현되면 B11 범위에서 함께 고치고, 안 되면 "기준선 GET이 항상 먼저 끝난다"를 근거와 함께 적는다.
- [ ] **`ready`가 켜지는 같은 렌더(커밋)에 신규 알림이 함께 실려 오면 기준선인가 신규인가.** 제약("effect로 미루지 않는다")은
      시점만 정했고 이 경우는 안 정했다. 2026-08-27 `/testgen`에서 발견 — 코드로 쓰지 않았다. 실무에선 기준선 GET 응답과 첫 스트림
      이벤트가 같은 커밋에 실릴 확률이 낮아 Phase 1을 막지 않는다.
- [x] 2026-08-10 육안 검증에서 이 증상이 안 잡힌 이유 → **봤는데 정상으로 오해했다**("방금 끝난 게 떠서 그런 줄", 2026-08-27 사용자). 검증 절차에 "새로고침 후 토스트 0건"이 없었던 것이 원인 — Phase 2 육안 확인에 넣었다.

## 작업 단계

- [x] **Phase 1 — 재현 고정 + 수정** ✅ 2026-08-27 (B11 10/10 · 프론트 전체 54/54)
      - 새로고침(마운트 → 기준선 GET 도착) 시나리오를 세 소비처에 대해 테스트로 고정(현재 코드로 실패해야 한다).
      - 미결 1의 결정대로 "기준선 GET 도착" 신호를 만들고 세 소비처의 기준선 시점을 옮긴다.
      완료 기준: `B11-` 케이스 통과 — 새로고침 시 토스트 0건 · 목록 재조회 추가 0회 · 진행 중 job 즉시 완료 없음 ·
      정상 신규 알림은 여전히 토스트/재조회/완료 처리됨(F09-44·45, P04-23, F09 Phase 3·5 회귀 0) · 기준선 GET 실패 시에도 그 뒤 이벤트가 처리됨.

- [x] **Phase 2 — dev 배포 + 육안 확인 + 계약 정정** ✅ 2026-08-28 (Worker 배포 · 새로고침 5회 토스트 0건·`/api/jobs` 1회/회 · CLAUDE.md 계약 #27 정정, `a601f4e`)
      - 프론트만 바뀌므로 Worker 수동 배포(CLAUDE.md "배포 (프론트엔드)").
      - dev에서 새로고침 5회: 토스트 0건, Network의 목록 API 호출 수 변화 없음.
      - 계약 #27의 "기준선은 렌더 중에 잡는다"를 **"기준선 GET이 돌아온 뒤의 렌더 중에"**로 정정.
      완료 기준: 위 육안 확인 기록 + CLAUDE.md 정정.

## 검증 계약

> 작성: 2026-08-27 · 스펙: 이 계획서(§ 결정 · § 작업 단계 Phase 1 · § 제약·함정) · 검증: `/testrun B11`
> 파일: `frontend/src/contexts/NotificationContext.ready.test.jsx` · `components/NotificationSnackbar.ready.test.jsx` ·
> `hooks/useNotificationRefresh.ready.test.jsx` · `hooks/useJobCompletion.ready.test.jsx`
> 테스트가 고정한 인터페이스: `contexts/NotificationContext`가 `useNotificationsReady(): boolean`을 export 한다.

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| B11-01 | `useNotificationsReady()` | 기준선 GET이 resolve되기 전엔 `false`, 된 뒤 `true` | 정상 | PLAN § 결정 — "(D) `useNotificationsReady()` 훅 추가" | 1 | ✅ |
| B11-02 | `useNotificationsReady()` | 기준선 GET이 reject돼도 `true`가 된다 | 예외 | PLAN § 결정 — "실패해도 즉시 `ready`" | 1 | ✅ |
| B11-03 | `NotificationProvider` | GET 실패 뒤 도착한 스트림 이벤트가 목록에 반영된다 | 예외 | PLAN § 작업 단계 Phase 1 — "기준선 GET 실패 시에도 그 뒤 이벤트가 처리됨" | 1 | ✅ |
| B11-10 | `NotificationSnackbar` | `ready=false`·빈 피드로 마운트 → `ready=true`+옛 알림 도착 → 토스트 0건 | 회귀 | PLAN § 작업 단계 Phase 1 — "새로고침 시 토스트 0건" | 1 | ✅ |
| B11-11 | `NotificationSnackbar` | `ready` 이후 도착한 신규 알림은 토스트가 뜬다 | 정상 | PLAN § 작업 단계 Phase 1 — "정상 신규 알림은 여전히 토스트/재조회/완료 처리됨" | 1 | ✅ |
| B11-12 | `NotificationSnackbar` | `ready` 이후 여러 건이 한꺼번에 오면 최신 1건 토스트 | 불변식 | PLAN § 제약·함정 — "재연결 복구분(`Last-Event-ID`)은 **기준선이 아니라 신규**다" | 1 | ✅ |
| B11-13 | `useNotificationRefresh` | `ready=false` 마운트 → `ready=true`+옛 알림 → `onFresh` 0회 | 회귀 | PLAN § 작업 단계 Phase 1 — "목록 재조회 추가 0회" | 1 | ✅ |
| B11-14 | `useNotificationRefresh` | `ready` 이후 신규 알림 → `onFresh` 1회 | 정상 | PLAN § 작업 단계 Phase 1 — "정상 신규 알림은 여전히 토스트/재조회/완료 처리됨" | 1 | ✅ |
| B11-15 | `useJobCompletion` | `ready=false`에 `jobId` 감시 시작 → `ready=true`+그 job의 옛 알림 → `onDone` 0회 | 회귀 | PLAN § 작업 단계 Phase 1 — "진행 중 job 즉시 완료 없음" | 1 | ✅ |
| B11-16 | `useJobCompletion` | `ready` 이후 그 job의 신규 알림 → `onDone` 1회 | 정상 | PLAN § 작업 단계 Phase 1 — "정상 신규 알림은 여전히 토스트/재조회/완료 처리됨" | 1 | ✅ |

`useNotifications()` 반환 형태 불변은 **P04-26**이 이미 고정한다 — 중복 작성하지 않는다.

## 제약·함정

- **`useNotifications()`의 반환 형태를 바꾸지 않는다** — P04-26이 키를 글자 그대로 고정하고, F09 47건이 그 표면 위에 있다.
  신호가 필요하면 **훅을 하나 더** 낸다(미결 1의 D안).
- **기준선을 effect로 미루지 않는다**(계약 #27) — 시점을 "GET 뒤"로 옮기더라도 그 렌더 안에서 잡는다. effect로 미루면
  같은 커밋에 실린 첫 신규 알림이 이미 처리된다.
- **테스트 무대**: jsdom에 `EventSource`가 없다 — F09 잔여 테스트처럼 `FakeEventSource` 스텁을 두고, 기준선 GET은
  `listNotifications` mock의 **resolve 시점을 제어**해야 "마운트 → GET 도착" 순서를 재현할 수 있다(즉시 resolve면 버그가 안 보인다).
- **기존 F09 소비처 테스트 3개(스낵바·`useNotificationRefresh`·`useJobCompletion`)는 `contexts/NotificationContext`를
  `useNotifications`만으로 mock한다.** 소비처가 `useNotificationsReady`를 import하는 순간 그 mock에서 `undefined`가 돼
  **F09 케이스가 통째로 죽는다** — 구현 결함이 아니라 무대다. `/testrun`이 (a)로 mock에 `useNotificationsReady: () => true`를
  보강한다(2026-08-27 `/testgen`에서 예고).
- **`waitFor` 금지**(계약 #25) — 타이머를 단언하는 케이스는 없지만 스낵바 6초 자동 닫힘과 섞이면 헷갈린다. `act` 플러시로 기다린다.
- 재연결 복구분(`Last-Event-ID`)은 **기준선이 아니라 신규**다 — 끊긴 사이 끝난 작업은 토스트가 떠야 맞다. "GET 도착 뒤에 온 것은
  전부 신규"라는 단순한 규칙이 이걸 자연스럽게 만족한다. 복구분을 따로 걸러내려 하지 말 것.
