# 인프라 구성 명세

## 주요 내용

- **배포 방식**: ECS vs Lambda 비교 후 Lambda 선택 (하루 100건 미만, 비용 최소화)
- **아키텍처**: Cloudflare Pages → API Gateway → Lambda(extractor/api) → R2
- **사전 작업**: 로컬 파일 상태 저장 → R2 이전 필요 (Lambda 도입 전제 조건)
- **작업 순서**: 추출서버 → 관리서버 → 프론트 → DB(마이그레이션)
- **Lambda 스펙**: extractor(15분, 2048MB) / api(30초, 512MB) 분리
- **비동기 패턴**: POST /extract → api Lambda → extractor Lambda 비동기 호출 → R2 상태 업데이트 → GET /status 폴링
- **Java 전환 고려사항**: DB 전환과 동시 진행, 통신 방식(Polling → SQS), SnapStart 권장

---

> **버전**: 2.0 | **작성일**: 2026-05-04
> **목표**: 개인 서비스(하루 100건 미만) 기준 비용 최소화. AWS Lambda + Cloudflare 조합으로 배포한다.
> **향후 계획**: 취업 후 Java 마이그레이션 + DB 전환 시 Lambda 함수 교체만으로 인프라 재사용 가능하도록 설계한다.

---

## 배포 방식 결정: Lambda vs ECS

| 항목 | ECS Fargate | **Lambda (선택)** |
|------|-------------|-------------------|
| 월 비용 (1태스크 상시) | ~$15–20 | **사실상 $0** (무료 티어 내) |
| 하루 100건 기준 | 유휴 시간에도 과금 | 월 3,000건 → 무료 티어(1M건) 이내 |
| 콜드 스타트 | 없음 | 3–10초 (개인 서비스 수준에서 허용) |
| 무거운 라이브러리 | 제한 없음 | Container Image(최대 10GB)로 해결 |
| 장기 마이그레이션 | 인프라 그대로 재사용 | Lambda 함수 이미지 교체로 재사용 |

> 트래픽이 증가하거나 콜드 스타트가 문제가 될 경우 ECS로 전환한다. Lambda + API Gateway 구조를 유지하면 ECS + ALB로의 전환도 어렵지 않다.

---

## 전제 조건

| 항목 | 상태 |
|------|------|
| Cloudflare DNS / CDN / 보안 설정 | ✅ 완료 |
| Cloudflare R2 스토리지 | ✅ 완료 |
| FastAPI 백엔드 Dockerfile | ✅ 존재 (`backend/Dockerfile`) |
| AWS 계정 | 필요 |

---

## 목표 아키텍처

```
사용자 브라우저
    │
    ▼
Cloudflare (DNS + CDN + WAF)
    │
    ├── dailystudy.yejicraft-cf.com        → Cloudflare Pages (프론트엔드)
    │
    └── api.dailystudy.yejicraft-cf.com   → AWS API Gateway (HTTP API)
                                                  │
                                      ┌───────────┴───────────┐
                              Lambda: extractor          Lambda: api
                              (PDF 추출 전용)            (나머지 API)
                                      │                       │
                                      └───────────┬───────────┘
                                           Cloudflare R2
                                        (파일 + 상태 JSON)
```

---

## 환경 구분

| 환경 | 백엔드 도메인 | R2 prefix | 용도 |
|------|-------------|-----------|------|
| dev  | `api.dailystudy-dev.yejicraft-cf.com` | `dev/` | 개발·테스트 |
| prod | `api.dailystudy.yejicraft-cf.com`     | `prod/` | 운영 |

> 초기에는 dev 환경만 구성하고, prod는 dev 안정화 후 동일 절차로 추가한다.

---

## 사전 작업: 로컬 파일 저장소 → R2 이전

Lambda는 인스턴스 간 로컬 파일을 공유할 수 없다. Lambda 도입 전 아래 항목을 R2로 이전해야 한다.

| 현재 (로컬 파일) | 변경 후 (R2 경로) |
|-----------------|-----------------|
| `status/{job_id}.json` | `{prefix}/status/{job_id}.json` |
| `workbooks/{id}.json` | `{prefix}/workbooks/{id}.json` |
| 업로드 PDF, 생성 PDF | R2 이미 사용 중 — 유지 |

> DB 전환(4단계) 시 R2 JSON → DB 교체. 인터페이스만 바꾸면 된다.

---

## 작업 순서

```
0단계 (사전작업): 로컬 파일 상태 저장 → R2 이전
1단계: PDF 추출 Lambda 배포          ← extractor Lambda (Container Image)
2단계: 나머지 백엔드 Lambda 배포      ← api Lambda (추후 Java Lambda로 교체 예정)
3단계: 프론트엔드 Cloudflare Pages 배포
4단계: DB 구성 (DynamoDB) + R2 JSON 파일 교체
```

---

## 요구사항

### REQ-INF-01 컨테이너 이미지 빌드 및 레지스트리

- AWS ECR 프라이빗 리포지토리 2개 생성
  - `pdf-extractor-extractor`: PDF 추출 Lambda용 (무거운 라이브러리 포함, Container Image 필수)
  - `pdf-extractor-api`: 나머지 API Lambda용 (가벼움, Zip 배포도 가능하나 이미지로 통일)
- `docker buildx build --platform linux/amd64` 로 빌드 (Apple Silicon Mac 필수)

### REQ-INF-02 Lambda 함수 구성

**extractor Lambda (PDF 추출 전용)**

| 항목 | 값 |
|------|-----|
| 함수명 | `pdf-extractor-extractor-dev` |
| 런타임 | Container Image (Python) |
| 타임아웃 | 15분 (최대값) |
| 메모리 | 2048 MB (pymupdf, pdfplumber, pytesseract 고려) |
| 아키텍처 | x86_64 |

**api Lambda (browse / upload / workbook)**

| 항목 | 값 |
|------|-----|
| 함수명 | `pdf-extractor-api-dev` |
| 런타임 | Container Image (Python → 추후 Java 교체) |
| 타임아웃 | 30초 |
| 메모리 | 512 MB |
| 아키텍처 | x86_64 |

### REQ-INF-03 비동기 추출 처리 패턴

현재 FastAPI의 `BackgroundTasks` 패턴을 Lambda에서 아래와 같이 대체한다.

```
POST /extract (api Lambda)
  → job_id 생성, R2에 PENDING 상태 저장
  → extractor Lambda 비동기 호출 (InvocationType=Event), 즉시 반환

extractor Lambda (비동기 실행)
  → PDF 처리 중 R2 상태 업데이트 (RUNNING → DONE / FAILED)

GET /status/{job_id} (api Lambda)
  → R2에서 상태 JSON 읽어 반환
```

### REQ-INF-04 API Gateway (HTTP API)

- HTTP API 타입 사용 (REST API 대비 비용 저렴, 기능 충분)
- 라우팅: 모든 경로 → Lambda 함수 (Lambda Proxy Integration)
- CORS 설정: Cloudflare Pages 도메인 허용
- 커스텀 도메인: `api.dailystudy-dev.yejicraft-cf.com`
  - ACM 인증서 발급 (ap-northeast-1 또는 us-east-1)
  - API Gateway 커스텀 도메인 연결

### REQ-INF-05 환경변수 및 시크릿 관리

- AWS Secrets Manager에 민감 정보 저장
- Lambda 환경변수에서 Secrets Manager ARN 참조 (또는 직접 환경변수 주입)

| 환경변수 | 설명 |
|---------|------|
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID |
| `R2_ACCESS_KEY_ID` | R2 액세스 키 |
| `R2_SECRET_ACCESS_KEY` | R2 시크릿 키 |
| `R2_BUCKET_NAME` | R2 버킷명 |
| `R2_ROOT_PREFIX` | 환경 prefix (`dev` or `prod`) |
| `R2_PUBLIC_DOMAIN` | R2 퍼블릭 도메인 |
| `STORAGE_BACKEND` | `s3` 고정 |
| `EXTRACTOR_LAMBDA_ARN` | extractor Lambda ARN (api Lambda에서 비동기 호출 시 사용) |

### REQ-INF-06 IAM 역할

**Lambda 실행 역할 (두 함수 공통)**

| 권한 | 용도 |
|------|------|
| `AWSLambdaBasicExecutionRole` | CloudWatch Logs 쓰기 |
| `secretsmanager:GetSecretValue` | Secrets Manager 읽기 |
| `lambda:InvokeFunction` (extractor ARN 한정) | api Lambda → extractor Lambda 비동기 호출 |
| ECR 이미지 풀 | Lambda 실행 시 자동 처리 (별도 정책 불필요) |

### REQ-INF-07 로깅

- CloudWatch Logs 자동 생성 (`/aws/lambda/pdf-extractor-*-dev`)
- 보존 기간: 30일

### REQ-INF-08 Cloudflare DNS 연결

- `api.dailystudy-dev.yejicraft-cf.com` CNAME → API Gateway 커스텀 도메인
- 프록시 모드: **DNS Only (회색 구름)**
  - 이유: API Gateway에서 직접 ACM SSL 처리

### REQ-INF-09 프론트엔드 배포 (Cloudflare Pages)

- `frontend/` 를 Cloudflare Pages에 배포
- 빌드 명령: `npm run build`, 출력 디렉토리: `dist`
- 루트 디렉토리: `frontend`
- 환경변수: `VITE_API_BASE_URL=https://api.dailystudy-dev.yejicraft-cf.com`
- 커스텀 도메인: `dailystudy-dev.yejicraft-cf.com`

### REQ-INF-10 DB 구성 (4단계)

- **DynamoDB** 사용 (무료 티어: 25GB, 읽기/쓰기 용량 25 unit — 개인 서비스 충분)
- R2에 저장 중인 status JSON, workbook JSON을 DynamoDB 테이블로 교체
- 원본 PDF / 생성 PDF 파일은 계속 R2 보관

### REQ-INF-11 CI/CD (GitHub Actions) — 선택 사항

- `main` 브랜치 push 시 자동 빌드 → ECR 푸시 → Lambda 이미지 업데이트
- 초기에는 수동 배포로 시작

---

## 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 월 비용 | 사실상 $0 (AWS 무료 티어 범위 내, 하루 100건 기준) |
| Java 마이그레이션 호환 | Lambda 함수 이미지 교체만으로 재배포 가능 |
| DB 전환 호환 | R2 JSON → DynamoDB 교체 시 인터페이스만 변경 |
| 시크릿 평문 노출 금지 | Secrets Manager 사용, 코드/환경파일에 하드코딩 금지 |
| 로그 보존 | CloudWatch Logs 30일 |

---

## Java 마이그레이션 시 고려사항 (취업 후)

### DB 전환 타이밍

- **R2 JSON → DB 전환은 Java 마이그레이션과 동시에 진행한다.**
  - Python에서 먼저 DB로 전환하면 Java 이전 시 이중 작업 발생
  - `workbook`, `upload`, `browse` 라우터를 Java로 이전하면서 DB 설계를 함께 확정
- R2는 원본 PDF + 생성 PDF 파일 보관 전용으로 계속 사용

### Python Lambda ↔ Java Lambda 간 통신

- 현재 비동기 호출 방식(api Lambda → extractor Lambda) 유지
- Java 마이그레이션 후 트래픽 증가 시 SQS로 전환 검토

| 방식 | 장점 | 단점 |
|------|------|------|
| Lambda 비동기 호출 (현재) | 추가 인프라 없음 | 재시도 제어 어려움 |
| SQS + Lambda 트리거 | 재시도 내장, 결합도 낮음 | 인프라 추가 |

### Lambda 리소스 — 서버 분리 후 조정

- Java api Lambda: JVM 기동 시간 고려, SnapStart (Java 21) 활성화 권장
- Python extractor Lambda: 메모리 2048MB 유지 또는 부하 테스트 후 조정

---

## 상세 plan 문서

| 단계 | 문서 |
|------|------|
| 추출 서버 배포 (공유 인프라 포함) | [plan-infra-backend-extractor.md](plan-infra-backend-extractor.md) |
| 관리 서버 배포 | [plan-infra-backend-api.md](plan-infra-backend-api.md) |
| 프론트엔드 배포 | [plan-infra-frontend.md](plan-infra-frontend.md) |
| Java 전환 + DB 구성 | [plan-infra-backend-migration.md](plan-infra-backend-migration.md) |
