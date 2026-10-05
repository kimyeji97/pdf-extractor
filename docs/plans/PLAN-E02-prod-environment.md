# PLAN-E02 · 운영(prod) 환경 구성

> 출처: 2026-10-05 세션 「운영환경구성」 · 작성: 2026-10-05 · 상태: 🟡 진행 (Phase 1 완료 2026-10-05)

## 배경

- 2026-10-06 오픈인데 환경이 **dev 하나뿐**이다. 실사용자 데이터가 테스트 데이터와 같은 버킷·같은 서비스에 섞인다
- dev는 `:latest` 이미지 + 수동 배포라, dev에 올린 미검증 빌드가 그대로 실사용자에게 노출된다
- dev 비밀(R2 키·JWT 키)은 과거 공개 레포 노출 이력이 있다(계약 #24). 같은 키로 운영하면 그 위험을 운영 데이터가 진다

## 범위

**포함**
- Cloudflare: R2 버킷 `dailystudy`(기존) + 그 버킷 전용 API 토큰 · 버킷 CORS · 공개 도메인 경로 제한 규칙 · 터널 `pdf-extractor-prod` · prod 프론트 Worker + 커스텀 도메인
- AWS: 시크릿 `pdf-extractor/prod` · 로그 그룹 `/ecs/pdf-extractor-prod` · 태스크 정의 `pdf-extractor-backend-prod` · 서비스 `pdf-extractor-backend-prod-svc`(같은 클러스터)
- 배포 스크립트: `frontend-deploy.sh`에 `dev|prod` 인자 · 백엔드 prod 배포는 버전 태그 지정
- prod admin 계정(가입 → `promote-admin.sh`)과 end-to-end 확인

**제외**
- CI/CD(GitHub Actions) — 오픈 전 시간 부족. 오픈 후 별도 REQ(2026-10-05 사용자 결정)
- dev 데이터 이관 — 빈 상태로 시작(2026-10-05 사용자 결정)
- 모니터링·알람 — 오픈 후 상황 보고 둔다(2026-10-05 사용자 결정)
- 터널 지연 대응(perf-infra-capacity § 3 ①) — P06에서 오픈 후로 이연된 것 그대로
- F16 관련 파일 — 다른 세션이 작업 중

## 결정

| 항목 | 결정 | 근거 | 기각한 안 |
|------|------|------|-----------|
| 도메인 | 프론트 `dailystudy-workbook.yejicraft-cf.com` · API `dailystudy-workbook-api.yejicraft-cf.com` (`-dev` 제거) | 2026-10-05 사용자 결정 | 별도 도메인 |
| R2 버킷 | **기존 `dailystudy` 버킷**(2026-04-19 생성, 공개 도메인 `dailystudy.yejicraft-cf.com` 연결됨) + 그 버킷 전용 토큰 · prefix `pdf-extractor` | dev(`dailystudy-dev` ↔ `dailystudy-dev.yejicraft-cf.com`)와 이름·구조를 맞춘다 · 별도 버킷이라 dev 키가 새도 prod는 안전 — 2026-10-05 사용자 결정 | 새 버킷 `dailystudy-prod`(같은 날 첫 결정, 교체) · 같은 버킷 + prefix `prod`(spec-infra 옛 계획 — dev 자격증명으로 prod 접근 가능) |
| R2 공개 도메인 | **dev와 동일하게 `R2_PUBLIC_DOMAIN` 사용** — 다운로드는 공개 URL | "최대한 dev와 동일하게" — 2026-10-05 사용자 결정. F16 `savePdf.js`가 이미 공개 도메인 오리진을 처리한다 | presigned만 |
| 공개 범위 | **공개 도메인에 경로 제한 규칙(WAF custom rule `dailystudy-prod-r2-public-paths`, Block)** — `/pdf-extractor/` 안에서 `uploads/`·`results/`만 허용, **`/pdf-extractor/` 밖은 건드리지 않는다** | 공개 도메인은 버킷 전체를 무인증·무만료로 연다. `users/{user_id}.json`(이메일·비밀번호 해시)도 user_id만 알면 읽힌다. 공개 URL을 만드는 코드는 원본(`browse.py`)·결과(`extract.py`) 둘뿐. **`dailystudy` 버킷은 `docs/refund_policy_combined.html`(환불 정책)을 이미 공개 중**이라 범위를 앱 prefix로 좁혔다 — 2026-10-05 사용자 결정 | 전부 차단(같은 날 첫 결정 — 환불 정책이 403이 된다) · `/docs/`만 예외 추가(경로가 늘 때마다 예외 추가) · dev와 완전히 동일(규칙 없음) |
| 첫 배포 커밋 | **main `2cc43de`** | 배포 스크립트 검증이 목적이라 F16 추가 수정을 기다리지 않는다 — 2026-10-05 사용자 결정 | F16 추가 수정 후 main |
| 오픈 후 dev | 지금처럼 쓸 때만 잠깐 켠다(desired 0 토글) | 2026-10-05 사용자 결정 | 상시 가동 |
| 데이터 | 빈 상태로 시작. admin은 prod 가입 후 `promote-admin.sh`로 승격 | 테스트 데이터 혼입 방지 — 2026-10-05 사용자 결정 | dev 데이터 복사 |
| CI/CD | 이번 범위 제외 | 2026-10-05 사용자 결정 | 함께 구성 |
| ECS | 같은 클러스터에 prod 서비스 추가, **2 vCPU / 4GB 상시**(~$85/월) | perf-infra-capacity § 5 권장 사양 | 1 vCPU / 2GB(분석 중 CPU 포화) · 클러스터 분리(이득 없음) |
| 이미지 | **prod는 버전 태그 고정, `:latest` 금지** | `:latest`면 dev 배포 뒤 prod 태스크가 재시작될 때 미검증 이미지로 바뀐다 | dev와 같은 `:latest` |
| 시크릿 | `pdf-extractor/prod` 신설 — **JWT 키 새로 발급**, `CORS_ALLOWED_ORIGINS`는 prod 프론트만 | dev 키 재사용 시 dev 토큰이 prod에서 통한다 | dev 시크릿 복제 |

## 미결 질문

- [x] ~~`dailystudy` 버킷의 기존 객체 4개(24kB)~~ → **그대로 둔다**(2026-10-05 사용자 결정). `docs/` 폴더 표시 · `docs/refund_policy_combined.html`(공개 중인 환불 정책) · `pdf-extractor/` 폴더 표시 · `pdf-extractor/favicon.ico`(05-02, 앱이 안 씀 — 규칙으로 403). 앱 데이터(status·users 등)가 아니라 빈 상태 시작과 안 부딪힌다

## 작업 단계

- [x] **Phase 1 — Cloudflare 리소스** — 2026-10-05, 케이스 6/6 (토큰·터널·WAF는 사용자 대시보드, CORS는 wrangler) (일부 사람 손: 토큰·터널은 대시보드)
      기존 객체 4개 확인 · 버킷 전용 R2 토큰 발급 · 버킷 CORS(dev와 같은 규칙, 오리진만 prod 프론트) · 공개 도메인 경로 제한 규칙 · 터널 생성 + public hostname `dailystudy-workbook-api…` → `http://localhost:8000`
      완료 기준: 새 토큰으로 `dailystudy` 목록 조회 성공 · **dev 버킷은 그 토큰으로 접근 거부** · 공개 도메인에서 `pdf-extractor/users/…` 요청은 차단, `uploads/`·`results/`는 통과 · 터널 토큰 확보
- [ ] **Phase 2 — AWS 백엔드**
      시크릿 · 로그 그룹 · 실행 역할의 새 시크릿 읽기 권한 · 태스크 정의 rev 1(2 vCPU/4GB, 버전 태그) · 서비스 desired 1
      완료 기준: `https://dailystudy-workbook-api.yejicraft-cf.com/health` 200 · 실행 digest = 지정 태그 digest · prod 태스크 정의에 `:latest` 없음 · dev 서비스 변화 없음
- [ ] **Phase 3 — 배포 스크립트**
      `frontend-deploy.sh dev|prod`(API URL·Worker 이름 분기, 인자 없으면 실패) · 백엔드 prod 배포 스크립트(태그 인자 필수, `latest` 거부)
      완료 기준: dev 배포 결과 불변(라이브 번들 해시 확인) · prod 스크립트가 태그 없이·`latest`로 실행하면 거부
- [ ] **Phase 4 — 프론트 prod 배포**
      새 Worker + 커스텀 도메인
      완료 기준: 프론트 접속 시 로그인 화면 · 라이브 청크에 prod API URL 있고 `-dev`·`localhost` 없음
- [ ] **Phase 5 — end-to-end + admin**
      가입 → `promote-admin.sh <email> .env.prod` → 업로드·분석 → 생성·다운로드
      완료 기준: 썸네일 이미지 표시(쿠키 인증) · PDF 다운로드 · 알림 수신 · 데이터가 `dailystudy`에만 생기고 dev 버킷 무변화

문서 현행화(CLAUDE.md 배포 토폴로지·배포 상태, `spec-infra.md` 환경 구분, TODO §6)는 `/checkpoint` 몫.

## 검증 계약

> 작성: 2026-10-05 · 스펙: 이 계획서(스펙 문서 없음) · 검증: `/testrun E02`
> Phase 1은 외부 리소스만 다뤄 코드가 없다 — 전부 실측(수동) 행. Phase 3(스크립트) 케이스는 착수 직전 `/testgen`에서 추가한다.
> E02-04의 확인용 객체는 판정 직후 지운다(빈 상태 시작 결정). E02-05는 dev의 `localhost:5173`을 prod에 넣지 않는 것으로 판정한다.

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| E02-01 | prod R2 토큰 | 새 토큰으로 `dailystudy` 버킷의 `pdf-extractor/` 목록 조회 성공 | 실측 | PLAN § 작업 단계 — "새 토큰으로 `dailystudy` 목록 조회 성공" | 1 | ✅ |
| E02-02 | prod R2 토큰 | 같은 토큰으로 `dailystudy-dev` 목록 조회가 접근 거부(403)로 실패 | 실측 | PLAN § 작업 단계 — "dev 버킷은 그 토큰으로 접근 거부" | 1 | ✅ |
| E02-03 | 공개 도메인 `dailystudy.yejicraft-cf.com` | `pdf-extractor/users/…` 요청이 403(규칙 차단) — 없는 객체의 404와 구별해 판정 | 실측 | PLAN § 작업 단계 — "`pdf-extractor/users/…` 요청은 차단" | 1 | ✅ |
| E02-04 | 공개 도메인 | `pdf-extractor/uploads/`·`pdf-extractor/results/` 아래 확인용 객체가 200(규칙에 막히지 않음) | 회귀 | PLAN § 작업 단계 — "`uploads/`·`results/`는 통과" | 1 | ✅ |
| E02-05 | `dailystudy` 버킷 CORS | 허용 메서드·헤더·노출 헤더·max-age가 dev와 같고, 오리진만 prod 프론트(`https://dailystudy-workbook.yejicraft-cf.com`) | 실측 | PLAN § 작업 단계 — "버킷 CORS(dev와 같은 규칙, 오리진만 prod 프론트)" | 1 | ✅ |
| E02-06 | 터널 `pdf-extractor-prod` | 터널이 있고 public hostname `dailystudy-workbook-api.yejicraft-cf.com` → `http://localhost:8000`, 토큰 확보 | 실측 | PLAN § 작업 단계 — "터널 토큰 확보" | 1 | ✅ |

## 제약·함정

- **`CORS_ALLOWED_ORIGINS`는 `list[str]`** — pydantic이 env 값을 JSON으로 읽는다. 시크릿 값은 `["https://dailystudy-workbook.yejicraft-cf.com"]` 형태여야 한다. 쉼표 문자열이면 기동 시 파싱 에러
- **access 쿠키는 `SameSite=Lax` · domain 미지정(API 호스트 전용)** — 프론트·API가 같은 사이트(`yejicraft-cf.com`)라서 `<img>` 요청에 쿠키가 실린다. 도메인을 다른 사이트로 바꾸면 썸네일이 전부 401(계약 #31, REQ-B15)
- **콘솔 "서비스 업데이트"는 최신 활성 리비전을 고른다** — prod 실험 리비전은 반드시 deregister(CLAUDE.md 배포 상태, 2026-09-28)
- **프론트 빌드는 셸 env로 API URL을 덮는다** — `.env.local`이 localhost라 안 덮으면 prod에 localhost가 박힌다
- **`wrangler deploy --temporary` 금지** — 임시 계정의 다른 Worker로 배포된다
- **prod env 파일은 `backend/.env.prod`** — `.env.*` 무시 규칙에 걸리는지 커밋 전 `git check-ignore`로 확인(계약 #24 — `.env.dev` 공개 노출 이력)
- **`dailystudy` 버킷은 다른 용도와 공유한다**(환불 정책 공개) — 버킷 단위 설정(CORS·수명 주기·공개 도메인)을 바꾸면 `docs/` 공개에도 닿는다. 앱 쪽 규칙은 `/pdf-extractor/` 안으로만 건다
- **R2 토큰 시크릿 줄 형식** — 2026-10-05 `.env.prod`에 `R2_SECRET_ACCESS_` + 값이 `KEY=` 없이 붙어 들어갔고, `=` 기준 마스킹이 그 줄을 못 가려 **값이 대화 기록에 노출 → 재발급**했다. env 파일은 줄 전체를 출력하지 말고 키 이름만 뽑는다(`grep -oE '^[A-Za-z0-9_]+='`)
- **경로 제한 규칙은 `R2_ROOT_PREFIX`에 묶인다** — prefix를 바꾸거나 공개 URL을 쓰는 새 경로(예: 썸네일)를 추가하면 규칙도 같이 고쳐야 한다. 안 고치면 그 다운로드만 조용히 403
- 테스트는 계약 #24 격리로 항상 local — prod 시크릿이 테스트에 닿을 경로는 없어야 한다
