# 인프라 구성 명세

> **버전**: 3.0 | **작성일**: 2026-05-16
> **목표**: FastAPI 백엔드를 AWS ECS Fargate + Cloudflare Tunnel 기반으로 배포한다.
> **향후 계획**: Spring Boot 마이그레이션 시 Dockerfile 교체만으로 인프라 재사용 가능하도록 설계한다.

---

## 전제 조건

| 항목 | 상태 |
|------|------|
| Cloudflare DNS / CDN / 보안 설정 | ✅ 완료 |
| Cloudflare R2 스토리지 | ✅ 완료 |
| FastAPI 백엔드 Dockerfile | ✅ 존재 (`backend/Dockerfile`) |
| AWS 계정 (ap-northeast-2) | ✅ 완료 |

---

## 목표 아키텍처

```
사용자 브라우저
    │
    ▼
Cloudflare (DNS + CDN + WAF)
    │
    ├── dailystudy-dev.yejicraft-cf.com          → Cloudflare Pages (프론트엔드)
    │
    └── dailystudy-workbook-api-dev.yejicraft-cf.com
            │
            ▼
        Cloudflare Tunnel (pdf-extractor-dev)
            │
            ▼
        ECS Fargate Task
            ├── backend container (FastAPI :8000)
            └── cloudflared container (Tunnel 연결)
                    │
                    ▼
            Cloudflare R2 (스토리지)
```

---

## 환경 구분

| 환경 | 백엔드 도메인 | R2 prefix | 용도 |
|------|-------------|-----------|------|
| dev | `dailystudy-workbook-api-dev.yejicraft-cf.com` | `pdf-extractor` | 개발·테스트 |
| prod | 추후 결정 | `prod` | 운영 |

---

## 구성된 AWS 리소스 (dev)

| 리소스 | 이름 / ID | 비고 |
|--------|----------|------|
| ECR 리포지토리 | `pdf-extractor-backend` | ap-northeast-2 |
| ECS 클러스터 | `pdf-extractor-cluster` | Fargate |
| ECS 서비스 | `pdf-extractor-backend-dev-svc` | 태스크 1개 |
| 태스크 정의 | `pdf-extractor-backend-dev` | backend + cloudflared |
| 보안 그룹 (ECS) | `sg-07d2336bbf0ec09ea` | 인바운드: 없음 (Tunnel 사용) |
| Secrets Manager | `pdf-extractor/dev` | R2 자격증명 + Tunnel 토큰 |
| IAM 역할 | `pdf-extractor-ecs-execution-role` | ECR 풀 + Secrets Manager 읽기 |
| CloudWatch 로그 | `/ecs/pdf-extractor-dev` | 보존 30일 |

## 구성된 Cloudflare 리소스 (dev)

| 리소스 | 값 |
|--------|-----|
| Tunnel 이름 | `pdf-extractor-dev` |
| Tunnel ID | `5793d4b8-b9e1-4ef9-8805-bf3e7ba9169a` |
| Public Hostname | `dailystudy-workbook-api-dev.yejicraft-cf.com` → `http://localhost:8000` |

---

## Secrets Manager 키 목록 (`pdf-extractor/dev`)

| 키 | 설명 |
|----|------|
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID |
| `R2_ACCESS_KEY_ID` | R2 액세스 키 |
| `R2_SECRET_ACCESS_KEY` | R2 시크릿 키 |
| `R2_BUCKET_NAME` | R2 버킷명 (`dailystudy-dev`) |
| `R2_ROOT_PREFIX` | R2 경로 prefix (`pdf-extractor`) |
| `R2_PUBLIC_DOMAIN` | R2 퍼블릭 도메인 |
| `STORAGE_BACKEND` | `s3` 고정 |
| `TUNNEL_TOKEN` | Cloudflare Tunnel 토큰 |

---

## 월 예상 비용

| 서비스 | 비용 |
|--------|------|
| ECS Fargate (0.5vCPU / 1GB, 24/7) | ~$21 |
| ECR 스토리지 | ~$0.1 |
| CloudWatch Logs | ~$1 |
| Secrets Manager | ~$0.4 |
| Cloudflare Tunnel | 무료 |
| **합계** | **~$23/month** |

> 미사용 시 ECS 태스크를 0으로 줄여 ~$2/month 수준으로 절감 가능

---

## 비기능 요구사항

| 항목 | 기준 |
|------|------|
| Spring Boot 마이그레이션 호환 | Dockerfile 교체만으로 재배포 가능 |
| WebSocket 호환 | ECS + Cloudflare Tunnel 기본 지원 |
| 시크릿 평문 노출 금지 | Secrets Manager 사용 |
| 로그 보존 | CloudWatch Logs 30일 |

---

## 상세 plan 문서

| 단계 | 문서 |
|------|------|
| 백엔드 배포 절차 + 수동 배포 | [plan-infra-backend.md](plan-infra-backend.md) |
| 프론트엔드 배포 | [plan-infra-frontend.md](plan-infra-frontend.md) |
