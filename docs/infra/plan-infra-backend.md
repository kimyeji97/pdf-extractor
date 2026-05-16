# 백엔드 배포 Plan

> **버전**: 1.0 | **작성일**: 2026-05-16
> **관련 spec**: [spec-infra.md](spec-infra.md)
> **구성**: ECS Fargate + Cloudflare Tunnel

---

## 초기 구성 절차 (최초 1회)

### Step 1. ECR 리포지토리 생성

```bash
aws ecr create-repository \
  --repository-name pdf-extractor-backend \
  --region ap-northeast-2
```

---

### Step 2. 보안 그룹 생성

```bash
# ECS 태스크 보안 그룹 (인바운드 불필요 — Tunnel 아웃바운드만 사용)
aws ec2 create-security-group \
  --group-name pdf-extractor-ecs-sg \
  --description "ECS task security group for pdf-extractor" \
  --vpc-id {VPC_ID} \
  --region ap-northeast-2
```

---

### Step 3. Secrets Manager 등록

```bash
aws secretsmanager create-secret \
  --name pdf-extractor/dev \
  --secret-string '{
    "R2_ACCOUNT_ID": "값입력",
    "R2_ACCESS_KEY_ID": "값입력",
    "R2_SECRET_ACCESS_KEY": "값입력",
    "R2_BUCKET_NAME": "값입력",
    "R2_ROOT_PREFIX": "pdf-extractor",
    "R2_PUBLIC_DOMAIN": "값입력",
    "STORAGE_BACKEND": "s3",
    "TUNNEL_TOKEN": "값입력"
  }' \
  --region ap-northeast-2
```

> Cloudflare Tunnel 토큰은 Zero Trust → Networks → Tunnels → 터널 생성 → Docker 선택 후 확인

---

### Step 4. IAM 역할 생성

```bash
# 역할 생성
aws iam create-role \
  --role-name pdf-extractor-ecs-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# 관리형 정책 연결
aws iam attach-role-policy \
  --role-name pdf-extractor-ecs-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Secrets Manager 인라인 정책 추가
aws iam put-role-policy \
  --role-name pdf-extractor-ecs-execution-role \
  --policy-name secrets-manager-read \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev*"
    }]
  }'
```

---

### Step 5. ECS 클러스터 생성

```bash
aws ecs create-cluster \
  --cluster-name pdf-extractor-cluster \
  --region ap-northeast-2
```

---

### Step 6. CloudWatch 로그 그룹 생성

```bash
aws logs create-log-group \
  --log-group-name /ecs/pdf-extractor-dev \
  --region ap-northeast-2

aws logs put-retention-policy \
  --log-group-name /ecs/pdf-extractor-dev \
  --retention-in-days 30 \
  --region ap-northeast-2
```

---

### Step 7. 태스크 정의 등록

```bash
cat > /tmp/task-def.json << 'EOF'
{
  "family": "pdf-extractor-backend-dev",
  "executionRoleArn": "arn:aws:iam::{AWS_ACCOUNT_ID}:role/pdf-extractor-ecs-execution-role",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "{AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest",
      "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pdf-extractor-dev",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "secrets": [
        {"name": "R2_ACCOUNT_ID",       "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:R2_ACCOUNT_ID::"},
        {"name": "R2_ACCESS_KEY_ID",    "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:R2_ACCESS_KEY_ID::"},
        {"name": "R2_SECRET_ACCESS_KEY","valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:R2_SECRET_ACCESS_KEY::"},
        {"name": "R2_BUCKET_NAME",      "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:R2_BUCKET_NAME::"},
        {"name": "R2_ROOT_PREFIX",      "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:R2_ROOT_PREFIX::"},
        {"name": "R2_PUBLIC_DOMAIN",    "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:R2_PUBLIC_DOMAIN::"},
        {"name": "STORAGE_BACKEND",     "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:STORAGE_BACKEND::"}
      ]
    },
    {
      "name": "cloudflared",
      "image": "cloudflare/cloudflared:latest",
      "command": ["tunnel", "--no-autoupdate", "run"],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pdf-extractor-dev",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "cloudflared"
        }
      },
      "secrets": [
        {"name": "TUNNEL_TOKEN", "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{AWS_ACCOUNT_ID}:secret:pdf-extractor/dev-{SUFFIX}:TUNNEL_TOKEN::"}
      ]
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-def.json \
  --region ap-northeast-2
```

---

### Step 8. Cloudflare Tunnel 생성

> Zero Trust → Networks → Tunnels → 터널 생성
> - 이름: `pdf-extractor-dev`
> - 커넥터: Docker 선택 → `--token` 값 복사 → Secrets Manager TUNNEL_TOKEN에 저장

> Public Hostname 설정:
> - Zero Trust → Networks → Tunnels → `pdf-extractor-dev` → Published application routes
> - Hostname: `dailystudy-workbook-api-dev.yejicraft-cf.com`
> - Path: `*`
> - Service: `http://localhost:8000`

---

### Step 9. ECS 서비스 생성

```bash
aws ecs create-service \
  --cluster pdf-extractor-cluster \
  --service-name pdf-extractor-backend-dev-svc \
  --task-definition pdf-extractor-backend-dev \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration 'awsvpcConfiguration={subnets=[{SUBNET_ID_1},{SUBNET_ID_2}],securityGroups=[{ECS_SG_ID}],assignPublicIp=ENABLED}' \
  --region ap-northeast-2
```

### 완료 확인

```bash
curl https://dailystudy-workbook-api-dev.yejicraft-cf.com/health
# 기대 응답: {"status": "ok"}
```

---

## 수동 배포 (코드 변경 시)

### 1. 이미지 빌드 및 푸시

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  504233295989.dkr.ecr.ap-northeast-2.amazonaws.com

# 빌드 및 푸시 (Apple Silicon Mac — linux/amd64 필수)
docker buildx build \
  --platform linux/amd64 \
  --push \
  -t 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest \
  ./backend
```

### 2. ECS 서비스 재배포

```bash
aws ecs update-service \
  --cluster pdf-extractor-cluster \
  --service pdf-extractor-backend-dev-svc \
  --force-new-deployment \
  --region ap-northeast-2
```

### 3. 배포 완료 확인

```bash
# 상태 모니터링
watch -n 10 "aws ecs describe-services \
  --cluster pdf-extractor-cluster \
  --services pdf-extractor-backend-dev-svc \
  --region ap-northeast-2 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}'"

# 헬스체크
curl https://dailystudy-workbook-api-dev.yejicraft-cf.com/health
```

---

## 서비스 중지 / 재시작

```bash
# 중지 (비용 절감)
aws ecs update-service \
  --cluster pdf-extractor-cluster \
  --service pdf-extractor-backend-dev-svc \
  --desired-count 0 \
  --region ap-northeast-2

# 재시작
aws ecs update-service \
  --cluster pdf-extractor-cluster \
  --service pdf-extractor-backend-dev-svc \
  --desired-count 1 \
  --region ap-northeast-2
```

---

## 로그 확인

```bash
# 전체 로그
aws logs tail /ecs/pdf-extractor-dev \
  --region ap-northeast-2 \
  --follow

# 백엔드 로그만
aws logs tail /ecs/pdf-extractor-dev \
  --log-stream-name-prefix ecs/backend \
  --region ap-northeast-2 \
  --follow

# cloudflared 로그만
aws logs tail /ecs/pdf-extractor-dev \
  --log-stream-name-prefix cloudflared \
  --region ap-northeast-2 \
  --follow
```
