# 백엔드 배포 Plan — 추출 서버 (Extractor Lambda)

## 주요 내용

- **Phase 0**: 상태 JSON, workbook JSON을 로컬 → R2로 이전 (Lambda 도입 전 필수 코드 변경)
- **Phase 1**: ECR 리포지토리 `pdf-extractor-extractor` 생성 + `linux/amd64` 이미지 빌드/푸시
- **Phase 2–3**: Secrets Manager(R2 자격증명) + IAM 역할 생성 — **공유 인프라, 이 단계에서 한 번만 구성**
- **Phase 4**: extractor Lambda 생성 (타임아웃 15분, 메모리 2048MB)
- **Phase 5**: API Gateway HTTP API 생성 + CORS 설정 — **공유 인프라**
- **Phase 6**: ACM 인증서 발급 (**us-east-1 리전 필수**) + API Gateway 커스텀 도메인 연결 — **공유 인프라**
- **Phase 7–8**: Cloudflare DNS CNAME 등록 (DNS Only) + `/health` 응답 확인

---

> **버전**: 1.0 | **작성일**: 2026-05-04
> **관련 spec**: [spec-infra.md](spec-infra.md)
> **목표**: PDF 문항 추출 전용 Lambda 배포. 공유 인프라(Secrets Manager, IAM, API Gateway, ACM)도 이 단계에서 함께 구성한다.

---

## 전체 작업 순서

```
Phase 0: 사전 작업 — 로컬 파일 저장소 → R2 이전 (코드 변경)
Phase 1: ECR 리포지토리 생성 및 이미지 빌드/푸시
Phase 2: Secrets Manager 등록       ← 공유 인프라
Phase 3: IAM 역할 생성              ← 공유 인프라
Phase 4: extractor Lambda 함수 생성
Phase 5: API Gateway (HTTP API) 생성 ← 공유 인프라
Phase 6: ACM 인증서 + 커스텀 도메인  ← 공유 인프라
Phase 7: Cloudflare DNS 연결
Phase 8: 접속 확인
```

---

## Phase 0 — 사전 작업: 로컬 파일 → R2 이전

Lambda 환경에서는 인스턴스 간 로컬 파일을 공유할 수 없다.
아래 항목을 R2에 저장하도록 코드를 변경한다.

| 항목 | 현재 (로컬 파일) | 변경 후 (R2 경로) |
|------|----------------|-----------------|
| 추출 job 상태 | `{local}/status/{job_id}.json` | `{prefix}/status/{job_id}.json` |
| 문제집 메타데이터 | `{local}/workbooks/{id}.json` | `{prefix}/workbooks/{id}.json` |

> 업로드 PDF, 생성 PDF는 이미 R2를 사용 중이므로 변경 불필요.
> DB 전환(마이그레이션 단계) 시 R2 JSON → DynamoDB 교체. 인터페이스만 변경하면 된다.

---

## Phase 1 — ECR 리포지토리 생성 및 이미지 빌드/푸시

### 1-1. ECR 리포지토리 생성

AWS 콘솔 → Elastic Container Registry → 리포지토리 생성

| 항목 | 값 |
|------|-----|
| 가시성 | 프라이빗 |
| 리포지토리 이름 | `pdf-extractor-extractor` |
| 태그 변경 가능성 | 변경 가능 |

### 1-2. Docker 이미지 빌드 및 푸시

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com

# Apple Silicon Mac — linux/amd64 플랫폼 명시 필수
docker buildx build \
  --platform linux/amd64 \
  -t {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-extractor:latest \
  ./backend

docker push {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-extractor:latest
```

> `{AWS_ACCOUNT_ID}` 는 실제 AWS 계정 ID로 치환

---

## Phase 2 — Secrets Manager 등록 (공유 인프라)

AWS 콘솔 → Secrets Manager → 새 보안 암호 저장

| 보안 암호 이름 | 키 | 값 |
|---------------|----|----|
| `pdf-extractor/dev` | `R2_ACCOUNT_ID` | Cloudflare Account ID |
| | `R2_ACCESS_KEY_ID` | R2 액세스 키 |
| | `R2_SECRET_ACCESS_KEY` | R2 시크릿 키 |
| | `R2_BUCKET_NAME` | R2 버킷명 |
| | `R2_ROOT_PREFIX` | `dev` |
| | `R2_PUBLIC_DOMAIN` | R2 퍼블릭 도메인 (없으면 빈 값) |
| | `STORAGE_BACKEND` | `s3` |

> 하나의 JSON 보안 암호로 저장 (키/값 쌍)

---

## Phase 3 — IAM 역할 생성 (공유 인프라)

AWS 콘솔 → IAM → 역할 생성

| 항목 | 값 |
|------|-----|
| 이름 | `pdf-extractor-lambda-role` |
| 신뢰 관계 | `lambda.amazonaws.com` |
| 관리형 정책 | `AWSLambdaBasicExecutionRole` |

**Secrets Manager 읽기 인라인 정책:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev*"
    }
  ]
}
```

**Lambda 비동기 호출 인라인 정책 (api Lambda → extractor Lambda):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": "arn:aws:lambda:ap-northeast-2:{AWS_ACCOUNT_ID}:function:pdf-extractor-extractor-dev"
    }
  ]
}
```

> 이 역할은 추후 api Lambda에서도 동일하게 사용한다.

---

## Phase 4 — extractor Lambda 함수 생성

AWS 콘솔 → Lambda → 함수 생성 → 컨테이너 이미지

| 항목 | 값 |
|------|-----|
| 함수명 | `pdf-extractor-extractor-dev` |
| 컨테이너 이미지 URI | `{AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-extractor:latest` |
| 아키텍처 | x86_64 |
| 실행 역할 | `pdf-extractor-lambda-role` |

**구성 → 일반 구성에서 변경:**

| 항목 | 값 |
|------|-----|
| 타임아웃 | **15분** (pymupdf, OCR 처리 시간 고려) |
| 메모리 | **2048 MB** |

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

---

## Phase 5 — API Gateway (HTTP API) 생성 (공유 인프라)

AWS 콘솔 → API Gateway → API 생성 → HTTP API

| 항목 | 값 |
|------|-----|
| API 이름 | `pdf-extractor-api-dev` |
| 통합 | Lambda — `pdf-extractor-extractor-dev` (초기, api Lambda 추가 전) |
| 라우트 | `$default` (모든 경로 → Lambda) |

**CORS 설정:**

| 항목 | 값 |
|------|-----|
| 허용 오리진 | `https://dailystudy-dev.yejicraft-cf.com` |
| 허용 메서드 | `GET, POST, PUT, DELETE, OPTIONS` |
| 허용 헤더 | `Content-Type, Authorization` |

> api Lambda 배포 후 라우트 분리: `/api/extract*`, `/api/status*` → extractor Lambda, 나머지 → api Lambda

---

## Phase 6 — ACM 인증서 + API Gateway 커스텀 도메인 (공유 인프라)

### 6-1. ACM 인증서 발급

AWS 콘솔 → Certificate Manager

> **주의**: API Gateway HTTP API 커스텀 도메인은 **us-east-1(버지니아)** 리전 인증서만 지원.

| 항목 | 값 |
|------|-----|
| 리전 | **us-east-1** (반드시) |
| 도메인 | `api.dailystudy-dev.yejicraft-cf.com` |
| 검증 방법 | DNS 검증 |

> Cloudflare DNS에 ACM이 요청하는 CNAME 레코드 추가 → 검증 완료 대기 (수 분)

### 6-2. API Gateway 커스텀 도메인 연결

AWS 콘솔 → API Gateway → 커스텀 도메인 이름 → 생성

| 항목 | 값 |
|------|-----|
| 도메인 이름 | `api.dailystudy-dev.yejicraft-cf.com` |
| ACM 인증서 | 위에서 발급한 인증서 (us-east-1) |
| 엔드포인트 타입 | 리전 |

API 매핑:

| API | 스테이지 | 경로 |
|-----|---------|------|
| `pdf-extractor-api-dev` | `$default` | `/` |

> 생성 후 표시되는 **API Gateway 도메인 이름**을 메모 (Phase 7에서 사용).

---

## Phase 7 — Cloudflare DNS 연결

Cloudflare 대시보드 → `yejicraft-cf.com` → DNS

| 타입 | 이름 | 값 | 프록시 |
|------|------|----|--------|
| CNAME | `api.dailystudy-dev` | `{API Gateway 도메인 이름}` | **DNS Only (회색 구름)** |

> 프록시 OFF 이유: API Gateway에서 직접 ACM SSL 처리

---

## Phase 8 — 접속 확인

```bash
curl https://api.dailystudy-dev.yejicraft-cf.com/health
# 기대 응답: {"status": "ok"}

# 추출 테스트 (콜드 스타트로 첫 요청은 느릴 수 있음 — 정상)
curl -X POST https://api.dailystudy-dev.yejicraft-cf.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"job_id": "test-id"}'
```

---

## 완료 체크리스트

- [ ] Phase 0: 상태 파일 저장소 R2 이전 완료 (코드)
- [ ] ECR 리포지토리 `pdf-extractor-extractor` 생성
- [ ] Docker 이미지 빌드 및 ECR 푸시
- [ ] Secrets Manager `pdf-extractor/dev` 등록
- [ ] IAM 역할 `pdf-extractor-lambda-role` 생성
- [ ] extractor Lambda 생성 (타임아웃 15분, 메모리 2048MB)
- [ ] Lambda 환경변수 설정
- [ ] API Gateway HTTP API 생성 및 Lambda 연결
- [ ] CORS 설정
- [ ] ACM 인증서 발급 (us-east-1) 및 DNS 검증 완료
- [ ] API Gateway 커스텀 도메인 생성 및 API 매핑
- [ ] Cloudflare DNS CNAME 등록
- [ ] `/health` 응답 확인
- [ ] 추출 API 동작 확인
