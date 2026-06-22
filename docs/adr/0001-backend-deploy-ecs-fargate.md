# 0001. 백엔드 배포 플랫폼으로 ECS Fargate 채택

## Status

<!-- proposed · accepted · deprecated · superseded -->
accepted

---

## Context and Problem Statement

FastAPI 백엔드(업로드·문항 감지·PDF 생성)를 AWS에 배포해야 한다. 초기 인프라 명세는 Lambda 기반으로 작성(2026-05-04, `plan-infra-backend-api.md` / `plan-infra-backend-extractor.md`)되었으나, 문항 감지·PDF 렌더링이 PyMuPDF/pdfplumber/Tesseract 등 무거운 네이티브 의존성과 수 초~수십 초의 처리 시간을 요구하여 Lambda의 실행 시간·패키지 크기·콜드 스타트 제약과 충돌했다.

개인 서비스 수준에서 운영 단순성과 처리 시간 제약 회피를 동시에 만족하는 배포 형태를 결정해야 한다.

---

## Decision Drivers

- 문항 감지/PDF 생성의 긴 처리 시간(Lambda 15분 제한·콜드 스타트 부담)
- 네이티브 라이브러리(PyMuPDF, Tesseract) 패키징 난이도
- 개인 서비스 수준의 낮은 트래픽·비용 민감도
- 향후 Spring Boot 마이그레이션 시 인프라 재사용 가능성(Dockerfile 교체만으로)
- 퍼블릭 노출 없이 안전한 외부 접근 경로 확보

---

## Considered Options

- Option A: ECS Fargate + Cloudflare Tunnel
- Option B: Lambda (API/Extractor 분리, 컨테이너 이미지 런타임)
- Option C: 단일 EC2 인스턴스 + 직접 운영

---

## Decision Outcome

**Chosen option:** Option A — ECS Fargate + Cloudflare Tunnel

**Rationale:**

- 컨테이너 기반이라 네이티브 의존성을 Dockerfile에 그대로 담을 수 있고, 처리 시간 제한이 없다.
- Cloudflare Tunnel로 퍼블릭 IP/로드밸런서 없이 외부 접근을 제공해 비용·노출을 최소화한다.
- 런타임이 컨테이너로 추상화되어, 향후 Spring Boot 전환 시 인프라(태스크 정의·네트워킹) 재사용이 가능하다(`spec-infra.md` v3.0의 "향후 계획"과 정합).
- Lambda(Option B)는 콜드 스타트·15분 제한·이미지 크기 제약으로 추출 워크로드에 부적합. EC2(Option C)는 패치·스케일·가용성 운영 부담이 크다.

---

## Consequences

**Good:**

- 처리 시간 제약 없이 무거운 추출 작업 수행 가능
- 퍼블릭 엔드포인트 없이 안전한 접근(Cloudflare Tunnel)
- 컨테이너 표준화로 언어 전환(Python→Java) 시 인프라 재활용

**Bad:**

- 상시 구동 태스크는 요청이 없을 때도 최소 비용이 발생(Lambda의 0-스케일 대비 불리)
- Cloudflare Tunnel·ECS 네트워킹 구성의 초기 학습/설정 비용

> 관련 문서: `docs/infra/spec-infra.md`, `docs/infra/plan-infra-backend.md`
> 후속 검토: `docs/infra/plan-infra-backend-migration.md` (Java 전환 + DynamoDB)
