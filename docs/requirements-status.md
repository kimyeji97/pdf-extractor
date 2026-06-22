# 요구사항 추적 현황 (Requirements Status)

> 모든 요구사항(REQ)의 추가일·완료일·상태를 한눈에 추적하는 인덱스.
> 상세 명세는 [`docs/specs/`](specs/), 결정 기록은 [`docs/adr/`](adr/) 참고.
> 최종 갱신: 2026-06-22

## 범례

- ✅ 완료 · 🟡 진행/부분 · ❌ 미착수
- **추가일**: 요구사항이 문서에 처음 등재된 날짜
- **완료일**: 구현이 커밋된 날짜 (git 이력 기준)

---

## v2 — 시각적 브라우징 UX (spec.md, 2026-04-15)

| REQ | 기능명 | spec 문서 | 추가일 | 완료일 | 상태 |
|-----|--------|-----------|--------|--------|:----:|
| REQ-01 | 파일 목록 조회 | [20260415-REQ-01-file-list.md](specs/20260415-REQ-01-file-list.md) | 2026-04-15 | 2026-04-15 | ✅ |
| REQ-02 | 페이지 목록 브라우징 | [20260415-REQ-02-page-browse.md](specs/20260415-REQ-02-page-browse.md) | 2026-04-15 | 2026-04-15 | ✅ |
| REQ-03 | 문항 목록 조회·선택 | [20260415-REQ-03-question-pick.md](specs/20260415-REQ-03-question-pick.md) | 2026-04-15 | 2026-04-16 | ✅ |
| REQ-04 | 선택 바스켓 | [20260415-REQ-04-selection-basket.md](specs/20260415-REQ-04-selection-basket.md) | 2026-04-15 | 2026-04-16 | ✅ |
| REQ-05 | 교차 파일·페이지 누적 선택 | [20260415-REQ-05-cross-selection.md](specs/20260415-REQ-05-cross-selection.md) | 2026-04-15 | 2026-04-16 | ✅ |
| REQ-06 | 선택 문항 PDF 다운로드 | [20260415-REQ-06-pdf-export.md](specs/20260415-REQ-06-pdf-export.md) | 2026-04-15 | 2026-04-16 | ✅ |
| REQ-07 | 문항 추출 현황 비동기 조회 | [20260415-REQ-07-extraction-status.md](specs/20260415-REQ-07-extraction-status.md) | 2026-04-15 | 2026-04-16 | ✅ |
| REQ-08 | 업로드/생성 파일 분리 표시 | [20260415-REQ-08-job-source-result-split.md](specs/20260415-REQ-08-job-source-result-split.md) | 2026-04-15 | 2026-04-16 | ✅ |
| REQ-09 | 페이지별 문항 수 표시 | [20260415-REQ-09-page-question-count.md](specs/20260415-REQ-09-page-question-count.md) | 2026-04-15 | 2026-04-16 | ✅ |

---

## v3.0 — 목적별 메뉴 + 감지 정밀도 (spec-v3.md, 2026-04-26)

| REQ | 기능명 | spec 문서 | 추가일 | 완료일 | 상태 |
|-----|--------|-----------|--------|--------|:----:|
| REQ-10 | 상단 탭 메뉴 | [20260426-REQ-10-nav-menu.md](specs/20260426-REQ-10-nav-menu.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-11 | 파일 단위 문항 재감지 | [20260426-REQ-11-question-redetect.md](specs/20260426-REQ-11-question-redetect.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-12 | 문항 타이틀 수정 | [20260426-REQ-12-question-title-edit.md](specs/20260426-REQ-12-question-title-edit.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-13 | 수동 문항 영역 추가 | [20260426-REQ-13-manual-question-add.md](specs/20260426-REQ-13-manual-question-add.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-14 | 문항 일괄 삭제 | [20260426-REQ-14-question-bulk-delete.md](specs/20260426-REQ-14-question-bulk-delete.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-15 | 전체 페이지 크기 오탐지 표시 | [20260426-REQ-15-false-positive-fullpage.md](specs/20260426-REQ-15-false-positive-fullpage.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-16 | 문제집 문항 탐색·선택 | [20260426-REQ-16-workbook-question-browse.md](specs/20260426-REQ-16-workbook-question-browse.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-17 | 선택 문항 Canvas 미리보기 | [20260426-REQ-17-workbook-canvas-preview.md](specs/20260426-REQ-17-workbook-canvas-preview.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-18 | 페이지 그리드 레이아웃 선택 | [20260426-REQ-18-grid-layout-select.md](specs/20260426-REQ-18-grid-layout-select.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-19 | 문항 드래그 앤 드롭 재배치 | [20260426-REQ-19-question-dnd-reorder.md](specs/20260426-REQ-19-question-dnd-reorder.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-20 | 기존 문제집 불러와 편집 | [20260426-REQ-20-workbook-load-edit.md](specs/20260426-REQ-20-workbook-load-edit.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-21 | 생성된 문제집 이력 목록 | [20260426-REQ-21-workbook-history-list.md](specs/20260426-REQ-21-workbook-history-list.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-22 | 문제집 재다운로드 | [20260426-REQ-22-workbook-redownload.md](specs/20260426-REQ-22-workbook-redownload.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-23 | y_bottom 정밀화 | [20260426-REQ-23-tight-y-bottom.md](specs/20260426-REQ-23-tight-y-bottom.md) | 2026-04-26 | 2026-04-26 | ✅ |
| REQ-24 | 컬럼 x 경계 정밀화 | [20260426-REQ-24-column-x-precision.md](specs/20260426-REQ-24-column-x-precision.md) | 2026-04-26 | 2026-04-26 | ✅ |

---

## v3.1 — 버그 수정 및 개선 (spec-v3.md, 2026-04-27)

| REQ | 기능명 | spec 문서 | 추가일 | 완료일 | 상태 |
|-----|--------|-----------|--------|--------|:----:|
| REQ-B01 | 문제집 이력 미노출 버그 수정 | [20260427-REQ-B01-workbook-history-save-fix.md](specs/20260427-REQ-B01-workbook-history-save-fix.md) | 2026-04-27 | 2026-04-27 | ✅ |
| REQ-B02 | 문항 식별자 체계 통일 | [20260427-REQ-B02-question-id-scheme.md](specs/20260427-REQ-B02-question-id-scheme.md) | 2026-04-27 | 2026-04-27 | ✅ |
| REQ-C01 | 문제집 파일명 입력 | [20260428-REQ-C01-workbook-filename-input.md](specs/20260428-REQ-C01-workbook-filename-input.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-C02 | 6단 레이아웃 2×3로 변경 | [20260428-REQ-C02-grid-6up-2x3.md](specs/20260428-REQ-C02-grid-6up-2x3.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-C03 | 2단 → 세로 2단 명칭 변경 | [20260428-REQ-C03-grid-rename-vertical-2up.md](specs/20260428-REQ-C03-grid-rename-vertical-2up.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-C04 | 가로 2단 레이아웃 추가 | [20260428-REQ-C04-grid-horizontal-2up.md](specs/20260428-REQ-C04-grid-horizontal-2up.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-C05 | 열 간 세로 구분선 | [20260428-REQ-C05-column-divider-line.md](specs/20260428-REQ-C05-column-divider-line.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-C06 | 셀 좌측 상단 정렬 | [20260428-REQ-C06-cell-top-left-align.md](specs/20260428-REQ-C06-cell-top-left-align.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-D01 | 문항 이미지 대형화·타이틀 상단 | [20260428-REQ-D01-question-image-enlarge.md](specs/20260428-REQ-D01-question-image-enlarge.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-D02 | 분석 메뉴 담기/다운로드 제거 | [20260428-REQ-D02-remove-basket-from-analysis.md](specs/20260428-REQ-D02-remove-basket-from-analysis.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-D03 | 재감지 버튼 파일 섹션 이동 | [20260428-REQ-D03-move-redetect-to-file-section.md](specs/20260428-REQ-D03-move-redetect-to-file-section.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-D04 | 파일+페이지 패널 통합 | [20260428-REQ-D04-merge-file-page-panel.md](specs/20260428-REQ-D04-merge-file-page-panel.md) | 2026-04-27 | 2026-04-28 | ✅ |
| REQ-E01 | 감지 진행률 WebSocket 스트리밍 | [20260427-REQ-E01-detection-progress-websocket.md](specs/20260427-REQ-E01-detection-progress-websocket.md) | 2026-04-27 | — | ❌ 차후 개발 예정 |

---

## 추가 요구사항 (REQ 신규 부여)

| REQ | 기능명 | spec 문서 | 추가일 | 완료일 | 상태 |
|-----|--------|-----------|--------|--------|:----:|
| REQ-25 | 배경색 기반 문항 오탐지 필터 | [20260526-REQ-25-bg-color-filter.md](specs/20260526-REQ-25-bg-color-filter.md) | 2026-05-26 | 2026-06-22 | ✅ |
| REQ-26 | 표지 이미지 관리·문제집 표지 삽입 | [20260502-REQ-26-cover-image.md](specs/20260502-REQ-26-cover-image.md) | 2026-05-02 | 2026-05-02 | ✅ |
| REQ-B03 | workbook_types 응답 누락 수정 | [20260526-REQ-B03-workbook-types-response-fix.md](specs/20260526-REQ-B03-workbook-types-response-fix.md) | 2026-05-26 | 2026-06-22 | ✅ |

---

## v3.2 — 로딩 UX 및 분석 레이아웃 개선 (spec-v3.md / 2026-06-01 plan)

| REQ | 기능명 | spec 문서 | 추가일 | 완료일 | 상태 |
|-----|--------|-----------|--------|--------|:----:|
| REQ-F01 | 전체 화면 로딩 딤 | [20260601-REQ-F01-global-loading-dim.md](specs/20260601-REQ-F01-global-loading-dim.md) | 2026-06-01 | 2026-06-22 | ✅ |
| REQ-F02 | 이미지 로딩 스켈레톤 딤 | [20260601-REQ-F02-image-skeleton.md](specs/20260601-REQ-F02-image-skeleton.md) | 2026-06-01 | 2026-06-22 | ✅ |
| REQ-F03 | 분석 섹션 비율 조정 | [20260601-REQ-F03-section-ratio-adjust.md](specs/20260601-REQ-F03-section-ratio-adjust.md) | 2026-06-01 | 2026-06-22 | ✅ |
| REQ-F04 | 3섹션 문항 카드 스크롤 | [20260601-REQ-F04-question-list-scroll.md](specs/20260601-REQ-F04-question-list-scroll.md) | 2026-06-01 | 2026-06-22 | ✅ |
| REQ-F05 | 수동 추가 모드 1·3섹션 잠금 | [20260601-REQ-F05-manual-mode-lock.md](specs/20260601-REQ-F05-manual-mode-lock.md) | 2026-06-01 | 2026-06-22 | ✅ |

---

## 인프라 (docs/infra/)

> REQ 번호 없는 배포 영역. 배포 플랫폼 결정은 [ADR 0001](adr/0001-backend-deploy-ecs-fargate.md)로 승격.
> 배포 방식은 **전부 수동(AWS CLI + Cloudflare 콘솔)** — IaC(Terraform 등)·CI/CD 없음. 레포 산출물은 `backend/Dockerfile`뿐.
> 범례: 📄 명세만 · 🟡 부분/수동 · ✅ 구축 완료 · 🔴 계획/미착수

### 아키텍처

```
브라우저 → Cloudflare(DNS+CDN+WAF)
  ├─ dailystudy-dev.yejicraft-cf.com               → Cloudflare Pages (프론트)
  └─ dailystudy-workbook-api-dev.yejicraft-cf.com  → Cloudflare Tunnel(pdf-extractor-dev)
        → ECS Fargate Task (0.5 vCPU / 1GB)
             ├─ backend (FastAPI :8000)
             └─ cloudflared (Tunnel)   ← 인바운드 미개방, 아웃바운드 터널만
        → Cloudflare R2 (스토리지)
```

### dev 환경 — ✅ 구축 완료 (수동)

| 영역 | 구성된 리소스 | 상태 |
|------|--------------|:----:|
| AWS 계정/리전 | `504233295989` / `ap-northeast-2` | ✅ |
| ECR | `pdf-extractor-backend` | ✅ |
| ECS 클러스터/서비스 | `pdf-extractor-cluster` / `pdf-extractor-backend-dev-svc` (태스크 1) | ✅ |
| 태스크 정의 | `pdf-extractor-backend-dev` (backend + cloudflared) | ✅ |
| 보안그룹 | `sg-07d2336bbf0ec09ea` (인바운드 없음) | ✅ |
| Secrets Manager | `pdf-extractor/dev` (R2 자격증명 + Tunnel 토큰) | ✅ |
| IAM 역할 | `pdf-extractor-ecs-execution-role` | ✅ |
| CloudWatch Logs | `/ecs/pdf-extractor-dev` (30일) | ✅ |
| Cloudflare Tunnel | `pdf-extractor-dev` (ID `5793d4b8-…169a`) | ✅ |
| Cloudflare R2 | 버킷 `dailystudy-dev`, prefix `pdf-extractor` | ✅ |
| 프론트 (Cloudflare Pages) | `pdf-extractor-frontend` — `dist` 수동 업로드 | 🟡 수동 |

> 상시 운영 ~$23/월, 미사용 시 `desired-count 0`으로 ~$2/월. 수동 배포·운영 절차는 `QUICKSTART.md` / [plan-infra-backend.md](infra/plan-infra-backend.md) 참고.

### 계획 문서 / 미착수

| 항목 | 문서 | 추가일 | 상태 |
|------|------|--------|:----:|
| 인프라 구성 명세 (ECS + Cloudflare Tunnel) | [spec-infra.md](infra/spec-infra.md) | 2026-05-16 | ✅ dev 반영 |
| 백엔드 배포 절차 (ECS) | [plan-infra-backend.md](infra/plan-infra-backend.md) | 2026-05-16 | ✅ dev 구축 |
| 프론트엔드 배포 (Cloudflare Pages) | [plan-infra-frontend.md](infra/plan-infra-frontend.md) | 2026-05-16 | 🟡 수동 배포 |
| 관리 서버 API 분리 (Lambda 검토) | [plan-infra-backend-api.md](infra/plan-infra-backend-api.md) | 2026-05-04 | 🔴 계획(ADR 0001로 ECS 채택) |
| 추출 서버 분리 (Lambda 검토) | [plan-infra-backend-extractor.md](infra/plan-infra-backend-extractor.md) | 2026-05-04 | 🔴 계획(ADR 0001로 ECS 채택) |
| Java 전환 + DynamoDB 마이그레이션 | [plan-infra-backend-migration.md](infra/plan-infra-backend-migration.md) | 2026-05-16 | 🔴 향후 |
| **prod 환경** | (도메인·구성 추후 결정) | — | 🔴 미착수 |
| **IaC / CI·CD 자동화** | (Terraform·파이프라인 없음) | — | 🔴 미착수 |

---

## 관련 ADR

| ADR | 제목 | 상태 |
|-----|------|:----:|
| [0001](adr/0001-backend-deploy-ecs-fargate.md) | 백엔드 배포 플랫폼으로 ECS Fargate 채택 | accepted |
| [0002](adr/0002-question-id-composite-key.md) | 문항 식별자를 복합 키 체계로 통일 (REQ-B02) | accepted |
| [0003](adr/0003-bg-color-false-positive-postfilter.md) | 배경색 오탐지 필터를 문항 후처리 방식으로 채택 (REQ-25) | accepted |

---

## 미해결 / 참고

- **REQ-E01 (감지 진행률 WebSocket)**: 미구현 — **차후 개발 예정**. 백엔드 WS 엔드포인트·프론트 훅 미작성.
- **표지(cover) 기능**: REQ-26으로 정식 스펙화 완료(사후 문서화). 기능은 2026-05-02 구현됨.
- **기존 작업계획서 정리**: 구 plan 문서(`spec.md`, `spec-v3.md`, `feature/*/plan*.md`)는 본 specs/adr로 정규화 후 `docs/_archive/`로 이관함.
- REQ 번호 부여 원칙: 정식 기능 요구사항은 숫자(REQ-NN), v3.1 액션 아이템은 분류 접두어(B=버그, C=문제집 생성, D=문항 분석, E=감지 UX, F=로딩/레이아웃 UX).
