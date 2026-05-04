# 백엔드 배포 Plan — 관리 서버 (API Lambda)

## 주요 내용

- **선행 조건**: 추출 서버 배포 완료 (공유 인프라 재사용 — Secrets Manager, IAM, API GW, ACM, DNS)
- **Phase 1**: ECR 리포지토리 `pdf-extractor-api` 생성 + 이미지 빌드/푸시 (현재는 동일 Dockerfile)
- **Phase 2**: api Lambda 생성 (30초, 512MB) + `EXTRACTOR_LAMBDA_ARN` 환경변수 추가
- **Phase 3**: API Gateway 라우트 분리 — `/api/extract*`, `/api/status*` → extractor Lambda / 나머지 `$default` → api Lambda
- **Phase 4**: 관리 API 동작 확인 + E2E 흐름 확인
- **Java 교체 절차 포함**: Spring Boot 이미지를 동일 ECR에 교체 푸시 후 `aws lambda update-function-code` 한 줄로 완료. API Gateway/IAM/DNS 변경 없음

---

> **버전**: 1.0 | **작성일**: 2026-05-04
> **관련 spec**: [spec-infra.md](spec-infra.md)
> **선행 조건**: [plan-infra-backend-extractor.md](plan-infra-backend-extractor.md) 완료 (공유 인프라 구성됨)
> **목표**: workbook / upload / browse 등 관리 API Lambda 배포. 추후 Java Lambda로 교체 예정.

---

## 전체 작업 순서

```
Phase 1: ECR 리포지토리 생성 및 이미지 빌드/푸시
Phase 2: api Lambda 함수 생성
Phase 3: API Gateway 라우트 분리
Phase 4: 동작 확인
```

> Secrets Manager, IAM 역할, API Gateway, ACM, Cloudflare DNS는
> 추출 서버 배포([plan-infra-backend-extractor.md](plan-infra-backend-extractor.md))에서 이미 구성됨.

---

## Phase 1 — ECR 리포지토리 생성 및 이미지 빌드/푸시

### 1-1. ECR 리포지토리 생성

AWS 콘솔 → Elastic Container Registry → 리포지토리 생성

| 항목 | 값 |
|------|-----|
| 가시성 | 프라이빗 |
| 리포지토리 이름 | `pdf-extractor-api` |
| 태그 변경 가능성 | 변경 가능 |

### 1-2. Docker 이미지 빌드 및 푸시

```bash
# ECR 로그인 (이미 로그인된 경우 생략)
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com

# Apple Silicon Mac — linux/amd64 플랫폼 명시 필수
docker buildx build \
  --platform linux/amd64 \
  -t {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest \
  ./backend

docker push {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest
```

> 현재는 extractor와 동일한 `backend/Dockerfile`을 사용한다.
> Java 마이그레이션 시 이 ECR 리포지토리에 Spring Boot 이미지를 교체 푸시한다.

---

## Phase 2 — api Lambda 함수 생성

AWS 콘솔 → Lambda → 함수 생성 → 컨테이너 이미지

| 항목 | 값 |
|------|-----|
| 함수명 | `pdf-extractor-api-dev` |
| 컨테이너 이미지 URI | `{AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest` |
| 아키텍처 | x86_64 |
| 실행 역할 | `pdf-extractor-lambda-role` (추출 서버 배포 시 생성한 역할) |

**구성 → 일반 구성에서 변경:**

| 항목 | 값 |
|------|-----|
| 타임아웃 | **30초** |
| 메모리 | **512 MB** |

**환경변수 설정 (구성 → 환경 변수):**

| 키 | 값 |
|----|-----|
| `R2_ACCOUNT_ID` | Secrets Manager에서 복사 |
| `R2_ACCESS_KEY_ID` | Secrets Manager에서 복사 |
| `R2_SECRET_ACCESS_KEY` | Secrets Manager에서 복사 |
| `R2_BUCKET_NAME` | Secrets Manager에서 복사 |
| `R2_ROOT_PREFIX` | `dev` |
| `R2_PUBLIC_DOMAIN` | Secrets Manager에서 복사 |
| `STORAGE_BACKEND` | `s3` |
| `EXTRACTOR_LAMBDA_ARN` | `arn:aws:lambda:ap-northeast-2:{AWS_ACCOUNT_ID}:function:pdf-extractor-extractor-dev` |

> `EXTRACTOR_LAMBDA_ARN`: api Lambda가 추출 요청을 extractor Lambda에 비동기로 위임할 때 사용.

---

## Phase 3 — API Gateway 라우트 분리

현재 API Gateway의 `$default` 라우트가 extractor Lambda로 연결되어 있다.
api Lambda 추가 후 경로별로 라우트를 분리한다.

AWS 콘솔 → API Gateway → `pdf-extractor-api-dev` → 라우트

| 라우트 | 연결 Lambda | 설명 |
|--------|-------------|------|
| `POST /api/extract` | `pdf-extractor-extractor-dev` | 추출 시작 |
| `POST /api/extract-v2` | `pdf-extractor-extractor-dev` | 복수 선택 추출 |
| `GET /api/status/{jobId}` | `pdf-extractor-extractor-dev` | 작업 상태 조회 |
| `$default` (나머지 전체) | `pdf-extractor-api-dev` | 관리 API |

> `$default` 라우트를 api Lambda로 변경하고, 추출 관련 경로만 extractor Lambda로 명시적으로 추가한다.

---

## Phase 4 — 동작 확인

```bash
# 관리 API 확인
curl https://api.dailystudy-dev.yejicraft-cf.com/api/workbooks
# 기대 응답: [] 또는 문제집 목록 JSON

curl https://api.dailystudy-dev.yejicraft-cf.com/api/files
# 기대 응답: 파일 목록 JSON

# 추출 서버 라우팅 확인 (여전히 extractor Lambda로 전달되는지)
curl -X POST https://api.dailystudy-dev.yejicraft-cf.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"job_id": "test-id"}'
```

---

## 완료 체크리스트

- [ ] ECR 리포지토리 `pdf-extractor-api` 생성
- [ ] Docker 이미지 빌드 및 ECR 푸시
- [ ] api Lambda 생성 (타임아웃 30초, 메모리 512MB)
- [ ] 환경변수 설정 (`EXTRACTOR_LAMBDA_ARN` 포함)
- [ ] API Gateway 라우트 분리 (추출 경로 → extractor, 나머지 → api)
- [ ] 관리 API 동작 확인
- [ ] 추출 → 상태 폴링 → 문제집 저장 E2E 흐름 확인

---

## Java 마이그레이션 시 교체 절차 (참고)

이 Lambda(api)를 Java Spring Boot로 교체할 때:

```bash
# 1. Spring Boot 프로젝트 빌드 및 Container Image 생성
docker buildx build \
  --platform linux/amd64 \
  -t {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest \
  ./backend-java   # 새 Java 프로젝트 경로

# 2. ECR 푸시
docker push {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest

# 3. Lambda 이미지 업데이트
aws lambda update-function-code \
  --function-name pdf-extractor-api-dev \
  --image-uri {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-api:latest
```

> API Gateway, IAM, Secrets Manager, Cloudflare DNS 변경 없이 Lambda 이미지 교체만으로 완료.
> Java Lambda SnapStart(Java 21) 활성화 권장 — JVM 콜드 스타트 1초 미만으로 단축.
