# 백엔드 서버 배포 Plan

> **버전**: 1.0 | **작성일**: 2026-05-02
> **관련 spec**: [spec-infra.md](spec-infra.md)
> **대상 환경**: dev (`api.dailystudy-dev.yejicraft-cf.com`) 먼저 구성

---

## Phase 1 — ECR 리포지토리 생성 및 이미지 푸시

### 1-1. ECR 리포지토리 생성

AWS 콘솔 → Elastic Container Registry → 리포지토리 생성

| 항목 | 값 |
|------|----|
| 가시성 | 프라이빗 |
| 리포지토리 이름 | `pdf-extractor-backend` |
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
  -t {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest \
  ./backend

# 푸시
docker push {AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest
```

> `{AWS_ACCOUNT_ID}` 는 실제 AWS 계정 ID로 치환

---

## Phase 2 — 네트워킹 (보안 그룹)

AWS 콘솔 → EC2 → 보안 그룹

### 2-1. ALB 보안 그룹 생성

| 항목 | 값 |
|------|----|
| 이름 | `pdf-extractor-alb-sg` |
| 인바운드 규칙 | HTTP 80 — 0.0.0.0/0 |
| 인바운드 규칙 | HTTPS 443 — 0.0.0.0/0 |
| 아웃바운드 규칙 | 전체 허용 |

### 2-2. ECS 태스크 보안 그룹 생성

| 항목 | 값 |
|------|----|
| 이름 | `pdf-extractor-ecs-sg` |
| 인바운드 규칙 | TCP 8000 — 소스: `pdf-extractor-alb-sg` |
| 아웃바운드 규칙 | 전체 허용 (R2 아웃바운드 필요) |

---

## Phase 3 — Secrets Manager 등록

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

## Phase 4 — IAM 역할 생성

AWS 콘솔 → IAM → 역할 생성

### 4-1. 태스크 실행 역할 (Task Execution Role)

| 항목 | 값 |
|------|----|
| 이름 | `pdf-extractor-ecs-execution-role` |
| 신뢰 관계 | `ecs-tasks.amazonaws.com` |
| 관리형 정책 | `AmazonECSTaskExecutionRolePolicy` |
| 추가 인라인 정책 | Secrets Manager 읽기 (아래 참고) |

Secrets Manager 인라인 정책:
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

---

## Phase 5 — ECS 클러스터 및 태스크 정의

### 5-1. 클러스터 생성

AWS 콘솔 → ECS → 클러스터 생성

| 항목 | 값 |
|------|----|
| 클러스터 이름 | `pdf-extractor-cluster` |
| 인프라 | AWS Fargate |

### 5-2. 태스크 정의 생성

AWS 콘솔 → ECS → 태스크 정의 → 새 태스크 정의 생성

| 항목 | 값 |
|------|----|
| 태스크 정의 이름 | `pdf-extractor-backend-dev` |
| 시작 유형 | Fargate |
| OS/아키텍처 | Linux/X86_64 |
| CPU | 512 (.5 vCPU) |
| 메모리 | 1024 MB (1 GB) |
| 태스크 실행 역할 | `pdf-extractor-ecs-execution-role` |

**컨테이너 설정:**

| 항목 | 값 |
|------|----|
| 컨테이너 이름 | `backend` |
| 이미지 URI | `{AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest` |
| 포트 매핑 | 8000 TCP |
| 로그 드라이버 | awslogs |
| 로그 그룹 | `/ecs/pdf-extractor-dev` |
| 로그 리전 | `ap-northeast-2` |

**환경변수 (Secrets Manager 참조):**

| 키 | 값 형식 |
|----|--------|
| `R2_ACCOUNT_ID` | `arn:aws:secretsmanager:...:pdf-extractor/dev:R2_ACCOUNT_ID::` |
| `R2_ACCESS_KEY_ID` | `arn:aws:secretsmanager:...:pdf-extractor/dev:R2_ACCESS_KEY_ID::` |
| `R2_SECRET_ACCESS_KEY` | `arn:aws:secretsmanager:...:pdf-extractor/dev:R2_SECRET_ACCESS_KEY::` |
| `R2_BUCKET_NAME` | `arn:aws:secretsmanager:...:pdf-extractor/dev:R2_BUCKET_NAME::` |
| `R2_ROOT_PREFIX` | `arn:aws:secretsmanager:...:pdf-extractor/dev:R2_ROOT_PREFIX::` |
| `R2_PUBLIC_DOMAIN` | `arn:aws:secretsmanager:...:pdf-extractor/dev:R2_PUBLIC_DOMAIN::` |
| `STORAGE_BACKEND` | `arn:aws:secretsmanager:...:pdf-extractor/dev:STORAGE_BACKEND::` |

---

## Phase 6 — ALB 생성

AWS 콘솔 → EC2 → 로드 밸런서 → 생성

### 6-1. ACM 인증서 먼저 발급

AWS 콘솔 → Certificate Manager → 인증서 요청

| 항목 | 값 |
|------|----|
| 도메인 | `api.dailystudy-dev.yejicraft-cf.com` |
| 검증 방법 | DNS 검증 |

> Cloudflare DNS에 ACM이 요청하는 CNAME 레코드 추가 → 검증 완료 대기 (수 분)

### 6-2. ALB 생성

| 항목 | 값 |
|------|----|
| 이름 | `pdf-extractor-alb` |
| 유형 | Application Load Balancer |
| 체계 | 인터넷 경계 |
| VPC | Default VPC |
| 가용 영역 | 2개 이상 선택 |
| 보안 그룹 | `pdf-extractor-alb-sg` |

**리스너 설정:**

| 리스너 | 규칙 |
|--------|------|
| HTTP 80 | → HTTPS 443 으로 리다이렉트 |
| HTTPS 443 | → 타겟 그룹 포워딩 (아래 생성) |

**타겟 그룹:**

| 항목 | 값 |
|------|----|
| 이름 | `pdf-extractor-backend-tg` |
| 타겟 유형 | IP |
| 프로토콜 | HTTP |
| 포트 | 8000 |
| 헬스체크 경로 | `/health` |

---

## Phase 7 — ECS 서비스 생성

AWS 콘솔 → ECS → 클러스터 `pdf-extractor-cluster` → 서비스 생성

| 항목 | 값 |
|------|----|
| 시작 유형 | Fargate |
| 태스크 정의 | `pdf-extractor-backend-dev` |
| 서비스 이름 | `pdf-extractor-backend-dev-svc` |
| 원하는 태스크 수 | 1 |
| 보안 그룹 | `pdf-extractor-ecs-sg` |
| 퍼블릭 IP | 활성화 (ECR 이미지 풀 위해 필요) |
| 로드 밸런서 | `pdf-extractor-alb` 연결 |
| 타겟 그룹 | `pdf-extractor-backend-tg` |

---

## Phase 8 — Cloudflare DNS 연결

Cloudflare 대시보드 → `yejicraft-cf.com` → DNS

| 타입 | 이름 | 값 | 프록시 |
|------|------|----|--------|
| CNAME | `api.dailystudy-dev` | `{ALB DNS 이름}.ap-northeast-2.elb.amazonaws.com` | **DNS Only (회색 구름)** |

> 프록시 OFF 이유: ALB에서 직접 ACM SSL 처리, Cloudflare 이중 프록시 불필요

### 접속 확인

```bash
curl https://api.dailystudy-dev.yejicraft-cf.com/health
# 기대 응답: {"status": "ok"}
```

---

## Phase 9 — Cloudflare Pages 프론트엔드 배포

Cloudflare 대시보드 → Pages → 새 프로젝트 → Git 연결

| 항목 | 값 |
|------|----|
| 리포지토리 | `pdf-extractor` |
| 빌드 명령 | `npm run build` |
| 빌드 출력 디렉토리 | `frontend/dist` |
| 루트 디렉토리 | `frontend` |
| 환경변수 | `VITE_API_BASE_URL=https://api.dailystudy-dev.yejicraft-cf.com` |

**커스텀 도메인 설정:**
Pages 프로젝트 → 커스텀 도메인 → `dailystudy-dev.yejicraft-cf.com` 추가

---

## Phase 10 — SSL Full (strict) 전환

ALB에 ACM 인증서가 설치되었으므로 Cloudflare SSL 모드 업그레이드.

Cloudflare 대시보드 → `yejicraft-cf.com` → SSL/TLS → Overview
→ 암호화 모드: **Full (strict)** 로 변경

---

## 완료 체크리스트

- [ ] ECR 리포지토리 생성 및 이미지 푸시
- [ ] ALB/ECS 보안 그룹 생성
- [ ] Secrets Manager 시크릿 등록
- [ ] IAM 태스크 실행 역할 생성
- [ ] ECS 클러스터 생성
- [ ] 태스크 정의 생성
- [ ] ACM 인증서 발급 및 검증
- [ ] ALB 생성 (리스너 + 타겟 그룹)
- [ ] ECS 서비스 생성 및 태스크 Running 확인
- [ ] Cloudflare DNS CNAME 등록
- [ ] `/health` 엔드포인트 응답 확인
- [ ] Cloudflare Pages 배포 및 도메인 연결
- [ ] SSL Full (strict) 전환
- [ ] HSTS includeSubDomains ON

---

## 향후 작업 (prod 환경)

dev 안정화 후 동일 절차로 진행. 차이점:

| 항목 | dev | prod |
|------|-----|------|
| 도메인 | `api.dailystudy-dev.yejicraft-cf.com` | `api.dailystudy.yejicraft-cf.com` |
| R2_ROOT_PREFIX | `dev` | `prod` |
| Secrets Manager | `pdf-extractor/dev` | `pdf-extractor/prod` |
| ECS 태스크 수 | 1 | 2 이상 (가용성) |
