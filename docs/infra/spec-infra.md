# 인프라 구성 명세 (Spec — Backend Server)

> **버전**: 1.0 | **작성일**: 2026-05-02
> **목표**: 로컬에서만 동작 중인 FastAPI 백엔드를 AWS ECS Fargate 기반으로 배포하고, Cloudflare와 연결한다.
> **향후 계획**: Spring Boot 마이그레이션 시 Dockerfile 교체만으로 인프라 재사용 가능하도록 설계한다.

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
    ├── dailystudy.yejicraft-cf.com      → Cloudflare Pages (프론트엔드)
    │
    └── api.dailystudy.yejicraft-cf.com  → AWS ALB
                                               │
                                          ECS Fargate (백엔드)
                                               │
                                          Cloudflare R2 (스토리지)
```

---

## 환경 구분

| 환경 | 백엔드 도메인 | R2 prefix | 용도 |
|------|-------------|-----------|------|
| dev  | `api.dailystudy-dev.yejicraft-cf.com` | `dev/` | 개발·테스트 |
| prod | `api.dailystudy.yejicraft-cf.com`     | `prod/` | 운영 |

> 초기에는 dev 환경만 구성하고, prod는 dev 안정화 후 동일 절차로 추가한다.

---

## 요구사항

### REQ-INF-01 컨테이너 이미지 빌드 및 레지스트리

- 기존 `backend/Dockerfile`을 수정 없이 사용한다.
- AWS ECR(Elastic Container Registry)에 프라이빗 리포지토리를 생성한다.
- `docker buildx build --platform linux/amd64` 로 빌드하여 ECR에 푸시한다.
  - (Apple Silicon Mac에서 빌드 시 플랫폼 명시 필수)

### REQ-INF-02 네트워킹 (VPC / 보안 그룹)

- 기존 Default VPC 또는 신규 VPC를 사용한다.
- ALB 보안 그룹: 인바운드 80(HTTP), 443(HTTPS) — 0.0.0.0/0 허용
- ECS 태스크 보안 그룹: 인바운드 8000 — ALB 보안 그룹에서만 허용

### REQ-INF-03 ECS Fargate 클러스터 및 서비스

- 클러스터 1개 (`pdf-extractor-cluster`)
- 태스크 정의: CPU 512, Memory 1024 (1 vCPU / 2GB) — 초기값, 부하 테스트 후 조정
- 서비스: 최소 1태스크, Auto Scaling 미적용 (초기)
- 컨테이너 포트: 8000

### REQ-INF-04 Application Load Balancer

- ALB 1개 (`pdf-extractor-alb`)
- 리스너: HTTP 80 → HTTPS 443 리다이렉트
- HTTPS 443 → ECS 타겟 그룹 (포트 8000) 포워딩
- ACM(AWS Certificate Manager) 인증서 발급 (`api.dailystudy-dev.yejicraft-cf.com`)
- WebSocket 지원: ALB 기본 지원 (추가 설정 불필요)

### REQ-INF-05 환경변수 및 시크릿 관리

- AWS Secrets Manager에 민감 정보 저장
- ECS 태스크 정의에서 Secrets Manager 참조
- 관리 대상 시크릿:

| 환경변수 | 설명 |
|---------|------|
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID |
| `R2_ACCESS_KEY_ID` | R2 액세스 키 |
| `R2_SECRET_ACCESS_KEY` | R2 시크릿 키 |
| `R2_BUCKET_NAME` | R2 버킷명 |
| `R2_ROOT_PREFIX` | 환경 prefix (`dev/` or `prod/`) |
| `R2_PUBLIC_DOMAIN` | R2 퍼블릭 도메인 (있는 경우) |
| `STORAGE_BACKEND` | `s3` 고정 |

### REQ-INF-06 IAM 역할

- ECS 태스크 실행 역할 (Task Execution Role): ECR 이미지 풀, CloudWatch Logs 쓰기, Secrets Manager 읽기
- ECS 태스크 역할 (Task Role): 필요 시 추가 (현재 R2 접근은 환경변수 기반이므로 불필요)

### REQ-INF-07 로깅

- CloudWatch Logs 로그 그룹 생성 (`/ecs/pdf-extractor-dev`)
- ECS 태스크 정의에 awslogs 드라이버 설정

### REQ-INF-08 Cloudflare DNS 연결

- Cloudflare에 `api.dailystudy-dev.yejicraft-cf.com` CNAME → ALB DNS 등록
- 프록시 모드: **DNS Only (회색 구름)** — ALB에서 직접 SSL 처리
  - 이유: Cloudflare 프록시 + ALB 이중 SSL 불필요, WebSocket 호환성 보장
- SSL/TLS: Full (strict) 전환 (ACM 인증서 발급 완료 후)

### REQ-INF-09 프론트엔드 배포 (Cloudflare Pages)

- `frontend/` 를 Cloudflare Pages에 배포
- 빌드 명령: `npm run build`, 출력 디렉토리: `dist`
- 환경변수: `VITE_API_BASE_URL=https://api.dailystudy-dev.yejicraft-cf.com`
- 커스텀 도메인: `dailystudy-dev.yejicraft-cf.com`

### REQ-INF-10 CI/CD (GitHub Actions) — 선택 사항

- `main` 브랜치 push 시 자동 빌드 → ECR 푸시 → ECS 배포
- 초기에는 수동 배포로 시작하고, 안정화 후 추가

---

## 비기능 요구사항

| 항목 | 기준 |
|------|------|
| Spring Boot 마이그레이션 호환 | Dockerfile 교체만으로 재배포 가능 |
| WebSocket 호환 | ALB + ECS 구성으로 추가 설정 없이 지원 |
| 시크릿 평문 노출 금지 | Secrets Manager 사용, 코드/환경파일에 하드코딩 금지 |
| 로그 보존 | CloudWatch Logs 30일 보존 |

---

## 상세 plan 문서

| Phase | 문서 |
|-------|------|
| 전체 배포 절차 | [plan-infra-backend.md](plan-infra-backend.md) |
