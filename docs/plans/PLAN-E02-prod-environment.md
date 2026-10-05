# PLAN-E02 · 운영(prod) 환경 구성

> 출처: 2026-10-05 세션 「운영환경구성」 · 작성: 2026-10-05 · 상태: 🟡 진행 (Phase 1~3 완료 2026-10-05)

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
| cloudflared 이미지 | **dev처럼 `cloudflare/cloudflared:latest`** — `:latest` 금지는 backend 이미지에만 | 2026-10-05 사용자 결정(Phase 2 착수 중). 착수 시점 실체는 2026.9.3(dev 실행 digest `072c067d…`와 같음) | `2026.9.3` 고정(재시작 때 몰래 안 바뀌지만 보안 패치를 손으로 올려야 함) |
| prod 이미지 빌드 | **`prod-2cc43de` 태그 하나만 푸시** — `backend-build.sh`를 안 쓰고 `docker buildx` 직접. `2cc43de` 분리 worktree(clean)에서 빌드 | `backend-build.sh`는 `:latest`도 덮어써 dev 재시작에 닿는다. 작업 worktree의 HEAD는 문서 커밋(`3fdf38a`)이라 스크립트로는 태그가 `prod-3fdf38a-dirty`가 된다 | `backend-build.sh prod` 그대로(dev `latest` 갱신) — prod 전용 경로는 Phase 3 스크립트 몫 |
| prod 프론트 Worker | **wrangler `env.prod`** — 이름 `dailystudy-workbook-prod`, 커스텀 도메인도 `env.prod`에 둔다. 배포는 `wrangler deploy --env prod`, dev는 지금 설정(`twilight-base-302d`) 그대로 | 2026-10-05 사용자 결정(`/testgen E02 3`) | 별도 설정 파일 `wrangler.prod.jsonc` + `-c` |
| 백엔드 prod 배포 스크립트 | **`backend-deploy-prod.sh prod-<커밋>` 한 번에** — 태그 하나만 빌드·푸시 → 현재 리비전을 복제해 이미지만 바꾼 새 리비전 등록 → 서비스 갱신 → 안정화 대기 → 이전 리비전 deregister. 태그는 HEAD와 일치해야 하고, 커밋 안 된 변경이 있으면 거부 | 2026-10-05 사용자 결정(`/testgen E02 3`). `backend-build.sh`는 `latest`도 덮는다(계약 #37) · 실험 리비전이 남으면 콘솔이 그걸 고른다 | 배포만(빌드는 `backend-build.sh`에 `latest` 끄는 옵션) |
| 시크릿 | `pdf-extractor/prod` 신설 — **JWT 키 새로 발급**, `CORS_ALLOWED_ORIGINS`는 prod 프론트만 | dev 키 재사용 시 dev 토큰이 prod에서 통한다 | dev 시크릿 복제 |

## 미결 질문

- [x] ~~`dailystudy` 버킷의 기존 객체 4개(24kB)~~ → **그대로 둔다**(2026-10-05 사용자 결정). `docs/` 폴더 표시 · `docs/refund_policy_combined.html`(공개 중인 환불 정책) · `pdf-extractor/` 폴더 표시 · `pdf-extractor/favicon.ico`(05-02, 앱이 안 씀 — 규칙으로 403). 앱 데이터(status·users 등)가 아니라 빈 상태 시작과 안 부딪힌다

## 작업 단계

- [x] **Phase 1 — Cloudflare 리소스** — 2026-10-05, 케이스 6/6 (토큰·터널·WAF는 사용자 대시보드, CORS는 wrangler) (일부 사람 손: 토큰·터널은 대시보드)
      기존 객체 4개 확인 · 버킷 전용 R2 토큰 발급 · 버킷 CORS(dev와 같은 규칙, 오리진만 prod 프론트) · 공개 도메인 경로 제한 규칙 · 터널 생성 + public hostname `dailystudy-workbook-api…` → `http://localhost:8000`
      완료 기준: 새 토큰으로 `dailystudy` 목록 조회 성공 · **dev 버킷은 그 토큰으로 접근 거부** · 공개 도메인에서 `pdf-extractor/users/…` 요청은 차단, `uploads/`·`results/`는 통과 · 터널 토큰 확보
- [x] **Phase 2 — AWS 백엔드** — 2026-10-05, 케이스 9/9 (태스크 정의 `prod:1` · 이미지 `prod-2cc43de` · 터널 healthy)
      시크릿 · 로그 그룹 · 실행 역할의 새 시크릿 읽기 권한 · 태스크 정의 rev 1(2 vCPU/4GB, 버전 태그) · 서비스 desired 1
      완료 기준: `https://dailystudy-workbook-api.yejicraft-cf.com/health` 200 · 실행 digest = 지정 태그 digest · prod 태스크 정의에 `:latest` 없음(**backend 이미지 한정** — cloudflared는 결정 표대로 `:latest`) · dev 서비스 변화 없음
- [x] **Phase 3 — 배포 스크립트** — 2026-10-05 `1ee1d8b`, 케이스 16/16(자동 15 + 실측 E02-24 dev 번들 파일 단위 동일)
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
> Phase 2도 외부 리소스만 — 실측 행. E02-07이 `CORS_ALLOWED_ORIGINS` JSON 형식 함정도 덮는다(형식이 틀리면 기동 실패라 200이 불가). E02-10 기준선은 `/implement` 착수 직전에 찍는다. 이미지 태그는 `prod-2cc43de`(2026-10-05 사용자 결정).
> Phase 3: `backend/tests/test_deploy_scripts.py`(pytest) — 스크립트를 임시 git 저장소에 복사해 돌리고 `npm`·`npx`·`docker`·`aws`는 PATH 앞의 가짜 실행 파일(호출 기록). 가짜 `aws`는 실제 응답 형태를 돌려주고 `--query`·`--output text`를 jmespath로 흉내 낸다 — 스크립트의 AWS 호출 방식을 테스트가 정하지 않기 위해. E02-24는 라이브 배포 대신 로컬 번들 비교(지금 dev 배포 = 작업 중 F16 노출). worktree엔 venv가 없어 `../pdf-extractor/backend/venv`로 실행.
> E02-04의 확인용 객체는 판정 직후 지운다(빈 상태 시작 결정). E02-05는 dev의 `localhost:5173`을 prod에 넣지 않는 것으로 판정한다.

| ID | 대상 | 케이스 | 유형 | 근거 | Phase | 결과 |
|----|------|--------|:----:|------|:----:|:----:|
| E02-01 | prod R2 토큰 | 새 토큰으로 `dailystudy` 버킷의 `pdf-extractor/` 목록 조회 성공 | 실측 | PLAN § 작업 단계 — "새 토큰으로 `dailystudy` 목록 조회 성공" | 1 | ✅ |
| E02-02 | prod R2 토큰 | 같은 토큰으로 `dailystudy-dev` 목록 조회가 접근 거부(403)로 실패 | 실측 | PLAN § 작업 단계 — "dev 버킷은 그 토큰으로 접근 거부" | 1 | ✅ |
| E02-03 | 공개 도메인 `dailystudy.yejicraft-cf.com` | `pdf-extractor/users/…` 요청이 403(규칙 차단) — 없는 객체의 404와 구별해 판정 | 실측 | PLAN § 작업 단계 — "`pdf-extractor/users/…` 요청은 차단" | 1 | ✅ |
| E02-04 | 공개 도메인 | `pdf-extractor/uploads/`·`pdf-extractor/results/` 아래 확인용 객체가 200(규칙에 막히지 않음) | 회귀 | PLAN § 작업 단계 — "`uploads/`·`results/`는 통과" | 1 | ✅ |
| E02-05 | `dailystudy` 버킷 CORS | 허용 메서드·헤더·노출 헤더·max-age가 dev와 같고, 오리진만 prod 프론트(`https://dailystudy-workbook.yejicraft-cf.com`) | 실측 | PLAN § 작업 단계 — "버킷 CORS(dev와 같은 규칙, 오리진만 prod 프론트)" | 1 | ✅ |
| E02-06 | 터널 `pdf-extractor-prod` | 터널이 있고 public hostname `dailystudy-workbook-api.yejicraft-cf.com` → `http://localhost:8000`, 토큰 확보 | 실측 | PLAN § 작업 단계 — "터널 토큰 확보" | 1 | ✅ |
| E02-07 | prod API | 터널 경유 `https://dailystudy-workbook-api.yejicraft-cf.com/health`가 200 | 실측 | PLAN § 작업 단계 — "`https://dailystudy-workbook-api.yejicraft-cf.com/health` 200" | 2 | ✅ |
| E02-08 | prod 실행 태스크 | backend 컨테이너 실행 이미지 digest = ECR `prod-2cc43de` 태그 digest | 실측 | PLAN § 작업 단계 — "실행 digest = 지정 태그 digest" | 2 | ✅ |
| E02-09 | prod 태스크 정의 | backend 이미지 참조가 버전 태그이고 `:latest`가 아님 | 불변식 | PLAN § 작업 단계 — "prod 태스크 정의에 `:latest` 없음" | 2 | ✅ |
| E02-10 | dev 서비스 | 착수 직전 dev 상태(태스크 정의 rev 8 · desired · 실행 digest)와 끝난 뒤 상태가 같음 | 불변식 | PLAN § 작업 단계 — "dev 서비스 변화 없음" | 2 | ✅ |
| E02-11 | prod 태스크 정의·서비스 | cpu 2048 / memory 4096, 서비스 desired 1 · running 1 | 정상 | PLAN § 결정 — "2 vCPU / 4GB 상시" | 2 | ✅ |
| E02-12 | prod 시크릿 | `JWT_SECRET_KEY`가 dev 값·코드 기본값과 다름(값은 출력하지 않고 비교만) | 정상 | PLAN § 결정 — "JWT 키 새로 발급" | 2 | ✅ |
| E02-13 | prod API CORS | prod 프론트 오리진 preflight엔 허용 헤더, dev 프론트·`localhost:5173` 오리진엔 없음 | 정상 | PLAN § 결정 — "`CORS_ALLOWED_ORIGINS`는 prod 프론트만" | 2 | ✅ |
| E02-14 | 로그 | backend·cloudflared 로그가 `/ecs/pdf-extractor-prod`에 쌓임 | 정상 | PLAN § 범위 — "로그 그룹 `/ecs/pdf-extractor-prod`" | 2 | ✅ |
| E02-15 | prod 태스크 정의 family | ACTIVE 리비전이 서비스가 쓰는 것 하나뿐(실험 리비전 없음) | 회귀 | PLAN § 제약·함정 — "prod 실험 리비전은 반드시 deregister" | 2 | ✅ |
| E02-16 | `frontend-deploy.sh` | 인자 없이 실행하면 실패하고 `npm`·`npx`를 부르지 않음 | 예외 | PLAN § 작업 단계 — "인자 없으면 실패" | 3 | ✅ |
| E02-17 | `frontend-deploy.sh` | `dev`·`prod`가 아닌 인자(`stage`)도 실패하고 `npm`·`npx`를 부르지 않음 | 예외 | PLAN § 작업 단계 — "API URL·Worker 이름 분기" | 3 | ✅ |
| E02-18 | `frontend-deploy.sh dev` | 빌드 시 `VITE_API_BASE_URL`이 `https://dailystudy-workbook-api-dev.yejicraft-cf.com/api` | 회귀 | PLAN § 작업 단계 — "dev 배포 결과 불변" | 3 | ✅ |
| E02-19 | `frontend-deploy.sh dev` | `npx wrangler deploy`를 `--env` 없이 부름 | 회귀 | PLAN § 결정 — "dev는 지금 설정(`twilight-base-302d`) 그대로" | 3 | ✅ |
| E02-20 | `frontend-deploy.sh prod` | 빌드 시 `VITE_API_BASE_URL`이 `https://dailystudy-workbook-api.yejicraft-cf.com/api` | 정상 | PLAN § 작업 단계 — "API URL·Worker 이름 분기" | 3 | ✅ |
| E02-21 | `frontend-deploy.sh prod` | `npx wrangler deploy --env prod`로 부름 | 정상 | PLAN § 결정 — "배포는 `wrangler deploy --env prod`" | 3 | ✅ |
| E02-22 | `frontend/wrangler.jsonc` | 최상위 `name`이 여전히 `twilight-base-302d` | 회귀 | PLAN § 결정 — "dev는 지금 설정(`twilight-base-302d`) 그대로" | 3 | ✅ |
| E02-23 | `frontend/wrangler.jsonc` | `env.prod.name`이 `dailystudy-workbook-prod`이고 `env.prod.routes`에 커스텀 도메인 `dailystudy-workbook.yejicraft-cf.com` | 정상 | PLAN § 결정 — "이름 `dailystudy-workbook-prod`, 커스텀 도메인도 `env.prod`에 둔다" | 3 | ✅ |
| E02-24 | dev 빌드 번들(실측, 수동) | 같은 커밋에서 옛 명령과 새 스크립트(dev)의 `dist/index.html`이 같음 | 실측 | PLAN § 작업 단계 — "dev 배포 결과 불변(라이브 번들 해시 확인)" | 3 | ✅ |
| E02-25 | `backend-deploy-prod.sh` | 태그 없이 실행하면 실패하고 `docker`·`aws`를 부르지 않음 | 예외 | PLAN § 작업 단계 — "태그 인자 필수" | 3 | ✅ |
| E02-26 | `backend-deploy-prod.sh` | 태그 `latest`면 실패하고 `docker`·`aws`를 부르지 않음 | 예외 | PLAN § 작업 단계 — "`latest` 거부" | 3 | ✅ |
| E02-27 | `backend-deploy-prod.sh` | 태그가 `prod-<HEAD>`와 다르면 실패하고 `docker`·`aws`를 부르지 않음 | 예외 | PLAN § 결정 — "태그는 HEAD와 일치해야 하고" | 3 | ✅ |
| E02-28 | `backend-deploy-prod.sh` | 커밋 안 된 변경이 있으면 실패하고 `docker`·`aws`를 부르지 않음 | 예외 | PLAN § 결정 — "커밋 안 된 변경이 있으면 거부" | 3 | ✅ |
| E02-29 | `backend-deploy-prod.sh`(정상 실행) | `docker`·`aws` 호출 인자 어디에도 `pdf-extractor-backend:latest`가 없음(cloudflared `:latest`는 결정대로 예외) | 회귀 | CLAUDE.md § 계약 #37 — "`latest`는 건드리지 않는다" | 3 | ✅ |
| E02-30 | `backend-deploy-prod.sh`(정상 실행) | 새 리비전의 backend 이미지는 `…:<태그>`이고, 나머지(cloudflared 이미지·시크릿·cpu/memory 등)는 현재 리비전과 같음 | 정상 | PLAN § 결정 — "현재 리비전을 복제해 이미지만 바꾼 새 리비전 등록" | 3 | ✅ |
| E02-31 | `backend-deploy-prod.sh`(정상 실행) | 서비스를 새 리비전으로 갱신 → 안정화 대기 → 그 뒤에 이전 리비전 deregister(순서) | 정상 | PLAN § 결정 — "안정화 대기 → 이전 리비전 deregister" | 3 | ✅ |

## 제약·함정

- **`CORS_ALLOWED_ORIGINS`는 `list[str]`** — pydantic이 env 값을 JSON으로 읽는다. 시크릿 값은 `["https://dailystudy-workbook.yejicraft-cf.com"]` 형태여야 한다. 쉼표 문자열이면 기동 시 파싱 에러
- **access 쿠키는 `SameSite=Lax` · domain 미지정(API 호스트 전용)** — 프론트·API가 같은 사이트(`yejicraft-cf.com`)라서 `<img>` 요청에 쿠키가 실린다. 도메인을 다른 사이트로 바꾸면 썸네일이 전부 401(계약 #31, REQ-B15)
- **콘솔 "서비스 업데이트"는 최신 활성 리비전을 고른다** — prod 실험 리비전은 반드시 deregister(CLAUDE.md 배포 상태, 2026-09-28)
- **프론트 빌드는 셸 env로 API URL을 덮는다** — `.env.local`이 localhost라 안 덮으면 prod에 localhost가 박힌다
- **실행 역할 `pdf-extractor-ecs-execution-role`은 dev·prod 공용** — 인라인 정책 `secrets-manager-read`의 Resource에 `pdf-extractor/dev*`·`pdf-extractor/prod*` 둘이 있다. 정책을 고칠 때 한쪽만 남기면 그 환경 태스크가 시크릿을 못 읽어 기동 실패
- **`wrangler deploy --temporary` 금지** — 임시 계정의 다른 Worker로 배포된다
- **prod env 파일은 `backend/.env.prod`** — `.env.*` 무시 규칙에 걸리는지 커밋 전 `git check-ignore`로 확인(계약 #24 — `.env.dev` 공개 노출 이력)
- **`dailystudy` 버킷은 다른 용도와 공유한다**(환불 정책 공개) — 버킷 단위 설정(CORS·수명 주기·공개 도메인)을 바꾸면 `docs/` 공개에도 닿는다. 앱 쪽 규칙은 `/pdf-extractor/` 안으로만 건다
- **R2 토큰 시크릿 줄 형식** — 2026-10-05 `.env.prod`에 `R2_SECRET_ACCESS_` + 값이 `KEY=` 없이 붙어 들어갔고, `=` 기준 마스킹이 그 줄을 못 가려 **값이 대화 기록에 노출 → 재발급**했다. env 파일은 줄 전체를 출력하지 말고 키 이름만 뽑는다(`grep -oE '^[A-Za-z0-9_]+='`)
- **경로 제한 규칙은 `R2_ROOT_PREFIX`에 묶인다** — prefix를 바꾸거나 공개 URL을 쓰는 새 경로(예: 썸네일)를 추가하면 규칙도 같이 고쳐야 한다. 안 고치면 그 다운로드만 조용히 403
- 테스트는 계약 #24 격리로 항상 local — prod 시크릿이 테스트에 닿을 경로는 없어야 한다
