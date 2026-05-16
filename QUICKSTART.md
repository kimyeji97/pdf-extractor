# 빠른 시작

## 로컬 개발

### 1. 백엔드 세팅

```bash
cd backend

# 가상환경
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성
pip install -r requirements.txt

# 로컬용 .env 복사
cp .env.local .env

# Tesseract 설치 (OCR fallback용)
# macOS:  brew install tesseract tesseract-lang
# Ubuntu: sudo apt install tesseract-ocr tesseract-ocr-kor tesseract-ocr-eng

# 서버 실행
uvicorn app.main:app --reload
```

### 2. 프론트엔드 세팅

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

---

## 수동 배포

### 백엔드 (ECS Fargate)

자세한 내용 → [docs/infra/plan-infra-backend.md](docs/infra/plan-infra-backend.md)

```bash
# 1. ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  504233295989.dkr.ecr.ap-northeast-2.amazonaws.com

# 2. 이미지 빌드 및 푸시 (Apple Silicon Mac — linux/amd64 필수)
docker buildx build \
  --platform linux/amd64 \
  --push \
  -t 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest \
  ./backend

# 3. ECS 서비스 재배포
aws ecs update-service \
  --cluster pdf-extractor-cluster \
  --service pdf-extractor-backend-dev-svc \
  --force-new-deployment \
  --region ap-northeast-2

# 4. 배포 완료 확인
watch -n 10 "aws ecs describe-services \
  --cluster pdf-extractor-cluster \
  --services pdf-extractor-backend-dev-svc \
  --region ap-northeast-2 \
  --query 'services[0].{Running:runningCount,Desired:desiredCount,Pending:pendingCount}'"

# 5. 헬스체크
curl https://dailystudy-workbook-api-dev.yejicraft-cf.com/health
```

### 프론트엔드 (Cloudflare Pages)

자세한 내용 → [docs/infra/plan-infra-frontend.md](docs/infra/plan-infra-frontend.md)

```bash
# 1. 프로덕션 빌드
cd frontend
VITE_API_BASE_URL=https://dailystudy-workbook-api-dev.yejicraft-cf.com/api npm run build
```

> 빌드 완료 후 `frontend/dist/` 폴더를 Cloudflare Pages에 업로드
> Cloudflare 대시보드 → Workers & Pages → `pdf-extractor-frontend` → 배포 → dist 폴더 업로드

---

## 서비스 중지 / 재시작 (비용 절감)

```bash
# 중지
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
# 전체 로그 실시간
aws logs tail /ecs/pdf-extractor-dev \
  --region ap-northeast-2 \
  --follow

# 백엔드만
aws logs tail /ecs/pdf-extractor-dev \
  --log-stream-name-prefix ecs/backend \
  --region ap-northeast-2 \
  --follow
```

---

## 인프라 전체 명세

→ [docs/infra/spec-infra.md](docs/infra/spec-infra.md)
