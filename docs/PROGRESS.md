# 진행 현황 (PROGRESS)

> 시간순 작업 로그. git이 말하지 못하는 **왜 / 함정 / 기각 이유**를 남긴다.
> 파일명·라인수처럼 `git show`로 볼 수 있는 건 적지 않는다.
> 깨면 회귀하는 **계약**은 이 파일이 아니라 [`CLAUDE.md`](../CLAUDE.md)에 둔다.
>
> 조회는 `/progress`, 갱신은 `/checkpoint`.
> 최종 갱신: 2026-07-27

## 요구사항 인덱스

범례: ✅ 완료 · 🟡 진행 · ⏸ 보류 · ❌ 기각/미착수

### v2 — 시각적 브라우징 UX (2026-04-15)

| REQ | 기능명 | 스펙 | 완료일 | 상태 |
|-----|--------|------|--------|:----:|
| REQ-01 | 파일 목록 조회 | [spec](specs/20260415-REQ-01-file-list.md) | 2026-04-15 | ✅ |
| REQ-02 | 페이지 목록 브라우징 | [spec](specs/20260415-REQ-02-page-browse.md) | 2026-04-15 | ✅ |
| REQ-03 | 문항 목록 조회·선택 | [spec](specs/20260415-REQ-03-question-pick.md) | 2026-04-16 | ✅ |
| REQ-04 | 선택 바스켓 | [spec](specs/20260415-REQ-04-selection-basket.md) | 2026-04-16 | ✅ |
| REQ-05 | 교차 파일·페이지 누적 선택 | [spec](specs/20260415-REQ-05-cross-selection.md) | 2026-04-16 | ✅ |
| REQ-06 | 선택 문항 PDF 다운로드 | [spec](specs/20260415-REQ-06-pdf-export.md) | 2026-04-16 | ✅ |
| REQ-07 | 문항 추출 현황 비동기 조회 | [spec](specs/20260415-REQ-07-extraction-status.md) | 2026-04-16 | ✅ |
| REQ-08 | 업로드/생성 파일 분리 표시 | [spec](specs/20260415-REQ-08-job-source-result-split.md) | 2026-04-16 | ✅ |
| REQ-09 | 페이지별 문항 수 표시 | [spec](specs/20260415-REQ-09-page-question-count.md) | 2026-04-16 | ✅ |

### v3.0 — 목적별 메뉴 + 감지 정밀도 (2026-04-26)

| REQ | 기능명 | 스펙 | 완료일 | 상태 |
|-----|--------|------|--------|:----:|
| REQ-10 | 상단 탭 메뉴 | [spec](specs/20260426-REQ-10-nav-menu.md) | 2026-04-26 | ✅ |
| REQ-11 | 파일 단위 문항 재감지 | [spec](specs/20260426-REQ-11-question-redetect.md) | 2026-04-26 | ✅ |
| REQ-12 | 문항 타이틀 수정 | [spec](specs/20260426-REQ-12-question-title-edit.md) | 2026-04-26 | ✅ |
| REQ-13 | 수동 문항 영역 추가 | [spec](specs/20260426-REQ-13-manual-question-add.md) | 2026-04-26 | ✅ |
| REQ-14 | 문항 일괄 삭제 | [spec](specs/20260426-REQ-14-question-bulk-delete.md) | 2026-04-26 | ✅ |
| REQ-15 | 전체 페이지 크기 오탐지 표시 | [spec](specs/20260426-REQ-15-false-positive-fullpage.md) | 2026-04-26 | ✅ |
| REQ-16 | 문제집 문항 탐색·선택 | [spec](specs/20260426-REQ-16-workbook-question-browse.md) | 2026-04-26 | ✅ |
| REQ-17 | 선택 문항 Canvas 미리보기 | [spec](specs/20260426-REQ-17-workbook-canvas-preview.md) | 2026-04-26 | ✅ |
| REQ-18 | 페이지 그리드 레이아웃 선택 | [spec](specs/20260426-REQ-18-grid-layout-select.md) | 2026-04-26 | ✅ |
| REQ-19 | 문항 드래그 앤 드롭 재배치 | [spec](specs/20260426-REQ-19-question-dnd-reorder.md) | 2026-04-26 | ✅ |
| REQ-20 | 기존 문제집 불러와 편집 | [spec](specs/20260426-REQ-20-workbook-load-edit.md) | 2026-04-26 | ✅ |
| REQ-21 | 생성된 문제집 이력 목록 | [spec](specs/20260426-REQ-21-workbook-history-list.md) | 2026-04-26 | ✅ |
| REQ-22 | 문제집 재다운로드 | [spec](specs/20260426-REQ-22-workbook-redownload.md) | 2026-04-26 | ✅ |
| REQ-23 | y_bottom 정밀화 | [spec](specs/20260426-REQ-23-tight-y-bottom.md) | 2026-04-26 | ✅ |
| REQ-24 | 컬럼 x 경계 정밀화 | [spec](specs/20260426-REQ-24-column-x-precision.md) | 2026-04-26 | ✅ |

### v3.1 — 버그 수정 및 개선 (2026-04-27)

| REQ | 기능명 | 스펙 | 완료일 | 상태 |
|-----|--------|------|--------|:----:|
| REQ-B01 | 문제집 이력 미노출 버그 수정 | [spec](specs/20260427-REQ-B01-workbook-history-save-fix.md) | 2026-04-27 | ✅ |
| REQ-B02 | 문항 식별자 체계 통일 | [spec](specs/20260427-REQ-B02-question-id-scheme.md) | 2026-04-27 | ✅ |
| REQ-C01 | 문제집 파일명 입력 | [spec](specs/20260428-REQ-C01-workbook-filename-input.md) | 2026-04-28 | ✅ |
| REQ-C02 | 6단 레이아웃 2×3로 변경 | [spec](specs/20260428-REQ-C02-grid-6up-2x3.md) | 2026-04-28 | ✅ |
| REQ-C03 | 2단 → 세로 2단 명칭 변경 | [spec](specs/20260428-REQ-C03-grid-rename-vertical-2up.md) | 2026-04-28 | ✅ |
| REQ-C04 | 가로 2단 레이아웃 추가 | [spec](specs/20260428-REQ-C04-grid-horizontal-2up.md) | 2026-04-28 | ✅ |
| REQ-C05 | 열 간 세로 구분선 | [spec](specs/20260428-REQ-C05-column-divider-line.md) | 2026-04-28 | ✅ |
| REQ-C06 | 셀 좌측 상단 정렬 | [spec](specs/20260428-REQ-C06-cell-top-left-align.md) | 2026-04-28 | ✅ |
| REQ-D01 | 문항 이미지 대형화·타이틀 상단 | [spec](specs/20260428-REQ-D01-question-image-enlarge.md) | 2026-04-28 | ✅ |
| REQ-D02 | 분석 메뉴 담기/다운로드 제거 | [spec](specs/20260428-REQ-D02-remove-basket-from-analysis.md) | 2026-04-28 | ✅ |
| REQ-D03 | 재감지 버튼 파일 섹션 이동 | [spec](specs/20260428-REQ-D03-move-redetect-to-file-section.md) | 2026-04-28 | ✅ |
| REQ-D04 | 파일+페이지 패널 통합 | [spec](specs/20260428-REQ-D04-merge-file-page-panel.md) | 2026-04-28 | ✅ |
| REQ-E01 | 감지 진행률 WebSocket 스트리밍 | [spec](specs/20260427-REQ-E01-detection-progress-websocket.md) | — | ❌ 차후 |

### 추가 요구사항

| REQ | 기능명 | 스펙 | 완료일 | 상태 |
|-----|--------|------|--------|:----:|
| REQ-25 | 배경색 기반 문항 오탐지 필터 | [spec](specs/20260526-REQ-25-bg-color-filter.md) | 2026-06-22 | ✅ |
| REQ-26 | 표지 이미지 관리·문제집 표지 삽입 | [spec](specs/20260502-REQ-26-cover-image.md) | 2026-05-02 | ✅ |
| REQ-B03 | workbook_types 응답 누락 수정 | [spec](specs/20260526-REQ-B03-workbook-types-response-fix.md) | 2026-06-22 | ✅ |

### v3.2 — 로딩 UX 및 분석 레이아웃 (2026-06-01)

| REQ | 기능명 | 스펙 | 완료일 | 상태 |
|-----|--------|------|--------|:----:|
| REQ-F01 | 전체 화면 로딩 딤 | [spec](specs/20260601-REQ-F01-global-loading-dim.md) | 2026-06-22 | ✅ |
| REQ-F02 | 이미지 로딩 스켈레톤 딤 | [spec](specs/20260601-REQ-F02-image-skeleton.md) | 2026-06-22 | ✅ |
| REQ-F03 | 분석 섹션 비율 조정 | [spec](specs/20260601-REQ-F03-section-ratio-adjust.md) | 2026-06-22 | ✅ |
| REQ-F04 | 3섹션 문항 카드 스크롤 | [spec](specs/20260601-REQ-F04-question-list-scroll.md) | 2026-06-22 | ✅ |
| REQ-F05 | 수동 추가 모드 1·3섹션 잠금 | [spec](specs/20260601-REQ-F05-manual-mode-lock.md) | 2026-06-22 | ✅ |

### 2026-06~07 — 뷰어·버그·성능·리디자인

| REQ | 기능명 | 스펙 | 완료일 | 상태 |
|-----|--------|------|--------|:----:|
| REQ-B04 | 문항 썸네일 미표시 + 목록 스크롤 | [spec](specs/20260629-REQ-B04-question-thumbnail-not-displayed.md) | 2026-07-04 | ✅ |
| REQ-F06 | 생성 이력 PDF 미리보기 | [spec](specs/20260629-REQ-F06-history-pdf-preview.md) | 2026-07-04 | ✅ |
| REQ-P01 | 문항 일괄 조회 API | [spec](specs/20260629-REQ-P01-bulk-questions-api.md) | 2026-07-04 | ✅ |
| REQ-D05 | 표지 2패널 디자인 통일 | [spec](specs/20260629-REQ-D05-cover-design-unification.md) | — | ❌ D06으로 대체 |
| REQ-B05 | PDF 뷰어 툴바 고정 + 이전/다음 이동 | [spec](specs/20260716-REQ-B05-pdf-viewer-toolbar-fix.md) | 2026-07-21 | ✅ |
| REQ-B06 | 문항 벌크 삭제 경쟁 상태 | [spec](specs/20260716-REQ-B06-question-bulk-delete-fix.md) | 2026-07-21 | ✅ |
| REQ-B07 | 오탐 문항 체크박스 활성화 | [spec](specs/20260716-REQ-B07-false-positive-checkbox-delete.md) | 2026-07-21 | ✅ |
| REQ-B08 | 편집 문항 목록 내부 스크롤 | [spec](specs/20260716-REQ-B08-editor-question-scroll.md) | 2026-07-21 | ✅ |
| REQ-B09 | PDF 라벨 한글 미렌더 | [spec](specs/20260716-REQ-B09-pdf-label-truncation.md) | 2026-07-21 | ✅ |
| REQ-C07 | 문항 라벨 포맷 변경 | [spec](specs/20260716-REQ-C07-question-label-format.md) | 2026-07-21 | ✅ |
| REQ-F07 | 문항 분석 미리보기 PDF 뷰어 전환 | [spec](specs/20260716-REQ-F07-analysis-page-pdf-viewer.md) | 2026-07-21 | ✅ |
| REQ-F08 | 편집 미리보기 스크롤 방향 | [spec](specs/20260716-REQ-F08-preview-scroll-direction.md) | 2026-07-21 | ✅ |
| REQ-D06 | 표지 목록형 1패널 + 업로드 모달 | [spec](specs/20260716-REQ-D06-cover-list-single-panel.md) | 2026-07-21 | ✅ |
| REQ-P03 | 서버 성능 (썸네일 병목·캐시·페이지네이션) | [spec](specs/20260716-REQ-P03-thumbnail-response-time.md) | 2026-07-25 | ✅ P03-06만 기각 |
| REQ-P02 | 클라 성능 (가상화·dedup·memo 등 10건) | [spec](specs/20260629-REQ-P02-performance-improvements.md) | 2026-07-22 | ✅ |
| REQ-C08 | 문제집·소스 삭제 (연관 저장물 포함) | — | 2026-07-25 | ✅ |
| REQ-D07 | 프론트 전면 리디자인 (Minimal 템플릿) | [spec](specs/20260725-REQ-D07-minimal-template-adoption.md) | — | 🟡 Phase 3-4 차례 |

### 인프라 (docs/infra/)

> REQ 번호 없는 배포 영역. 배포 플랫폼 결정은 [ADR-0001](adr/0001-backend-deploy-ecs-fargate.md)로 승격.
> **배포는 전부 수동**(AWS CLI + Cloudflare 콘솔) — IaC·CI/CD 없음. 레포 산출물은 `backend/Dockerfile`뿐.

dev 환경은 구축 완료. ECR / ECS 클러스터·서비스 / 태스크 정의(backend + cloudflared) / 보안그룹(인바운드 없음) /
Secrets Manager / IAM 실행역할 / CloudWatch Logs(30일) / Cloudflare Tunnel / R2 버킷 전부 ✅.
프론트(Cloudflare Pages)만 `dist` 수동 업로드 🟡.

> 상시 운영 ~$23/월, 미사용 시 `desired-count 0`으로 ~$2/월.
> 절차는 `QUICKSTART.md` / [plan-infra-backend.md](infra/plan-infra-backend.md).

| 항목 | 문서 | 상태 |
|------|------|:----:|
| 인프라 구성 명세 | [spec-infra.md](infra/spec-infra.md) | ✅ dev 반영 |
| 백엔드 배포 절차 | [plan-infra-backend.md](infra/plan-infra-backend.md) | ✅ dev 구축 |
| 프론트엔드 배포 | [plan-infra-frontend.md](infra/plan-infra-frontend.md) | 🟡 수동 |
| 관리 서버 API 분리 (Lambda 검토) | [plan-infra-backend-api.md](infra/plan-infra-backend-api.md) | ❌ ADR-0001로 ECS 채택 |
| 추출 서버 분리 (Lambda 검토) | [plan-infra-backend-extractor.md](infra/plan-infra-backend-extractor.md) | ❌ ADR-0001로 ECS 채택 |
| Java 전환 + DynamoDB 마이그레이션 | [plan-infra-backend-migration.md](infra/plan-infra-backend-migration.md) | ❌ 향후 |
| prod 환경 | (추후 결정) | ❌ 미착수 |
| IaC / CI·CD 자동화 | — | ❌ 미착수 |

---

# 로그

<!-- 최신이 위. 날짜 헤딩은 `## YYYY-MM-DD` 형식을 반드시 지킬 것 (/progress 가 파싱) -->

## 2026-07-27

### 진행 기록 체계 분리

진행 현황이 `CLAUDE.md` 안에서 205줄(전체의 40%)까지 불어나 이 파일로 분리했다.
`docs/requirements-status.md`(2026-06-22 이후 갱신 중단)를 상단 인덱스로 흡수하고 삭제했다 —
같은 정보를 담은 문서가 둘이면 반드시 한쪽이 썩는다.

**계약은 옮기지 않았다.** 어기면 회귀하는 규칙(높이 체인, 뷰어 좌표 공식, 미들웨어 순서 등)은
`CLAUDE.md`의 `## 계약` 절에 남겼다. `CLAUDE.md`는 매 세션 자동 로드되지만 이 파일은 필요할 때만
읽힌다 — 계약을 여기 묻으면 다음에 똑같이 깨진다.

조회·기록은 전역 커스텀 커맨드 `/progress`, `/checkpoint`로 한다.
실체는 `~/project_sources/_init/claude-commands`(별도 저장소), 각 계정 프로필의
`commands` 디렉토리가 심볼릭 링크로 연결된다.

**이관 중 발견 — 날짜 오류**: 기존 §0-1이 "2026-07-22 추가 작업"으로 적혀 있었으나
해당 커밋(`c090d2a`, `71236c0`, `b8d40aa`, `0d8a163`)은 전부 **07-21**이었다. git 기준으로 바로잡았다.
손으로 적은 날짜는 어긋난다는 근거이고, `/progress`가 git을 1차 소스로 삼는 이유다.

**함정 — git의 bare 날짜 파싱은 조용히 실패한다**:
`--since=2026-07-25 --until=2026-07-26` → 0건(실제 커밋 5개 존재),
`--since=2026-07-25T00:00:00 --until=2026-07-26T00:00:00` → 5건. 반드시 완전 ISO 형식으로 넘길 것.

## 2026-07-26

### REQ-D07 리디자인 — Phase 1·2·3-1·3-2·3-3

상세는 [D07 스펙](specs/20260725-REQ-D07-minimal-template-adoption.md) §4-1.

| Phase | 커밋 | 요점 |
|-------|------|------|
| 1 기반 교체 | `bcc2e35` | 테마는 템플릿 원본 그대로, 레이아웃 core만 쓰고 dashboard는 우리 라우트로 재작성. `minimal-shared`+`@fontsource` 도입(Google Fonts 링크 제거). **123파일 삭제, 번들 955→495KB** |
| 2 스타일 통일 | `d457ede` | 인라인 style 0개, JSX hex 48→0, **App.css 1,115→707줄**, body 전역 규칙을 테마로 이관 |
| 3-1 분석 목록 | `2c8f8fc` | `BookCard` 신설(책등+두께 B안). 책등 색은 **이름 해시**로 확정 |
| 3-2·3-3 표지·이력 | `169ceea` | BookCard 재사용 + `selected`, 액션 호버 노출. 백엔드 `_pdf_key_of()`로 EXPORT 썸네일 404 수정 |

**알게 된 것**

- **높이 체인이 이식의 핵심 적응 지점**: 템플릿은 body가 스크롤되는 문서형 전제. 이 앱은 100dvh 작업대라
  root→sidebarContainer→main 전 구간에 `flex:1`/`minHeight:0`/`overflow:hidden`을 걸어야 한다.
  이게 REQ-B04·B05·B08 계약의 뿌리다.
- **우리 코드에도 죽은 파일이 있었다**: `QuestionPicker`(624줄)·`SelectionBasket`(366줄)·`StatusPoller`·
  `QuestionInput`·`NavMenu`. 도달성 분석(진입점부터 import 추적)으로 확인 후 제거 —
  Phase 3 마이그레이션 대상에서 ~1,100줄이 빠졌다.
- **`WorkbookPreview`의 색은 토큰화하지 않는다**: UI 색이 아니라 생성될 PDF 지면을 재현한 값이고
  `pdf_service`의 라벨 배경과 짝을 이룬다. `PAPER` 상수로 이름만 붙였다.
- **책등 색은 유형이 아니라 이름 해시**: 실데이터의 `workbook_types`가 자유 입력이라 5권에 13종이고
  고정 분류가 없었다.
- MUI 7.0(템플릿) → 7.3(우리)에서 `shape.borderRadius` 타입이 `number | string`으로 넓어졌다.

**남은 것**: Phase 3-4(문항 분석 작업 — 뷰어 좌표·높이 체인 계약 집중),
3-5(문제집 편집 868줄 + 멀티 파일 선택 노출), Phase 4(추가 기능).

## 2026-07-25

### 테스트 발견 버그·개선 6건 (커밋 `a778803`)

`docs/예정된작업.md` 2026.07.25 목록 중 서버 여백 2건·로그인/공유를 제외한 전부.

- **생성 이력→편집 복원 시 이미지 없음**: `editor/index.jsx`가 `thumbnailUrl: null`을 하드코딩하고 있었다.
  썸네일 URL은 결정적이라 조립하면 된다. 같은 자리에서 `questionId`도 복합키로 바로잡았다 —
  번호만 쓰면 멀티 파일 문제집에서 키가 충돌한다.
- **① 문항 수에 수동 문항 누락**: `list_pages`의 `question_count`가 `questions_per_page`(자동 감지분)에서만
  나왔다 → 전체 문항 일괄 API로 페이지별 재집계. 같은 데이터로 **오탐 페이지 하이라이트**도 구현.
- 이름/유형 편집을 문제집 편집 → 문항 분석 목록으로 이동.
- **삭제 기능 2종 신설** (REQ-C08): `DELETE /api/jobs/{id}`, `DELETE /api/workbooks/{id}`.
  사용자 결정에 따라 **연관 저장물 전부 삭제**(원본·결과·상태·경계·썸네일·수동문항·페이지캐시).
  R2는 `delete_objects` 1,000개 배치. 소스를 지우면 그 문항으로 만든 이력은 남지만 편집 화면 이미지가
  안 보인다 — 다이얼로그에 명시했다.
- **문항별 배율 조절**: `SelectionItem.scale` 신설. PDF는 `show_pdf_page`에 대상 클리핑이 없어
  **넘치는 만큼 원본 clip을 줄이는** 방식으로 구현(벡터 유지 + 이웃 셀 침범 없음).
  연타 시 stale 값이 쓰이던 버그를 updater 전달로 수정.

### REQ-P03-03 목록 API 페이지네이션 (커밋 `1800fd3`) — P03 전체 완료

보류였던 마지막 성능 항목. 사용자 결정: **무한 스크롤 + 검색 서버 이관 + jobs·workbooks 둘 다**.

**검색을 서버로 옮겨야 했던 이유**: 분석 목록·편집 파일 목록이 전체를 받아 클라에서 이름/유형을
필터링하고 있었다. 서버 페이지네이션만 넣으면 검색이 "현재 불러온 페이지 안"에서만 동작하는
**기능 회귀**가 된다. 그래서 `name`·`types` 쿼리 파라미터를 신설하고 프론트는 300ms 디바운스로 넘긴다.

- **응답 형태 변경**(`browse.py`): `{source_jobs, export_jobs}` → `{items, total, skip, limit}` + `job_type` 쿼리.
  기존 형태는 SOURCE/EXPORT를 한 번에 내려 각각 페이징이 불가능했다.
  **`export_jobs`는 프론트에서 아무도 소비하지 않던 것**을 확인하고 진행했다.
  ⚠️ `job_type`은 enum 값이라 **대문자**(`SOURCE`/`EXPORT`) — 소문자는 422(초기 구현에서 실제로 밟았다).
- **`WorkbookSummary` 신설**: 문제집 **목록** 응답에서 `selections` 제외. 목록 화면은 쓰지도 않는데
  문항 수십~수백 건이 통째로 실려 있었다. 실측 — 목록 20건 3.9KB vs 단건 상세 1건 5.7KB(selections 40개).
  편집 복원용 selections는 단건 조회에서 그대로 제공한다.
- **R2 목록 조회 병렬화**(`s3_service._get_json_many`, `ThreadPoolExecutor(12)`): **이번 작업의 진짜 성능 이득**.
  페이지네이션을 넣어도 정렬(uploaded_at/created_at 내림차순)하려면 전체 status JSON을 읽어야 하고,
  그게 키 1건당 R2 GET 1회다. **실측 16건 순차 1.311s → 병렬 0.314s(4.2배)**,
  키당 왕복 ~82ms라 100건 누적 시 순차면 ~8초.
- **프론트 무한 스크롤**: 공용 훅 `hooks/usePaginatedList.js`(IntersectionObserver, rootMargin 200px,
  요청 ID로 stale 응답 폐기) + `hooks/useDebouncedValue.js` 신설. 3개 화면에 적용.
  `FileListPanel`의 `refreshTrigger`는 **값이 실제로 바뀐 경우에만** 재조회 —
  안 그러면 검색어 변경 시 훅 재로드와 겹쳐 중복 요청이 난다.
- **검증**: 합성 데이터(SOURCE 47 + EXPORT 13 + 문제집 35)를 로컬 스토리지에 만들어 headless Chrome/CDP로 확인.
  분석 목록 20→40→47 후 요청 중단, 편집 파일 목록 동일 + 유형 검색 '과학' 9건, 생성 이력 20→35,
  디바운스 5글자 입력 → 요청 1회. 실제 R2 데이터로도 스모크 테스트(jobs ~0.25s, workbooks ~0.19s).

**결론**: REQ-P03 전체 완료(P03-06만 정확도 회귀로 기각). 성능 작업(P02+P03) 전부 종료.

## 2026-07-22

### REQ-P03 서버 성능 마무리

**P03-01 전 페이지 썸네일 프리워밍** (커밋 `abaccdc`): `prewarm_service.py` 신설. 업로드 감지·재감지 둘 다
**`boundaries_status=DONE` 저장 후** 이미 로드된 `pdf_bytes`로 전 페이지 썸네일 + 감지된 전체 문항 크롭을
미리 렌더링해 캐시에 저장한다.
**중요 발견**: R2 PUT 1건이 실측 ~270ms라 순차 처리 시 job당(132p/573문항) 3~4분이 걸린다 —
애초 "렌더만 30ms×N≈6초" 추정은 R2 업로드 왕복을 빠뜨린 과소 추정이었다.
`ThreadPoolExecutor(max_workers=12)`로 병렬화해 12~20초로 단축.
`head_object`의 `LastModified`로 실행 확인, 이후 개별 썸네일 GET은 0.2~0.45초(캐시 히트).

**P03-05 재검토 — 조치 불필요**: `get_question_thumbnail_endpoint`를 다시 보니 `git blame` 상
**최초 작성 커밋(`d4367ce`)부터** 이미 `pdf_bytes`를 boundary 감지와 썸네일 생성에 재사용하고 있었다.
스펙 작성 당시 진단이 실제 코드와 맞지 않았던 것 — 코드 변경 없이 완료 처리.

**P03-04 ProcessPoolExecutor 분리** (커밋 `d461a3d`): `extract.py`에 모듈 레벨
`ProcessPoolExecutor(max_workers=2)`(ECS 0.5 vCPU 고려). 목적은 CPU 작업이 **메인 프로세스 GIL**을 점유해
다른 요청 처리를 지연시키는 걸 막는 것 — 총 vCPU는 그대로지만 GIL 분리 효과가 있다.
실측 오버헤드 거의 없음(12.76s vs 12.66s). `SelectionItem` pydantic 모델은 pickle 가능함을 확인했다.

**P03-06 adaptive 조건부 실행 — 시도 후 기각**: 정규식 커버리지 80% 이상이면 adaptive를 스킵하는
스펙 원안을 구현해 실제 job(198p/388문항)으로 검증했다.
**결과: adaptive 강제 393문항 vs 조건부 스킵 378문항 = 15문항 누락.**
원인은 "regex_coverage"가 **페이지 단위**(그 페이지에 정규식 매칭이 1개라도 있는지)만 보기 때문 —
한 페이지 안에서 일부 문항만 정규식에 걸리고 나머지를 adaptive가 보완해야 하는 경우를 못 걸러낸다.
P03-01에서 이미 adaptive 자체가 병목이 아님(전체 파싱 ~14ms)을 확인했으므로 성능 이득도 없다 → **원복**.
문항 감지는 핵심 비즈니스 로직이라 이런 트레이드오프는 받아들이지 않기로 했다.
**다시 시도한다면 페이지 단위가 아니라 문항 번호 단위 커버리지로 판단 기준을 바꿔야 한다.**

**P03-07 썸네일 DPI 96** (커밋 `da381b4`): `get_question_thumbnail` 기본 dpi 144→96. 호출부가 전부
기본값 의존이라 자동 반영. 최종 추출 PDF는 별도 벡터 크롭 경로라 품질 영향 없음 — UI 미리보기 해상도만 낮아진다.

**P03-08 요청 타임아웃 미들웨어** (커밋 `da381b4`): `TimeoutMiddleware`(30초, `asyncio.wait_for`).
엔드포인트 개별 sync→async 전환 대신 미들웨어로 일괄 적용(위험도가 낮다).
**등록 순서 주의**: `add_middleware`는 나중에 등록한 게 바깥쪽이 되므로 `TimeoutMiddleware`를
`CORSMiddleware`보다 먼저 등록해 CORS가 바깥을 감싸게 했다 — 그래야 504 응답에도 CORS 헤더가 붙어
프론트가 CORS 에러가 아닌 진짜 504로 인식한다.
한계: 클라이언트 대기만 취소되고 threadpool의 실제 작업 스레드는 강제 종료되지 않는다(자연 종료까지 실행).

### REQ-P02 클라 성능 — 10개 항목 전체

사용자 결정으로 **Quick win(02,05,03) → Polish(04,06,07,08,09) → 가장 크고 복잡한 P02-01을 마지막에** 순서로 진행.
전 항목 실제 브라우저(dev 서버 + headless Chrome/CDP) 검증 후 커밋.

- **P02-02** (`49c677b`): 분석 목록 `JobCard`의 `getPages` 호출 제거, 썸네일 URL 직접 조립(결정적 URL이라
  목록 API가 불필요). `onError` 폴백 유지.
- **P02-05** (같은 커밋): `work.jsx` 재감지 폴링이 로컬 `setInterval` 변수라 언마운트 시 미정리되던 것을
  `refreshPollRef` + cleanup으로 수정.
- **P02-03** (`931b594`): `apiFetch`에 GET 전용 dedup. 동일 URL in-flight면 Promise 공유 +
  `Response.clone()`으로 각자 독립 `res.json()` 가능하게 했다. Node로 검증(동시 3회 → 실제 요청 1회).
- **P02-04** (`e9d9df2`): 리스트 항목 컴포넌트 분리 + `React.memo`. 편집 상태를 비교자에 포함해
  인라인 편집 중인 카드만 리렌더.
- **P02-06** (`66bd6bc`): 편집 페이지 초기화 API를 `Promise.all` 병렬화(개별 `.catch()`로 에러 격리 유지).
- **P02-07** (`303ac50`): `WorkbookPreview` IntersectionObserver 가상화(rootMargin 300px).
  실측 40문항/20페이지 중 이미지 렌더 셀 5개.
- **P02-08** (`9678721`): `allChecked`를 `useMemo`로 래핑(편집 중 매 keystroke마다 전체 `.every()` 재순회 방지).
- **P02-09** (`4772e00`): `@mui/lab`·`@mui/x-data-grid` 전수 확인 결과 **둘 다 실제 라우트에서 도달 불가능한
  죽은 코드**에서만 쓰이고 있어 제거. 연쇄 죽은 코드 포함 22개 파일 삭제.
- **P02-01** (`7f4c7ed`): 뷰어 가상화(rootMargin 1000px). react-window 대신 직접 구현 —
  F07 오버레이 좌표 계약 유지가 더 쉽다.
  **버그 발견·수정**: `scrollToPage` 점프 시 대상의 "이전" 페이지까지 강제 렌더하면 그 페이지가 아직 0px인
  상태로 누적 높이를 계산해 스크롤이 한 페이지 짧게 잡힌다(실측: 150페이지 이동 시 149에 안착).
  → 이전 페이지는 강제 렌더 대상에서 제외하고 대상+다음 페이지만 렌더 큐에 넣어 해결.
  CDP로 206페이지 문서 검증: 초기 캔버스 2~4개, 점프(75/100/150) 정확히 도착, 자연 스크롤 점진 렌더(4→16개).

### 테마 리디자인 + 브랜드 로고 (REQ 번호 미부여)

성능 작업 사이에 끼어 진행된 즉흥 작업이라 번호를 붙이지 않았다.
(이후 2026-07-26의 REQ-D07 Phase 1에서 이 테마는 Minimal 템플릿 원본으로 교체됐다.)

- **테마 리디자인** (`5722c61`): Inter 폰트 전환, 팔레트·그림자 톤 조정, 헤딩 `fontWeight` 700→500 /
  `lineHeight` 1.5→1.2, `MuiCard` 계열 오버라이드 신설, 사이드바 `grey.950` 다크화 + 접기/펼치기 토글.
- **브랜드 로고/파비콘** (`326eb74`): placeholder를 실제 브랜드 이미지 **"깊은생각"** 으로 교체.
  `Logo.tsx`는 163줄 → 15줄 수준으로 축소. **투명 배경 PNG라 다크 사이드바에 그대로 얹혀서**
  직전 커밋에 넣었던 `inverse` prop이 불필요해져 제거했다.

## 2026-07-21

### 버그·개선 9건 일괄 (커밋 `9601355` 코드 / `8ef1f05` 스펙, F07·D06은 별도)

- **REQ-B08** 문제집 편집 문항 목록 내부 스크롤 복구 + **파일 목록 내부 스크롤**(별건 함께 처리)
- **REQ-F08** 편집 미리보기 스크롤 좌우→상하(세로 스택)
- **REQ-B07** 오탐 문항 체크박스 활성화 → 최종 **옵션 ②(완전 일반 취급)**:
  개별·전체 선택·벌크 삭제 모두 오탐 포함
- **REQ-B06** 문항 벌크 삭제 경쟁 상태 → `POST /api/jobs/{id}/pages/{n}/questions/bulk-delete` 신설
- **REQ-C07** 라벨에 문항 이름 추가(미리보기·PDF 문자열 동기화, `sel.label` 단일 출처)
- **REQ-B09** PDF 라벨 한글 미렌더(점 표시) 수정 → **원인은 축약이 아니었다**:
  PyMuPDF 1.25.5에 `Document.add_font`가 없어 helv로 폴백되며 한글이 깨졌다.
  **`TextWriter` + `fitz.Font("korea")`** 로 해결 + 긴 라벨은 셀 폭에 맞춰 폰트 자동 축소.
- **REQ-B05** PDF 뷰어 툴바 고정 + 이전/다음 이동. 원인 = `history/index.jsx` 래퍼의 깨진 flex 높이 체인
  + smooth `scrollIntoView` 취소. → 래퍼 flex 컬럼화 + 컨테이너 직접 `scrollTo({behavior:"instant"})`
- **REQ-F07** 문항 분석 ② 미리보기를 PDF 뷰어(`PdfPreviewPanel` 재사용)로 전환.
  백엔드 `GET /api/jobs/{id}.original_pdf_url` 신설, 뷰어에 `onPageChange`·`renderPageOverlay`·
  `ref.scrollToPage` 확장(전부 optional이라 생성 이력에 무영향).
  **좌표 변환은 `pt = cssPx / scale` 단일 공식**(react-pdf가 pt×scale로 렌더) — 실측 오차 <1px.
  ①↔뷰어 양방향 동기화(250ms 디바운스). 데드코드 ~1,200줄은 별도 커밋 `52e4b7d`로 제거.
- **REQ-D06** 표지 관리를 2패널(D05) → **1패널 래핑 그리드 + 업로드 모달**로 재작성.
  분석 목록도 가로 스크롤 → 여러 줄 래핑 그리드로 통일(사용자 결정). 백엔드 API 무변경.
  **REQ-D05는 superseded 표기 후 파일 유지.**

### CSS 회귀 2건 (커밋 `c090d2a`)

같은 날 F07/데드코드 작업에서 생긴 회귀. **둘 다 "지운 게 실은 살아있는 코드였다" 유형이다.**

- **수동 추가 좌표가 마지막 페이지에 고정**: 정리 편집에서 `.pdf-page-wrapper`의 `position:relative`가
  빠졌다 → 각 페이지 오버레이(`absolute; inset:0`)가 상위 positioned 조상(② Paper)에 겹쳐 쌓여
  마지막 페이지 오버레이가 전체 드래그를 가로챘다. → 복원(검증: idx 3→3, 7→7).
- **편집 문항 선택 CSS 미적용**: 데드코드 커밋 `52e4b7d`에서 `wbe-*` 섹션을 지울 때
  **그 안에 섞여 있던 `qlist-*` 규칙까지** 삭제됐다. 살아있는 `QuestionListPanel`이 쓰는 클래스다.
  → `qlist-*` 25개 규칙 복원(독립 섹션으로 분리).

### P02/P03 성능 스펙 재구성 (커밋 `71236c0`)

구 P02(클라+서버 혼재) → **P02=Frontend / P03=Backend**로 분리. 백엔드 7개 항목을 P03로 이관하고
P02는 P02-01~10으로 재번호.

**StrictMode** (`fef001d` → 되돌림 `2d2a0e2`): dev 이중 API 요청을 없애려고 껐다가,
**현업 기본값이고 effect cleanup 안전망**이라는 이유로 **다시 켰다(최종 ON)**.
이중 요청은 dev 전용 착시(프로덕션 무영향)로 결론. 실질 중복은 P02-03(dedup)이 담당한다.

### REQ-P03 착수

- **P03-01 프로파일링** (`b8d40aa`): 썸네일 6~10초 병목 = **R2 전체 PDF 다운로드가 ~99%**(~2초/8MB).
  파싱 ~14ms·렌더 ~30ms는 무시 수준. 6~10초는 N회 전체 다운로드 누적(카드 5개 × `list_pages` 등).
  → **DPI·adaptive는 병목이 아니다.** 처방은 PDF 다운로드를 job당 1회로 줄이는 것.
- **P03-02 페이지 메타 캐시** (`0d8a163`): `page_info/{job_id}.json` 캐시 신설.
  `list_pages`가 캐시 우선, 미스 시만 read+저장. 업로드 감지·refresh에서 `pdf_bytes`를 재사용해 프리워밍.
  **실측: list_pages 2.75s → 0.17s(~16배).** page_info는 job당 PDF가 불변이라 무효화가 필요 없다.

## 2026-07-04 이전

REQ-01~26, B01~B04, C01~C06, D01~D05, E01, F01~F06, P01 — 상단 인덱스 참고.
당시에는 이 로그가 없어 상세 맥락이 각 스펙 문서와 git 이력에만 남아 있다.

---

## 부록 — 2026-07-04 작업 계획 스냅샷

당시 `docs/예정된작업.md`를 기반으로 REQ 번호를 부여하고 의존 관계로 순서를 잡았던 기록.
**전 항목 완료**되었으므로 참고용으로만 남긴다.

```
[Phase 1] 독립 소규모 버그       REQ-B08, REQ-F08
[Phase 2] 문항 삭제 UX 묶음      REQ-B07 → REQ-B06
          ※ 오탐 문항을 선택 가능하게 만든 뒤 벌크 삭제를 얹어야 정합
[Phase 3] 라벨 묶음(동시 진행)   REQ-C07 + REQ-B09
          ※ 라벨 길이 증가와 폰트 이슈가 한 셀 안에서 충돌하므로 함께 설계
[Phase 4] PDF 뷰어 묶음          REQ-B05 → REQ-F07
[Phase 5] 표지 디자인            REQ-D06 (D05 superseded)
[Phase 6] 성능                   REQ-P03(서버) + REQ-P02(클라)
```

**의존 요약**: `B04 → B08`, `F06 → B05 → F07`, `B07 → B06`, `C07 ↔ B09`,
`P02-02 ↔ P03-01`(목록 로딩), `P02-01 ↔ F07`(오버레이 좌표).

**번호 부여 판단 기록**
- 문항 분석 툴바 이슈 2건은 REQ-F06 뷰어의 결함이라 버그 스펙 **B05** 하나로 묶었다.
- 표지 목록형은 예정 문서에 `D05`로 적혀 있었으나 기존 D05 스펙(2패널 수평)과 방향이 상충해
  **D06**을 새로 부여했다.
- 서버 성능은 예정 문서에 "P02 항목 추가"로 적혀 있었으나 원인 규명·처리 규모가 커 **P03**으로 분리했다.
