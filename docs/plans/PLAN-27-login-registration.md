# PLAN-27 · 로그인/회원가입 (인증 + CORS 제한 + D07 잔여 슬롯)

> 출처: 2026-09-14 세션(AskUserQuestion 4건 + 미결 7건 확정 라운드 2건) + 과거 세션 전수 검색(REQ-27 관련 언급 9건, 실질 논의는 이번이 처음) · 작성: 2026-09-14 · 상태: 🟡 진행 — Phase 4 완료, 미결 0건

## 배경

인증·인가가 전무하다. CORS는 `*`로 전체 허용돼 있고, 모든 job·문제집·표지·각주·워터마크·템플릿을
누구나 조회·수정·삭제할 수 있다. 사용자 개념 자체가 없어 "내 것"이라는 경계가 없다.

D07 리디자인 때 프론트에는 이미 자리만 만들어 뒀다 — `auth-layout`이 라우터에 연결 안 된 채
존재하고, `AppbarActionItems`의 `ProfileMenu`(account-popover)도 알맹이 없이 슬롯만 있다
(D07 스펙 §6). 백엔드는 스토리지 팩토리(local/s3)에 사용자 개념이 전혀 없다.

> ⚠️ **정정(2026-09-18, Phase 4 착수 시 실측)** — 위 문단은 D07 스펙(원본 Minimal 템플릿
> 문서)을 그대로 옮긴 것이었는데 **실제 코드에는 `auth-layout`도 `ProfileMenu`도 파일 자체가
> 없다.** 남아 있는 건 `layouts/dashboard/layout.tsx:67`의 주석 한 줄
> (`// 추가 예정 기능 자리 — 계정(REQ-27)`)뿐이다. 즉 Phase 4·5는 "슬롯 연결"이 아니라
> **로그인/회원가입 화면·라우트·인증 상태·가드를 처음부터 새로 만드는 작업**이다. 아래
> 결정 표의 파일 위치·라우트 경로·상태 관리·가드 항목이 이 정정 때문에 새로 추가됐다.

## 범위

**포함**
- 백엔드: 사용자 등록·로그인(JWT access 1시간 + refresh 7일, rolling refresh) API
- 백엔드: `admin`/`user` 역할 구분 — `admin`은 모든 계정의 데이터를 조회 가능
- 백엔드: 기존 job·문제집·표지·각주·워터마크·템플릿 API에 인증 요구(보호 라우트) + 소유권(`owner_id` 메타데이터 필드) 도입
- 백엔드: 로그인 없이 쌓인 기존 데이터(job·문제집·표지·각주·워터마크·템플릿 전부)를 관리자(본인) 계정 소유로 일괄 이관하는 마이그레이션
- 백엔드: CORS를 프론트 도메인(dev 배포 도메인 + 로컬 `localhost:5173`)으로 제한(`*` 제거)
- 프론트: `auth-layout` 라우터 연결 + 로그인/회원가입 화면 알맹이 구현
- 프론트: 토큰을 `localStorage`에 저장, 만료 시 자동 갱신, `Authorization` 헤더로 부착 + 인증 가드(미인증 시 로그인으로 리다이렉트)
- 프론트: `account-popover`(`ProfileMenu`) 슬롯에 실제 로그인 사용자 정보 연결

**제외**
- REQ-28 공유 기능(계정 간 분석 파일·문제집 공유) — "27 뒤에 별도 판단"이라는 기존 TODO 순서를 그대로 따른다. 이번 REQ는 사용자별 소유권 분리까지만이고, 소유권을 넘어 공유하는 기능은 다루지 않는다
- 이메일 인증(가입 확인 메일) — 사용자 결정으로 이번 범위에서 제외, 나중에 별도 도입
- 비밀번호 재설정(분실) 플로우 — 이번 대화에서 언급되지 않아 제외. 필요하면 후속 REQ

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 인증 방식 | JWT(access+refresh 토큰) | → [ADR-0005](../adr/0005-jwt-auth.md) | ↑ |
| 가입 경로 | 자체 이메일+비밀번호 가입(공개) | 사용자 선택 | 초대 전용 발급 / OAuth 연동 |
| 기존 데이터 귀속 | 로그인 이전에 쌓인 job·문제집·표지 등 기존 자산은 전부 관리자(본인) 계정 소유로 일괄 이관 | 사용자 선택 — 마이그레이션 스크립트 1회 실행 | 소유자 없음으로 유지(공용 데이터) |
| REQ-27 범위 | 인증 · CORS 제한 · D07 잔여 슬롯(auth-layout·account-popover)을 한 번에 닫는다 | 사용자 선택 — TODO 5단계 원문("REQ-27 + D07 마무리 + CORS 제한")을 그대로 따름 | 인증 핵심만 먼저 닫고 CORS·D07 슬롯은 후속 Phase/별도 커밋으로 분리 |
| 신규 가입자의 데이터 소유권 | 로그인 이후 새로 만드는 job·문제집 등은 만든 사용자 본인 소유로 귀속(기본 전제) | REQ-27이 "사용자·세션·보호 라우트·스토리지 사용자 분리"를 명시한 TODO 5단계 항목 자체의 목적 — 공개 가입을 열면서 소유권 분리가 없으면 이 REQ의 존재 이유가 성립하지 않는다 | — (대화에서 반박된 적 없음, 범위의 자명한 전제로 판단) |
| refresh 토큰 저장 위치 | 프론트 `localStorage`, `Authorization` 헤더로 부착 | 사용자 선택 — CORS에 `credentials`(쿠키) 허용을 안 얹어도 돼 설계가 단순해진다 | httpOnly 쿠키(`SameSite=None; Secure` + CORS credentials 허용 필요) |
| 기존 데이터 이관 범위 | job·문제집·표지·각주·워터마크·템플릿 **전부**를 관리자 계정으로 이관 | 사용자 선택("응") | 일부만 이관 |
| 사용자 분리 방식 | **메타데이터 필드** — 기존 경로·URL 그대로 두고 각 JSON 메타에 `owner_id` 추가, 조회 시 필터링 | 사용자 선택(추천안 채택) — 관리자 전체 조회가 필터 생략만으로 되고, 기존 데이터 이관이 파일 이동 없이 필드 기입만으로 끝난다. 이 레포의 결정적 URL 계약(#15 등)을 건드리지 않는다 | 경로 분리(`user_id`를 경로에 포함) — 물리적 격리는 확실하나 기존 URL 패턴 전부를 고쳐야 하고 관리자 전체 조회에 디렉토리 순회 로직이 새로 필요 |
| 이메일 인증 | 이번 범위에서 미도입, 나중에 별도 도입 | 사용자 선택 | 가입 시 확인 메일 발송 |
| 토큰 수명 | access 1시간, refresh 7일, rolling refresh(갱신 때마다 refresh도 재발급해 만료 연장) | 사용자 선택 | 고정 만료(rolling 없음) |
| 관리자 역할 | `role` 개념 도입 — `admin`은 모든 계정 데이터 조회 가능 | 사용자 선택("관리자 계정이면 모든 계정껄 다 볼 수 있어야 함") | 역할 없이 계정 소유물만 접근 |
| CORS 허용 도메인 | dev 프론트 도메인 + 로컬 개발(`localhost:5173`) 포함 | 사용자 선택 | 로컬 제외, dev/prod만 |
| **(Phase 4, 2026-09-18)** 로그인/회원가입 화면 파일 위치·라우트 | `pages/login/index.jsx` · `pages/signup/index.jsx`, 라우트 `/login` · `/signup`(`paths.ts`에 추가) | 사용자 선택 — 기존 `pages/<이름>/index.jsx` 관례(analysis·editor·format·history)와 동일하게 맞춘다 | `pages/auth/login.jsx` + `pages/auth/signup.jsx` 한 폴더 묶음 — 폴더 1개=화면 1개인 기존 관례와 어긋난다 |
| **(Phase 4)** 인증 상태 관리 | `contexts/AuthContext.jsx` — `NotificationProvider`와 같은 Provider 패턴, `App.tsx`에서 함께 감싼다 | 사용자 선택 — `NotificationContext` 선례를 그대로 따른다(리렌더·소비처 다건이라 Context가 자연스럽다) | Context 없이 `api/client.js` 모듈 레벨 상태 + `hooks/useAuth.js` — `_activeCount` 패턴과 같지만 React 트리와 분리돼 리렌더 연동이 훅 쪽에 따로 필요 |
| **(Phase 4)** 인증 가드 위치 | 라우터 최상위에서 `DashboardLayout`을 감싸는 `RequireAuth` 래퍼 컴포넌트(`/login`·`/signup`은 감싸지 않음) | 사용자 선택 — 4개 화면(analysis·editor·format·history) 전부를 한곳에서 막을 수 있다 | `useAnalysisEntryGuard`처럼 화면마다 훅 추가 — REQ-F11 선례와 같은 모양이지만 화면 4곳에 중복해서 넣어야 한다 |
| **(Phase 4)** access token 자동 갱신 트리거 | `apiFetch`가 401 응답을 받으면 refresh를 1회 시도하고 원 요청을 재시도(reactive) | 사용자 선택 — 타이머 관리가 필요 없고 진입점이 `api/client.js`의 `apiFetch` 하나뿐이라 기존 로딩 상태 처리(`_setLoading`)와 같은 자리에 넣을 수 있다 | `exp` 기반 선행 타이머로 만료 전에 미리 갱신 — 더 매끄럽지만 타이머 생성·해제 관리가 새로 필요하고, 계약 #25가 지적한 "waitFor가 setInterval을 쓰면 타이머 스파이 테스트와 충돌"과 같은 계열 함정을 새로 들일 수 있다 |
| **(Phase 4)** 회원가입 직후 동작 | signup(토큰 미반환, `{user_id, email, role}`만) 성공 직후 같은 자격증명으로 `POST /api/auth/login`을 자동 호출해 토큰을 받고 바로 보호된 화면으로 진입 | 사용자 선택 — 사용자가 방금 입력한 비밀번호를 다시 치지 않아도 된다 | 가입 후 `/login`으로 리다이렉트만 하고 별도 로그인 입력을 요구 — 구현은 더 간단하지만 이중 입력이 생긴다 |

## 미결 질문

(없음 — 착수 전 미결 0건)

## 작업 단계

- [x] **Phase 1** — 사용자 모델 + 회원가입/로그인/토큰 발급(백엔드) — ✅ 2026-09-14, 케이스 11/11
      완료 기준: 신규 이메일로 가입 → 로그인 → access(1시간)/refresh(7일) 토큰 발급까지 API로 확인됨. `role`(admin/user) 필드가 사용자 모델에 있고 회원가입 기본값은 `user`.
- [x] **Phase 2** — 기존 API 보호 + 소유권(`owner_id`) 도입 + 기존 데이터 관리자 계정 이관 — ✅ 2026-09-15, 케이스 30/30 (`/testrun` 2026-09-16 확인), 회귀 없음(백엔드 전체 163/163)
      완료 기준: 인증 없이 기존 job/workbook/cover/footnote/watermark/template API 호출 시 401. `user` 역할은 본인 소유 데이터만 조회되고 타인 소유물 접근 시 403/404(→404로 고정, 위 Phase 2 메모 참조). `admin` 역할은 전체 조회 가능. 마이그레이션 스크립트 실행 후 기존 데이터(6종 전부) 각 메타에 `owner_id`(관리자 계정)가 채워짐.
- [x] **Phase 3** — CORS 제한 — ✅ 2026-09-16, 케이스 4/4 (`/testrun` 확인), 회귀 없음(백엔드 전체 167/167)
      완료 기준: dev 프론트 도메인·`localhost:5173` 외 origin에서 API 호출 시 CORS로 차단됨.
- [x] **Phase 4** — 프론트 로그인/회원가입 화면 + 토큰 저장·갱신 + 인증 가드 — ✅ 2026-09-18, 케이스 18/18 (`/testrun` 확인), 회귀 없음(백엔드 전체 167/167 · 프론트 전체 180/180)
      완료 기준: `pages/login`·`pages/signup`(라우트 `/login`·`/signup`)에서 회원가입·로그인이 동작하고,
      `RequireAuth`가 미인증 접근을 `/login`으로 리다이렉트하며, `contexts/AuthContext`가 로그인 상태를
      들고 `localStorage` 토큰으로 보호된 4개 화면(analysis·editor·format·history)이 정상 동작하고,
      `apiFetch`가 401 응답에 refresh 1회 재시도로 access를 자동 갱신함. (선행: Phase 1·2 완료.
      위 "정정" 메모대로 `auth-layout` 슬롯 연결이 아니라 신규 구현이다)
- [ ] **Phase 5** — `account-popover` 실 데이터 연결
      완료 기준: 헤더의 프로필 메뉴에 실제 로그인 사용자 정보(이메일 등)가 표시되고 로그아웃이 동작함. (선행: Phase 4 완료)

## 검증 계약

> 작성: 2026-09-14 · 스펙: 없음(계획서 § 결정·작업 단계 완료 기준이 1차 소스) · 검증: `/testrun 27`
>
> API 경로·응답 봉투·02·03·04·08·09·11의 REST 관례는 계획서가 정하지 않아
> **이 검증 계약이 고정한다**(REQ-29 각주·워터마크 CRUD 선례와 동일한 방식):
> `POST /api/auth/signup` → 201 `{user_id, email, role}` ·
> `POST /api/auth/login` → 200 `{access_token, refresh_token, token_type}` ·
> `POST /api/auth/refresh` → 200 `{access_token, refresh_token}`.
> 사용자 저장 경로는 `users/{user_id}.json`(표지·각주·워터마크와 같은 파일 기반 패턴)으로 고정.
>
> **Phase 2(2026-09-15 추가)** — 완료 기준이 안 정한 것들:
> 타인 소유물 접근 시 상태 코드는 **404**로 고정(계획서가 "403/404" 병기 — 존재 자체를 숨기는
> 쪽으로 결정). 마이그레이션 진입점은
> `app.services.migration_service.backfill_owner_id(admin_user_id: str) -> dict`로 고정
> (계획서는 "스크립트 실행"이라고만 명시, 콜러블 시그니처는 미지정 — CLI는 이를 감싸는
> 얇은 래퍼로 구현될 것을 전제한다).
>
> **Phase 3(2026-09-16 추가)** — 대상 엔드포인트는 `GET /health`로 고정(인증·스토리지
> 격리와 무관하게 CORS 미들웨어 자체만 검증). Starlette `CORSMiddleware` 소스 확인 —
> 허용 안 된 origin의 preflight(OPTIONS)는 `400 "Disallowed CORS origin"`, 단순 GET은
> 200으로 통과하되 `Access-Control-Allow-Origin` 헤더가 붙지 않는다(둘 다 케이스로 분리).
>
> **Phase 4(2026-09-18 추가)** — 계획서가 안 정한 프론트 구조는 이 검증 계약이 관례로 고정한다
> (REQ-30 client 함수 시그니처 선례와 같은 방식): `api/client.js`에 `signup(email, password)`·
> `login(email, password)` 신설, `localStorage` 키는 `access_token`·`refresh_token`.
> `contexts/AuthContext.jsx`의 `useAuth()`는 `{ isAuthenticated, userEmail, login, signup }`을
> 반환한다(`logout`은 Phase 5 완료 기준에만 있어 이번엔 안 만든다). `components/RequireAuth.jsx`는
> 기본 export, 미인증 시 `paths.login`으로 리다이렉트. 로그인 응답에는 이메일이 없으므로
> `userEmail`은 로그인 폼에 입력한 값을 그대로 쓴다. `lib/utils.ts`의 `getItemFromStore` 등은
> 쓰지 않는다 — 아무 데도 안 쓰이는 미사용 템플릿 코드라(grep 0건) `auth-layout`과 같은 함정을
> 또 만들 수 있어 raw `localStorage` 호출을 그대로 쓴다. `logout()` 동작과 로그인/회원가입 에러
> 메시지의 정확한 문구는 완료 기준 밖이라 케이스에서 뺐다.

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| 27-01 | POST /api/auth/signup | 신규 이메일+비밀번호 가입 → 201, user_id 반환, role 기본값 "user" | 정상 | PLAN § Phase 1 완료 기준 — "`role`(admin/user) 필드가 사용자 모델에 있고 회원가입 기본값은 `user`" | 1 | ✅ |
| 27-02 | POST /api/auth/signup | 가입 응답에 비밀번호(평문·해시 어느 쪽도)가 노출되지 않는다 | 예외 | 근거 문서 없음 — 검증 계약이 관례로 고정 | 1 | ✅ |
| 27-03 | POST /api/auth/signup | 저장된 비밀번호는 평문이 아니다(스토리지 파일 직접 확인) | 불변식 | 근거 문서 없음 — 검증 계약이 관례로 고정 | 1 | ✅ |
| 27-04 | POST /api/auth/signup | 이미 가입된 이메일로 재가입 시 409 | 예외 | 근거 문서 없음 — 검증 계약이 관례로 고정(각주·워터마크 CRUD 선례) | 1 | ✅ |
| 27-05 | POST /api/auth/login | 가입한 이메일+올바른 비밀번호로 로그인 → 200, access_token·refresh_token 반환 | 정상 | PLAN § Phase 1 완료 기준 — "로그인 → access/refresh 토큰 발급까지 API로 확인됨" | 1 | ✅ |
| 27-06 | POST /api/auth/login | access_token의 exp가 발급 시각 기준 약 1시간 후 | 정상 | PLAN § 결정 — "access 1시간" | 1 | ✅ |
| 27-07 | POST /api/auth/login | refresh_token의 exp가 발급 시각 기준 약 7일 후 | 정상 | PLAN § 결정 — "refresh 7일" | 1 | ✅ |
| 27-08 | POST /api/auth/login | 존재하지 않는 이메일로 로그인 시 401 | 예외 | 근거 문서 없음 — 검증 계약이 관례로 고정 | 1 | ✅ |
| 27-09 | POST /api/auth/login | 틀린 비밀번호로 로그인 시 401 | 예외 | 근거 문서 없음 — 검증 계약이 관례로 고정 | 1 | ✅ |
| 27-10 | POST /api/auth/refresh | 유효한 refresh_token으로 갱신 시 새 access_token과 새 refresh_token을 받는다(rolling) | 정상 | PLAN § 결정 — "rolling refresh(갱신 때마다 refresh도 재발급해 만료 연장)" | 1 | ✅ |
| 27-11 | POST /api/auth/refresh | 위조되거나 만료된 refresh_token으로 갱신 시 401 | 예외 | 근거 문서 없음 — 검증 계약이 관례로 고정 | 1 | ✅ |
| 27-12~17 | GET /api/{jobs\|workbooks\|covers\|footnotes\|watermarks\|templates} | 인증 없이 호출 시 401 (엔티티별 6건) | 예외 | PLAN § Phase 2 완료 기준 — "인증 없이 기존 job/workbook/cover/footnote/watermark/template API 호출 시 401" | 2 | ✅ |
| 27-18~23 | 상동 (목록 조회) | `user` 역할은 본인 소유 데이터만 목록에 노출된다 (엔티티별 6건) | 불변식 | PLAN § Phase 2 완료 기준 — "`user` 역할은 본인 소유 데이터만 조회" | 2 | ✅ |
| 27-24~29 | DELETE /api/{...}/{id} | 타인 소유물 삭제 시도 시 404 (엔티티별 6건) | 예외 | PLAN § Phase 2 완료 기준 — "타인 소유물 접근 시 403/404" + § 제약·함정 — "모든 엔티티에 필수로 넣을 것" | 2 | ✅ |
| 27-30~35 | 상동 (목록 조회) | `admin` 역할은 전체 계정 데이터를 조회할 수 있다 (엔티티별 6건) | 정상 | PLAN § Phase 2 완료 기준 — "`admin` 역할은 전체 조회 가능" | 2 | ✅ |
| 27-36~41 | `migration_service.backfill_owner_id()` | 마이그레이션 실행 후 기존 데이터(엔티티별 6건) 메타에 `owner_id`(관리자 계정)가 채워짐 | 회귀/불변식 | PLAN § Phase 2 완료 기준 — "마이그레이션 스크립트 실행 후 기존 데이터(6종 전부) 각 메타에 `owner_id`가 채워짐" | 2 | ✅ |
| 27-42 | GET /health | dev 프론트 도메인(`https://dailystudy-workbook-dev.yejicraft-cf.com`) 요청은 `Access-Control-Allow-Origin`에 그 origin이 그대로 반영된다 | 정상 | PLAN § 결정 — "CORS 허용 도메인 \| dev 프론트 도메인 + 로컬 개발(`localhost:5173`) 포함" | 3 | ✅ |
| 27-43 | GET /health | `http://localhost:5173` 요청도 동일하게 허용된다 | 정상 | PLAN § 결정 — "CORS 허용 도메인 \| dev 프론트 도메인 + 로컬 개발(`localhost:5173`) 포함" | 3 | ✅ |
| 27-44 | OPTIONS /health (preflight) | 허용 목록에 없는 origin의 preflight 요청은 400으로 차단된다 | 예외 | PLAN § Phase 3 완료 기준 — "dev 프론트 도메인·`localhost:5173` 외 origin에서 API 호출 시 CORS로 차단됨" | 3 | ✅ |
| 27-45 | GET /health | 허용되지 않은 origin의 단순 요청 응답에는 `Access-Control-Allow-Origin` 헤더가 없다 | 예외 | PLAN § Phase 3 완료 기준 — "dev 프론트 도메인·`localhost:5173` 외 origin에서 API 호출 시 CORS로 차단됨" | 3 | ✅ |
| 27-46 | `routes/paths.ts` | `paths.login === '/login'`, `paths.signup === '/signup'` | 정상 | PLAN § 결정(Phase 4) — "라우트 `/login`·`/signup`(`paths.ts`에 추가)" | 4 | ✅ |
| 27-47 | `routes/router`(실제 `routes` + `RouterProvider`) | 토큰 없이 `/`로 진입하면 최종 위치가 `/login`이 된다 | 정상 | PLAN § Phase 4 완료 기준 — "`RequireAuth`가 미인증 접근을 `/login`으로 리다이렉트" | 4 | ✅ |
| 27-48 | `signup()` | `POST /api/auth/signup`에 `{email,password}`를 JSON body로 보낸다 | 정상 | 검증 계약 헤더 — "`POST /api/auth/signup` → 201 `{user_id, email, role}`" | 4 | ✅ |
| 27-49 | `signup()` | 서버가 409를 반환하면 응답 `detail`로 Error를 던진다 | 예외 | 근거 문서 없음 — 기존 `client.js` 관례(`err.detail \|\| ...`)를 검증 계약이 고정 | 4 | ✅ |
| 27-50 | `login()` | `POST /api/auth/login`에 `{email,password}`를 보내고, 성공 시 `access_token`·`refresh_token`을 `localStorage`에 저장한다 | 정상 | PLAN § 결정 — "refresh 토큰 저장 위치 \| 프론트 `localStorage`" | 4 | ✅ |
| 27-51 | `login()` | 서버가 401을 반환하면 응답 `detail`로 Error를 던진다 | 예외 | 근거 문서 없음 — 기존 `client.js` 관례를 검증 계약이 고정 | 4 | ✅ |
| 27-52 | `apiFetch`(경유: `listJobs()`) | `localStorage`에 `access_token`이 있으면 요청에 `Authorization: Bearer <token>` 헤더가 붙는다 | 정상 | PLAN § 범위 — "`Authorization` 헤더로 부착" | 4 | ✅ |
| 27-53 | `apiFetch`(경유: `listJobs()`) | `access_token`이 없으면 `Authorization` 헤더를 붙이지 않는다 | 경계 | 상동(토큰 없는 반대 경우) | 4 | ✅ |
| 27-54 | `apiFetch`(경유: `listJobs()`) | 401을 받으면 refresh를 1회 호출해 새 `access_token`으로 원 요청을 재시도한다 | 정상 | PLAN § Phase 4 완료 기준 — "`apiFetch`가 401 응답에 refresh 1회 재시도로 access를 자동 갱신함" | 4 | ✅ |
| 27-55 | `apiFetch`(경유: `listJobs()`) | refresh 자체가 401이면 더 재시도하지 않고 저장된 토큰을 지운다 | 예외/회귀 | PLAN § 제약·함정(Phase 4) — "무한 루프에 빠지지 않도록 그 자리에서 로그아웃 처리하고 재시도하지 않는다" | 4 | ✅ |
| 27-56 | `AuthContext`(`useAuth`) | 마운트 시 `access_token`이 있으면 `isAuthenticated`가 true다 | 정상 | PLAN § Phase 4 완료 기준 — "`contexts/AuthContext`가 로그인 상태를 들고" | 4 | ✅ |
| 27-57 | `AuthContext`(`useAuth`) | 마운트 시 토큰이 없으면 `isAuthenticated`가 false다 | 경계 | 상동 | 4 | ✅ |
| 27-58 | `AuthContext.login()` | 로그인 성공 시 `isAuthenticated`가 true가 되고, 입력한 이메일이 사용자 정보로 노출된다(로그인 응답엔 이메일이 없다) | 정상 | 근거 문서 없음 — 검증 계약이 관례로 고정(로그인 응답 봉투에 이메일이 없어 입력값을 쓴다) | 4 | ✅ |
| 27-59 | `AuthContext.signup()` | 회원가입 성공 직후 같은 자격증명으로 로그인이 자동 호출되어 `isAuthenticated`가 true가 된다 | 정상 | PLAN § 결정(Phase 4) — "회원가입 직후 동작 \| ... 성공 직후 같은 자격증명으로 `POST /api/auth/login`을 자동 호출" | 4 | ✅ |
| 27-60 | `RequireAuth` | 인증된 상태에서는 children을 그대로 렌더한다 | 정상 | PLAN § Phase 4 완료 기준 — "보호된 4개 화면이 정상 동작" | 4 | ✅ |
| 27-61 | `RequireAuth` | 미인증 상태에서는 children을 렌더하지 않고 `/login`으로 리다이렉트한다 | 예외 | PLAN § Phase 4 완료 기준 — "`RequireAuth`가 미인증 접근을 `/login`으로 리다이렉트" | 4 | ✅ |
| 27-62 | `pages/login` | 이메일·비밀번호를 입력하고 제출하면 그 값 그대로 `login()`이 호출된다 | 정상 | PLAN § Phase 4 완료 기준 — "`pages/login`...에서 회원가입·로그인이 동작" | 4 | ✅ |
| 27-63 | `pages/signup` | 이메일·비밀번호를 입력하고 제출하면 그 값 그대로 `signup()`이 호출된다 | 정상 | 상동 | 4 | ✅ |

## 제약·함정

- **스토리지 팩토리 이중 구현 의무** — 사용자 저장소를 새로 만들면 표지·각주·워터마크와 같은 패턴대로 `local_storage_service.py`·`s3_service.py` **양쪽 다** 구현해야 한다. 하나만 고치면 `storage.py` 팩토리의 s3 분기가 `ImportError`로 죽는다(REQ-29 Phase 1에서 실측, 계획서 로그 2026-09-11).
- **계약 #24(테스트 스토리지 격리)** — 사용자·인증 테스트도 예외 없이 `os.environ` 값 덮어쓰기로 local 백엔드 격리를 지켜야 한다. 인증 흐름이라고 다르지 않다.
- **`owner_id` 필터 누락은 에러 없이 조용히 샌다** — 메타데이터 필드 방식(결정 참조)을 택했으므로 물리적 격리가 없다. 라우터 하나에서 소유권 체크를 빠뜨리면 다른 사용자 데이터가 조용히 노출된다 — 6개 엔티티(job·workbook·cover·footnote·watermark·template) × 각 CRUD 엔드포인트마다 빠짐없이 확인 필요. `/testgen`에서 "인증된 다른 사용자로 접근 시 403/404" 케이스를 모든 엔티티에 필수로 넣을 것.
- **렌더 무대 없는 화면** — `editor/index.jsx`·`format/index.jsx`와 같은 계열로, 로그인/회원가입 화면도 API mock이 여러 개 필요해 렌더 테스트 무대가 없을 가능성이 높다(계약 #25 계열). 착수 시 확인할 것.
- **(Phase 4) `apiFetch`의 401 재시도는 1회로 고정한다** — refresh 자체가 401이면(refresh_token도 만료·위조) 무한 루프에 빠지지 않도록 그 자리에서 로그아웃 처리하고 재시도하지 않는다.
- **(Phase 4) `RequireAuth`가 `/login`·`/signup`을 감싸면 안 된다** — 감싸면 미인증 사용자가 로그인 화면 자체에서 다시 `/login`으로 리다이렉트되는 무한 루프가 생긴다. 라우터 구조상 이 두 경로는 `DashboardLayout` 트리 밖에 둔다(router.tsx에 `RequireAuth` 래퍼 라우트와 별도 형제 라우트로).
