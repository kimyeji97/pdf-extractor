# 진행 현황 (PROGRESS)

> 시간순 작업 로그. git이 말하지 못하는 **왜 / 함정 / 기각 이유**를 남긴다.
> 파일명·라인수처럼 `git show`로 볼 수 있는 건 적지 않는다.
> 깨면 회귀하는 **계약**은 이 파일이 아니라 [`CLAUDE.md`](../CLAUDE.md)에 둔다.
>
> 조회는 `/progress`, 갱신은 `/checkpoint`.
> 최종 갱신: 2026-10-22

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
| REQ-D07 | 프론트 전면 리디자인 (Minimal 템플릿) | [spec](specs/20260725-REQ-D07-minimal-template-adoption.md) | 2026-09-18 | ✅ 잔여 기능(`auth-layout`·`account-popover` 슬롯)이 REQ-27 Phase 4·5로 해소됨 — 실제로는 "슬롯 연결"이 아니라 슬롯 자체가 없어(주석 한 줄뿐) 새로 구현했다 |
| REQ-D08 | 라이트/다크 모드 | [spec](specs/20260729-REQ-D08-dark-mode.md) | 2026-07-29 | ✅ |
| REQ-B10 | 생성 중 화면 이탈 시 문제집 메타 유실 | [plan](plans/archive/PLAN-B10-workbook-meta-lost-on-navigate.md) | 2026-07-31 | ✅ dev 배포 완료 — 백엔드 2026-08-18 · 프론트 2026-08-21 |
| REQ-B11 | 알림 기준선이 피드 도착 전에 잡힘 — 새로고침마다 직전 알림 토스트 | [plan](plans/archive/PLAN-B11-notification-baseline-before-feed.md) | 2026-08-28 | ✅ **Phase 1~2 완료**(`useNotificationsReady` + 세 소비처 게이트, 10/10 · dev Worker 배포 후 새로고침 5회 토스트 0건 · 계약 #27 정정) — PR #3 **main 머지 완료(2026-08-28, `3d35d65`)**. 미결 1건(ready 동승 알림)은 후속 |
| REQ-C09 | 알림 경로 후속 묶음 (실패 문구 서버 `message` 단일 출처 · `useNotificationRefresh` `kind` 필터 · 계약 #26 딤 회귀 케이스 · SSE `: connected` 선발송) | [plan](plans/archive/PLAN-C09-notification-followups.md) | 2026-08-28 | ✅ Phase 1·2 완료 (10/10 · 백엔드 34/34 · 프론트 61/61 · dev 실측 warm `onopen` 0.2~0.8s) — PR #4 **main 머지 완료(2026-08-28, `91a911a`)**. Phase 1 육안 1건(실패 배너 문구) 미확인 |
| REQ-P05 | 알림 전달 지연 (감지 완료 알림을 프리워밍 앞으로 · 피드 GET 병렬화) | [plan](plans/archive/PLAN-P05-notification-latency.md) | 2026-08-28 | ✅ Phase 1~3 완료 (10/10 · 백엔드 44/44 · 프론트 61/61) — 발행 전 대기 **8.1s 단축**, 피드 GET 3.79s → 1.43s. PR #5 **main 머지(2026-08-28, `6fba551`)** |
| REQ-P06 | API 응답 속도 — 목표 "분석 중 여부 상관없이 모든 API p90 1s 미만"(파일 업로드·SSE 제외, 내려받기 3s 허용) + 운영 사양 | [plan](plans/archive/PLAN-P06-api-latency-during-analysis.md) | 2026-10-02 | ✅ **Phase 1~7 완료** — 현황판 API 캐시(PR #29) · 감지·썸네일 렌더링 nice 19 자식(PR #30) · 최종 측정 터널 경유 모든 API p90 < 1s(피크 ② 포함). 터널 튐 대응은 오픈 후로 이연 |
| REQ-F09 | 문항 분석·문제집 생성 완료 알림 | [plan](plans/archive/PLAN-F09-completion-notification.md) | 2026-08-10 | ✅ v1(Phase 1~5) — 케이스 47/47 + 육안 확인 · dev 배포 완료(백엔드 08-18 · 프론트 08-21) · Phase 6 이연 |
| REQ-F11 | 재감지 중 상세 진입 차단 | [plan](plans/archive/PLAN-F11-analysis-detail-entry-guard.md) | 2026-08-10 | ✅ 케이스 10/10 + 육안 확인 · 프론트 dev 배포 2026-08-21 |
| REQ-P04 | 상시 폴링 → 서버 푸시 전환 | [plan](plans/archive/PLAN-P04-websocket-push.md) | 2026-08-27 | ✅ **Phase 0~3 완료** — SSE, 폴링 0건, dev 실측 전송 0.3~1.3s·숨김 탭 즉시 · PR #2 main 머지(`d176596`) · 후속: 콜드 스타트 기준, `: connected` 선발송, 발행 전 서버 작업 ~6s |
| REQ-D09 | 생성 이력 화면 구조 개편 (목록 전체 폭 카드 그리드 + 클릭 시 우측 아코디언 미리보기 720px) | [plan](plans/archive/PLAN-D09-F10-history-screen-rework.md) | 2026-09-03 | ✅ **Phase 1~5 완료**(케이스 14/14 · `/testrun` 확인 · Phase 5 육안 검증 완료). dev 배포는 미실행(프론트 배포 정책상 로드맵 완료 시점에 모아서) |
| REQ-F10 | 생성 이력 이름 검색 | [plan](plans/archive/PLAN-D09-F10-history-screen-rework.md) | 2026-09-03 | ✅ Phase 3(D09-08~12, 이 REQ의 전체 범위) + Phase 5 육안 검증 완료. dev 배포는 미실행(위와 동일 정책) |
| REQ-D10 | 문항 목록 n×n 바둑판 배열 — 임계 420px 초과 시에만 열 수 증가(D01과 공존) | [plan](plans/archive/PLAN-D10-question-grid-columns.md) | 2026-09-03 | ✅ **Phase 1~2 완료**(케이스 7/7 · `/testrun` 확인 · Phase 2 로컬 육안 — 1↔2열 전환·이미지 잘림 0·상호작용 4종·다크 실측 통과, **오탐 배지만 미확인**(검증 PDF에 오탐 0건)). PR #8 **main 머지 완료(2026-09-03, `48e445d`)**. dev 배포는 미실행(프론트 배포 정책) |
| REQ-D11 | 메뉴 이름 변경(분석·생성·결과·템플릿 관리) + 경로 변경(`/create`·`/results`·`/templates`, 리다이렉트 없음) | [plan](plans/archive/PLAN-D11-menu-rename.md) | 2026-09-04 | ✅ Phase 1·2 완료, 검증 계약 18/18. PR #9 **main 머지 완료(2026-09-04, `1fc5bac`)**, 브랜치 삭제됨. dev 프론트 재배포 시 옛 URL(`/editor`·`/history`·`/format`) 깨짐은 결정 사항 |
| REQ-B12 | 목록을 거치지 않는 작업 화면 진입 — 문서 이름이 job-id로 뜸(+직접 진입 목록 복귀 재현) | [plan](plans/archive/PLAN-B12-work-entry-name.md) | 2026-09-07 | ✅ Phase 1(케이스 7/7) + Phase 2(재현 시도 6회 전부 미재현, Phase 3 없이 종결). 브랜치 `feat/B12-work-entry-name` 푸시됨, PR은 미생성(다음에 오픈 예정) |
| REQ-F12 | 문항분석 현황판 — 목록 화면 통계 5타일(분석중·미탐지·오탐·수동·탐지율, 기존 StatCards 대체) + 아코디언 상세 + 페이지 진입 스크롤 | [plan](plans/archive/PLAN-F12-detection-stats-dashboard.md) | 2026-09-09 | ✅ **Phase 1~3 전부 완료**(케이스 40/40 · `/testrun` 확인 · 회귀 없음 백엔드 68/68·프론트 30파일 127/127). PR #11 **main 머지 완료(2026-09-09, `d1ad297`)**, 브랜치 삭제됨 |
| REQ-29 | 각주·워터마크 등록(표지 CRUD와 같은 모양) + 생성 PDF 반영(표지 제외 전 페이지) | [plan](plans/archive/PLAN-29-footnote-watermark-registration.md) | 2026-09-11 | ✅ **완료**(Phase 1+2, 케이스 28/28 · `/testrun` 확인 · 회귀 없음 140/140). PR #12 **main 머지 완료(2026-09-13, `e0da607`)**. 잔여 위험 2건(s3 스토리지 경로 미검증 · 브라우저 end-to-end 미실시)은 머지 후에도 그대로 |
| REQ-30 | 템플릿 — 표지·각주·워터마크 조합 엔티티(**참조**, ADR-0004) + 생성 화면에서 `cover_id` 대신 `template_id` 선택 | [plan](plans/archive/PLAN-30-template-entity.md) · [ADR](adr/0004-template-reference-not-snapshot.md) | 2026-09-13 | ✅ **Phase 1·2 완료**(케이스 41/41 · `/testrun` 확인 · 회귀 없음 백엔드 111·프론트 150). PR #13 **main 머지 완료(2026-09-13, `e1e4a7f`)**, 브랜치 삭제됨. 잔여 위험 2건(s3 경로 미검증 · 브라우저 e2e 미실시)은 머지 후에도 남는다 |
| REQ-F13 | 미리보기에 템플릿(표지·각주·워터마크) 반영 + 워터마크 알파 결함 수정(REQ-29에서 들어옴) | [plan](plans/archive/PLAN-F13-preview-template-rendering.md) | 2026-09-13 | ✅ **Phase 1~3 완료**(케이스 23/23 · `/testrun` 확인 · 육안 검증 완료 · 회귀 없음 백엔드 122·프론트 162). 렌더 상수는 **프론트에 복제하지 않고 서버가 응답에 실어 보낸다**. PR #14 **main 머지 완료(2026-09-13, `2fb290b`)**, 브랜치 삭제됨 |
| REQ-B13 | 문항 크롭 여백을 네 변 10pt로 통일 (TODO 4단계 "서버 영역 버그") | [plan](plans/archive/PLAN-B13-crop-margin-uniform.md) | 2026-09-21 | ✅ **Phase 1·2 전부 완료**. Phase 1(케이스 11/11 · `/testrun` 확인 · 회귀 없음 136) PR #15 **main 머지 완료(2026-09-18)**. Phase 2(2026-09-21) 실제 기출 PDF 4종·문항 1,141개로 오탐 실측 — 3종 0건 유지, 1종에서 1건 증가했으나 원인이 "유형 N 배지 오인식"이라는 기존 오탐지가 색상 필터에 정확히 걸린 것으로 확인돼 허용 오차 조정 없이 종결(사용자 확인) |
| REQ-27 | 로그인/회원가입 — 인증(JWT) · CORS 제한 · D07 잔여 슬롯(auth-layout·account-popover) | [plan](plans/archive/PLAN-27-login-registration.md) · [ADR](adr/0005-jwt-auth.md) | 2026-09-18 | ✅ **Phase 1~5 전부 완료**(케이스 68/68 · `/testrun` 확인 · 회귀 없음 백엔드 167/167·프론트 185/185). 착수 중 배경 서술 오류 발견 — `auth-layout`·`ProfileMenu`는 실제로 존재하지 않고 주석 한 줄뿐이었다(계획서 § 배경 정정). PR #16 **main 머지 완료(2026-09-18, `88ba7a3`)**, 브랜치 삭제됨. D07 잔여 슬롯도 이걸로 해소 |
| REQ-B14 | 업로드/추출 생성 경로 무인증 + owner_id 미기입 (REQ-27 Phase 2 범위 밖에서 발견) | [plan](plans/archive/PLAN-B14-upload-extract-auth-owner-id.md) | 2026-09-21 | ✅ **Phase 1~3 전부 완료**(케이스 16/16 · `/testrun` 확인 · 회귀 없음 백엔드 196/196·프론트 186/186). Phase 1이 남긴 REQ-30 회귀(`test_template_extract_wiring.py` 8건, fixture가 실제 job 없이 job_id만 참조)는 Phase 3에서 `_make_job`으로 해소. PR #17 **main 머지 완료(2026-09-21, `eeb79c4`)**, 브랜치 삭제됨 |
| REQ-B15 | 이미지 요청 401 — `<img>`가 인증 헤더를 못 보냄 (REQ-27 후속, dev 배포 후 발견) → access 쿠키 병행 | [plan](plans/archive/PLAN-B15-image-auth-cookie.md) | 2026-09-28 | ✅ **Phase 1~3 전부 완료**(케이스 22/22 · `/testrun` 확인 · 회귀 없음 백엔드 221/221·프론트 192/192 · dev 육안 5개 화면). PR #18 **main 머지 완료(2026-09-28, `da8e1c1`)**, 브랜치 삭제됨 |
| REQ-B16 | 문항 끝에 붙은 그림이 크롭 하단에서 잘림 (dev 육안 제보, `0928 테스트4` 3p 5번) | [plan](plans/archive/PLAN-B16-trailing-figure-crop.md) | 2026-09-28 | ✅ **Phase 1 완료**(케이스 6/6 · `/testrun` 확인 · 회귀 없음 백엔드 227/227 · 기출 4종 1,141문항 실측). PR #19 **main 머지 완료(2026-09-28, `7498854`)**, 브랜치 삭제됨. **dev 백엔드 배포 전** — 배포 후 기존 파일은 재감지 필요 |
| REQ-B17 | 분석 중 백엔드 OOM — pdfplumber 페이지 누수 + 동시 분석 무제한 (dev 연속 업로드 중 530) | [plan](plans/archive/PLAN-B17-analysis-oom.md) | 2026-09-29 | ✅ **Phase 1~4 완료**(누수 수정 212쪽 1,033→170MB · 동시 5개·`QUEUED`·시작 시 FAILED·알림 · 프론트 "대기 중", 케이스 23건). PR #20 main 머지 `6862b75`. dev 확인 2026-09-29 `f93e525` — FAILED+알림·재감지 DONE, 9건 연달아 분석 태스크 생존·메모리 최대 65% |
| REQ-B18 | 목차·"유형 N" 제목이 문항으로 잡히고, 번호만 보고 합쳐 진짜 문항이 사라짐 (dev `0928 테스트2` 1쪽 목차 4문항 · 2쪽 0문항) | [plan](plans/archive/PLAN-B18-regex-only-false-positive.md) | 2026-09-29 | ✅ **Phase 1·2 완료**(위치 기준 병합 + 정규식 전용 경계 오탐 **표시**, 케이스 8/8 · 기출 4종 실측: 심화대비 복구, 내신마스터 "유형 N" 62건 오탐). PR #21 main 머지 `c17f884`. dev 상세 육안 2026-09-29 `f93e525` |
| REQ-B19 | 분석 실패 파일 상세가 30초 504 — 조회 경로가 캐시 미스 시 요청 안에서 동기 감지 (B17 Phase 4를 막음, TODO §7) | [plan](plans/archive/PLAN-B19-lookup-path-sync-detection.md) | 2026-09-29 | ✅ **Phase 1~3 완료**(조회 3곳 캐시 미스 → 감지 없이 빈 결과·404, 상태 파일 안 씀 · 케이스 10/10 · `/testrun` 확인 · 회귀 없음 백엔드 266/266 · 전제 소멸한 F09-06·07·16 폐기 · 504 CORS 헤더는 Cloudflare 쪽에서 빠짐 — 구간 특정까지). PR #22 main 머지 `46c464e`, dev 배포 `f93e525` 확인(FAILED 상세 즉시 200·재감지 DONE·stats 9s→0.9s). `/api/jobs`·`/api/notifications` 재측정과 미결 3건은 TODO §7·§9로 이관 |
| REQ-B20 | HWP 출력 PDF가 전부 오탐 — 보이지 않는 0.1pt 번호 글자 + 같은 쪽·같은 번호 식별자 충돌 (B18 회귀, dev `테스트02` 840경계·오탐 378) | [plan](plans/archive/PLAN-B20-invisible-number-and-id-collision.md) | 2026-09-30 | ✅ **Phase 1~5 완료**(adaptive 1pt 이하 제외 · 정규식 전용 높이 규칙 200pt · 문항 ID 순번 k — ADR-0006 · 목록 k 필드 · 프론트 k 전달 · 케이스 27/27 · 백엔드 288/288·프론트 203/203). PR #23 `0d8c5d4`·PR #24 `ee27f2c` main 머지, dev 배포 `fe3d971` 사용자 확인 |
| REQ-B23 | 결과 PDF 상태 조회(`GET /api/status/{job_id}`)가 401 — `getStatus` raw fetch에 인증 헤더 누락(계약 #31 누락) | [plan](plans/archive/PLAN-B23-status-poll-401.md) | 2026-09-30 | ✅ **Phase 1·2 완료**(`getStatus`에 `_authHeaders()` · raw fetch 인증 스캔 테스트 · 케이스 3/3 · 프론트 206/206). PR #25 main 머지 `4f26daf`, dev 프론트 배포 후 사용자 확인 |
| REQ-B24 | 현황판 통계 API(`/api/stats`·`/api/stats/detail`) 인증 누락 — 비로그인으로도 전 사용자 합산·남의 job_id·파일명 노출 | [plan](plans/archive/PLAN-B24-stats-auth-missing.md) | 2026-10-02 | ✅ **Phase 1 완료**(인증 + user 본인·admin 전체 · 케이스 9/9 · 백엔드 326/326). PR #28 main 머지 `64b8a18`, dev 배포 후 비로그인 401·user 남의 job 0건 확인(admin 화면은 테스트로만) |
| REQ-B21 | 크롭 하단 여백이 문항마다 다름 — 하단 조임이 다음 문항 번호를 제 것으로 잡았다 | [plan](plans/archive/PLAN-B21-crop-bottom-next-number.md) | 2026-09-30 | ✅ **완료**(B21-01~04 · PR #26 `f18c495` · dev 확인) |
| REQ-B22 | 경계 캐시가 없는 job 처리 — FAILED·DONE 0문항 화면 안 안내 · extract-v2 캐시 미스 감지 제거 | [plan](plans/archive/PLAN-B22-missing-boundaries-cache.md) | 2026-09-30 | ✅ **완료**(B22-01~10 · PR #26 `f18c495` · dev 확인) |
| REQ-F14 | 현황판 개선 + 시스템 전체 뱃지 색 — 감지 상태 SSE `status` 이벤트 · 목록·현황판 함께 배경 재조회 · `utils/badges` 단일 정의 · 상세 영역 닫기·목록 우측 | [plan](plans/archive/PLAN-F14-stats-board-and-badges.md) | 2026-09-30 | ✅ **완료**(F14-01~26 · PR #26 `f18c495` · dev 확인) |
| REQ-F15 | 문제집 이름·파일명 표시 — 감지 알림 제목 문제집 이름 우선 · 목록 카드·작업 화면 헤더에 파일명 병기 | [plan](plans/archive/PLAN-F15-workbook-name-and-filename.md) | 2026-09-30 | ✅ **완료**(F15-01~11 · PR #26 `f18c495` · dev 확인) |
| REQ-C10 | 감지 문항 이름을 원문으로 표시("문항 유형 01" — 고정 접두어 "문항" + 사용자 이름 \|\| 원문 \|\| 번호) | [plan](plans/archive/PLAN-C10-question-source-title.md) | 2026-10-01 | ✅ **Phase 1~3 완료**(백엔드 감지 원문 `source_text` + 조회 API · 프론트 `utils/questionName` 단일 표시 이름·입력란 고정 접두어, 케이스 30/30 · 백엔드 317 · 프론트 273 · 기출 4종·테스트02 경계 불변 실측). PR #27 main 머지 `b6edc0f`, dev 배포 `c10-b6edc0f` 후 사용자 육안 확인. 원문은 재감지한 파일부터 |
| REQ-B27 | 알림 사용자별 분리 + 알림별 읽음 — 알림 API 3종 무인증·전 사용자 알림 노출, 전역 읽음 커서 | [plan](plans/archive/PLAN-B27-notification-per-user.md) | 2026-10-02 | ✅ **Phase 1·2 완료**(케이스 35/35 · 백엔드 374/374·프론트 290/290 · 리뷰 3회 후 `206af9b` (b)·(c) 0). PR #31 main 머지 `95b707c`, dev 백엔드·프론트 동반 배포 후 계정 둘로 확인(API 18항목 · 화면 계정 전환) |
| REQ-B26 | 문항 삭제 [되돌리기]가 복원하지 않음 → 삭제를 토스트 동안 미루고 되돌리면 그대로 | [plan](plans/archive/PLAN-B26-delete-undo-restore.md) | 2026-10-02 | ✅ **Phase 1 완료**(케이스 22/22 · 프론트 312/312 · 리뷰 3회 후 `4c50d43` (b)·(c) 0). PR #32 main 머지 `7477a91` · **dev 프론트 배포 완료**(2026-10-02 18:57, 머지와 같은 분 — 2026-10-03 라이브 번들로 확인) |
| REQ-B25 | 현황판 페이지 번호 클릭 → 항상 1쪽 (로딩 전 이동 요청이 버려짐) | [plan](plans/archive/PLAN-B25-stats-page-jump.md) | 2026-10-03 | ✅ **Phase 1 완료**(케이스 8/8 · `/review` 2회 — 회차 0의 (b) 2건을 회차 1에서 닫음 · 미결 2건 확정). dev 프론트 배포 후 212쪽 합성 PDF로 `?page=150·212·2` 육안 확인 |
| REQ-F17 | 출처 문구 형식 "n번) 문제집. p쪽. 문항이름." + 이름 표시 확장자 제거 | [plan](plans/archive/PLAN-F17-source-label-format.md) | 2026-10-03 | ✅ **Phase 1 완료**(케이스 23/23 · 프론트 338 · 백엔드 377 · `/review` 3회차 결함 전부 닫음 · 로컬 육안). PR·dev 배포 전 |
| REQ-F16 | 생성된 PDF 저장 — 브라우저 저장 위치 선택 창 | [plan](plans/archive/PLAN-F16-pdf-save-picker.md) | 2026-10-05 | ✅ Phase 1·2 (케이스 31/31 · 각 `/review` 3회차 · **dev 육안 4건 확인** — 한 번 클릭·창 전환·재다운로드·취소) |
| REQ-F18 | 생성/결과 업무 분리 — 생성 화면 다운로드 제거 · 진입 시 페이지 목록 스크롤 | [plan](plans/archive/PLAN-F18-split-download-and-list-scroll.md) | 2026-10-05 | ✅ 케이스 10/10 · `/review` 2회차 · **dev 육안 3건 확인** |
| REQ-B29 | 메타 저장 실패 시 PDF 가 조용히 사라진다 — 재시도 + 실패 알림 | [plan](plans/archive/PLAN-B29-workbook-meta-save-failure.md) | 2026-10-06 | ✅ 케이스 11/11 · `/review` 3회차 · **prod 정상 생성 확인**(실패 경로는 R2 를 끊어야 재현돼 육안 불가 — 테스트가 실제 저장 키·알림 파일을 덮는다) |
| REQ-B28 | 생성 PDF 의 한글이 조용히 사라진다 — 그리기 직전 NFC 정규화 | [plan](plans/archive/PLAN-B28-pdf-text-nfc.md) | 2026-10-05 | ✅ 케이스 7/7 · `/review` 3회차 · **dev 육안 확인**(라벨 한글 온전 · 커진 글자가 안 잘림 · 각주 정상) |
| REQ-E02 | 운영(prod) 환경 구성 — 도메인 `-dev` 제거 · R2 `dailystudy` · ECS prod 서비스 2 vCPU/4GB · 이미지 태그 고정 | [plan](plans/archive/PLAN-E02-prod-environment.md) | 2026-10-05 | ✅ **Phase 1~5 완료** — prod 백엔드(ECS `prod-svc` 2 vCPU/4GB, 이미지 `prod-2cc43de`)·프론트(Worker `dailystudy-workbook-prod`)·R2 `dailystudy`(WAF 경로 제한) 가동, 배포 스크립트 dev/prod 분리, 계약 #37·#38 · 케이스 44/44 · 리뷰 회차 1 @ `2e75c3d` (TODO 4 · 감수 1) |
| REQ-F19 | 서버 다운 안내 화면 + 꺼짐 예고 배너 — 다운 감지 → 안내 경로, 운영 구간 API, 1시간 전 카운트다운 | [plan](plans/archive/PLAN-F19-server-down-notice.md) | 2026-10-15 | ✅ Phase 4/4 — PR #43 머지(`dfcc485`) · dev·prod 배포 · **prod 응답 대조 일치(2026-10-15)** · 22시 배너 육안(사용자) · 케이스 43/43 · 리뷰 회차 9 @ `340ddea` (TODO 5 · 감수 3) |
| REQ-F20 | 튜토리얼 — 로그인 후 첫 화면에 안 본 튜토리얼 슬라이드 모달, 다시 보지 않기, 골라 다시 보기 | [plan](plans/PLAN-F20-tutorial.md) | — | 🟡 Phase 4 테스트만(구현 전, red) — Phase 3은 로컬 육안 뒤 재설계로 대체 · 브랜치 `feat/F20-tutorial` · 리뷰 회차 1 @ `3a9e1fe` |
| REQ-C12 | 운영 콘솔 — 가입 승인 · 계정 차단 · 서버 수동 on/off | [plan](plans/archive/PLAN-C12-ops-console-accounts-server.md) | 2026-10-15 | ✅ Phase 3/3 — 케이스 27/27 · 리뷰 회차 6 @ `ed9d061` (b) 0 · (c) 감수 1 · dev 육안(승인·차단·콘솔 on/off) · prod 확인 창 육안 · prod 실측은 사용자 결정으로 생략(dev 실측 대체) · Phase 1·2는 PR #47 머지·배포, **Phase 3은 `feat/C12-server-onoff` PR·배포 전** |
| REQ-D13 | 브랜드 리뉴얼 — 로고·파비콘·테마색(남색·빨강)·글꼴(Outfit·Gothic A1) | [plan](plans/archive/PLAN-D13-brand-renewal.md) | 2026-10-08 | ✅ Phase 3/3(로고·파비콘 · 테마색 · 글꼴) — 케이스 30/30 · 리뷰 회차 6 @ `122da1c` (b)·(c) 0 · dev 육안 확인 · PR #45 머지 `cee0695` · prod 프론트 배포 |
| REQ-D12 | 시스템 이름 변경 — 한글 "오답 클립북" · 영문 "ClipBook" (화면·문서 이름만, 도메인 제외) | [plan](plans/archive/PLAN-D12-system-rename.md) | 2026-10-07 | ✅ Phase 1 완료(케이스 4/4 · `/testrun` 확인 · `/review` (c) 1 감수) — 탭 제목·Swagger 제목. 워드마크·아이콘은 테마 컬러와 함께 **별도 작업으로 분리**(TODO.md). 브랜치 `feat/D12-system-rename` |

### 미착수 — 번호만 부여된 것 (2026-07-29)

> **스펙 파일이 없어도 번호는 점유된 상태다.** 새 번호를 부여하기 전에 이 표를 반드시 확인할 것 —
> `ls docs/specs/`만 보면 D08·F09·REQ-27처럼 **제안 단계에서 예약된 번호를 못 보고 충돌한다.**
> D08·F09·REQ-27은 [D07 스펙 §6](specs/20260725-REQ-D07-minimal-template-adoption.md)에서 제안됐고,
> D09·F10·D10은 `예정된작업.md`의 항목에 2026-07-29에 부여했다.
>
> **D08은 2026-07-29에 착수·완료되어 이 표에서 빠졌다** — 위 완료 인덱스에 있다.
> **F09는 2026-07-30에 계획서가 작성되어 이 표에서 빠졌다**(위 인덱스 ✅ — v1 2026-08-10 완료). 규모 추정도
> 정정됐다 — "표면만 추가"가 아니라 **폴링을 앱 셸로 올리는 것이 작업의 무게중심**이다.
> 같은 날 그 점검에서 **REQ-B10**이 파생됐다.
>
> **REQ-P04는 2026-08-03 F09 미결 검토에서 파생됐다** — F09가 "모두의 알림"을 택하면서
> 상시 폴링이 확정됐고, 그것을 걷어내는 작업이다. **F09 선행**(전환 대상이 F09가 만든다).
> F09 v1이 2026-08-10에 닫혔으므로 **선행 조건은 해소됐다.**
> **2026-08-10에 계획서가 작성되어 이 표에서 빠졌고, 2026-08-27 Phase 0~3 완료·main 머지됐다**(위 인덱스 ✅).
> 전환 대상은 처음 예상한 3곳이 아니라 **알림 피드 1곳**이다(F09 Phase 3이 나머지를 걷어냈다).
>
> **REQ-F11은 2026-08-10에 부여되고 같은 날 착수·완료되어 이 표에서 빠졌다**(위 인덱스 ✅).
> F09 육안 검증 중 발견됐지만 **F09가 만든 구멍은 아니다** — 목록 클릭 차단이 처음부터
> URL 직접 진입·뒤로가기를 못 막고 있었다.
>
> **REQ-D09·F10은 2026-08-31에 계획서(하나로 묶음, 같은 화면이라 두 번 안 뜯음)가 작성되고
> 2026-09-03에 Phase 1~5 전체가 완료되어 이 표에서 빠졌다**(위 인덱스 ✅). F10의 "서버 검색 선행
> 필요"는 낡은 전제였다 — REQ-P03-03(2026-07-25)에 이미 들어가 있어 백엔드 변경 0건.
>
> **REQ-D10은 2026-09-03에 계획서가 작성되고 같은 날 Phase 1이 완료되어 이 표에서 빠졌다**(위 인덱스 🟡).
> 규모는 "소~중"에서 **소**로 내려갔다 — 백엔드 변경 0건, 순수 함수 하나 + 컨테이너 grid 전환.
>
> **2026-09-03에 TODO 3단계 "신규 항목" 6건을 작업 단위 5개로 묶어 번호를 부여했다**(D11·B12·F12·REQ-29·REQ-30).
> 순서는 D11 → B12 → F12 → REQ-29 → REQ-30. TODO 원문 나열과 다른 점 둘 — ⑤(벨 job-id)는 버그라 앞으로
> 당겼고, **②(테마)는 번호를 주지 않았다**: "컬러·글씨체·머릿글/바닥글 디자인"이 무엇을 어디에 적용하는지
> 원문에 없고, REQ-30 템플릿이 생기면 그 속성으로 흡수될 가능성이 커서 REQ-30 뒤에 `/workplan`에서 다시 정의한다.
>
> **REQ-D11은 같은 날 계획서가 작성되어 이 표에서 빠졌다**(위 인덱스 🟡). 미결 3건을 닫으면서
> **경로 변경(`/create`·`/results`·`/templates`)까지 범위에 들어와** 규모가 "소(프론트만)"에서 조금 늘었다 — 여전히 프론트만.
>
> **REQ-B12는 2026-09-04에 계획서가 작성되어 이 표에서 빠졌다**(위 인덱스 2026-09-07 ✅). 착수 시 확인하기로 했던
> "두 증상이 같은 원인인지"는 **아니다로 판명** — 이름 버그는 이름 출처가 한 경로(목록 클릭 state)에만
> 있어서 나고, 직접 진입 시 목록 복귀는 state 부재와 무관한 별개 현상이었다. **Phase 2 재현 시도(6회) 전부
> 미재현**으로 원인 규명 없이 종결 — D10 Phase 2의 1회성 관찰은 도구(playwright) 함정이었을 가능성이 높다.
>
> **REQ-F12는 2026-09-08에 계획서가 작성되고 같은 날 Phase 1이 완료되어 이 표에서 빠졌다**(위 인덱스 🟡).
> 착수 전 미결 두 건(화면 위치·통계 API 필요 여부)은 대화에서 해소됐다 — **작업 화면이 아니라 목록
> 화면**(전체 문서를 한눈에 보는 대시보드가 목적이었음), **매 요청 재집계가 아니라 job 단위 캐시 합산**
> (기존 `total_question_count` 패턴 확장). 규모 추정은 "중(프론트 위주)"에서 갈렸다 — Phase 1이 백엔드
> 통계 캐시 4필드 + 5개 지점 재계산으로 프론트보다 먼저 왔다.
>
> **REQ-29는 2026-09-10에 계획서가 작성되고 2026-09-11에 Phase 1이 완료되어 이 표에서
> 빠졌다**(위 인덱스 🟡). 이 REQ에 대한 이전 대화·논의는 세션 히스토리 어디에도 없었다
> (48개 세션 전체 조회, 0건) — TODO 원문 한 줄이 유일한 출처였다. **아래 REQ-30 행의
> "REQ-29 선행" 표기가 맞고, 바로 위(옛 REQ-29 행)에 있던 "REQ-30 선행" 표기는 반대
> 방향의 오기였다** — 템플릿(REQ-30)이 각주·워터마크(REQ-29)의 산출물을 조합하는
> 엔티티라 29가 먼저 와야 앞뒤가 맞는다(633행 "REQ-29 → REQ-30 순서가 문서상 확정적"
> 참조). 옛 표기를 믿고 REQ-30부터 착수하지 않도록 바로잡는다.
>
> **REQ-30은 2026-09-13에 계획서·ADR이 작성되고 같은 날 Phase 1·2가 모두 완료되어 이 표에서
> 빠졌다**(위 인덱스 ✅). 규모 추정 "중~대"는 대체로 맞았으나 **무게중심이 예상과 달랐다** —
> 조합 엔티티 자체는 표지 CRUD의 복제라 가벼웠고, 실제 작업량은 **dangling 처리(A′·E)**와
> 생성 화면의 칩 3줄을 걷어내는 쪽이었다. 이로써 2026-09-03에 번호를 부여한 신규 항목 5개
> (D11·B12·F12·REQ-29·REQ-30)가 **전부 닫혔다.** 로드맵상 다음은 **테마 재정의**(번호 보류 —
> REQ-30 속성으로 흡수될지 이제 판단할 수 있다) → **REQ-27 로그인**이다.
>
> **REQ-27은 2026-09-14에 계획서·ADR-0005가 작성되고 Phase 1이 완료되어 이 표에서
> 빠졌다**(위 인덱스 🟡). 과거 세션을 전수 검색해도 실질 논의가 전혀 없어(48개 세션, 0건)
> 대화로 처음부터 설계했다 — 인증 방식(JWT)·가입 경로(자체 이메일)·기존 데이터 귀속(관리자
> 계정 일괄)·사용자 분리 방식(메타데이터 `owner_id` 필드, 경로 분리 아님)·토큰 수명(access
> 1시간·refresh 7일 rolling)·관리자 role·CORS 허용 도메인까지 미결 7건을 이번에 전부 닫았다.
> 규모 "대(별건)"는 Phase가 5개로 쪼개지며 그대로 유지 — **인증(1~2)·CORS(3)·D07 슬롯
> 연결(4~5)**로 나눠 각각 커밋 단위가 된다.

| REQ | 기능명 | 출처 | 규모 | 상태 |
|-----|--------|------|------|:----:|
| REQ-28 | 분석 결과 공유 (이메일 · 소유자/편집자/뷰어) — 문제집 공유는 제외 | [계획서](plans/archive/PLAN-28-analysis-sharing.md) | 2026-10-22 | ✅ |
| REQ-C11 | "유제"(보이는 번호 없는 하위 문항) 감지 — HWP 출력 기본문제 PDF | [TODO §8](TODO.md) · B20에서 분리 | — | ❌ **기각(2026-10-01)** — 2026-10-06 오픈 후 실사용 케이스를 보고 넣을지 다시 정한다. 그때 새 번호로(번호 재사용 안 함) |

> **REQ-C12는 2026-10-15에 Phase 3까지 끝나 이 표에서 빠졌다**(위 인덱스 ✅).

> **REQ-B25는 2026-10-03에 계획서가 현행화되고 Phase 1 구현·리뷰가 끝나 이 표에서 빠졌다**(위 인덱스 🟡).
> dev 육안(212쪽)만 남았다 — 단위 테스트가 구조적으로 못 덮는 부분이다.

> **REQ-F17은 2026-10-03에 착수·완료해 이 표에서 빠졌다**(위 인덱스 ✅). `/review` 3회차까지 돌았고
> 마지막 수선은 재리뷰 대신 **로컬 육안**으로 판정했다(`docs/reviews/F17.md` 종결 기록).

> **REQ-F16은 2026-10-03에 착수해 이 표에서 빠졌다**(위 인덱스 🟡). 코드·테스트는 끝났고
> **dev 육안만 남았다** — 파일 선택 창은 자동화로 "고르기"를 할 수 없어 사람이 눌러야 한다.

**D10은 REQ-D01("문항 이미지 대형화")과 상충 소지가 있었다.** D01이 이미지를 키운 요구였고 D10은
"과도하게 커지면 너비 조절 의미가 사라진다"는 반대 방향이다. **2026-09-03 계획서 배경 절에
"임계를 경계로 공존"으로 명시했다** — 임계 이하 1열(D01 그대로), 초과 시에만 열 수 증가.

### 인프라 (docs/infra/)

> REQ 번호 없는 배포 영역. 배포 플랫폼 결정은 [ADR-0001](adr/0001-backend-deploy-ecs-fargate.md)로 승격.
> **배포는 전부 수동**(AWS CLI + Cloudflare 콘솔) — IaC·CI/CD 없음. 레포 산출물은 `backend/Dockerfile`뿐.

dev 환경은 구축 완료. ECR / ECS 클러스터·서비스 / 태스크 정의(backend + cloudflared) / 보안그룹(인바운드 없음) /
Secrets Manager / IAM 실행역할 / CloudWatch Logs(30일) / Cloudflare Tunnel / R2 버킷 전부 ✅.
프론트는 **Workers 정적 자산 `twilight-base-302d`**에 `wrangler deploy`로 수동 배포 🟡
(자동화 없음 — 2026-08-21 확인. **Pages가 아니다**, 5월 문서가 틀렸다).

> 상시 운영 ~$23/월, 미사용 시 `desired-count 0`으로 ~$2/월.
> 절차는 `QUICKSTART.md` / [plan-infra-backend.md](infra/plan-infra-backend.md).

| 항목 | 문서 | 상태 |
|------|------|:----:|
| 인프라 구성 명세 | [spec-infra.md](infra/spec-infra.md) | ✅ dev 반영 |
| 백엔드 배포 절차 | [plan-infra-backend.md](infra/plan-infra-backend.md) | ✅ dev 구축 |
| 프론트엔드 배포 | [plan-infra-frontend.md](infra/plan-infra-frontend.md) | 🟡 수동 `wrangler deploy` (문서 본문은 Pages 기준 — 상단 정정 메모 참조) |
| 관리 서버 API 분리 (Lambda 검토) | [plan-infra-backend-api.md](infra/plan-infra-backend-api.md) | ❌ ADR-0001로 ECS 채택 |
| 추출 서버 분리 (Lambda 검토) | [plan-infra-backend-extractor.md](infra/plan-infra-backend-extractor.md) | ❌ ADR-0001로 ECS 채택 |
| Java 전환 + DynamoDB 마이그레이션 | [plan-infra-backend-migration.md](infra/plan-infra-backend-migration.md) | ❌ 향후 |
| 성능 측정 · 운영 사양 산정 (REQ-P06) | [perf-infra-capacity.md](infra/perf-infra-capacity.md) | ✅ 2026-10-01 측정 — 최소 1 vCPU/2GB · 권장 2 vCPU/4GB, 현 dev 0.5/1GB는 피크에서 OOM |
| prod 환경 | [PLAN-E02](plans/archive/PLAN-E02-prod-environment.md) | ✅ 2026-10-05 REQ-E02 |
| IaC / CI·CD 자동화 | — | ❌ 미착수 |

---

# 로그

## 2026-10-22

### REQ-F20 — 튜토리얼 (🟡 재설계: Phase 4 테스트만, 구현 전)
- 로컬 육안 뒤 재설계(사용자 요청). Phase 3(기본 흐름·공유 2개)은 완료가 아니라 **대체**다. dev 육안은 하지 않는다
  - 모달은 스크린샷이 작아 알아보기 어려웠다 → 전용 화면 `/tutorials`(왼쪽 목차, 오른쪽 큰 슬라이드). 거의 전체 화면 모달은 기각
  - 메뉴 소개가 아니라 기능 설명이 필요하다 → 화면별 6묶음(분석·생성·결과·템플릿 관리·공유·알림과 튜토리얼), 요청 기능 13개를 슬라이드로 배치
  - 자동 노출은 안 본 묶음 전부를 차례로(사용자 선택, "시작하기 1개만"은 기각). 첫 진입 때 세션당 한 번 화면으로 보낸다
  - 스크린샷은 화면 전체 + 설명 대상에 빨간 테두리
- Phase 4 `/testgen`: F20-26~45 20건. 모달 전제 케이스 16건(F20-01~11·14·15·21~23)은 표에서 `대체`로 바꾸고 테스트 코드를 지웠다. `/testrun`은 `대체` 행을 누락으로 세지 않는다
- 미결 1건: 자동 모드에서 안 본 묶음을 다 끝내면 어디로 가나
- 커밋: 테스트는 구현 전(red)이지만 사용자 요청으로 `test(F20)` 커밋·푸시했다. 다음은 `/implement F20 4`

### REQ-F20 — 튜토리얼 (Phase 3 구현·리뷰 끝 시점 기록)
- Phase 3: 기본 흐름 4장·공유 3장. 스크린샷은 dev에서 테스트 계정 test@test.com으로 찍었다(사용자 지정). 로컬은 PDF 뷰어 401(F16 TODO)과 빈약한 테스트 데이터로 못 썼다
  - 공유 화면을 찍으려고 이 계정으로 기출 PDF 2개 업로드·문제집 1개 생성(dev 데이터)
  - dev 프론트가 `ac502ca`라 스크린샷 헤더에 ? 버튼이 없다(nit)
- dev 공유 버그(소유자 역할 공유 실패, 오류가 [object Object])는 코드가 아니라 **배포 누락**이었다. dev 태스크가 `28-9c17599`(Phase 5)로 떠 있었다
  - 원인: ECS는 배포를 만들 때 `:latest`를 digest로 고정한다. 10-22에 이미지만 푸시하고 desired만 바꿔 옛 digest로 떴다. 어제 기록한 "dev `28-ac502ca`"는 실제로 돈 적이 없다
  - `--force-new-deployment` 후 `ba0034dd…`(= `28-ac502ca`) 확인. 422 배열 detail이 [object Object]로 찍히는 표시 문제는 TODO로 남겼다
- 리뷰 회차 0 @ `cdb17bf`: (b) 2 · (c) 2 · nit 3 → 회차 1 @ `3a9e1fe`: 수정 3건 닫힘
  - 끝까지 본 경우를 계획서가 안 정해서 [확인]이 그냥 닫기로 기록됐다 → 마지막 [확인]은 다시 보지 않기와 같이(사용자 결정). X·배경·Esc는 그냥 닫기
  - 공유 문구가 실제와 달랐다(역할 칩은 모든 카드, 패널 추가는 내 소유 카드만). 문구는 화면 코드와 짝이라 화면을 바꾸면 튜토리얼 문구도 본다
- 리뷰: F20 @ 3a9e1fe — (b) 0 · (c) 0 · nit 2 (직전 수정 3건 닫힘 · 감수 1 유지)
  - 직전 (b): [frontend/src/utils/tutorials.js:45,51] 공유 튜토리얼 문구가 실제 동작과 다르다 · 실측
    - 방안: A 문구 2곳 수정 (tutorials.js 2줄) · TODO · 감수 — 추천 A
    - 결정: A → 닫힘 (3a9e1fe)
  - 직전 (b): [frontend/src/components/TutorialGate.jsx:42,24] 저장소 실패 경계가 getItem·setItem만 덮는다 · 가설
    - 방안: A 저장소 접근을 함수 안 try로 옮기고 읽기 실패 시 쓰지 않기 (+5줄 · TutorialGate.jsx) · TODO · 감수(AuthContext 초기화가 같은 접근에서 먼저 죽는다) — 추천 감수
    - 결정: 감수
  - 직전 (c): [frontend/src/components/TutorialDialog.jsx:24,50] 마지막 슬라이드 [확인]이 그냥 닫기로 기록돼 다 본 사람에게도 새 세션마다 다시 뜬다 · 실측
    - 방안: A 마지막 [확인]은 다시 보지 않기로 기록 (계획서 결정 추가 + 1줄) · B 지금대로 · TODO — 추천 A
    - 결정: A → 닫힘 (3a9e1fe, 계획서 결정 표)
  - 직전 (c): [frontend/src/components/TutorialMenu.jsx:14] 미결 "다시 연 튜토리얼을 닫으면 본 기록을 바꾸나"를 코드가 정했다 · 실측
    - 방안: A 지금 동작으로 계획서 확정 (/workplan, 문서만) · TODO · 감수 — 추천 A
    - 결정: A → 닫힘 (계획서 결정 표, F20-23)
- 테스트: F20 25/25 · 프론트 전체 480 · 빌드 OK · 표 ID 25 = 코드 ID 25 · 근거 인용 모두 본문에 있음
- Phase 3는 체크하지 않았다. 완료 기준의 "dev에서 육안 확인"이 남았다

- Phase 2: 헤더 ? 버튼(알림 벨 왼쪽) → 튜토리얼 목록 → 고르면 모달. 모달을 `TutorialDialog`로 떼어 첫 화면 노출과 다시 보기가 같이 쓴다
- 다시 보기는 본 기록을 읽지도 쓰지도 않는다. 그래서 다시 보기 모달엔 [다시 보지 않기]가 없다. 닫을 때 기록을 바꿀지는 계획서 미결로 남겼다(Phase 2 `/testgen`에서 나옴, 완료 기준 밖)
- 테스트: F20 16/16 · 프론트 전체 471 · 빌드 OK · 표 ID 16 = 코드 ID 16 · 근거 인용 12건 모두 본문에 있음
- 결정은 계획서 결정 표에 있다. 요지만:
  - 슬라이드 모달. 스포트라이트 투어는 화면을 고칠 때마다 깨지고 의존성이 늘어 기각
  - 본 기록은 브라우저 저장소(이메일별). 다시 보지 않기는 localStorage, 그냥 닫기는 sessionStorage. 서버 저장은 기기 간 유지 대신 API·저장소가 늘어 기각(사용자 선택)
  - 그림은 스크린샷, 다크 모드용은 따로 두지 않는다
- 함정: 샘플 문구에 옛 메뉴 이름 "문항 분석"을 쓰자 D11-02(옛 이름 소스 스캔)가 깨졌다. 튜토리얼 문구도 제품 소스라 스캔 대상이다. Phase 3 콘텐츠도 지금 메뉴 이름(분석·생성·결과·템플릿 관리)으로 쓴다
- 저장소 접근 실패 테스트(F20-09)는 인증 키 2개만 통과시킨다. AuthProvider 초기화가 같은 `Storage.prototype.getItem`을 쓰기 때문
- 테스트: F20 13/13 · 프론트 전체 468 통과 · 빌드 OK · 표 ID 13 = 코드 ID 13 · 근거 인용 10건 모두 본문에 있음

### REQ-28 — 분석 결과 공유 (✅ 리뷰 회차 3)
- 리뷰 회차 2 (b) 수정: 공동 소유자가 공유 추가에 자기 이메일을 넣으면 `put_share`가 기존 항목을 덮어써 자기 역할이 내려갔다. 본인 차단을 역할 변경·해제에만 걸어 둔 탓 → 추가에도 `_not_self`. 패널은 내 행에 컨트롤을 안 보여서 직접 입력할 때만 타던 길이다
- 28-62는 `/implement` 전에 `/testgen`으로 먼저 넣었다(사용자 선택). red 확인 뒤 1줄 수정
- 리뷰 회차 2 (c) 감수(사용자 결정): 공동 소유자는 업로더를 해제 못 하지만 job 삭제는 한다. 공동 소유자는 믿고 맡긴 사람이라는 전제 — 계획서 결정 표 "업로더 보호"에 명시
- 브랜치는 머지한 `feat/28-co-owner`를 main에 ff로 맞춰 다시 썼다(사용자 선택)
- 테스트: REQ-28 백엔드 41 · 프론트 21 (28-01~62 통과) · 표 ID 62 = 코드 ID 62 · 근거 인용 62건 모두 본문에 있음(표 행 제외 검사). 프론트 `window is not defined` 간헐 오류는 이번엔 안 났다(TODO 유지)
- 리뷰: 28 @ 0497247 — (b) 0 · (c) 0 · nit 2 (직전 (b) 1건 닫힘 · 직전 (c) 감수 · 회차 1의 TODO 6건 이월)
  - 직전 (b): [backend/app/routers/share.py:75] 공동 소유자가 POST /shares 에 자기 이메일로 자기 역할을 내릴 수 있다 · 실측
    - 방안: A `add_share` 에 `_not_self` + 케이스 28-62 · TODO · 감수 — 추천 A
    - 결정: A → 닫힘 (0497247)
  - 직전 (c): [PLAN § 결정 "업로더 보호" ↔ 28-46] 공동 소유자는 업로더를 해제 못 하지만 job 삭제는 된다 · 실측
    - 방안: A 감수로 결정 표에 명시 · B 삭제는 업로더만 · TODO
    - 결정: 감수 (2026-10-22 사용자 결정)
  - nit: 28-62가 상태 코드만 본다 · 업로더가 아닌 admin이 자기 이메일로 처음 공유할 때 문구가 어긋난다(피해 없음)
- 리뷰 게이트: 마지막 코드 커밋 `0497247` = 회차 3 sha · (b) 닫힘 · (c) 감수 → ✅
- 이 수정(`0497247`)은 아직 main 머지·배포 전이다. dev·prod는 어제 `dd98f4b`

### REQ-28 — Phase 8 동시 편집 후속 (✅ 리뷰 회차 6)
- 남은 항목 검토(사용자 "남은거 검토해자") 뒤 회차 1 이연 6건을 정리했다
  - 고침 4건: 재감지가 편집자 이름 변경을 되돌림 · 비소유자 재감지 안내 · `delete_job` 편집 잠금 · 역할 변경과 해제 경쟁
  - 이미 닫힘 1건: 공유 다이얼로그 목록 잔상 — Phase 7 패널이 대상이 바뀌면 비우고 늦은 응답을 버린다
  - 감수 1건: 편집 잠금 스레드풀 교착 — 같은 job 쓰기 40건이 동시에 몰려야 해서 지금 규모에선 안 생긴다
- 재감지 쓰기는 `_save_detection`으로 모았다. 잠금 안에서 최신 상태를 다시 읽고 감지 필드만 옮긴다. 재감지 동안 잠금을 쥐는 안은 수십 초 편집이 멈춰 기각
- 리뷰가 같은 길에서 경계를 두 번 더 좁혔다
  - 회차 4 (b) 2건(실측): 재감지 도중 삭제한 job의 상태가 `or job`으로 되살아남 · 성공 저장 뒤 finally가 한 번 더 써서 프리워밍 중 바뀐 수동 문항 수를 되돌림
  - 회차 5 (c): 지운 job에도 완료·실패 알림이 나가고 캐시가 고아로 남음 → 알림 생략 + `storage.delete_job`으로 정리
  - 회차 6 (c): 완료 저장 뒤 프리워밍 몇 초 사이 삭제의 고아 썸네일 → 감수. 고칠 때마다 더 좁은 틈이 나오는 계열이라 여기서 멈췄다
- ⚠️ `threading.Lock`은 재진입이 안 된다. `_save_detection`이 편집 잠금을 잡으므로 잠금을 쥔 요청 안에서 재감지 저장을 부르면 교착이다. 지금은 백그라운드 태스크에서만 부른다
- 테스트: REQ-28 백엔드 50 · 프론트 23 · 백엔드 전체 497 · 프론트 전체 455 · build 통과 · 표 ID 71 = 코드 ID 71 · 근거 인용 전부 본문에 있음
- 리뷰: 28 @ 2200178 — (b) 0 · (c) 1 · nit 1 (회차 6. 직전 (c) 1건 닫힘)
  - 직전 (c): [backend/app/routers/browse.py:445, 527] 재감지 도중 지운 job에도 알림이 나가고 캐시가 고아로 남는다 · 가설
    - 결정: A → 닫힘 (2200178)
  - (c): [backend/app/routers/browse.py:546] 성공 저장 뒤 썸네일 프리워밍 도중 지우면 프리워밍 썸네일이 고아로 남는다 · 가설
    - 방안: A 프리워밍 뒤 상태가 없으면 `_discard_deleted` (+2줄) · TODO · 감수 — 추천 감수
    - 결정: 감수 (2026-10-22 사용자 결정)
  - nit: 28-70·71이 감지 중 삭제 경로만 덮는다(대기 중 삭제·예외 경로 케이스 없음)
  - 회차 4 기록: 28 @ bf4ab9b — (b) 2 · nit 2 → (b) 2건 결정 A, 회차 5에서 닫힘(c29bfa4). nit: 28-67 sleep 타이밍 의존 · 28-66 삭제 완료 미단언
- 리뷰 게이트: 마지막 코드 커밋 `2200178` = 회차 6 sha · 수정 결정 전부 닫힘 · 나머지 감수 → ✅ 유지
- Phase 8 코드는 `feat/28-co-owner`에만 있다 — 머지·배포 전

## 2026-10-21

### REQ-28 — 분석 결과 공유 (✅ PR #49 머지 `9c17599`)
- 배경: 실사용에서 분석(a)과 생성(b·c·d)이 사람 단위로 갈렸다. ⏸였던 REQ-28을 **분석 결과 공유만**으로 좁혀 꺼냈다 — 문제집 공유는 쓰는 흐름이 없어 제외
- **권한 요청·승인 흐름은 기각** — 생성 담당자가 미탐을 고치려고 요청하고 기다리는 구조가 사용자가 걱정한 불편 그 자체다. 공유할 때 역할을 고르고 기본은 편집자. 오탐은 고르지 않으면 끝나고, 수동 추가가 필요한 미탐만 편집 권한이 필요하다
- 미결 7건은 2026-10-20 사용자와 하나씩 닫았다(계획서 § 결정): 이메일 직접 입력 · job 단위 잠금 · 끊긴 선택은 "삭제된 문항" 표시 · 해제 뒤 문제집은 남고 같은 표시 · 공유받은 사람도 알림 · 현황판에 포함 · 볼 수 있으면 403 / 못 보면 404
- ⚠️ **계획 이탈 — 저장 위치를 상태 파일 `shares` 필드에서 인덱스 파일 `shares/index.json`으로** (`/testgen` 중 발견한 (c), 사용자 결정). 상태 파일을 쓰는 곳이 28군데이고 대부분 읽어 둔 job 객체를 나중에 통째로 쓴다. 재감지는 수십 초 뒤에 쓴다 → 그 사이 추가한 공유가 조용히 지워진다. 같은 이유로 리뷰가 "재감지가 편집자의 이름 변경을 되돌린다"를 냈다(공유 전부터 있던 패턴, TODO)
- 동시 편집 실측: 읽기 직후 50ms 멈추는 대역으로 수동 문항 8건을 동시에 추가하면 **잠금 없이 1건만 남았다** → 잠금 후 8건
- 잠금은 프로세스 안(`threading.Lock`, FastAPI 의존성)이다. ECS 태스크 1 · uvicorn 워커 1 전제 — 늘리면 깨진다
- s3 공유 인덱스는 메모리 캐시 — 알림 필터가 SSE 이벤트마다 읽는다. 쓰는 곳이 API 프로세스 하나라는 전제(운영 콘솔이 공유를 쓰게 되면 깨진다)
- 리뷰 회차 0의 (b) #1: 복원 판정이 재감지 중(문항 목록이 비어 온다)·504를 "전부 삭제"로 읽었다 → 404만 접근 불가, 감지 미완료·그 밖의 오류는 판정 생략
- 테스트: 백엔드 31 · 프론트 12 (28-01~43 전부 통과) · 백엔드 전체 480 · 프론트 전체 444(Node 22). ⚠️ **Node 20에선 F17-17·20이 `fs.globSync is not a function`으로 실패** — 이번 변경과 무관한 환경 문제(`globSync`는 Node 22+)
- 회차: 1 · 범위: 1e69b56..5ef3a9d · 2026-10-21
- 리뷰: 28 @ 5ef3a9d — (b) 0 · (c) 0 · nit 2 (직전 (b) 2건 닫힘 · TODO 6건 이월)
  - (b): [frontend/src/pages/editor/index.jsx:106] markMissing 이 빈 응답·모든 오류를 "삭제됨"으로 읽어 재감지 중·504 때 전부 "삭제된 문항" · 가설
    - 방안: A getJobInfo 로 404=접근 불가, 감지 미완료면 판정 안 함 (+8줄 · editor/index.jsx) · TODO · 감수 — 추천 A
    - 결정: A → 닫힘 (e1721e2)
  - (b): [frontend/src/components/SelectionOrderPanel.jsx:182] "삭제된 문항" 칩 색을 badges.js 밖에서 정함(계약 #36) · 실측
    - 방안: A badges.js 에 MISSING_CHIP (+3줄) · TODO · 감수 — 추천 A
    - 결정: A → 닫힘 (e1721e2)
  - (b): [frontend/src/components/ShareDialog.jsx:34] 열 때 목록을 안 비우고 늦은 응답을 안 버려 이전 job 목록이 남음 · 가설
    - 방안: A 열 때 비우고 늦은 응답 버림 (+4줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (b): [frontend/src/pages/analysis/work.jsx:183] 편집자·뷰어에게 "재감지해 주세요" 안내가 뜨는데 버튼이 없음 · 가설
    - 방안: A 역할별 문구 (+3줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (b): [backend/app/routers/browse.py:58] _edit_lock 이 스레드풀 안에서 대기 — 같은 job 쓰기 ~40건이면 프로세스 정지 · 가설
    - 방안: A async 의존성 + asyncio.Lock (±6줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (b): [backend/app/routers/browse.py:451] 재감지가 잠금 밖에서 읽어 둔 job 을 통째로 써 편집자 변경(이름)을 되돌림 — 원인은 공유 전 패턴 · 가설
    - 방안: A 끝에 다시 읽고 감지 필드만 쓰기 (+6줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (b): [backend/app/routers/browse.py:340] delete_job 이 잠금을 안 잡아 진행 중 편집이 삭제 뒤 파일을 되살림 · 가설
    - 방안: A delete_job 에 _edit_lock (+1줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (b): [backend/app/routers/share.py:77] 역할 변경의 존재 확인·쓰기가 잠금 밖 — 동시 해제를 되살림 · 가설
    - 방안: A _index_lock 안에서 확인·쓰기 (+4줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - nit: getJobInfo 와 getAllQuestions 사이 수십 ms 창에 재감지가 시작되면 그 job 이 전부 "삭제된 문항" · 회차 0 의 판정 분기(DONE 아님·404)를 지키는 테스트 없음(28-43 은 호출만 본다)
- 리뷰 게이트: 마지막 코드 커밋 `5ef3a9d` = 리뷰 회차 1 sha · (b) 수정 2건 닫힘 · 나머지 6건 TODO → 게이트 열림
- PR #49 main 머지(`9c17599`). dev 배포: 백엔드 이미지 `28-9c17599`(= `:latest`, rev 9) · 프론트 Worker Version `6143644a`. 배포 뒤 사용자 요청으로 dev 백엔드 `desired 0`
- ⚠️ **꺼진 서비스를 `--desired-count 1 --force-new-deployment`로 켜면 태스크가 2개 뜨고 하나는 옛 이미지다** — 옛 배포가 이미지 digest를 고정해 둔 채 desired 1을 받는다. 정리될 때까지 몇 분간 API가 옛 코드로 응답했다(공유 경로 404). 판정은 태스크별 `imageDigest`와 배포 수가 1이 될 때까지 기다린 뒤 한다
- ⚠️ **계획 이탈 — Phase 5 육안은 dev가 아니라 로컬에서 했다** (사용자 결정 A). dev를 켜 둘 이유가 없어 로컬 백엔드(local 스토리지) + Vite로 3계정을 심어 확인했다
  - API 실측(실제 HTTP): 역할별 `my_role` · 목록 · 현황판 합계 · 뷰어 쓰기 403 · 편집자 쓰기 201 · 재감지·삭제 403 · 남 404 · 강등 즉시 403 · **소유자 4 + 편집자 4 동시 수동 추가 → 8건 모두 남음**
  - 화면: 소유자(공유·삭제 버튼, 공유 다이얼로그) · 편집자 · 뷰어(생성 메뉴에서 선택 가능, 생성 버튼은 안 누름) 확인
  - **못 본 것: 편집자 화면에서 드래그로 수동 추가.** local 모드 PDF 뷰어가 `/api/files` 401로 전 계정 실패 — REQ-28과 무관한 기존 이연(TODO F16 "local 미리보기")이고 dev·prod는 presigned라 해당 없음. 쓰기 판정은 서버라 API 실측으로 갈음하고, 다음 dev 기동 때 한 번 보기로 TODO
- **같은 날 재개 — Phase 6·7** (로컬 육안 뒤 사용자 요청, 브랜치 `feat/28-co-owner`). REQ-28은 ✅ → 🟡
  - Phase 6 공동 소유자: 공유 역할에 소유자. 소유권 이전은 기각(요청은 "함께 관리"). 업로더는 인덱스 밖(`owner_id`)이라 해제·변경 대상이 아니고, 공유 목록 응답에 `owner`로 따로 싣는다
  - ⚠️ 계획 이탈: 초안 결정 "공유로 주는 역할은 편집자·뷰어뿐"을 뒤집었다 → 28-25를 `owner`→422에서 `admin`→422로 갱신
  - Phase 7: 다이얼로그를 현황판 상세 자리의 오른쪽 패널로(사용자 "분석현황판 상세와 동일하게"). 패널이 열린 동안 카드 클릭 = 공유 대상 선택. 일괄 공유는 기존 API를 분석마다 불러 되는 것만 공유(전부-아니면-전무 일괄 API 기각, 사용자 선택). 모든 카드에 역할 칩(`ROLE_CHIP`). 본인 역할 변경·해제는 서버 400
  - 파일 경로 `components/ShareDialog.jsx`는 패널이 됐어도 유지 — 계약 #28
  - 9건 중 5건(28-45~48·50)은 구현 전부터 녹색이었다. `role_of`가 인덱스의 역할 문자열을 그대로 읽어서 owner 항목도 이미 통했다
  - 테스트: REQ-28 백엔드 40 · 프론트 21 (28-01~61 전부 통과) · 백엔드 전체 489 · 프론트 전체 453 · build 통과
  - ⚠️ 프론트 `vitest -t '28-'`에서 `ReferenceError: window is not defined` 처리 안 된 오류가 8회 중 2회 났다(케이스는 전부 통과). 재현 때 스택을 못 잡아 원인 미확인 — TODO
  - 사용자 로컬 육안 통과("아주 마음에 들어")
- 리뷰: 28 @ 56d9277 — (b) 1 · (c) 1 · nit 3 (회차 2 · 범위 5ef3a9d..56d9277)
  - (b): [backend/app/routers/share.py:75] 공동 소유자가 POST /shares 에 자기 이메일을 넣으면 자기 역할을 내릴 수 있다 — 본인 차단이 PATCH·DELETE 에만 있다 · 실측
    - 방안: A `add_share` 에 `_not_self(target["user_id"], current_user)` + 케이스 28-62 (+1줄 · 테스트 ~8줄) · TODO · 감수 — 추천 A
    - 결정: A — 2026-10-22 수정 (사용자 "결함 나오면 내일 고치자")
  - (c): [PLAN § 결정 "업로더 보호" ↔ 28-46] 공동 소유자는 업로더를 해제 못 하지만 job 삭제는 된다 · 실측(28-46 녹색)
    - 방안: A 감수로 결정 표에 명시 (문서 1줄) · B 삭제는 업로더만 (`browse.py` 1곳 + 테스트 1건) · TODO — 추천 없음(사람 결정)
    - 결정: — (2026-10-22 결정)
  - nit: 실패 목록 key·표시가 문서 이름(계약 #17) · 일괄 결과 문구가 카드를 더해도 남음 · 공유 중 카드 토글 시 늦은 응답이 다른 분석 사람 목록에 붙을 수 있음(가설)
- 리뷰 게이트: (b) 결정 A 미수정 · (c) 결정 `—` → 🟡. 배포는 사용자 요청으로 이 상태 그대로 dev·prod에 나간다((b)는 공동 소유자 자기 자신에게만 영향)

## 2026-10-15

### REQ-C12 — Phase 3 서버 수동 on/off (🟡 구현·리뷰 끝, prod 확인 남음)
- **미결 2건 종결**: 켜는 방식은 **`desiredCount`만 변경**(scalable target 최소·최대는 안 건드림) · dev도 **같은 버튼**(다음 예약 "없음")
- dev 실측(임시 scalable target min=max=0, 끝나고 삭제): 범위 밖 desired 1을 10분 둬도 그대로(스케일링 활동 0건) → 한 번 도는 예약(min=max=0)이 돌자 17:36:35에 min/max 변경 직후 desired 0. **AAS는 예약이 돌 때만 범위로 맞춘다**(prod엔 스케일링 정책이 없다 — 정책을 추가하면 다시 볼 것). 주말에 수동으로 켜면 다음 off가 월 23:00이라 그때까지 켜져 있다
- 실측 방향의 한계(회차 4 (c), 감수): 확인한 건 "desired > 최대" 쪽뿐이다. 운영 구간 안에서 끄기(desired 0 < 최소 1)가 안 되돌려지는지는 미실측
- 로직은 F19 모듈에 둔다 — `operating_schedule.next_scheduled`(켜져 있으면 다음 꺼짐, 꺼져 있으면 다음 켜짐) · `set_service_running`. 콘솔 스크립트는 임포트 시 `sys.argv`를 읽어 테스트 불가(Phase 1과 같은 이유)
- ⚠️ **다음 예약은 구간(`compute_windows`)이 아니라 예약 하나하나에서 고른다**(회차 4 실측) — 구간은 켜짐→꺼짐 쌍만 남겨, 한 번 도는 `at()` off가 끼면 12:00 대신 23:00, 짝 없는 예약만 있으면 "없음"이 나왔다
- ⚠️ **해석 실패를 `None`으로 삼키면 "없음"(= 예약 없음)으로 보인다**(회차 5 실측) — 운영자는 수동으로 끈 게 계속 간다고 읽는다. 예외를 올려 콘솔이 "조회 실패"로 보이게 했다. 이걸로 회차 4 (c) "해석 실패와 없음 구별"(TODO 결정)도 해소돼 `TODO.md`엔 넣지 않았다
- dev 육안(사용자): 가입 → 승인 대기 안내 · 로그인 403 안내 · [승인] 후 진입 · 열어 둔 화면에서 [차단] → **30초 안에 로그인 화면** · [차단 해제] · 콘솔로 dev 켜기(18:42 태스크 기동)·끄기(18:45 정지)
- 리뷰: C12 @ e7e37ca — (b) 2 · (c) 2 · nit 3 (회차 4, 범위 66d7d6f..e7e37ca — 직전 기준 9fe0043..HEAD엔 main의 C12 아닌 커밋이 섞여 분기점 delta로)
  - (b): [backend/app/services/operating_schedule.py:154 `next_scheduled`] 쌍 구간에서만 뽑아 짝 없는 예약(at() 등)을 놓침 · 실측
    - 방안: A 예약 이벤트 직접 조회 (~10줄 · 테스트 1건) · TODO · 감수 — 추천 A
    - 결정: A → `b562ef6` 회차 5에서 닫힘
  - (b): [scripts/ops/admin_console.py:137 `server`] 예약 조회 실패면 server() 500 → 패널·on/off 버튼 소실 · 가설
    - 방안: A try/except + "조회 실패" (~5줄) · TODO · 감수 — 추천 TODO
    - 결정: A → `b562ef6` 회차 5에서 닫힘
  - (c): [PLAN-C12 § 제약] 운영 구간 안에서 끄기 미실측 · 가설
    - 방안: A prod 실측 항목에 추가 · TODO · 감수 — 추천 A
    - 결정: 감수
  - (c): [operating_schedule.py `compute_windows`] 해석 실패도 [] → "없음", dev와 구별 안 됨 · 가설
    - 방안: A 계획서에 실패 표시 결정 · TODO · 감수 — 추천 TODO
    - 결정: TODO → 회차 5 (b) 수정으로 해소
- 리뷰: C12 @ b562ef6 — (b) 1 · (c) 1 · nit 3 (회차 5)
  - (b): [backend/app/services/operating_schedule.py:169 `next_scheduled`] 해석 못 하는 예약(`L`·`rate()`)을 삼켜 None → "없음" · 실측
    - 방안: A try/except 삭제 (−4줄) · TODO · 감수 — 추천 A
    - 결정: A → `ed9d061` 회차 6에서 닫힘
  - (c): 운영 구간 안 끄기 미실측 — 결정: 감수(회차 4 그대로)
  - nit: 14일 안에 예약이 없으면 "없음" · StartTime/EndTime 무시(compute_windows 때부터) · schedule_error 원문이 화면에 안 보임
- 리뷰: C12 @ ed9d061 — (b) 0 · (c) 1 · nit 1 (회차 6)
  - (c): 운영 구간 안 끄기 미실측 — 결정: 감수
  - nit: 해석 실패가 예외로 올라오는 경로를 고정하는 케이스가 없다(try/except를 되살려도 녹색)
- 케이스 **C12-20~27 (8/8)** · C12 전체 27/27 · 백엔드 449 · Phase 3 체크는 아직 — **prod 확인 창 육안 · prod 실측 1회(15시 전 콘솔로 켜고 23:00 off 확인)**가 완료 기준에 남았다

### REQ-C12 — ✅ (Phase 3 마무리)
- prod 콘솔 확인 창 육안(사용자) — [서버 끄기] → "PROD 서버를 끕니다" 확인 창 → 취소
- ⚠️ **계획 이탈**: Phase 3 완료 기준 "수동으로 켠 뒤 다음 off 예약이 정상으로 내린다(prod 실측 1회)"는 **사용자 결정으로 생략**. 같은 메커니즘(예약이 돌면 desired를 범위로 내린다)을 오늘 dev 임시 target 실측으로 봤다. prod에서 직접 본 적은 없으니, prod에 스케일링 정책을 붙이거나 예약을 바꾸면 그때 확인할 것
- 리뷰 게이트: 마지막 코드 커밋 `ed9d061` = 리뷰 회차 6 sha · (b) 0 · (c) 1 감수 → ✅. 코드는 `feat/C12-server-onoff`에만 있고 **PR·배포 전**(서버 쪽은 함수 2개 추가뿐이라 prod 동작 무변경 — 콘솔은 머지 후 바로 쓴다)

### REQ-F19 — ✅ (Phase 3 prod 대조)
- prod `GET /api/operating-windows`(17:22, 운영 구간 중) ↔ AWS 예약(`on` 평일 15:00 · `off` 평일 23:00 Asia/Seoul): 10-15~10-29 평일 11구간 · 주말 제외 · 진행 중 당일 구간 포함 — **일치**. 22시 배너는 사용자 육안 확인(10-08 이후)
- 리뷰 게이트: 게이트 명령이 `2576d4b`를 마지막 코드 커밋으로 낸다 — 루트 `CLAUDE.md`만 바꾼 문서 커밋이라 `:/!docs` 밖으로 잡힌 것(알려진 게이트 sha 문제). 실제 마지막 코드 커밋은 리뷰 sha `340ddea`와 같아 ✅로 올렸다. 회차 9 결정(TODO 5 · 감수 3)은 10-08에 옮겨 둠

## 2026-10-13

### REQ-C12 — Phase 1·2만 먼저 머지 (PR #47 `97c1410`)
- Phase 3(서버 수동 on/off)은 미결 2건(켜는 방식 실측 · dev 버튼 여부)이 열려 있어 **1·2를 먼저 내보내기로 결정**(사용자). Phase 3은 같은 브랜치에서 이어 간다
- 충돌은 `App.tsx` 하나 — 아래 색상 정리 커밋이 따옴표 스타일을 통째로 바꾼 자리라 **의미 충돌은 없었다.** main 쪽을 그대로 두고 `BlockedGuard`·import 2개만 얹었다
- 배포 전 확인: 상태 필드가 없는 기존 사용자 레코드는 **`active`로 읽는다**(`auth_service.py:74`) — 배포해도 기존 계정은 막히지 않고 새 가입자만 승인을 거친다
- 리뷰: 새 코드 커밋 없음(머지 커밋의 충돌 해소만) — 회차 3 @ `9fe0043` 판정 그대로
- 백엔드 441 · 프론트 432/432 · `npm run build` 통과 · **dev·prod 배포 전**(백엔드·프론트 둘 다 바뀜)

### 색상 정리 (`a8811e5`, 2026-10-08 사용자 직접 커밋 — REQ 없음)
- 뱃지 색을 바꿨다: 분석 중 info→**secondary** · 완료 success→**primary** · 오탐 warning→**error** · 수동 primary→**info** · 정보성 칩 primary→**secondary** 테두리형 · 신규 `HIGH_INFO_CHIP`(secondary 채움, 생성 이력) · 신규 `MARK_COLOR.missPage`(warning)
- `/review`·`/testrun`을 거치지 않고 main에 들어가 **F14-13·15·16·17 · D13-13 5건이 main에서 5일간 빨간 상태**였다. C12 머지 검증 중 발견 → 사용자 확인 "의도한 색" → 테스트 기대값·계획서 표(F14·D13)를 새 색으로 갱신(`9008162`). 계약 #36도 현행화
- `MARK_COLOR.missPage`는 정의만 있다가 현황판 미탐지 타일이 쓰도록 사용자가 연결(`8cd781b`) · `badges.js`의 "수동은 primary(남색)" 주석은 이제 틀렸다(코드는 info)
- ⚠️ D13이 "수동 = primary"로 정한 이유(새 secondary 주홍이 error 진홍과 붉어 헷갈림)는 이번에 수동이 info로 가며 해소됐지만, **오탐이 error가 되면서 "오탐"과 "분석 실패"가 같은 색**이 됐다 — 의도인지 미확인
- dev·prod 배포 → 아래

### 배포 — C12 Phase 1·2 + 색상 정리 → dev·prod
- 결과: 백엔드 dev `c12-289a3a3`(rev 9, `:latest`) · prod **rev 6 `prod-8cd781b`**(rev 5 deregister) — 둘 다 같은 digest `baacf3e0…`(그사이 백엔드 변경 없음), 실행 digest = ECR 대조 · `/health` 200 · 프론트 dev `187a3853` · prod `1b4b81a1`(라이브 번들 = 로컬 dist)
- ⚠️ **첫 시도에서 prod 백엔드가 조용히 안 올라갔다.** 백엔드 빌드와 `frontend-deploy.sh`를 동시에 돌렸더니 wrangler가 `frontend/.wrangler/tmp`를 만들었고, `backend-deploy-prod.sh`의 `git status --porcelain` 검사가 이를 미커밋 변경으로 보고 **"거부"로 끝났다.** 출력을 `| tail`로 잘라 종료 코드가 0으로 보였고 **완료로 오보고**했다 — 다음 확인(`describe-services`가 여전히 rev 5)에서 발견. → prod 백엔드 배포는 **단독으로, 파이프 없이, exit 코드와 실행 digest를 보고** 판정한다. `.wrangler/`는 지금 빈 디렉터리라 git엔 안 보이지만, 안에 파일이 생기는 순간 다시 걸린다
- dev 백엔드는 배포 뒤 사용자 요청으로 `desired 0`(running 0 확인). prod는 그대로 켜 둠(사용자 몫)
- 배포 도중 사용자가 중단을 요청했으나 프론트 2건·dev 백엔드는 이미 끝난 뒤였다 → 되돌리지 않고 `missPage` 커밋 후 재배포로 결정(사용자)

## 2026-10-08

### REQ-C12 — 운영 콘솔 Phase 2 계정 차단 (🟡 Phase 2/3)

- 결정(2026-10-08 사용자): 차단된 세션은 **403 "이용이 제한된 계정" → 안내 후 로그아웃·로그인 화면**(401 재로그인 유도 기각 — `apiFetch`가 갱신부터 시도해 원인이 안 보인다) · 열린 알림 스트림은 **바로 끊기** · **admin 계정은 차단 불가**(회수 후 차단 — 콘솔은 AWS 자격증명으로 돌아 "자기 자신"을 구분 못 한다)
- **차단 판정은 `auth_service.ensure_active()` 한 곳** — 로그인·refresh·`_user_from_access_token`(헤더·쿠키 인증 공통)이 지난다. 새 인증 경로를 만들면 이 함수를 거쳐야 차단이 먹는다
- "바로 끊기"의 실제 의미는 **차단 후 최대 ~30초** — 콘솔은 별도 프로세스가 저장소에만 쓰므로 서버가 알려면 다시 읽어야 하고, heartbeat(30초)가 그 주기다. 즉시가 필요하면 서버에 차단 알림 경로가 따로 필요하다(안 함)
- ⚠️ **차단 사용자는 대부분 `403`이 아니라 `401 → refresh 403`으로 온다**(회차 2) — 화면을 열어 둔 채 차단되면 서버가 스트림을 닫고 `EventSource` 재연결 403 → `onError`가 갱신 시도, 접속 안 한 사용자도 access 만료 뒤 갱신 경로다. `_rawFetch`만 감지하면 토큰만 지워지고 안내·로그아웃 없이 401이 반복됐다 → `_tryRefresh`도 감지
- ⚠️ **SSE에서 이벤트마다 `storage.get_user`를 부르면 연결 수 × 이벤트 수만큼 R2 동기 GET이 나가 이벤트 루프를 막는다**(회차 2) → heartbeat에만. C12-19가 되살아나면 잡는다(스크래치 변형 실측)
- 리뷰: C12 @ 24005e0 — (b) 1 · (c) 0 · nit 3 (회차 2)
  - (b): [frontend/src/api/client.js:133 `_tryRefresh`] 화면을 열어 둔 채 차단되거나 access 만료 뒤 돌아온 차단 사용자는 refresh 403에서 토큰만 지워지고 안내·로그아웃 없이 401 반복 · 가설(코드 추적)
    - 방안: A `_tryRefresh`도 차단 감지 · B 토큰 없는 401이면 범용 로그아웃 · TODO · 감수 — 추천 A
    - 결정: A → `9fe0043` 회차 3에서 닫힘
  - nit(수정 결정): `notification.py:111` 이벤트마다 상태 읽기 — 사용자 선택으로 heartbeat에만(계획대로) → `9fe0043` 닫힘
  - nit: C12-13은 사실상 항상 통과(삭제가 추가될 때만 잡음) · App 렌더 테스트 mock에 `setBlockedCallback` 없음(stderr 잡음, 기존 계열)
- 리뷰: C12 @ 9fe0043 — (b) 0 · (c) 0 · nit 1 (회차 3)
  - nit: 401 요청이 동시에 N개면 `_onBlocked`·`logout`·`navigate(replace)` N번(멱등, 가시 피해 없음) — 갱신 Promise 공유로 줄일 수 있음
- 케이스 **C12-09~19 (11/11)** · 백엔드 441 · 프론트 430/432(F17 기존) · 콘솔 local 실측(admin 차단 400 · 해제 반영) · **브라우저 육안 전**(30초 스트림 종료·로그인 화면 이동·[차단 해제])

### REQ-C12 — 운영 콘솔 Phase 1 가입 승인 (🟡 Phase 1/3)

- **TODO 2건(가입 승인·계정 차단)에 서버 수동 on/off를 더해 한 REQ로** — 셋 다 운영 콘솔(내 맥 127.0.0.1, R2 직접 읽기·쓰기) 기능. 앱 안 관리자 화면·prod 관리 API는 만들지 않는다(기존 콘솔 관례)
- 결정(2026-10-08 사용자): 사용자 레코드 `status` 하나(`pending`·`active`·`blocked`, 거절 = 차단) · 미승인은 **로그인 거부 + 안내**(로그인 허용·기능 막기 기각 — 화면마다 손대야 함) · **`status` 없는 기존 가입자 = active**(이관 없음 — 오픈 후 쓰는 사람이 갑자기 못 들어오면 안 됨) · 차단은 **즉시** · 수동 on/off는 **예약 그대로**(다음 예약까지만 유효)
- 미승인 로그인은 **403**(비밀번호 오류 401과 구분) · **비밀번호가 맞을 때만** 상태를 알린다(승인 대기 여부가 계정 존재를 드러내지 않게) · **가입 직후 자동 로그인 제거**(REQ-27 27-59 → C12-06 대체, PLAN-27 행에 표시)
- 승인 로직은 `auth_service.set_user_status()`(값 검사 포함) — **콘솔 스크립트는 임포트 시점에 `sys.argv`를 읽어 테스트로 임포트할 수 없다.** 로직을 백엔드에 둬야 검증된다. 콘솔 연결은 scratch `LOCAL_STORAGE_DIR` + local 모드로 띄워 실측(목록·잘못된 값 400·승인 반영·버튼)
- ⚠️ **가입→로그인 테스트 헬퍼 6파일이 새 기본값 `pending`에 걸렸다**(`conftest.authed_client` 포함) — 로그인 전 승인 한 줄씩. 새 테스트가 가입 직후 로그인하면 403이다
- ⚠️ **로그인이 `pending`만 막으면 콘솔에서 승인 대기를 [차단]하는 순간 로그인이 열렸다**(회차 0 실측) → `active`만 허용. 토큰 갱신·이미 로그인한 세션 차단은 Phase 2
- 리뷰: C12 @ 095395f — (b) 1 · (c) 0 · nit 2 (회차 0)
  - (b): [backend/app/routers/auth.py:51 · scripts/ops/admin-console.html:228] 로그인이 `pending`만 거부해, 콘솔에서 승인 대기를 [차단]하면 로그인이 열린다 · 실측
    - 방안: A 로그인 `!= "active"` 거부 · B Phase 1 [차단] 버튼 빼기 · TODO · 감수 — 추천 A
    - 결정: A → `f14beaf` 회차 1에서 닫힘
  - nit: 차단된 줄에 해제 버튼 없음(Phase 2) · C12-06이 27-59의 signup 인자 단언을 뺐으나 27-63이 덮음
- 리뷰: C12 @ f14beaf — (b) 0 · (c) 0 · nit 3 (회차 1)
  - nit: `status: null` 레코드는 거부(손으로 고친 경우만, 막히는 쪽) · C12-08이 `blocked`만 봐 "모르는 값 거부"는 미고정 · 차단 해제 버튼 없음(Phase 2 — 그 전까지 Phase 1 콘솔의 [차단]은 되돌릴 버튼이 없다)
- 케이스 **C12-01~08 (8/8)** · 백엔드 433 · 프론트 427/429(F17-17·20 기존 Node 20 환경) · 배포 전(백엔드·프론트 둘 다 바뀜)

### REQ-D13 — 브랜드 리뉴얼 Phase 3 글꼴 (✅)

- **본문·제목 모두 `Outfit Variable` → `Gothic A1` → OS 한글 고딕** — 계획서는 Gothic A1이 OS 고딕 "자리를 대체한다"였지만 OS 고딕은 **뒤에 남겼다**(글꼴 로드 전·실패 대비). Outfit은 가변 글꼴 1파일(등록 이름 `Outfit Variable` — `'Outfit'`이 아니다), Gothic A1은 굵기마다 별 파일이라 400~700만
- Gothic A1 한글은 굵기당 `@font-face` 99개로 쪼개진 unicode-range라 빌드 `dist/assets`가 12MB(woff2 ~4.7MB)지만 브라우저는 쓰는 글자 조각만 받는다
- ⚠️ **배포 직후 라이브 CSS가 옛 글꼴(Barlow·DM Sans)로 보였다** — `index.html` 캐시였다. 캐시 우회 재조회로 새 번들 확인. "배포했는데 안 바뀌었다"면 index부터 no-cache로 다시 볼 것
- 생성 PDF 글꼴(`fitz.Font("korea")`)은 범위 밖 — 미리보기 라벨(테마 글꼴)과 PDF 글꼴은 DM Sans 때부터 달랐고 계약 #12·#14는 문자열·지면 색 짝이라 무관
- 리뷰: D13 @ 122da1c — (b) 0 · (c) 0 · nit 4 (회차 6)
  - nit: `typography.ts:73,80` h1·h2 `fontWeight: 800` 잔존(Gothic A1은 700까지, 사용처 0) · `typography.ts:52` 주석 "OS 기본 고딕" 잔존 · `brandFont.test.js` `/^Outfit/`이 `'Outfit'`도 통과 · 미리보기 vs PDF 글꼴 차이(범위 밖)
- 케이스 **D13-25~30 (6/6)** · dev 배포(Worker `e2982dee`) 후 사용자 육안 확인 → **REQ-D13 ✅**
- **PR #45 main 머지 `cee0695` → prod 프론트 배포**(Worker `dailystudy-workbook-prod` Version `7b551ea0`) — 라이브 CSS 번들이 로컬 빌드와 같고 Outfit·Gothic A1 포함, API는 prod 도메인. 프론트 전용이라 백엔드 배포 없음. dev 프론트는 브랜치 빌드가 main과 같은 앱 코드라 재배포 안 함

### REQ-D13 — 브랜드 리뉴얼 Phase 2 테마색 (🟡 Phase 2/3)

- **사용자가 최종 테마 셋(6색 × 6단계 + 남색 회색 grey)을 직접 줬다** — 처음 정한 빨강 `#F0503A` secondary·다크 primary `#8FA3D1`은 이 셋(주홍 `#CC4A12` · 다크 primary `#8EA4D6`)으로 대체. "수동" 칩은 셋을 받은 뒤에도 primary로 재확인 → F14-16 기대값 갱신(PLAN-F14 행에 대체 표시)
- **테마 셋의 main은 라이트용 진한 색이라 다크에서 글자로 묻혔다**(회차 2, error 2.04:1) — primary만 다크용이 있었다. 5색(primary·secondary·info·success·error)을 **모드별 팔레트**로: 다크 main = 라이트 light. warning은 6.27:1이라 공유
- ⚠️ **다크 `dark` 단계를 진하게 두면 채움 버튼 hover가 묻힌다**(회차 3) — MUI contained hover 배경이 `palette[color].dark`인데 글자는 다크 contrastText `#151D2E`라 error 2.68:1. 다크 `dark` = 다크 `light`(main보다 밝게)로 → 9.6~11.8:1. 같은 이유로 **다크 filled Alert(완료·실패 스낵바)는 파스텔 바탕 + 검정 글자**가 됐다 — 사용자 dev 육안 확인
- 흰 PDF 지면 위 드래그 오버레이는 다크에서도 종이 위라 다크 primary면 2.49:1 → 모드 무관 `#1B2B4B` 고정(계약 #20 예외 그대로)
- 계약 #20("main·lighter·darker 공유")의 전제가 깨져 문구 갱신(회차 4 (c) 결정 A) — 결론(tint를 쓴다)은 그대로, 이유를 "다크 lighter도 파스텔"로. #21 배경 hex·#36 수동 칩 색도 현행화
- 리뷰: D13 @ 342019b — (b) 1 · (c) 0 · nit 1 (회차 3)
  - (b): [frontend/src/theme/core/palette.ts:91-99] 다크 contained 버튼 hover 배경(*.dark) 위 contrastText #151D2E가 묻힘 — error 2.68:1 · success 3.36 · 실측
    - 방안: A 다크 dark 단계를 main보다 밝게 · B contained hover 오버라이드 · TODO · 감수 — 추천 A
    - 결정: A → `aed8739` 회차 4에서 닫힘
- 리뷰: D13 @ aed8739 — (b) 0 · (c) 1 · nit 3 (회차 4)
  - (c): [CLAUDE.md 계약 #20 · tint.js:3-8 · QuestionListPanel.jsx:59 · nav.tsx:121] "팔레트 공유" 문구가 실제(5색 모드별)와 다름 · 실측
    - 방안: A 계약 #20(/checkpoint) + 주석 3곳(/implement) 갱신 · TODO · 감수 — 추천 A
    - 결정: A → 주석 `62ed2ff` 회차 5에서 닫힘 · 계약 #20 이번 기록에서 갱신
  - nit: 다크 filled Alert 파스텔 바탕(육안 확인) · 다크 책등 warning만 진함 · 다크 warning 배너 흰 글자 3.37:1(warning 공유 사각, delta 이전)
- 리뷰: D13 @ 62ed2ff — (b) 0 · (c) 0 · nit 1 (회차 5)
  - nit: 같은 옛 "공유" 이유 주석이 `UploadForm.jsx:55` · `work.jsx:552` · `NotificationBell.jsx:9-10`에 남음(결론은 맞음 · NotificationBell은 F09-46 스캔 대상)
- 케이스 **D13-09~24 (16/16)** — `/testrun` @ `aed8739`. 그 뒤 `62ed2ff`는 주석만(회차 5 리뷰어가 비주석 변경 0 확인)이라 결과 유지
- dev 배포(D13 브랜치 `62ed2ff`, Worker `eeec6b08`) 후 **사용자 육안 확인**(라이트·다크 버튼·칩·알림 바)

### REQ-D13 — 브랜드 리뉴얼 Phase 1 로고·파비콘 (🟡 Phase 1/3)

- **D12에서 분리했던 워드마크·아이콘·테마색을 한 REQ로** — 사용자가 새 로고 세트(light·dark·transparent·symbol·파비콘 묶음)를 `public/`에 올렸다. 범위: 로고+파비콘+테마색+글꼴(사용자 결정), 생성 PDF 지면(계약 #14·#39)·도메인은 제외
- 결정 6건(2026-10-08 사용자): **남색 primary · 빨강 secondary**(다크는 primary를 `#8FA3D1`로 모드별 — 계약 #20) · **다크 로고는 `logo-dark.svg`에서 배경만 뺀 투명본 파생** · 글꼴 **본문·제목 모두 Outfit + Gothic A1, 400~700, fontsource 자체 호스팅**(D07 관례) · **"수동" 칩은 primary**(secondary가 빨강이 되면 실패 칩과 헷갈림) · 옛 워드마크만 삭제
- **로고는 두 이미지를 DOM에 두고 `applyStyles('dark')`로 하나만 보인다** — JS로 모드를 읽어 src를 바꾸면 첫 페인트에 잘못된 로고가 번쩍인다(계약 #21 계열). 대가: 두 파일 다 내려받는다
- ⚠️ **받은 로고 SVG는 481×184 캔버스에 사방 ~40 여백**이 있어 사이드바 26px에서 한글이 ~6px였다(회차 0, 도형 계산). viewBox를 내용 경계 `38 38 401 108`로 좁혀 ~11.8px. 그림은 그대로라 "디자인 수정 제외"를 넘지 않는다. CLIPBOOK은 여전히 ~4px(nit)
- ⚠️ **받은 SVG마다 ~7.7KB C2PA 메타데이터**(파일의 43~95%) — 공개 배포되고, 파생본은 내용이 바뀌어 해시가 어긋난다. 앱이 쓰는 3개에서 제거(그림 바이트 동일). 안 쓰는 `symbol.svg`·`logo-light/dark.svg`엔 남음(nit)
- ⚠️ **`favicon.ico`에 `sizes="any"`면 크롬이 svg 대신 ico를 고른다** → `32x32`
- ⚠️ **자산을 Finder로 넣으면 `public/.DS_Store`가 생겨 빌드마다 `dist`로 복사·배포된다**(gitignore라 안 보임) → `public/.assetsignore`(wrangler가 assets 최상위에서 읽고 자신은 업로드 제외 — 소스 확인). 배포 후 `/.DS_Store`는 SPA 폴백 `index.html`로 응답(파일 아님) 확인
- 리뷰: D13 @ 55dcc56 — (b) 4 · (c) 0 · nit 5 (회차 0)
  - (b): [frontend/src/components/common/Logo.tsx:29] 로고 SVG 여백으로 26px에서 글자 ~6px · 실측(도형 계산)
    - 방안: A viewBox 자르기 · B CSS 확대 · TODO · 감수 — 추천 A
    - 결정: A → `05784b9` 회차 1에서 닫힘
  - (b): [frontend/index.html:8] ico `sizes="any"`로 svg 대신 ico · 가설 — 결정: A → `05784b9` 닫힘
  - (b): [frontend/public/*.svg] C2PA 메타데이터 공개·파생본 해시 불일치 · 실측 — 결정: A → `05784b9` 닫힘
  - (b): [frontend/public/.DS_Store] Finder 부산물 배포 · 실측 — 결정: A → `05784b9` 닫힘
- 리뷰: D13 @ 05784b9 — (b) 0 · (c) 0 · nit 5 (회차 1)
  - nit: CLIPBOOK ~4.2px · 크롬이 탭에 png를 고를 수 있음(같은 그림) · 미사용 SVG에 C2PA 잔존 · Logo.tsx 주석이 viewBox 자르기 전 기준 · 회차 0 이월 nit(두 이미지 다운로드·단언 약함·`showName=false` 죽은 분기)
- dev 배포(D13 브랜치, Worker `52d1f053`) 후 **사용자 육안: 로고(라이트·다크 전환)·파비콘 확인** — dev 백엔드는 사용자가 다시 내림
- 케이스 **D13-01~08 (8/8)** — D13-08은 구현 전에도 통과(기존 아이콘 링크도 실재 파일이었다)

### REQ-F19 — Phase 3 운영 구간 API (🟡 구현 완료 · prod 반영 전)

- **`GET /api/operating-windows`(무인증)** — 백엔드가 ECS Application Auto Scaling 예약 작업을 `DescribeScheduledActions`로 읽어 앞으로 2주 치 `{start, end}`(ISO, 시간대 포함)를 준다. 켜짐/꺼짐은 이름이 아니라 **용량**(Min≥1 / Max=0)으로 식별. 로컬 AWS 자격증명으로 실제 prod 예약을 읽어 `10-07 15:00+09:00~23:00` 부터 10구간 — 실제 스케줄과 일치(읽기 전용 조회)
- **AWS cron은 직접 해석했다(의존성 추가 없음)** — 6필드 · `?` · 요일 1=SUN…7=SAT · 연도 필드라 일반 cron 라이브러리 관례와 다르다. `python:3.11-slim`에서도 `zoneinfo`가 `Asia/Seoul`을 읽는 것을 확인(tzdata 별도 설치 불필요)
- `SCHEDULE_RESOURCE_ID`가 비면(로컬·dev) 조회하지 않고 빈 목록. **prod 반영은 아직** — 태스크 역할 IAM `application-autoscaling:DescribeScheduledActions` + 태스크 정의 env + 배포가 필요하고, prod 인프라라 사용자 승인 대기
- ⚠️ **`/review`가 회차 4·5·6을 돌며 한 겹씩 내려갔다** — 회차 4 실측 4건(`5/10` step 1회 발화 · 미지원 토큰 하나가 전체를 비움 · 14일 lookback 밖 진행 중 구간 소실 · 같은 시각 on/off 길이 0 구간) + 가설 ⑥(요청마다 AWS 호출 → 5분 캐시)을 고쳤더니, 회차 5가 **②의 "그 예약만 건너뛰기"가 off를 빼면 앞뒤 구간이 이어 붙어 "며칠째 켜짐"을 만든다**(N1, 실측)는 걸 찾았다. 결정 A — **해석 실패가 하나라도 있으면 `[]`. 틀린 구간보다 모름이 낫다.** 회차 6은 같은 증상이 `at(...)`·`rate(...)`(예외 없이 건너뜀)로도 난다는 걸 찾았고 TODO(계획서 미결 `at(...)`과 함께)
- ⚠️ **작업 트리 공유 사고** — 2026-10-07 다른 세션이 공유 체크아웃을 `feat/D12-system-rename`으로 바꾸며 F19 계획서 미커밋 수정을 `stash@{0}`에 보관했다. F19는 **별도 worktree `../pdf-extractor-f19`** 로 옮겨 stash를 거기 적용하고 이어 갔다(D12 세션 무간섭). 동시에 두 REQ를 돌리면 체크아웃을 공유하지 말 것
- 리뷰: F19 @ 5a0f22d — (b) 3 · (c) 0 · nit 5 · 이월 6 (회차 5)
  - (b): [backend/app/services/operating_schedule.py:115-119] 건너뛴 예약이 off면 앞뒤 구간이 이어 붙어 "켜져 있음"이 며칠로 늘어난다 · 실측
    - 방안: A 해석 실패가 하나라도 있으면 `[]` · TODO · 감수 — 추천 A
    - 결정: A → `63d999b` 회차 6에서 닫힘
  - (b): [operating_schedule.py:41-49] 실패는 캐시하지 않아 장애 동안 요청마다 AWS 호출 · 가설
    - 결정: TODO
  - (b): [operating_schedule.py:41] 캐시 만료 순간 동시 요청이 각자 AWS 호출 · 가설
    - 결정: 감수
- 리뷰: F19 @ b171aa2 — (b) 7 · (c) 0 · nit 3 · 이월 3 (회차 4)
  - (b): ① `5/10` step 한 번만 발화 · ② 미지원 토큰 하나가 전체를 비움 · ③ lookback 14일 · ④ 같은 시각 on/off 길이 0 — 모두 실측 · 결정: A → `5a0f22d` 회차 5에서 닫힘
  - (b): ⑤ 예약 작업 `StartTime`/`EndTime` 무시 · 가설 · 결정: TODO
  - (b): ⑥ 요청마다 AWS 호출 · 가설 · 결정: A → `5a0f22d` 닫힘(성공 경로만)
  - (b): ⑦ `NextToken` 페이지네이션 없음 · 가설 · 결정: 감수
- 리뷰: F19 @ 63d999b — (b) 1 · (c) 0 · nit 2 · 이월 8 (회차 6)
  - (b): [backend/app/services/operating_schedule.py:78-79] `at(...)`·`rate(...)` 예약은 예외 없이 건너뛰어 N1 가드를 안 탄다 — off 가 그렇게 빠지면 며칠짜리 켜짐 구간. 원인은 delta 이전(b171aa2) · 실측
    - 방안: A cron 아닌 on/off 예약도 해석 실패로 `[]` · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (b): [operating_schedule.py:41-49] 실패 캐시 없음 · 가설 (회차 5) — 결정: TODO
  - (b): [operating_schedule.py:41] 캐시 만료 동시 호출 · 가설 (회차 5) — 결정: 감수
  - (b): [operating_schedule.py] `StartTime`/`EndTime` 무시 · 가설 (회차 4) — 결정: TODO
  - (b): [operating_schedule.py:fetch_scheduled_actions] `NextToken` 없음 · 가설 (회차 4) — 결정: 감수
  - (b): [frontend/src/pages/unavailable/index.jsx:35] 재시도 fetch 타임아웃 없음 · 가설 (회차 0) — 결정: TODO
  - (c): [frontend/src/api/client.js:28] CORS 없는 504/524도 "서버 다운" · 가설 (회차 0) — 결정: 감수
  - (c): [frontend/src/api/client.js] 사용자 raw fetch 미감지 · 가설 (회차 0) — 결정: TODO
  - nit: 해석 실패 로그에 Schedule만(Timezone 원인 안 보임) · 잘못된 예약이 남은 동안 요청마다 경고
- 테스트 공백: 회차 4·5 수정(step · 격리 → 전체 비움 · 탐색 범위 · 동시각 정렬 · 캐시)은 검증 계약 케이스가 없고 일회성 스크립트로만 확인
- 케이스 **F19-15~24 (10/10)** · F19 누계 24/24 · 백엔드 420/420
- **Phase 3 체크하지 않음** — 완료 기준 "prod에서 API 응답이 실제 `on`·`off` 스케줄과 일치한다"가 남았고(prod 반영 승인 대기), 계획서 미결 `at(...)`이 열려 있다

### REQ-F19 — Phase 4 꺼짐 예고 배너 · 운영 구간 저장 · 다운 화면 운영 시간 (✅ Phase 4)

- **배너는 `App`의 Outlet 밖 · `position: fixed`** — 로그인 화면에서도 보이고(사용자 결정), 100dvh 높이 체인(계약 #1)에 블록을 끼우지 않는다. filled warning Alert라 `*.lighter` 계열을 안 쓴다(계약 #20). 10초 틱 · 분 올림(최소 1분) · `now < end`라 끝 시각에 사라진다
- **운영 구간 조회는 무인증 raw fetch** — apiFetch면 실패 시 서버 다운 안내로 튀고 딤이 켜진다(계약 #26). B23-03 무인증 예외 목록에 이유와 함께 올렸다(계약 #31). 테스트 파일이라 `/testgen`이 올렸다(`/implement`는 테스트를 못 고친다)
- **다운 화면 운영 시간은 브라우저 저장값** — 서버가 꺼져 있으면 물을 수 없어서. 운영 중 장애면 **지금 구간을 표시**(2026-10-08 사용자 결정, `/testgen` 미결에서) — 라벨은 "운영 시간"/"다음 운영"으로 가른다. 시각 표기는 Asia/Seoul 고정
- ⚠️ **API가 `[]`를 주면 저장하지 않는다**(회차 7, 실측) — 백엔드는 AWS 조회·해석 실패도 200 `[]`라서, 덮어쓰면 **서버가 불안정한 바로 그때** 다운 화면 운영 시간이 사라졌다. 대가: 스케줄을 정말 지워도 옛 구간이 최대 14일 남는다 — 백엔드가 실패를 `[]`와 구분해 주기 전까진 못 고친다
- ⚠️ **F19-37 테스트 무대 결함**(`/testrun` (a)) — 저장소 읽기 실패를 흉내 내며 `token|mode` 키만 통과시켰더니 `AuthProvider`가 마운트 때 읽는 `user_email`이 막혀 **앱 셸이 먼저 죽었다**. `/token|mode|email/`로 넓혔지만 취약하다(nit) — 앱 셸이 새 키를 읽기 시작하면 무관하게 깨진다
- ⚠️ **리뷰 에이전트가 worktree에서 `git stash`를 실수로 실행**했다가 즉시 pop — 미커밋 계획서·리뷰 결과 파일이 잠깐 빠졌고, 손실 없음을 재확인했다. 리뷰 에이전트에 "작업 트리를 바꾸는 git 명령 금지"를 함께 넘길 것
- 리뷰: F19 @ 467c3f3 — (b) 2 · (c) 0 · nit 5 · 이월 9 (회차 7)
  - (b): [frontend/src/components/ShutdownBanner.jsx:26] API `[]`가 저장된 운영 구간을 덮어 지운다 · 실측
    - 방안: A 빈 배열은 저장 안 함 (1줄) · TODO · 감수 — 추천 A
    - 결정: A → `5710a3d` 회차 8에서 닫힘
  - (b): [frontend/src/components/ShutdownBanner.jsx:47] 좁은 화면에서 fixed 배너가 헤더 조작부·다이얼로그를 최대 1시간 가린다 · 가설
    - 방안: A 위치·폭 조정 · TODO · 감수 — 추천 TODO(육안 확인 필요)
    - 결정: TODO
  - nit: 구간을 마운트 때 한 번만 받음(14일 넘은 탭은 배너 안 뜸) · 다운 화면 `now` 렌더 때 한 번 · F19-31은 문구 변화만 · F19-37 키 필터 취약 · 맞닿은 구간이면 배너 오탐(백엔드 소관)
- 리뷰: F19 @ 5710a3d — (b) 0 · (c) 0 · nit 2 · 이월 9 (회차 8)
  - (b): [frontend/src/components/ShutdownBanner.jsx:47] 배너 가림 · 가설 (회차 7) — 결정: TODO
  - (b): [frontend/src/pages/unavailable/index.jsx:35] 재시도 fetch 타임아웃 없음 · 가설 (회차 0) — 결정: TODO
  - (c): [frontend/src/api/client.js:28] CORS 없는 504/524도 "서버 다운" · 가설 (회차 0) — 결정: 감수
  - (c): [frontend/src/api/client.js] 사용자 raw fetch 미감지 · 가설 (회차 0) — 결정: TODO
  - (b): [backend/app/services/operating_schedule.py] `StartTime`/`EndTime` 무시 · 가설 (회차 4) — 결정: TODO
  - (b): [operating_schedule.py:fetch_scheduled_actions] `NextToken` 없음 · 가설 (회차 4) — 결정: 감수
  - (b): [operating_schedule.py:41-49] 실패 캐시 없음 · 가설 (회차 5) — 결정: TODO
  - (b): [operating_schedule.py:41] 캐시 만료 동시 호출 · 가설 (회차 5) — 결정: 감수
  - (b): [operating_schedule.py:78-79] `at(...)`·`rate(...)` 건너뛰기로 구간 병합 · 실측 (회차 6) — 결정: TODO
  - nit: 스케줄 삭제 시 옛 구간이 최대 14일 캐시에 남음(결정 A의 대가) · 응답이 배열이 아니면 렌더 throw(이전부터, 실해 낮음)
- 테스트 공백: 회차 7 수정("빈 목록은 저장 안 함")을 단언하는 케이스 없음 — 리뷰 에이전트 일회용 테스트로만 확인(수정 전 커밋에선 실패)
- 케이스 **F19-25~38 (14/14)** · F19 누계 38/38 · B23-03 3/3
- **REQ-F19는 ✅ 아님** — Phase 3 완료 기준(prod 응답 대조)과 미결 `at(...)`이 남았다

### REQ-F19 — Phase 3 미결 `at(...)` 결정 · 구현 (리뷰 회차 9)

- **사용자 결정(2026-10-08)** — `at(yyyy-mm-ddThh:mm:ss)`는 그 예약의 Timezone을 붙인 **한 번의 켜짐/꺼짐**으로 반영("오늘만 일찍 끄기"가 실제 운영 시나리오). `rate(...)`가 켜짐/꺼짐에 섞이면 **`[]`**(기준점이 `StartTime`이라 계산이 까다롭고 ECS on/off에 쓸 일이 드묾 — 회차 5 N1과 같은 "틀린 구간보다 모름"). 기각: at 무시(앞뒤 구간이 붙는 오답) · at도 `[]` · rate를 StartTime 기준 계산
- 구현은 `_occurrences`에서 cron·at이 아닌 표현식을 `ValueError`로 올려 기존 해석 실패 가드(`[]`)에 태웠다 — 새 분기를 만들지 않았다. 회차 6 TODO(at/rate 건너뛰기 병합)가 이걸로 닫혔다
- ⚠️ **F19-42는 수정 전 코드로도 통과한다** — `[ON, rate_off]`는 원래 off가 없어 구간이 안 생긴다. 회차 9가 지적(nit). `[ON, OFF, rate_off]` + on 쪽 rate로 강화해야 결정을 실제로 지킨다
- 리뷰: F19 @ 340ddea — (b) 0 · (c) 0 · nit 4 · 이월 8 (회차 9)
  - (b): [frontend/src/components/ShutdownBanner.jsx:47] 배너 가림 · 가설 (회차 7) — 결정: TODO
  - (b): [frontend/src/pages/unavailable/index.jsx:35] 재시도 fetch 타임아웃 없음 · 가설 (회차 0) — 결정: TODO
  - (c): [frontend/src/api/client.js:28] CORS 없는 504/524도 "서버 다운" · 가설 (회차 0) — 결정: 감수
  - (c): [frontend/src/api/client.js] 사용자 raw fetch 미감지 · 가설 (회차 0) — 결정: TODO
  - (b): [backend/app/services/operating_schedule.py] `StartTime`/`EndTime` 무시 · 가설 (회차 4) — 결정: TODO
  - (b): [operating_schedule.py:fetch_scheduled_actions] `NextToken` 없음 · 가설 (회차 4) — 결정: 감수
  - (b): [operating_schedule.py:41-49] 실패 캐시 없음 · 가설 (회차 5) — 결정: TODO
  - (b): [operating_schedule.py:41] 캐시 만료 동시 호출 · 가설 (회차 5) — 결정: 감수
  - 닫힘: 회차 6 TODO `at(...)`·`rate(...)` 건너뛰기로 구간 병합 → `340ddea`
  - nit: F19-42 약함 · at 해석이 오프셋을 조용히 덮음(`strptime`이 더 엄격) · 같은 시각 at-on/cron-off면 구간이 쪼개짐(가설) · at-on 뒤 off 없으면 "모름"
- 케이스 **F19-39~43 (5/5)** · F19 누계 43/43 · 백엔드 425/425
- **남은 것: Phase 3 완료 기준 "prod에서 API 응답이 실제 `on`·`off` 스케줄과 일치한다"** — IAM `application-autoscaling:DescribeScheduledActions` + 태스크 정의 env `SCHEDULE_RESOURCE_ID` + prod 배포(사용자 승인 대기)

### REQ-F19 — PR #43 머지 · dev·prod 배포

- **main(D12) 병합 충돌 3건은 문서뿐** — `CLAUDE.md` 다음 번호 줄(D13·F20 둘 다)·`TODO.md`·`PROGRESS.md`(2026-10-07 섹션에 F19·D12 둘 다). D12 쪽 로그가 미리 경고해 둔 그대로였다
- **ECS 태스크에 task role이 없었다**(dev·prod 모두 execution role뿐) — 컨테이너 안 boto3가 AWS를 부르려면 task role이 필요해 **`pdf-extractor-ecs-task-role`**을 새로 만들었다(`DescribeScheduledActions` 읽기만, 신뢰 정책에 `aws:SourceAccount` 조건)
- **dev는 prod 예약을 읽는다**(사용자 결정) — dev 서비스엔 예약 작업이 0건이라 dev 값이면 항상 `[]`. rev 9 env `SCHEDULE_RESOURCE_ID`=prod 서비스로 두니 dev API가 10/8(목)·10/9(금)·10/12(월) 15:00–23:00(+09:00) 10구간 — prod cron과 일치. 다운 안내·404 육안 확인 완료(사용자)
- ⚠️ **`backend-deploy-prod.sh`는 서비스의 현재 리비전을 복사해 이미지만 바꾼다** — task role·env를 새로 넣을 땐 **그걸 넣은 리비전(rev 4)을 먼저 등록해 서비스를 옮겨 두고** 스크립트를 돌려야 rev 5가 이어받는다. prod는 desired 0이라 rev 4 전환은 태스크를 띄우지 않았다. rev 3(옛 이미지·role 없음)은 롤백용으로 활성 유지
- ⚠️ **스크립트는 깨끗한 작업 트리를 요구한다** — worktree의 `frontend/node_modules` 심볼릭 링크(미추적)가 걸려 잠시 지웠다 되돌렸다
- **prod 다운 화면에 운영 시간이 안 뜬 건 설계대로** — F19 프론트가 올라간 뒤 prod 백엔드가 한 번도 켜지지 않아 브라우저에 저장된 구간이 없었다. 꺼진 시간에 처음 온 사용자는 계속 못 본다(사용자: 따로 남기지 않음)
- **남은 것** — Phase 3 완료 기준 "prod 응답 대조"(prod는 15:00 예약으로 켜짐) · 22~23시 배너·배너 가림(사용자 육안). 끝나면 Phase 3 체크·REQ ✅

## 2026-10-07

### REQ-F19 — 서버가 꺼져 있거나 꺼질 예정이면 알린다 (🟡 Phase 1/4)

- **발단: "ErrorBoundary로 되나?"** — 안 된다. 렌더 중 throw만 잡고, API 호출은 effect·핸들러·Promise 안이라 닿지 않는다. 감지는 `apiFetch`가 모두 지나는 `_rawFetch` 한 곳에서 한다(`setLoadingCallback` 짝인 `setServerDownCallback`). ErrorBoundary(`errorElement`)는 **흰 화면 방지용으로 따로** Phase 2에 둔다
- **판정은 fetch reject만** — 꺼진 백엔드·터널 530/502는 CORS 헤더가 없어 브라우저에 상태 코드가 아니라 `TypeError`로 온다(계약 #8). CORS가 붙은 5xx는 사용자 결정으로 제외("꺼짐"과 "느림"을 섞지 않는다)
- 사용자 결정: 안내는 **별도 경로**(덮개 기각) · 복구는 **버튼만**(자동 폴링 기각) · 오프라인은 `navigator.onLine === false`일 때만 구분 · 배너 **로그인 화면 포함**(→ 운영 구간 API 무인증) · 다운 화면엔 **다음 운영 구간**(요일·시간 요약은 일반 cron을 문장화하기 어려워 기각)
- **prod 자동 켜짐/꺼짐의 실체(2026-10-07 실측)** — ECS Application Auto Scaling 예약 작업 `on` `cron(0 15 ? * MON-FRI *)` · `off` `cron(0 23 ? * MON-FRI *)`, Timezone Asia/Seoul. **주말은 종일 꺼짐.** 시각은 사용자가 수시로 바꾸므로 프론트·환경변수에 박지 않고 **백엔드가 `DescribeScheduledActions`로 읽는다**(Phase 3 — 태스크 역할 IAM 읽기 권한 필요)
- ⚠️ **안내 화면은 lazy로 두지 않는다** — 오프라인이면 그 청크부터 못 받는다. 그리고 `RequireAuth` 밖이다(안이면 미인증 사용자가 `/login`으로 튕긴다)
- ⚠️ **`/health`는 `/api` 아래가 아니다** — `BASE_URL`에 붙이면 404. 재시도는 raw fetch(apiFetch면 딤이 켜지고 실패 시 감지가 재발)
- **`/review` 회차 0 → 1** — 회차 0 (b) 2건을 수정(`c543422`): ① 복귀 대상이 `pathname+search`뿐이라 **`location.state`가 사라져** 편집 화면(`initialWorkbookId`)이 빈 편집기로 열렸다 ② push 이동이라 **뒤로 가기 → 원래 화면 재실패 → 다시 안내**로 튕기고, 동시 reject가 stale ref 가드를 지나 기록이 중복됐다 → `replace`. 회차 1에서 둘 다 닫힘 · 새 결함 0
- 리뷰: F19 @ c543422 — (b) 0 · (c) 0 · nit 3 · 이월 3
  - (b): [frontend/src/pages/unavailable/index.jsx:35] 재시도 fetch에 타임아웃이 없다 — 응답이 매달리면 [다시 시도]가 비활성으로 남는다(Cloudflare 524까지 ~100s) · 가설 (회차 0)
    - 방안: A `signal: AbortSignal.timeout(…)` (+1줄) · TODO · 감수
    - 결정: TODO
  - (c): [frontend/src/api/client.js:28] CORS 없는 Cloudflare 504/524(느린 정상 서버)도 "서버 다운"으로 판정 — 앱 `TimeoutMiddleware`(30s) 504는 CORS가 붙어 먼저 오므로 드문 경로 · 가설 (회차 0)
    - 방안: A 계획서 미결로 · TODO · 감수
    - 결정: 감수
  - (c): [frontend/src/api/client.js] 사용자가 누른 raw fetch(`uploadPdf` local · `uploadCover` · `uploadWatermark` · `getJobInfo`)는 감지되지 않는다 — 계획서 범위가 `apiFetch` 경로 · 가설 (회차 0)
    - 방안: A 범위 확대를 계획서 미결로 · TODO · 감수
    - 결정: TODO
- 테스트 공백(nit): 회차 0 수정 두 가지(state 복원 · replace)를 단언하는 케이스가 없다 — F19-08은 경로만 본다
- 케이스 **F19-01~12 (12/12)** · 프론트 전체 378/380 — 실패 2건(F17-17·20)은 **Node 20에 `fs.globSync`가 없어서**(Node 22+) 생긴 기존 환경 문제, main에서도 같다
- **Phase 2 — 최상위 `errorElement`(흰 화면 방지)** — 렌더 크래시·`lazy` 청크 로드 실패에 [새로고침] 안내. `<App/>` 자리를 대신하므로 컨텍스트(인증·알림)에 기대지 않는다. 테스트는 **실제 `routes[0]`을 복제해 children에 터지는 라우트를 덧붙인다** — 그래야 "최상위에 달렸는가"가 검증된다
- ⚠️ **catch-all 라우트가 없어서 없는 URL(404)도 최상위 `errorElement`로 온다** — 회차 2가 실측으로 찾았다. "새 버전 배포 · 새로고침" 문구가 404에도 떠 **새로고침해도 영원히 안 풀리는 막다른 화면**이 됐다(이전엔 react-router 기본 "404 Not Found"). 결정 A — `isRouteErrorResponse` 404면 "없는 페이지" + [홈으로](`a511df1`). catch-all `/` 리다이렉트(B)는 기각 — 안내 없이 조용히 튕긴다
- 404 아닌 ErrorResponse(405 등)도 [새로고침]으로 가지만 **앱에 loader·action·`<Form>`·`useFetcher`가 0건**이라 발생 경로가 없다 — 데이터 라우터 API를 쓰기 시작하면 다시 볼 것
- [새로고침]의 `window.location.reload()` 호출은 **jsdom이 `location` 재정의를 막아** 케이스로 못 쓴다 — 코드로만 본다
- 리뷰: F19 @ 0384dfd — (b) 1 · (c) 0 · nit 3 · 이월 3 (회차 2)
  - (b): [frontend/src/routes/router.tsx:33] catch-all 없어 404도 "새로고침" 막다른 안내 · 실측
    - 방안: A 404 분기 + 홈 링크 (RouteError.jsx) · B catch-all → `/` 리다이렉트 · TODO · 감수 — 추천 A
    - 결정: A → `a511df1` 회차 3에서 닫힘
- 리뷰: F19 @ a511df1 — (b) 0 · (c) 0 · nit 2 · 이월 3 (회차 3)
  - (b): [frontend/src/pages/unavailable/index.jsx:35] 재시도 fetch에 타임아웃이 없다 · 가설 (회차 0)
    - 결정: TODO
  - (c): [frontend/src/api/client.js:28] CORS 없는 Cloudflare 504/524도 "서버 다운"으로 판정 · 가설 (회차 0)
    - 결정: 감수
  - (c): [frontend/src/api/client.js] 사용자가 누른 raw fetch는 서버 다운 감지 안 됨 · 가설 (회차 0)
    - 결정: TODO
  - nit: 404 분기를 단언하는 케이스가 없다(F19-13·14는 [새로고침] 경로만) · 404 화면에 대시보드 내비 없음
- 케이스 **F19-13·14 (2/2)** · F19 누계 14/14 · 프론트 380/382(실패 2건은 위 Node 20 환경 문제)

### REQ-D12 — 시스템 이름 변경 "오답 클립북 / ClipBook" (✅ — Phase 1로 종결)

- **이름은 대화로 골랐다** — 후보 방향 4개(클립북·픽앤북·오답+오리기·오답+책)를 한글·영문 짝으로 좁혀 사용자가 **오답 클립북 / ClipBook**으로 결정. 기각 후보: 가위풀·엮음·문제공방·픽앤북·오려담기(SnipNote)·오답북(MissBook)·다시북(Rebook)·MissClipBook(길다)
- **범위는 화면·문서 이름만** — 오픈(2026-10-06) 직후라 도메인·Worker·R2(`dailystudy-*`)·레포·ECS 이름은 그대로. 바꾸면 prod WAF(계약 #38)·R2 CORS·커스텀 도메인이 함께 움직인다
- ⚠️ **워드마크 이미지 속 글자가 `깊은생각`이다**(`logo-wordmark.png`, alt 동일) — 시스템 이름인지 별개 운영 브랜드인지 확인 안 됨. 탭 제목만 바뀌어 **헤더 로고와 탭 이름이 지금 다르다** — 이 상태로 배포하면 두 이름이 함께 보인다
- README·CLAUDE.md 제목은 `/checkpoint`에서 함께 바꿨다(문서라 `/implement` 범위 밖)
- 브랜치는 `main`에서 새로 땄다 — F19 브랜치(미머지 7커밋) 위였다. F19 계획서 미커밋 수정은 `stash@{0}`에 보관(F19 브랜치에서 `git stash pop`)
- ⚠️ **F19 브랜치도 `## 2026-10-07` 섹션과 인덱스 행을 갖고 있다** — 두 PR이 머지될 때 PROGRESS·CLAUDE.md(다음 번호 줄)가 충돌한다. 같은 날짜 섹션은 하나로 합칠 것
- **계획 이탈 — Phase 2(워드마크·아이콘 교체) 보류, 별도 작업으로 분리**(사용자 결정). 미결 2건(`깊은생각` 교체 여부·아이콘)과 함께 **테마 컬러 변경**(남색 `#1B2B4B` · 빨강 `#F0503A`, 채점 펜 느낌)을 한 번에 요청 예정 — 루트 `TODO.md` "브랜드 리뉴얼". 번호는 그때 부여(다음 D13)
  - ⚠️ 그 작업의 함정: 계약 #20 — `main`·`lighter`·`darker`는 라이트/다크 공유라 남색 primary는 **다크에서 배경에 묻힐 수 있다**
- 리뷰: D12 @ e55654a — (b) 0 · (c) 1 · nit 2
  - (c): [frontend/src/systemName.test.js:23] 검증 범위가 완료 기준보다 좁다 — 계획서는 "옛 이름 두 개 × `frontend/`·`backend/app/`" 0건인데, D12-03은 한글 이름 × frontend JS/TS만, D12-04는 영문 이름 × backend `.py`만 본다 · 가설 (현재 두 이름 모두 0건 실측)
    - 방안: A 검증 계약 확장 (/workplan → /testgen, 테스트 2건 +6줄) · TODO · 감수 — 추천 감수
    - 결정: 감수
  - nit: CLAUDE.md "다음 번호"의 `F19`는 F19 브랜치 머지 때 `F20`으로 정리 · src 순회 헬퍼가 테스트 3곳에 복사
- ⚠️ **`@ e55654a`는 문서 커밋이다** — 게이트 명령(`':/!docs'`)이 `docs/` 밖의 `README.md`·`CLAUDE.md`를 바꾼 커밋도 "코드 커밋"으로 잡는다. 이번엔 리뷰 범위가 그 커밋까지 포함해 맞았다
- 케이스 **D12-01~04 (4/4)**

## 2026-10-06

### REQ-B29 — 메타 저장이 실패하면 만들어진 PDF 가 조용히 사라진다 (✅ prod 정상 생성 확인)

- **REQ-F18 `/review` 가 찾아낸 (c) 에서 나왔다.** PDF 는 만들어졌는데 **사용자가 닿을 길이 없고 에러도 없는** 경로가 있었다 — `extract.py` 가 메타 저장 실패를 의도적으로 삼키고(그 판단은 옳다. PDF 는 실제로 만들어졌다) `status = DONE` 을 유지하는데, `emit_export` 가 **`job.status` 만 보고** severity 를 정해 **성공 알림**이 나갔다. 결과 화면은 문제집 행 기준이라 그 PDF 가 안 뜨고, **F18 이 생성 화면 다운로드를 걷어내 유일한 탈출구마저 없앴다**
- 범위는 **재시도 + 알림을 ERROR 로**(사용자 결정). 결과 화면을 job 기준으로 바꾸는 근본 해결은 오픈 전날이라 제외했다 — 재시도가 **발생 확률**을, 알림이 **무지(無知)** 를 줄인다
- **`NotificationSeverity` 에 `WARNING` 을 넣지 않았다** — enum 이 `SUCCESS`·`ERROR` 뿐이고 프론트 3곳이 **이분법**(`severity === "error" ? … : …`)이라 새 값은 **조용히 "성공" 으로 떨어진다**(계약 #18·#20 계열)
- ⚠️ **계획서 함정이 실제로 구현을 바꿨다** — `meta_failed` 를 `emit_export` 에 **따로 넘긴다.** `job.error` 를 신호로 쓰고 싶지만 **그 필드는 생성 실패 경로에서도 채워져서**, severity 는 맞게 나오는데 **문구가 뒤바뀐다**("생성에 실패했습니다" — PDF 는 만들어졌는데). B29-07·11 이 양쪽을 고정한다
- ⚠️ **`message` 는 화면을 떠난 사용자에게 안 닿는다** — `NotificationSnackbar`·`NotificationBell` 둘 다 **`title` 만** 그린다(실측). 이 REQ 가 상정한 사용자가 바로 그 사람이라, 힌트를 **`title` 에** 섞었다(`"<이름> — 이력 등록 실패"`). 프론트는 안 건드렸다
- **`/review` 3회차 — 매번 한 겹씩 아래로 내려갔다.** 회차 0 은 **구현**(재시도가 멱등이 아니었다 — `workbook_id` 를 함수 안에서 만들어 재시도마다 다른 키였고, PUT 은 올라갔는데 응답에서 터지는 경우 이력에 **중복 행**이 생긴다. 계약 #23 이 "중복으로도 안 잡힌다" 고 경고한 모양), 회차 1 은 **그 가드**(B29-09 가 `_save_workbook_meta` 를 통째로 대역으로 갈아 "호출부가 무엇을 넘겼나" 만 봐서, **함수가 그 인자를 쓰는지**는 아무도 안 봤다), 회차 2 는 **가드의 가드**(키의 *안정성* 만 보고 *정합성* 은 안 봐서, 저장 키를 `export_job_id` 로 바꿔도 통과했다 — 그러면 행이 광고하는 id 로 조회·삭제가 404 다)
- **상한에서 멈추고 사람 판단을 받았다**(ㄱ — 단언 3줄). **전부 단언 "추가" 라 구조를 안 건드렸고, 그래서 새 구멍이 안 났다** — 회차마다 수정이 새 구멍을 내던 것과 다른 종류였다. 변형 재실측 M6·M8·M7·M1 전부 FAIL
- ⚠️ **"3회" 상한이 어디에도 안 박혀 있었다** — `fail_times=99`(영원히 실패)라 `ATTEMPTS >= 2` 면 severity 가 어차피 ERROR 가 돼서, 상한을 10 으로(총 대기 4.5초) 늘려도 전부 통과했다. 지금 보호되던 명제는 **"재시도가 1번 이상 있다"** 뿐이었다
- ⚠️ **`/testrun` 의 근거 인용 검사가 거짓 녹색이었다** — 계획서 **전체**에서 인용을 세어 **표 행 자신을 센다.** "1건 발견 → 통과" 가 거짓이었고, **레포 전수로 19건**(B29 3건은 고침)이 같은 상태다(`27`·`B12`·`B25`·`B28`·`E02`·`F12`·`F16`·`F17`). 계약 #25 가 경고한 "0건은 초록색" 의 **더 나쁜 변종**이다 — 0건도 아니고 **거짓 1건**. 검사기 수정과 19건 교정을 `TODO.md` 에 올렸다
- 재시도는 **3회 · 사이 0.5초**(총 대기 1.0초). 간격을 길게 두지 않는다 — `time.sleep` 이 **Starlette BackgroundTask 스레드**(anyio)를 잡는다. ⚠️ 처음엔 "REQ-B17 동시 5개 한도를 공유" 라고 적었는데 **거짓이었다** — 생성 경로는 `analysis_slots` 를 안 쓴다(감지 경로 전용). 리뷰에서 교정했다
- 리뷰: B29 @ f0f9d51 — (b) 1 · (c) 0 · nit 4 · 이연 2
  - (b): [backend/tests/test_b29_workbook_meta_retry.py:166] B29-09 가 키의 **안정성**만 보고 **정합성**은 안 본다 · 실측
    - 방안: 단언 한 줄 · TODO · 감수
    - 결정: **수정** → `f0f9d51` (재리뷰 상한이라 자체 변형 실측으로 검증 — M6 통과→FAIL)
  - 이연: "3회" 상한 미고정 → **결정: 수정** → `f0f9d51` (M8 통과→FAIL)
  - 이연: B29-08 부정 단언 → **결정: 수정** → `f0f9d51` (M7 통과→FAIL)
- **prod 확인 완료 (사용자, 2026-10-06)** — `prod-51acedb`(rev 3) 배포 후 **정상 생성이 돌아 회귀 없음**을 확인. B29 는 "실패했을 때" 를 고친 것이라 **정상 경로가 안 깨졌는지**가 관문이었다(사용자 결정 ㄴ). **실패 경로는 R2 를 일부러 끊어야 재현돼 육안이 불가능**하고, 대신 케이스가 **실제 저장 키(`storage.save_workbook`)와 저장된 알림 파일**을 직접 읽는다. **REQ-B29 ✅**
- ⚠️ **dev 백엔드에는 B29 가 없다**(`b28-eaa7f38`). 올릴 필요가 없다 — dev 는 `:latest` 를 쓰므로 **다음 `backend-build.sh` 때 자동으로 따라오고**, B29 는 메타 저장이 실패해야 드러나 dev 에서 볼 것도 없다. prod 배포는 `latest` 를 건드리지 않는다(계약 #37)
- 케이스 **B29-01~11 (11/11)** · 백엔드 **410 passed**

## 2026-10-05

### REQ-F18 — 생성/결과 업무 분리 + 진입 시 페이지 목록 스크롤 (🟡 dev 육안 남음)

- **둘 다 2026-10-05 dev 육안에서 사용자가 지적한 것**이고 성격이 다르다 — ①생성 화면이 "만드는 곳"과 "받는 곳"을 겸하고 있다(*"생성은 PDF 를 만드는 곳, 결과는 만들어진 걸 다운로드 하는 곳"*) ②현황판에서 쪽 번호로 진입하면 **뷰어는 가는데 왼쪽 목록은 맨 위 그대로**라 212쪽 문서에서 "지금 몇 쪽인지"가 안 보인다
- **F16 을 하루 만에 절반 되돌린 셈이다** — 다만 **버려진 건 생성 화면 배선뿐**이고, Phase 2 가 만든 결과 화면 몫(창 먼저 열기·취소/미지원/실패 3분기)과 `savePdf.js` 순수 함수는 **그대로 산다**. 사용자가 범위를 ㄴ(생성 화면에서 통째 제거)으로 택했다
- **사용자가 범위를 좁혀 설계가 바뀌었다** — 당초 "선택된 페이지로 자동 스크롤"이었는데 *"현황판에서 페이지 번호 클릭하는 진입 플로우에서만"* 으로 좁혔다. 그 덕에 **미결이 통째로 사라졌다** — `selectedPage` 가 바뀌는 경로가 셋(목록 클릭·**뷰어 스크롤 역동기화 250ms 디바운스**·복원)이라 "선택되면 스크롤"로 짰으면 **뷰어를 스크롤할 때마다 목록이 끌려갔다**
- 스크롤 판정은 **순수 함수로 뺐다**(`utils/pageListScroll.js`) — `work.jsx` 는 렌더 무대가 없다. `targetPage.js` ↔ `workPageScroll.test.js` 선례와 같은 2단 구성이고, 소스 스캔만으로 갔으면 B25·F16·B28 에서 반복된 "스캔이 조용히 뚫린다"를 또 만났을 것이다
- **F16 케이스 11건 폐기** — `F16-13·16·18·19·21·22·24·25·26·29·30`. 전제(생성 화면 다운로드)가 사라졌다. **조용히 지우지 않고** `PLAN-F16` 검증 계약에 ⛔ 와 사유를 남겼다(F17 이 B12-02·03 을 폐기한 것과 같은 처리)
- ⚠️ **F16-06·07 은 폐기가 아니라 무대가 깨진 것이었다** — 무대 앵커가 `getStatus` 였는데 F18 이 완료 분기의 그 호출을 없앴다. 창이 거의 비어 **부정 단언이 공허하게 통과**하던 상태라 시작점을 `onDone:` 으로 옮겼다. 그래도 지금은 창이 setState 세 줄이라 사실상 공허하다(TODO — 폐기 검토)
- **`/review` 2회차.** 회차 0 (b) 2건 — ①**진입 effect 가 1회가 아니었다**(`pages` 가 deps 인데 재감지 완료가 `fetchPages` 를 다시 부른다) ②**F18-08 의 400자 고정 창이 effect(197자)를 넘어** 스크롤 호출을 뷰어 핸들러로 옮겨도 통과했다. 회차 1 에서 **내가 그 수정에 또 구멍을 냈다** — F18-10 이 비교만 보고 **대입을 안 봐서**, 대입 한 줄만 지우면 가드가 영원히 참인데 전부 녹색이었다(변형 실측). 그리고 1회 가드 키가 `?page=` 값뿐이라 **`router.tsx` 의 `<Suspense key={location.pathname}>` 에 몰래 의존**했다 — 키를 `${jobId}:${pageParam}` 으로 바꿔 의존을 없앴다
- 회차 0 의 (c) — **메타 저장이 실패하면 생성된 PDF 가 UI 에서 고아가 된다**(생성 화면 다운로드가 유일한 탈출구였다). 사용자 결정으로 **프론트 반창고 대신 백엔드에서 닫기로** 하고 별도 REQ 로 이연했다 → `docs/TODO.md`
- 리뷰: F18 @ 1a3a8a3 — (b) 0 · (c) 0 · nit 3 · 이연 2
  - 이연: [frontend/src/pages/analysis/work.jsx:248] 재감지 완료 시 뷰어가 `?page=` 로 튄다 — `handlePageClick` 이 1회 가드 밖(원인 REQ-F12, F18 이전과 동일 동작)
  - 이연: [frontend/src/pages/editor/index.jsx:530] `[결과로 이동]` 이 basket·filename·layout·템플릿 선택을 전부 날린다
- **dev 육안 3건 확인 완료 (사용자, 2026-10-05)** — ①생성 시 **저장 위치 창이 뜨지 않고** 완료 Alert 이 `[결과로 이동]` 으로 바뀜 ②현황판에서 깊은 쪽 진입 시 목록이 **가운데**로 옴 ③**뷰어를 스크롤해도 목록이 안 끌려감**(가장 위험했던 자리). **REQ-F18 ✅**
- **prod 육안 확인 (사용자, 2026-10-05)** — prod 에서도 PDF 라벨 한글이 온전함(B28)
- 프론트 **83 파일 · 368 케이스 통과** · `npm run build` 통과(렌더 무대 없는 화면이라 필수)

### REQ-B28 — 생성 PDF 의 한글이 조용히 사라진다 (🟡 코드·테스트 완료 · dev 육안 남음)

- **증상**: 문제집 이름 `2026 2학기 중3 내신마스터(1~3회)` 가 **미리보기는 정상인데 생성된 PDF 에서만** `2026 2  ㄱ      3 …` 로 글자가 빠졌다. 사용자가 dev 육안에서 발견
- **원인이 셋 겹쳤고 셋 다 실측으로 확정했다** — ①macOS 가 올린 파일명은 **NFD(자모 분해)** 다(`학` = `ᄒ`+`ᅡ`+`ᆨ`) ②`fitz.Font("korea")` 는 한글 폰트가 아니라 **`Droid Sans Fallback Regular`** 이고 **자모 블록(U+1100~)에 글리프가 거의 없다** ③`TextWriter.append()` 가 글리프 없는 문자를 **에러 없이 notdef(`\x00`)로 치환**한다
- **역산으로 확정했다** — 같은 이름을 NFD 로 렌더한 결과가 사용자 PDF 와 **글자 단위로 완전 일치**(`'2026 2\x00\x00ㄱ\x00\x00 \x00\x00\x003 …'`). NFC 로 렌더하면 원문 그대로. 깨진 자리에 `ㄱ` 하나가 섞인 것도 설명된다 — 종성 `ᆨ`(U+11A8) 은 이 폰트에 글리프가 있다
- **미리보기가 정상인 건 결함이 아니라 증상이다** — 브라우저는 NFD 자모를 폰트 폴백으로 조합해 그린다. **화면으로는 영원히 안 드러나고 PDF 에서만 드러난다.** 그래서 검증도 "렌더한 PDF 를 `get_text()` 로 되읽기"여야 한다 (문자열 비교만 하는 테스트는 통과한다)
- **REQ-F17 탓이 아니다.** 옛 라벨 형식도 이름을 그렸고 폰트는 바뀐 적이 없다 — 원래 있던 결함인데 **NFD 이름을 쓴 게 이번이 처음**이라 지금 드러났다
- **범위는 "그리기 직전 NFC"만**(사용자 결정, 10-06 오픈 전 최소 변경). 저장 시점 정규화·마이그레이션·폰트 교체는 제외 — 렌더를 고치면 **기존 저장분까지 즉시 해결**된다
- **폭 계산도 같이 맞췄다** — `text_length` 가 정규화 전 문자열을 재고 있었다. NFD 는 자모가 낱자로 세어져 **53% 넓게 측정**되고(실측 486.3 vs 318.3pt @14pt) B09 자동 축소가 과하게 걸려 **라벨이 쓸데없이 작아졌다**(4단 7.80 → 11.92pt). `/review` 가 (c) 로 잡아 계획서 `## 결정` 에 기록 + B28-07 신설
- **`/review` 3회차 — 같은 실패가 세 번 모양을 바꿔 가며 나왔다.** B28-06("그리는 자리가 전부 정규화를 거친다")이 회차 0 에선 **문자열 검색이 docstring 산문을 세고 창을 `fontsize` 로 끊어서**, 회차 1 에선 **ast 가 수신자를 `ast.Name` 으로만 봐서**(체이닝·walrus·속성·인덱스 4종 통과), 회차 2 에선 **`fitz.TextWriter` 정확 일치라서**(별칭·`getattr`·`insert_htmlbox` 통과) 각각 뚫렸다. 전부 **격리 worktree 변형 실측**으로 잡았다
- **회차 1 에서 `_draw_text()` 통로 하나로 모았고, 회차 2 의 (b) 는 감수했다** — **소스 스캔은 구문만 보므로 "통로가 하나"를 증명할 수 없다.** 네 번째 열거도 같은 벽을 칠 뿐이고, 현시점 생성지가 한 자리뿐이라 노출이 0 이다. 대신 **거짓이 된 문구를 전부 고쳤다**(docstring 의 "모양은 안 본다"·"열거가 끝난다", 계약 #38 의 "두 곳", 계획서의 줄 번호, 폭 측정 수치)
- ⚠️ **검증 계약 `근거` 인용 2건이 `grep -F` 0건이었다** — B28-01 은 **줄바꿈을 넘는 인용**(계약 #25 가 경고한 바로 그 모양), B28-04 는 `…` 생략 인용. 회차 1 에서 "7개 다 찾힌다"고 한 내 보고가 **틀렸다**(한 줄짜리로만 쪼개 검사했다). 한 줄 축자 인용으로 교체해 **7건 전부 일치 확인**
- 계약 **#37**(`fitz.Font("korea")` 는 Droid Sans Fallback · 자모 글리프 없음 · notdef 조용한 치환) · **#38**(그리는 자리에서 NFC 정규화 · 미리보기로는 검증 안 됨 · 문자열 비교 테스트는 통과함) 승격
- 리뷰: B28 @ ee64a25 — (b) 0 · (c) 0 · nit 6 · 이연 3
  - 이연: [docs/TODO.md] 검색·정렬 NFD/NFC 불일치 별도 REQ — **기록 완료**(2회차 연속 미이행이었다)
  - 이연: [backend/tests/test_b28_pdf_text_nfc.py] B28-06 이 `pdf_service.py` 한 파일만 스캔한다(계약 #31 과 같은 모양) — docstring 에 한계 명시
  - 이연: [docs/plans/archive/PLAN-B28-pdf-text-nfc.md] 검증 계약 표 행 순서가 `B28-05 → B28-07 → B28-06`
- **dev 육안 확인 완료 (사용자, 2026-10-05)** — 백엔드 재배포(`b28-eaa7f38`, 실행 태스크 digest `sha256:ffca2c03…` 가 ECR 과 일치함을 확인) 뒤 새로 생성한 PDF 에서 ①출처 라벨의 한글이 **온전** ②폭 과대측정이 사라져 **커진 글자(4단 7.80→11.92pt)가 셀을 넘어 잘리지 않음** ③각주 정상. **REQ-B28 ✅**
  (생성 화면에 다운로드 창이 여전히 뜨는 것은 B28 범위 밖이다 — **REQ-F18** 이 지운다)
- ⚠️ **계약 번호가 충돌했다 — 같은 날 다른 세션(REQ-E02)이 `#37`·`#38`을 먼저 썼다.** 두 세션이 `CLAUDE.md` 계약 절을 동시에 늘렸고, git 은 서로 다른 줄이라 **충돌 없이 둘 다 머지**해 같은 번호가 두 개씩 생겼다. **E02 가 먼저 main 에 올라갔으므로 B28 쪽을 `#39`·`#40` 으로 밀었다**(계약 번호는 고정 ID 라 재배치하지 않는다는 규칙의 반대 방향 — 아직 main 에 없던 쪽이 양보한다). 코드·테스트·계획서·리뷰의 참조 11건도 함께 갱신했다.
  **git 이 안 잡아 주는 충돌이다** — 번호를 쓰기 전에 `origin/main` 의 계약 절을 먼저 봐야 한다
- **남은 관문은 dev 육안이다** — 백엔드 변경이라 **ECS 재배포 전에는 안 보인다.** 확인은 **생성된 PDF** 로(미리보기는 처음부터 멀쩡했으므로 아무것도 증명하지 않는다)
### REQ-E02 — 운영(prod) 환경 구성 착수, Phase 1(Cloudflare) 완료 (🟡)

- 오픈(10/6) 전날 prod 환경이 없었다. dev를 복제하되 이름만 `prod`로 — 도메인 `-dev` 제거 · 데이터 빈 상태 시작 · CI/CD는 오픈 후 별도 REQ(사용자 결정)
- **prod 이미지는 버전 태그 고정** — `:latest`면 dev에 배포한 미검증 이미지가 prod 태스크 재시작 때 딸려 올라간다
- **버킷을 새로 만들지 않았다** — `dailystudy`(04-19 생성, 공개 도메인 `dailystudy.yejicraft-cf.com`)가 이미 있었고 dev(`dailystudy-dev`)와 이름 짝이 맞는다. 계획서 첫 결정 `dailystudy-prod`를 교체
- ⚠️ **그 버킷은 이미 환불 정책(`docs/refund_policy_combined.html`)을 공개 서비스 중이었다** — 계획대로 "uploads·results 말고 전부 차단"을 걸었으면 그 페이지가 403이 됐다. WAF 규칙을 `/pdf-extractor/` 안으로 좁혔다. 객체 4개는 그대로 둔다
- **공개 도메인 경로 제한은 dev에 없는 prod만의 차이** — 공개 도메인은 버킷 전체를 무인증·무만료로 연다. `users/{user_id}.json`(이메일·비밀번호 해시)이 user_id만 알면 읽혔다. **dev는 지금도 그 상태다**(규칙 없음)
- 실측: prod 토큰으로 dev 버킷 `AccessDenied` 403 · 공개 도메인 `users/`·`status/` 403(객체 유무 무관 — 규칙 차단이지 404가 아니다) · `uploads/`·`results/` 200 · 환불 정책 200
- ⚠️ **R2 시크릿이 대화 기록에 노출돼 재발급했다** — `.env.prod`에 `KEY=` 없이 값이 붙은 줄이 있었고, `=` 기준 sed 마스킹이 그 줄을 통과시켰다. env 파일은 키 이름만 뽑아 본다
- wrangler OAuth는 zone 권한이 `read`뿐이라 **WAF 규칙은 대시보드에서만** 만들 수 있다(R2 CORS·터널 조회는 가능)
- 작업 트리를 F16 세션과 공유하고 있어(그쪽이 브랜치를 바꿈) E02는 **worktree `../pdf-extractor-e02` · 브랜치 `feat/E02-prod-environment`**로 분리했다. `backend/.env.prod`(gitignore)는 원래 디렉토리에 있다
- 리뷰 생략 — 코드 커밋 없음(Phase 1은 외부 설정만)

### REQ-E02 — Phase 2(AWS 백엔드) 완료 — prod API 가동 (🟡)

- prod 백엔드가 떴다: 서비스 `pdf-extractor-backend-prod-svc`(desired 1) · 태스크 정의 `prod:1`(dev rev 8 복제, 이미지·시크릿 ARN·로그 그룹만 교체 + CORS 시크릿 추가) · 시크릿 `pdf-extractor/prod`(JWT 새로 발급) · 로그 `/ecs/pdf-extractor-prod`. **지금부터 상시 ~$85/월**
- **이미지는 `backend-build.sh`로 안 만들었다** — 스크립트가 `:latest`도 덮어써 dev가 다음 재시작 때 그 이미지를 받는다. `prod-2cc43de` 태그만 `docker buildx`로 직접 푸시. 또 작업 worktree HEAD가 문서 커밋이라 스크립트로는 태그가 `prod-3fdf38a-dirty`가 됐을 것 → `2cc43de` 분리 worktree에서 빌드. `25ee3d2..2cc43de` 사이 backend 변경 0건이라 dev 실행 이미지와 내용이 같다
- **cloudflared는 dev처럼 `:latest`**(사용자 결정) — 완료 기준 "`:latest` 없음"은 backend 이미지 한정으로 계획서에 명시. 착수 중 dev 태스크 정의를 보고서야 cloudflared도 `:latest`인 걸 알았다(실체 2026.9.3)
- **CORS 시크릿은 dev에 없던 키**다 — dev는 코드 기본값(dev 프론트 + localhost)에 기대고 있었다. prod는 `CORS_ALLOWED_ORIGINS`를 JSON 배열로 넣어 기동 성공(형식이 틀리면 `/health`부터 안 뜬다)
- 실측: `/health` 200 · 실행 digest = `prod-2cc43de`(`ca24e394…`) · CORS preflight prod 프론트만 허용(dev 프론트·localhost는 400) · 터널 healthy · dev는 착수 전 기준선과 같음(rev 8 · 같은 태스크 · 같은 digest)
- 실행 역할은 dev·prod 공용 — 인라인 정책 Resource에 `prod*` 추가
- dev 백엔드는 여전히 켜져 있다(10/03부터 desired 1) — 내릴지 사용자 결정 대기
- 리뷰 생략 — 코드 커밋 없음(Phase 2도 외부 설정만)

### REQ-E02 — Phase 3(배포 스크립트) 완료 + 계약 #37·#38 (🟡)

- `frontend-deploy.sh dev|prod`(인자 필수) · `wrangler.jsonc` `env.prod`(Worker `dailystudy-workbook-prod` + 커스텀 도메인) · 신규 `backend-deploy-prod.sh prod-<HEAD>`(빌드·푸시 → 리비전 복제·이미지만 교체 → 서비스 갱신 → 안정화 → 이전 리비전 deregister). 결정 2건(Worker 방식·백엔드 스크립트 범위)은 `/testgen` 중 사용자가 정했다
- **백엔드 스크립트는 "배포만" 안을 기각** — 빌드를 `backend-build.sh`에 맡기면 그 스크립트가 `latest`를 덮어 계약 #37을 스스로 깬다. 빌드부터 한 손에 둬야 태그가 하나로 고정된다
- 거부 4종(태그 없음·`latest`·HEAD 불일치·미커밋 변경)은 **아무것도 호출하기 전에** 판정한다 — 이미지가 커밋과 달라지면 태그가 거짓말을 한다
- **스크립트 테스트는 레포 최초** — 임시 git 저장소에 스크립트를 복사하고 `npm`·`npx`·`docker`·`aws`를 PATH 앞의 가짜로 바꿔 호출만 기록한다. 가짜 `aws`가 `--query`·`--output text`를 jmespath(boto3 의존성)로 흉내 내서, 스크립트가 AWS를 어떻게 부르든 테스트가 구현을 고정하지 않는다
- **E02-24(dev 결과 불변)는 라이브 배포가 아니라 로컬 번들 비교로 판정** — 지금 main을 dev에 올리면 작업 중인 F16이 노출된다. 같은 커밋에서 옛 명령과 새 스크립트의 `dist`가 파일 단위로 동일(`index.html` `f632f963…`)
- `wrangler deploy --env prod --dry-run`으로 `env.prod`가 `assets`를 물려받는 것 확인(경고 없음)
- worktree엔 `backend/venv`가 없어 원래 디렉토리 venv로 pytest를 돈다(`../pdf-extractor/backend/venv/bin/python -m pytest -k E02`)
- 계약 승격: **#37** prod backend 이미지 `:latest` 금지 · **#38** R2 공개 URL 경로를 늘리면 prod WAF 허용 경로도 — 둘 다 dev·테스트에선 안 드러나고 prod에서만 터진다
- 리뷰: 아직 — REQ 마지막 Phase 뒤 `/review E02`

### REQ-E02 — Phase 4(프론트 prod 배포) 완료 (🟡)

- `frontend-deploy.sh prod`로 첫 배포 — Worker `dailystudy-workbook-prod`가 새로 생기고 커스텀 도메인 `dailystudy-workbook.yejicraft-cf.com`이 붙었다(Version `e46e4d4e`). E02 브랜치의 `frontend/`는 `2cc43de`와 `wrangler.jsonc`만 달라 **"첫 배포 커밋 2cc43de" 결정이 그대로 지켜진다**
- 실측: 라이브 진입 청크 `index-5GZJJjxu.js` = 로컬 `dist`(청크 20개 내용까지 동일) · prod API URL 6개 청크 · dev 도메인·`localhost:8000` 0건 · 로그인 화면은 사용자 육안(브라우저 확장 미연결)
- ⚠️ **검증 기준 2건을 `/testrun` 뒤 바꿨다(사용자 승인)** — 계획을 조용히 맞춘 게 아니라 기준이 틀렸던 것:
  - E02-34 "`localhost` 없음" → **"`localhost:8000` 없음"**: 걸린 건 react-router 내부 `let i="http://localhost"`(브라우저에선 `location.origin`으로 덮임). 함정이 막으려던 건 API 주소가 로컬로 박히는 것이다. dev 번들에도 같은 문자열이 있다
  - E02-36 "dev 진입 청크 그대로" → **"prod 배포가 dev Worker에 새 배포를 안 만듦 + dev 번들은 dev API"**: 내 prod 배포(14:14:20) 80초 뒤 **사용자가 dev를 직접 배포**해 기준선(`Bhyi37oW` → `DbJFrFSC`)이 무효가 됐다. 배포 기록상 겹치는 dev 배포 없음
- ⚠️ **배포 직후 이 머신에서 prod 도메인이 안 열렸다** — 배포 전 조회한 "없음" 응답을 macOS 리졸버가 캐시(`dig`는 IP, `curl`은 resolve 실패). `curl --resolve`로 확인했다. 서비스 문제가 아니다
- 리뷰: 아직 — 코드 변경 없는 Phase. REQ 마지막 Phase 뒤 `/review E02`

### REQ-E02 — Phase 5(end-to-end + admin) 완료 + 리뷰 회차 0 (🟡)

- 가입은 사용자, `promote-admin.sh <email> .env.prod`로 admin 승격(백필 0건 — prod가 비어 있었다). 업로드·분석·생성·다운로드·알림은 사용자가 브라우저로, 서버 쪽은 R2·공개 URL·로그로 실측: 썸네일 130건 전부 200(401 0) · 공개 `uploads/`·`results/` 200 `application/pdf` · 알림 4건 · 5xx 0
- **E02-44(dev 버킷 무변화)는 객체 수가 아니라 "prod 식별자가 dev에 섞였나"로 판정** — dev를 사용자가 쓰는 중이라 객체 수는 계속 변한다(75,145 → 75,152). prod job_id·user_id 키 0건
- 확인용 데이터는 **남겨 둔다**(사용자 결정). prod에 두 번째 가입자(14:57, naver 메일, `user`)가 있다 — 사용자 본인 테스트 계정인지 확인 안 됨
- admin 권한은 요청마다 저장소에서 읽지만(`_user_from_access_token`) 화면 메뉴는 로그인 응답 기준 — 승격 뒤 재로그인 필요할 수 있음
- 리뷰: E02 @ 5c4ac04 — (b) 3 · (c) 3 · nit 4
  - (b): [scripts/deploy/backend-deploy-prod.sh:70] 안정화 대기 실패·시간 초과 시 이전 리비전이 ACTIVE로 남고 재실행하면 영영 정리 안 됨 · PRIMARY 배포가 NEW인지 확인 안 함 · 가설
    - 방안: A deregister 전 PRIMARY 배포 = NEW 확인 + 실패 시 남은 상태 안내 (+6줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (b): [CLAUDE.md:316] REQ prefix 표의 E 점유 범위가 REQ-E01에 멈춤, 다음 번호에 E 없음 · 실측
    - 방안: A `E01~E02`·다음 `E03` (2줄, /checkpoint) · TODO · 감수 — 추천 A
    - 결정: A
  - (b): [CLAUDE.md:376] dev 프론트 배포 상태 줄의 굵은 표기 깨짐(`**` 3개) · 실측
    - 방안: A 남는 `**` 제거 (1줄, /checkpoint) · TODO · 감수 — 추천 A
    - 결정: A
  - (c): [scripts/deploy/backend-deploy-prod.sh:73] 안정화 직후 이전 리비전 deregister → 즉시 롤백 대상 소실(INACTIVE로는 update-service 불가). 계획서 결정의 부작용 · 가설
    - 방안: A N-1 유지·N-2 정리로 계획 변경 (/workplan → +5줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (c): [scripts/deploy/frontend-deploy.sh:18] prod 배포에 미커밋 변경 거부·커밋 기록 없음 — 계획서는 백엔드만 정함 · 가설
    - 방안: A prod일 때 미커밋 변경 거부 (/workplan → +3줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (c): [scripts/deploy/backend-deploy-prod.sh:27] HEAD가 origin/main 조상인지 확인 안 함(막으면 브랜치 핫픽스도 막힘) · 가설
    - 방안: A origin/main 조상일 때만 허용 (/workplan → +3줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
- 리뷰 (b) 문서 2건(CLAUDE.md:316·376)은 이 커밋에서 고쳤다. TODO 4건은 루트 `TODO.md`로(파일 신설). **CLAUDE.md는 `docs/` 밖이라 이 커밋이 E02의 새 "마지막 코드 커밋"이 되어 리뷰 sha(5c4ac04)가 낡는다 → 🟡 유지, `/review E02` 재실행으로 (b) 2건 닫힘 확인 후 ✅**
- 리뷰 범위 메모: `/code-review`가 짚은 circuit breaker 롤백 시나리오는 prod 서비스 breaker가 꺼져 있어(`enable: false`) 해당 없음 · `workers.dev` 노출은 계정에 서브도메인이 없어 재현 안 됨

### REQ-E02 — 재리뷰 회차 1 → ✅

- 리뷰: E02 @ 2e75c3d — (b) 1 · (c) 4 · nit 1
  - (b): [scripts/deploy/backend-deploy-prod.sh:70] 안정화 대기 실패·시간 초과 시 이전 리비전이 ACTIVE로 남고 재실행하면 영영 정리 안 됨 · PRIMARY 배포가 NEW인지 확인 안 함 · 가설
    - 방안: A deregister 전 PRIMARY 배포 = NEW 확인 + 실패 시 남은 상태 안내 (+6줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (c): [scripts/deploy/backend-deploy-prod.sh:73] 안정화 직후 이전 리비전 deregister → 즉시 롤백 대상 소실(INACTIVE로는 update-service 불가). 계획서 결정의 부작용 · 가설
    - 방안: A N-1 유지·N-2 정리로 계획 변경 (/workplan → +5줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (c): [scripts/deploy/frontend-deploy.sh:18] prod 배포에 미커밋 변경 거부·커밋 기록 없음 — 계획서는 백엔드만 정함 · 가설
    - 방안: A prod일 때 미커밋 변경 거부 (/workplan → +3줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (c): [scripts/deploy/backend-deploy-prod.sh:27] HEAD가 origin/main 조상인지 확인 안 함(막으면 브랜치 핫픽스도 막힘) · 가설
    - 방안: A origin/main 조상일 때만 허용 (/workplan → +3줄) · TODO · 감수 — 추천 TODO
    - 결정: TODO
  - (c): [CLAUDE.md:100·349] 루트 `TODO.md` 신설로 TODO 파일이 둘인데 CLAUDE.md는 `docs/TODO.md`만 가리킴 — 다음 세션이 리뷰 TODO를 놓칠 수 있음 · 실측
    - 방안: A CLAUDE.md에 두 파일 역할 1줄 (/checkpoint, 재리뷰 1회 추가) · TODO · 감수 — 추천 A
    - 결정: 감수
- 직전 (b) CLAUDE.md:316·376 → 닫힘(2e75c3d). 재리뷰는 delta(`5c4ac04..2e75c3d`)만 독립 에이전트로
- ⚠️ **"마지막 코드 커밋"에 문서 커밋이 잡혔다** — 게이트 명령이 `docs/` 밖 변경을 코드로 보는데 이 REQ는 `CLAUDE.md`(계약·배포 상태)를 `docs:` 커밋에서 여러 번 고쳤다. 그래서 리뷰 (b)를 문서로 고친 커밋이 sha를 밀어 재리뷰가 한 번 더 필요했다. CLAUDE.md를 바꾸는 REQ는 리뷰 전에 CLAUDE.md 수정을 끝내 둘 것
- ✅ 조건: 리뷰 sha `2e75c3d` = 마지막 코드 커밋 · 수정 결정 2건 닫힘 · 나머지 TODO 4·감수 1(빈 결정 없음). TODO 4건은 이미 루트 `TODO.md`에 있다(중복 추가 안 함)
- ⚠️ CLAUDE.md 배포 상태 줄의 "REQ-E02 진행 중"은 이 커밋에서 고치지 않았다 — 고치면 그 커밋이 다시 마지막 코드 커밋이 된다. 머지 뒤 E02를 메시지에 안 넣은 커밋으로 정리

### REQ-F16 Phase 2 — 클릭 한 번으로 저장 (🟡 리뷰 3회, dev 육안 남음)

- Phase 1(버튼 → 선택 창)을 dev에서 확인한 사용자가 **다운로드 버튼 단계 자체를 없애라**고 요구했다 — 생성이 끝나면 **바로** 저장 위치 창이 떠야 한다. 요구 3건: ①클릭 한 번 ②생성 중 다른 창 갔다 와도 동작 ③결과 화면 재다운로드도 같은 동작
- **설계가 뒤집혔다 — 창을 "완료 후"가 아니라 "생성 요청 전"에 연다.** `showSaveFilePicker`는 transient user activation(~5초)을 요구하는데 생성은 수 초~수십 초다. 완료 후엔 어떤 방법으로도 창을 못 띄운다. 그래서 [PDF 생성] 클릭 **안에서** 핸들만 먼저 받아 두고(`pickSaveTarget`), 완료되면 그 핸들에 쓴다(`writePdfToHandle`). 사용자가 누르는 건 한 번이다
- 계획서 `범위 — 제외`의 "완료 시 자동 다운로드 — 버튼으로만 저장"이 **뒤집혔다**(취소선 + 사유 기록). Phase 1의 결정을 Phase 2가 덮은 것이라 조용히 지나가면 안 되는 자리다
- **취소 = "안 만들겠다"로 읽는다**(사용자 결정) — 핸들이 없으면 생성 요청도 안 보낸다. 미지원 브라우저(Safari·Firefox)는 Phase 1 경로(버튼 다시 보여주기)로 폴백하고, 그 버튼을 `variant="contained" color="success"`로 키웠다(사용자 요구 "눈에 잘 띄게")
- **위치를 먼저 고르면 빈 파일 위험이 생긴다** — 브라우저가 **창 확인 시점에** 파일을 만든다(`createWritable`이 아니다). 그래서 ①`writePdfToHandle`은 `fetchPdf` 성공 **뒤에만** `createWritable`을 부르고 ②생성·받기가 실패한 네 경로가 `leftoverNotice()`로 알린다. 안내 문구는 **"지워 주세요"가 아니라 "빈 파일이 생겼을 수 있습니다(새 이름으로 저장한 경우)"** — 덮어쓰기로 골랐으면 원본이 멀쩡한데 지우라고 하면 데이터를 잃게 만든다
- **`setSaveError(...)`를 같은 동기 블록의 `setSaveError("")`가 지우는 결함이 이 REQ에서 세 번째로 났다.** 회차 1에서 또 걸려 `setSaveError("")`를 picker **앞**으로 옮겼다. 코드에 "세 번째"라고 주석을 박았다
- 리뷰 회차 2(상한)에서 **격리 worktree 변형 실측**으로 드러난 사실 — **고친 프로덕션 코드 4건을 되돌려도 프론트 369/369가 녹색이다.** `leftoverNotice`는 테스트에 한 번도 안 나오고, `history/index.test.jsx`는 `showSaveFilePicker`를 스텁하지 않아 취소·실패 분기가 아예 안 돈다. F16-19는 `setSaveError("")`의 **존재**만 보고 순서를 안 본다 — 세 번 재발한 구조적 원인이 이것이다
- **잠금 공백은 사용자 결정으로 이연했다**(2026-10-05 "그냥 바로 ㄴ으로 가자") — 케이스 3건 신설(순서·빈 파일 안내 배선·history 3분기)을 `TODO.md`로 넘기고 머지한다. 범위 안 (b)·(c)가 0건이라 게이트는 열려 있다
- 리뷰: F16 @ fb9cf16 — (b) 0 · (c) 0 · nit 6 · 이연 4
  - 이연: [frontend/src/pages/editor/index.jsx:127] 핸들 쓰기가 **성공하면** `downloadUrl`을 안 세워 완료 Alert에 저장 위치·재다운로드 버튼이 없다
  - 이연: [frontend/src/pages/editor/f16Download.test.js:79] F16-19가 `setSaveError("")`의 존재만 봐 순서를 안 본다 — 3회 재발의 구조적 원인
  - 이연: [frontend/src/components/PdfPreviewPanel.jsx:352] `file={pdfUrl}`이 자격 없는 XHR이라 local 모드 결과 PDF 미리보기가 크로스오리진에서 못 읽는다
  - 이연: [frontend/src/utils/savePdf.js] `toDownloadUrl`이 `previewUrl.js`의 사실상 복제 — `withCacheKey(url, key)`로 합칠 만하다
- **dev 육안 4건 확인 완료 (사용자, 2026-10-05)** — ①[PDF 생성] 한 번으로 창→생성→저장 ②**생성 중 다른 창에 갔다 와도 저장됨**(요구 ②, 자동화 불가 항목) ③생성 이력 재다운로드도 같은 창 ④취소하면 생성도 안 함. **REQ-F16 ✅**
- **Phase 2 완료 기준은 전부 육안이다** — OS 네이티브 저장 창도, 요구 ②(다른 창 갔다 와도 저장)의 탭 포커스 전환도 자동화할 수 없다. 케이스 31/31 녹색이어도 ✅로 올리지 않았다

## 2026-10-03

### REQ-F16 — 생성 PDF 저장 위치 선택 (🟡 리뷰 3회, dev 육안 남음)

- 완료 후 자동 다운로드를 없애고 [다운로드] 버튼이 `showSaveFilePicker` 로 위치 선택 창을 띄운다. 미지원 브라우저는 blob 폴백
- **계획서가 짚은 함정(제스처 순서)은 처음부터 지켰는데, 평범한 실패 경로를 통째로 비웠다** — 리뷰 회차 0 총평이 "앞 절반은 맞고 뒤 절반에 에러 표면이 없다"였다. `res.ok` 미확인(에러 본문이 PDF로 저장) · `abort()` 없음(덮어쓰기 대상 파괴) · promise 버림(조용한 실패)
- ⚠️ **회차 0 수선이 주 경로를 깼다** — 인증을 붙이면서 로컬 `/api/files`만 보고 **dev·운영의 실제 경로(R2 공개 도메인)**를 놓쳤다. 그 버킷 CORS엔 `AllowCredentials`가 없어 `credentials: include`면 브라우저가 응답을 통째로 막고, `Authorization`은 preflight를 유발하며 presigned에 붙이면 400이다. **인증은 우리 API 오리진일 때만** 붙이는 것으로 정정(회차 1)
- ⚠️ **"조용한 실패"가 형태만 바뀌어 한 번 더 남았다** — `.catch`를 붙였는데 `generateError`를 썼고, 그 Alert은 `generateStatus === "error"` 분기에만 있어 저장 버튼이 사는 `"done"` 분기와 **배타적**이라 화면에 영영 안 닿았다(회차 1). 저장 전용 `saveError`로 분리. 그 거울상(재생성 때 안 지워져 **시도도 안 한 실패가 뜬다**)이 회차 2에서 또 나왔다
- **내가 다른 파일의 결정을 모르고 뒤집었다** — `BASE_URL`을 export 했는데 `NotificationContext`가 *"export 하지 않는 이유: 테스트가 `api/client`를 통째로 mock 하면 undefined가 된다"*를 적어 두고 있었다. `new URL(undefined, origin)`은 **던지지 않고** `/undefined`로 떨어져 자격이 조용히 사라진다(계약 #18·#20 계열). env 직독으로 되돌렸다
- **되돌려도 녹색이던 자리가 매 회차 나왔다** — 회차 1이 "이번에 고친 세 수선 모두 되돌려도 테스트가 녹색"이라 지적했고, 회차 2도 `Authorization` 미고정을 잡았다. 케이스 7 → 14 → 18 → **20**으로 늘어난 건 대부분 **회귀 방어를 뒤늦게 채운 것**이다
- 계약 #31에 **"B23-03 스캔은 `client.js` 한 파일만 본다"**를 기록했다 — F16이 `client.js` 밖 첫 raw fetch를 만들었고, 거기선 **오리진에 따라 일부러 자격이 갈린다**. 안 적으면 다음 raw fetch가 같은 방식으로 인증을 빠뜨린다
- 리뷰: F16 @ 3acbeaf — (b) 0 · (c) 0 · nit 6 · 이연 3
  - 이연: [history/index.jsx:148] 생성 이력 다운로드가 맨 URL `<a download>` — dev에서 탭이 열리고 **캐시 오염원**이다
  - 이연: [PdfPreviewPanel.jsx:352] `file={pdfUrl}`이 자격 없는 XHR — local 모드 결과 미리보기가 못 읽는다
  - 이연: [utils/savePdf.js] `toDownloadUrl`이 `previewUrl.js`의 사실상 복제
- (회차 0 @ af01636은 (b) 6 · (c) 2, 회차 1 @ 4fa91f6은 (b) 5 · (c) 2였다. 상한 2회를 넘겼지만 매 회차 결함이 **스펙 혼란이 아니라 직전 수선의 부작용**이라 닫고 갔다)
- ⚠️ **✅로 올리지 않았다** — 완료 기준이 *"dev Chrome에서 위치 선택 창이 뜨고 **고른 곳에** 저장됨"*인데 **파일 선택 창은 OS 네이티브 다이얼로그라 "고르기"를 자동화할 수 없다.** B25(스크롤)·F17(화면 글자)과 달리 사람이 직접 눌러야 한다

### REQ-F17 — 로컬 육안 확인으로 종결 (✅)

- **로컬로 띄워 확인했다** — ⚠️ `backend/.env`가 `STORAGE_BACKEND=s3` + dev R2라 그냥 띄우면 dev 실데이터에 붙는다(계약 #24와 같은 결). 셸 env로 `local`을 덮어 격리했다
- 이름을 **안 붙인 파일**과 **붙인 파일**을 하나씩 올려 네 경우(이름 유무 × 제목/부제)를 한 화면에서 봤다 —
  이름 있음: 제목 `심화대비 모음` / 부제 `심화대비`(확장자 제거) · 이름 없음: 제목 `2026 1학기.중간`, **부제 숨김**(제목과 같아서)
- 출처 라벨 실측: `1번) 2026 1학기.중간. p1. 문항 1.` — 번호 뒤 `)` · 확장자 뺀 파일명 · 1-based 쪽 · **끝 마침표 하나** 전부 확인
- 생성 화면 파일 목록에서 **구분자가 홀로 남지 않는 것**(회차 2 (b))도 같이 확인했다
- **함정 — 404 페이지에서 잰 값을 결론으로 쓸 뻔했다.** 생성 화면을 `/editor`로 알고 열었는데 실제 라우트는 `/create`이고,
  404 페이지에서 "`.pdf` 노출 0건"이 나와 **통과처럼 보였다.** 올바른 경로에서 다시 재니 1건이 잡혔고,
  추적해 보니 **생성될 파일 이름 입력란의 접미사 표시**(`endAdornment`)라 범위 밖이었다.
  **측정 전에 그 화면이 맞는지부터 확인할 것** — 빈 화면·에러 화면은 어떤 부정 단언도 통과시킨다
- ⚠️ **마지막 수선 커밋 `5573e1a`는 재리뷰를 안 거쳤다.** 재리뷰 상한(2회) 도달 + 회차 2 결함이 스펙 혼란이 아니라
  직전 수선의 부작용이어서, **육안 확인으로 대체**하고 ✅로 올렸다(사용자 결정). 근거는 `docs/reviews/F17.md` 종결 기록에 남겼다
- **생성된 PDF 실물은 열지 않았다** — 미리보기 문자열과 `build_source_label` 짝 테스트(F17-14)로 갈음했다

### REQ-F17 — 출처 문구 형식 + 이름 표시 확장자 제거 (🟡 리뷰 3회, (b) 2건 남음)

- 라벨 조립이 프론트 JSX와 백엔드 `extract_questions_v2` 본문 안에 **각각 인라인**이라 계약 #12가 사람 눈으로만 지켜지고 있었다 → 양쪽을 순수 함수로 빼고 **같은 입력·같은 기대값을 쓰는 테스트 짝**으로 묶었다
- 제목·부제 생성 코드도 한 벌로. 전엔 작업 화면만 공유 헬퍼를 쓰고 **목록 카드는 인라인**이라 폴백까지 달랐다(`"unknown.pdf"` vs `jobId`)
- **`/review`가 세 바퀴 돌았고, 매 회차가 "절반만 고쳤다"를 잡아냈다** — 한 파일·한 `useMemo`·한 인자만 바꾸고 짝을 안 본 것이 회차 0·1·2 모두의 공통 원인이다
- ⚠️ **테스트가 전부 녹색인 채로 결함이 세 번 통과했다.** 그 셋은 전부 "감시가 비었거나 거짓 녹색"이었다:
  - F17-17 소스 스캔이 **한 파일만** 읽어 금지 패턴이 글자 그대로 있는 `StatCards.jsx`·`FileListPanel.jsx`를 통과시켰다(회차 0의 (b) 원인)
  - `globSync`의 제외 옵션은 **`exclude`인데 `ignore`**를 썼다 — 조용히 무시된다(실측 `all 120 · ignore 120 · exclude 44`)
  - `toHaveTextContent('m')`은 **부분 일치**라 `'m.pdf'`에도 통과한다. 내가 기대값을 그렇게 바꿔 **단언을 약화**시켰고, 직전 보고에서 "약화한 곳 없다"고 잘못 말했다
- 결정이 두 번 뒤집혔고 둘 다 **기각안으로 보존**했다 — ①생성 화면을 범위에서 뺐다가 되돌림(제외 근거였던 "라벨 재료로만 쓴다"가 **내 `/testgen` 조사 누락**이었다. `FileListPanel`이 이름을 직접 그린다) ②부제를 확장자째 두려다 제거로(완료 기준과 승인 케이스 F17-09가 서로 모순이었다)
- **라벨의 이름·파일명을 저장 스냅샷에서만 읽는다**(사용자 "(가)"→"(ㄱ)"). 프론트가 읽는 값과 같아야 계약 #12가 성립한다.
  **대가를 계획서에 명시했다** — 문제집 이름을 바꾼 뒤 예전 문제집을 재생성하면 라벨에 **옛 이름**이 들어간다(종전엔 현재 이름). "미리보기와 PDF가 항상 같다"와 맞바꾼 것이다.
  ⚠️ 파일명은 사용자 결정이었지만 **이름까지 넓힌 것은 내 판단이었다** — 회차 2가 "계획서에 없는 결정"으로 잡아내 사후 확정했다
- 전제가 소멸한 기존 케이스는 **폐기(B12-02·03)와 갱신(F15-05·08·09, F12-32)**으로 갈랐다. 폐기분 커버리지는 F17-05·06이 승계한다(그 파일 헤더에 명시)
- 백엔드 venv가 낡아 `bcrypt`·`jwt`(REQ-27 의존성)가 빠져 수집조차 안 됐다 — `requirements.txt`에 선언된 것이라 동기화로 처리. F17과 무관한 기존 상태다
- 리뷰: F17 @ 4be5989 — (b) 2 · (c) 2 · nit 3 · 이연 1
  - (b): [FileListPanel.jsx:104-105] 부제를 숨길 때 구분자 `" · "`가 홀로 남아 `" · 수학"`으로 렌더 — 짝 소비처는 요소째 가리는데 여기만 텍스트만 가렸다
  - (b): [test_f17_source_label.py:46-49] 이름 스냅샷 수선을 지키는 단언이 **0건** — live로 되돌려도 376개가 전부 녹색
  - (c): [PLAN-F17:35] 라벨 **이름**의 출처를 스냅샷으로 바꾼 결정이 계획서에 없었다 → **이 체크포인트에서 (ㄱ)으로 확정해 닫음**
  - (c): [PLAN-F17] F17-21이 검증 계약 표에 없고 계획서가 통째로 미커밋 → **이 체크포인트에서 닫음**(F17-21~23 추가 + 커밋)
  - 이연: [pdf_service.py:338] `source_label` 주석 예시가 옛 형식 `"Q1 · 수학문제집 · p.3"` → TODO 이관
- (회차 0 @ 6cfaf4a는 (b) 2 · (c) 2, 회차 1 @ 5fe0d61은 (b) 6 · (c) 1이었다. **재리뷰 상한 2회에 도달**해 자동 수선 루프는 멈췄다)

### REQ-B25 — 현황판 쪽 클릭이 항상 1쪽: 보관 후 적용, 그리고 "적용 시점"이 진짜 문제였다

- 원인: `?page=`는 PDF 로딩보다 먼저 도착하는데 imperative `scrollToPage`가 `if (!numPages) return`으로 **조용히 버렸다**. 결정: 뷰어 안에서 보관 → 로딩 후 적용(계획서 § 결정 — 호출부마다 가드를 두는 안 기각)
- **1차 구현은 테스트 8건이 녹색인데 틀렸다.** `numPages`가 들어온 커밋에 적용했더니 ①`onDocumentLoadSuccess`가 `pageSizes`를 비우고 `renderedPages`를 `{1}`로 돌려 **1쪽이 "렌더됐지만 미도색(≈0px)"** ②`firstLoadedPageSize`가 없어 placeholder가 **A4 842pt 고정**. 계약 #7의 "대상 앞 0px → 한 쪽 짧게 안착"이 **다른 문으로 재유입**됐고, 비A4(B5 516×729)는 150쪽 점프에 ~23쪽 어긋난다
- **jsdom은 이 결함을 구조적으로 못 본다**(레이아웃 없음 → `getBoundingClientRect` 전부 0). `/review`의 **코드 읽기**가 찾아냈다 — 단위 테스트 녹색이 완료의 증거가 못 되는 실례
- 수선: 적용 게이트를 `Object.keys(pageSizes).length === 0`으로. 왜 이게 닫는지 `node_modules`까지 내려가 확인했다 — `Page/Canvas.js`가 **자식 effect**에서 `canvas.style.height`를 대입하고 `Page.js`가 **부모 effect**에서 `onLoadSuccess`를 부른다. React는 한 커밋에서 자식 passive effect를 먼저 플러시하므로 **캔버스 사이징 → 보고 → 게이트 열림** 순서가 보장된다
- **무대가 결함을 가리고 있었다** — 1회차 `Page` mock이 `onLoadSuccess`를 아예 안 불러 `pageSizes`가 영영 비었다. 자동 호출로 고치면 "아직 아무 쪽도 실측되지 않은" 구간을 만들 수 없으므로 **테스트가 발화**하는 방식(`loadPage(n)`)으로 바꿨다. 그래야 B25-07이 red가 된다
- **`/implement`가 게이트에서 한 번 멈췄다** — 수선을 넣으면 기존 4건이 빨개지는데 무대 수정은 그 커맨드 권한 밖(§4)이라, `/testgen` 2회차를 먼저 돌렸다. 생산단 분리가 실제로 작동한 사례
- 미결 2건 확정(사용자 "그대로 확정"): **보관분은 적용 시 소비**(안 비우면 `numPages` 변경마다 재적용) · **중복 요청은 마지막이 이긴다**(단일 ref 덮어쓰기). 둘 다 다른 선택이 성립하지 않는 자리였고, `/review`·`/testrun`이 3회 연속 같은 지점을 가리켰다
- **게이트의 대가로 새 미결 1건** — 1쪽 로드가 실패하면 `onLoadSuccess`가 안 불려 **보관분이 조용히 유실**된다(사용자에겐 B25 원래 증상과 동일). 계획서 미결로 남겼다
- **Phase 1은 체크하지 않았다** — 완료 기준이 *"dev에서 … 그 쪽이 보이는 상태로 열림(212쪽 PDF 포함)"*이고 그 육안이 미완이다. 케이스 8/8 녹색은 "요청이 유실되지 않고 대상 쪽이 렌더 큐에 든다"까지의 근거다
- nit로만 남긴 것: 게이트가 1쪽을 특정하지 않는다(`pageSizes[1] != null`이 더 단순) · `onDocumentLoadError`가 보관분을 비우지 않는다 · 범위검사+삼종 호출 2경로 중복 · **B25-01과 B25-08 본문이 바이트 동일**(2회차가 B25-01에 `loadPage(1)`을 더하며 같아졌다 — 거짓 녹색은 아니나 B25-08이 커버리지를 더하지 않는다)
- 리뷰: B25 @ f2e3bbe — (b) 0 · (c) 2 · nit 6 · 이연 2
  - (c): [PLAN-B25 미결 1] 보관분 적용 시 비우는 규칙이 계획서엔 `- [ ]`인데 코드(`PdfPreviewPanel.jsx:249`)에만 있다 → **이 체크포인트에서 확정해 닫음**
  - (c): [PLAN-B25 미결 2] 중복 요청 마지막 우선 규칙이 계획서엔 `- [ ]`인데 코드(`:223`)에만 있다 → **이 체크포인트에서 확정해 닫음**
  - 이연: [PdfPreviewPanel.jsx:170-175] 쪽 크기 섞인 문서는 placeholder가 첫 실측 쪽 크기를 쓴다(P02-01 원래 폴백) → TODO 이관
  - 이연: [queued.test.jsx] 간헐 Unhandled Error(`@iconify/react` 타이머) — delta 무관 기존 flake → TODO 이관
- (회차 0 @ f3318ff은 (b) 2 · (c) 2 · nit 2 · 이연 0이었고, 그 (b) 2건이 회차 1에서 둘 다 닫혔다)

### REQ-B25 — dev 육안 확인으로 종결 (✅)

- **212쪽 합성 PDF**(PyMuPDF, 쪽마다 `page N`을 큰 글씨로)로 확인했다 — 개인 PDF·개인 계정을 쓰지 않는다는 B27 선례를 따라 테스트 계정으로 업로드. `?page=150·212·2` 전부 **해당 쪽이 보이는 상태**로 열렸다
- **판정 신호를 둘로 잡은 것이 요점** — 툴바 입력값만 보면 "번호는 맞는데 화면은 1쪽"을 놓친다(B25 원래 증상 계열). **뷰포트 중앙에 걸린 `.pdf-page-wrapper` 인덱스**를 함께 재서 둘이 일치할 때만 OK로 봤다
- `?page=`는 문항이 아니라 **쪽 목록**(`resolveTargetPage(pages, …)`)을 쓰므로 합성 PDF의 감지 품질과 무관하게 이 경로를 그대로 탄다 — 현황판 아코디언을 거치지 않고 URL로 바로 확인할 수 있었던 근거
- 확인 수단: 브라우저 확장이 연결돼 있지 않아 `playwright-core`를 **스크래치패드에 설치**해 설치된 Chrome을 몰았다(레포 의존성 무변경). B27 때와 같은 경로
- dev 백엔드는 확인 뒤 `desired 0`으로 내렸다. **테스트 업로드(job `90c96391…`)는 사용자 요청으로 남겨 뒀다**
- ⚠️ **dev 프론트가 브랜치 빌드다**(`cc6dbc42`) — PR 머지 후 main으로 재배포해야 한다(P06에서 ECR `:latest`가 브랜치 이미지로 남았던 것과 같은 함정)
- 남은 미결 1건(첫 쪽 실측이 끝내 안 오면 보관분 유실)은 **`TODO.md`로 이관**하고 REQ를 닫았다(B19 선례)
- ⚠️ **리뷰 게이트 명령이 이번에 실제로 막았다** — `git log … -- ':/' ':/!docs'`가 `bb86ea5`(계약 #7 한 줄 추가, **`CLAUDE.md` 단일 파일**)를 "마지막 코드 커밋"으로 돌려줘 리뷰 sha `f2e3bbe`와 어긋났다. 코드 변경이 0건임을 확인하고 ✅로 올렸다.
  **`CLAUDE.md`가 `docs/` 밖이라 생기는 문제이고 이번이 3회째다**(B27 → 10-03 체크포인트 → 지금). 게이트 명령에서 `CLAUDE.md`도 빼야 한다 — 안 빼면 `/checkpoint`가 계약을 갱신할 때마다 반복된다

### B26 dev 프론트 배포 — 돌려 보니 전날 이미 떠 있었다 (문서가 반대로 적혀 있었다)

- 사용자 요청으로 `scripts/deploy/frontend-deploy.sh`를 돌렸다. 빌드 2.0s·자산 59개, Worker `twilight-base-302d` Version `a489749b` 배포(트래픽 100%)
- **`No updated asset files to upload`이 떴다** — Vite 자산은 내용 해시 파일명이라 B26 변경이 들어갔으면 새 파일이 올라가야 한다. 파고들어 보니
  `wrangler deployments list`의 직전 배포가 **2026-10-02 18:57 KST, PR #32 머지와 같은 분**이었다. 어제 머지 직후 이미 배포돼 있었고 그 번들에 B26이 들어 있었다.
  이번 실행은 **같은 자산으로 새 버전만 찍은 재배포**(업로드 0.34KiB = 매니페스트만). 무해하지만 **PROGRESS 인덱스는 "PR·dev 배포 전", CLAUDE.md는 "B27까지"**로 둘 다 틀려 있었다
- **함정 — 배포 여부를 문서로 판정하면 양방향으로 틀린다.** 수동 배포 영역이라 기록이 뒤처지기도(이번) 앞서기도 한다. 라이브를 직접 본다:
  ① `npx wrangler deployments list | grep '^Created:' | tail -5` ② 라이브 `index.html`의 `assets/*.js` 참조 ↔ 로컬 `dist/index.html` 비교(해시가 같으면 같은 번들)
  ③ 그 변경의 고유 문자열을 라이브 청크에서 grep. 이번엔 B26의 `"삭제하지 못했습니다"`가 `work-BGkIjcqQ.js`에 있는 것으로 확인했다
- **함정 — `wrangler login` 세션이 비어 있었다.** 후보 경로 네 곳 모두 자격증명이 없고 `~/Library/Preferences/.wrangler` 자체가 실행 시점에 새로 생겼다. **비대화형 셸에선 OAuth 로그인을 끝낼 수 없다** →
  사용자에게 `npx wrangler login`을 요청해야 한다. **`--temporary`는 쓰면 안 된다** — 임시 계정으로 붙어 엉뚱한 Worker에 배포된다
- 빌드가 `work.jsx`·`QuestionAnalysisPanel.jsx`를 컴파일했다(CLAUDE.md "렌더 무대 없는 화면은 `npm run build`를 따로" 조건 충족) · `dist`에 dev API URL 확인·`localhost:8000` 0건(`.env.local` 함정 안 걸림)

## 2026-10-02

### REQ-B26 — 삭제 [되돌리기] 복원: 삭제 지연으로 (리뷰 세 바퀴)

- 원인: 삭제는 즉시 서버 반영, [되돌리기]는 서버 목록을 다시 읽기만 했다 — 복원된 게 없었다. 결정: **삭제 지연**(화면에서 숨기고 4초 토스트가 닫힐 때 서버 삭제), 백엔드 무변경
- 구현 전 확인: 첫 테스트 9건 중 6건이 옛 구현에서도 통과 — 대역 서버가 삭제를 반영하지 않아 "다시 읽기"로도 문항이 돌아왔다. `/testrun`이 무대를 서버처럼(삭제 반영) 바꾸고 옛 컴포넌트로 돌려 B26-03·04가 실패하는 것을 확인. 기존 B20-27은 "클릭 즉시 호출"을 단언해 (a)로 언마운트 확정 후 단언(단언 불변)
- `/review` 세 바퀴:
  - ① (b) 같은 쪽 다시 읽기가 삭제 POST를 앞질러 지운 문항이 되살아남 · 4초 안 탭 닫기면 삭제 유실 · 지연 삭제가 `apiFetch`라 사용자가 안 누른 순간 전역 딤(계약 #26) / (c) 토스트 중 재감지 · 실패 처리 미정 → 사용자 "추천대로": **재감지 전 확정·대기**, **실패 시 "삭제하지 못했습니다" + 그 쪽일 때만 다시 읽기, 다른 숨김 유지** · `pagehide` 전송 · `bulkDeleteQuestions` 자체를 배경 요청(헤더 직접·`keepalive`·401 갱신 1회 — 호출처가 지연 삭제뿐)
  - ② **`work.jsx`가 쪽마다 패널 `key`를 바꿔 쪽 이동 = 언마운트·새 마운트**인데 같은 인스턴스로 가정했다(B26-17도 `rerender` 무대) → 진행 중 삭제(`inflightDeletes`)·실패 알림을 **모듈 수준**으로 · 외부 확정 시 토스트 닫기
  - ③ 0건
- 함정: 실패 처리의 다시 읽기가 "진행 중 삭제"를 기다리는데 그게 자기 자신이면 서로 기다려 멈춘다 — 읽기는 **요청 자체**가 끝나기만 기다린다
- 리뷰: B26 @ 2b7b64f — (b) 3 · (c) 2 · nit 2 · 이연 0
  - (b): [frontend/src/components/QuestionAnalysisPanel.jsx:250] refreshTrigger 정리에서 대기 삭제를 기다리지 않고 바로 다시 읽음
  - (b): [frontend/src/components/QuestionAnalysisPanel.jsx:312] 토스트 4초 안 탭 닫기·새로고침이면 대기 삭제가 안 나감
  - (b): [frontend/src/components/QuestionAnalysisPanel.jsx:315] 지연 삭제가 apiFetch라 전역 딤(계약 #26)
  - (c): [frontend/src/components/QuestionAnalysisPanel.jsx:244] 토스트 중 재감지 처리 미정
  - (c): [frontend/src/components/QuestionAnalysisPanel.jsx:246] 지연 삭제 실패 시 동작 미정
- 리뷰: B26 @ 7fc7b54 — (b) 3 · (c) 0 · nit 1 · 이연 1
  - (b): [frontend/src/components/QuestionAnalysisPanel.jsx:296] 쪽 이동(재마운트) 뒤 실패 무알림
  - (b): [frontend/src/components/QuestionAnalysisPanel.jsx:227] 진행 중 삭제가 인스턴스별 — 새 패널이 이전 POST를 안 기다림
  - (b): [frontend/src/components/QuestionAnalysisPanel.jsx:260] 외부 확정 뒤 토스트 잔존, [되돌리기]가 아무것도 안 되살림
  - 이연: [frontend/src/pages/analysis/work.jsx:196] 재감지 진행 중에도 삭제 가능 — 옛 (번호, k)로 새 경계를 지울 수 있음
- 리뷰: B26 @ 4c50d43 — (b) 0 · (c) 0 · nit 1 · 이연 1
  - 이연: [frontend/src/components/QuestionAnalysisPanel.jsx:274] 작업 화면을 떠난 뒤의 지연 삭제 실패는 알릴 패널이 없음
- nit(기록만): 쪽 목록 문항 수가 삭제 뒤 안 바뀜(예전부터) · 다른 job 패널에 맥락 없는 실패 문구 · pagehide 때 401이면 갱신 재시도가 못 끝남

### REQ-B27 — PR #31 머지, dev 배포·계정 둘 확인 → B27 완료

- main `95b707c` · 백엔드 이미지 `b27-95b707c`(rev 8) + 프론트 Worker 동반 배포. 확인용 dev 계정 `b27-a-…`·`b27-b-…@test.local`을 새로 만들고 PyMuPDF로 만든 3문항 PDF를 올렸다(개인 PDF 안 씀)
- API(httpx, 18항목): 비로그인 3종 401 · **헤더 없이 쿠키만으로 스트림 200 + `Access-Control-Allow-Credentials: true`** · A 파일 알림이 B 피드·스트림에 없음(역도 같음) · A 단건 읽음 → A만 1→0 · B "모두 읽음"이 A 미확인·A 스트림에 영향 없음
  - 확인 스크립트가 처음엔 "A 스트림에 `read` 이벤트 없음"으로 짜서 A **자신의** 읽음 이벤트를 세 실패로 나왔다 — 따로 떼어 보니 B 읽음 뒤 A 스트림은 비어 있었다(스크립트 결함)
- 화면(playwright-core + Chrome): 로그아웃 상태에서 열어 A 로그인 → 스트림 200 · 뱃지 1, 새 알림 "미확인"(색 아이콘)·이전 "확인"(회색 체크) · "모두 읽음" → 뱃지 0·전부 확인 · **같은 탭** 로그아웃 → B 로그인 → 새 스트림 200, 벨에 B 알림 1건만
- 확인 중 로그인 1건이 30s 타임아웃 — 백엔드 로그에 요청이 안 찍히고 cloudflared 쪽 오류만. 재시도 1.1s. B27 무관, P06 미결 "터널 튐"과 같은 현상으로 추정
- 리뷰 게이트 예외: 게이트 명령(`-- ':/' ':/!docs'`)이 `206af9b`가 아니라 문서 커밋 `0ed835c`를 돌려준다 — 그 커밋이 루트 `CLAUDE.md`(docs/ 밖)를 고쳤기 때문. 둘 사이 docs/ 밖 차이는 `CLAUDE.md`뿐이라 코드는 전부 리뷰됨 → ✅로 올렸다. **`/checkpoint`가 CLAUDE.md를 고치면 매번 이렇게 된다** — 명령에서 `CLAUDE.md`도 빼야 한다
- 실사용 계정은 배포 직후 뱃지가 최근 30일치 전부(옛 커서 미이전 — 계획서 결정). 새 계정이라 이번 확인엔 안 드러남

### REQ-B27 — 알림 사용자별 분리: 코드 완료, 리뷰 세 바퀴 (dev 계정 둘 확인 남음)

- 출처: 같은 날 dev 전체 확인 중 사용자 요청 2건 + B24가 남긴 "알림 피드 사용자 구분 확인 안 함". 같은 확인에서 **B25·B26·F16·F17** 계획서도 나왔다(전부 미착수)
- **소유자는 알림 본문이 아니라 job 상태의 `owner_id`로 판정** — 본문에 넣으면 거를 때 파일을 다 열어 F09-09(평상시 GET 0회)가 깨진다. 읽음 기록은 `notification_reads/{user_id}.json` — 계획서의 `notifications/read/…`에서 바꿨다(그 아래 `.json`은 알림 키로 세어진다). 옛 전역 커서는 이전 없이 버림(계획서 결정) → **배포 직후 모든 사용자 뱃지가 30일치 전부 미확인**으로 보인다
- F09-41·42·47(벨 열기 = 전체 읽음)은 결정이 바뀌어 폐기 → B27-19·21·22
- **`/review`가 세 바퀴 돌았다** — 리뷰 (b)를 고칠 때마다 수정 코드가 새 (b)를 만들었다:
  - ① 알림 Provider가 마운트 1회만 연결 → 로그인 화면에서 시작하면 401로 영영 죽고, 같은 탭 계정 전환 시 **앞 사람 알림이 남음**(B27의 존재 이유를 깨는 누수) · 만료 토큰 401로 스트림 CLOSED 뒤 복구 없음 → `useAuth()` 사용자에 연결 수명을 묶고 CLOSED면 갱신 후 재연결
  - ② 그 재연결이 **5xx에도 갱신을 불러 `_tryRefresh`가 토큰을 지움 → 장애·배포 중 조용한 로그아웃** · 새 `EventSource`는 `Last-Event-ID`를 안 보내 끊긴 동안 알림 유실 → 토큰은 401·403에만 지움(apiFetch 경로도 같이 나음) · 재연결 뒤 `since`로 복구
  - ③ 그 복구가 본 알림이 없으면 `since` 없이 나가 **30일치가 스낵바로 쏟아짐**(계약 #27 모양) → 연결 시작 시각을 `since`로
- **함정**: `EventSource`는 HTTP 오류(401·5xx)면 CONNECTING이 아니라 **CLOSED로 끝나고 다시 안 붙는다** — 브라우저 자동 재연결은 네트워크 끊김에만. 그리고 수동으로 새로 열면 `Last-Event-ID`가 없다
- 스낵바는 기준선을 한 번만 잡았다 → Provider가 ready를 내리면(로그아웃·전환) 다시 잡는다. 테스트가 안 덮는다
- 테스트 무대: Provider가 `AuthProvider` 밖이면 로그인으로 취급(기존 알림 테스트 6파일 무수정)
- 범위 밖: 프론트 전체 실행에서 간헐 "Unhandled Errors" — 테스트 종료 뒤 `@iconify/react` 타이머가 상태를 바꿈(`queued`·`statusRefresh`·`QuestionAnalysisPanel.sourceText` 등). 결과는 전부 통과
- 리뷰: B27 @ cbaa557 — (b) 2 · (c) 0 · nit 8
  - (b): [frontend/src/contexts/NotificationContext.jsx:130] 마운트 1회 연결 — 로그인 전 시작 시 영영 죽음 · 계정 전환 시 앞 사람 알림 잔존
  - (b): [frontend/src/contexts/NotificationContext.jsx:92] 만료 토큰 401 CLOSED 뒤 복구 없음
- 리뷰: B27 @ 147abde — (b) 2 · (c) 0 · nit 7
  - (b): [frontend/src/contexts/NotificationContext.jsx:135] 5xx CLOSED에도 갱신 → 토큰 삭제(조용한 로그아웃)
  - (b): [frontend/src/contexts/NotificationContext.jsx:155] 수동 재연결이 끊긴 동안 알림을 못 되찾음
- 리뷰: B27 @ febcdfa — (b) 1 · (c) 0 · nit 2 · 이연 1
  - (b): [frontend/src/contexts/NotificationContext.jsx:148] 본 알림 없을 때 since 없는 복구 → 30일치 유입
  - 이연: [frontend/src/contexts/NotificationContext.jsx:144] 스트림 5xx로 닫히고 갱신도 5xx면 재연결을 포기 — 백오프 재시도 후속
- 리뷰: B27 @ 206af9b — (b) 0 · (c) 0 · nit 1 · 이연 0
- 남은 nit(이연 아님, 기록만): `_for`가 async 생성기 안에서 R2 동기 읽기 · 읽음 요청 본문 무타입(`{"ids":[[...]]}` 500) · `mark_read` 동시 쓰기 유실 · 옛 커서 코드 잔존 · 복구 since 클라 시계 의존

### REQ-P06 — Phase 7 최종 측정: 목표 달성 → P06 완료

- 터널 경유 GET 23종 × 평시·피크 ①·피크 ② × 2회 — 일반 API 1s 초과 **0건**, 가장 느린 p90 `questions_all` 0.70s, 이미지 내려받기 최대 2.07s(3s 기준 안), 피크 ② 메모리 54%
- **시간대 분산은 생략**(사용자 결정 — 지금은 사용자 1명이라 무관). 10/1 오후 터널 튐은 재현 안 됨 → 미결로 남겨 오픈 후 본다
- 상세: [perf-infra-capacity.md](infra/perf-infra-capacity.md) §8

### REQ-P06 — Phase 6: 분석 중 API 느림의 진짜 원인은 API 프로세스 안의 썸네일 렌더링

| 시도 | 피크 ① `questions_all` p90 | `/health` p90 | CPU |
|---|---|---|---|
| 분리 전 (감지 스레드) | 1.41s | 0.33s | 57% |
| 감지만 자식 프로세스 5개 | 2.31s | 0.50s | 99% |
| + nice 19 | 1.99s | 0.44s | 99% |
| **+ 썸네일 프리워밍도 자식으로** | **0.70s** | **0.10s** | 96~99% |

- **감지만 분리하면 오히려 나빠진다** — GIL이 감지 5건을 CPU 1개로 묶어 주던 게 풀려 vCPU 2개를 다 썼다. "GIL 경쟁만 없애면 된다"는 추정이 반쪽이었다
- **원인은 감지가 아니라 프리워밍** — 감지 직후 API와 같은 프로세스에서 12스레드로 PyMuPDF 렌더링. 이걸 nice 19 자식으로 옮기자 CPU 99%인데도 API가 평시와 같아졌다(자식이 남는 CPU만 쓴다)
- 피크 ②(분석 10 + 생성 3): 메모리 최대 43%(4GB), 재시작 없음. 감지 결과는 실제 PDF 5종(테스트02 포함)에서 분리 전과 같다
- **함정**: ① 자식 프로세스엔 monkeypatch가 안 건너간다 → conftest 자동 픽스처 `inline_detect_pool` ② Linux fork로 부모 boto3 연결 풀이 복사된다 → 자식 시작 시 `s3_service._make_client()`로 재생성 ③ macOS(spawn)는 stdin 스크립트에서 자식을 못 띄운다(측정 스크립트는 파일로)
- **계획서가 중간에 스스로 어긋났다** — 프리워밍을 옮기는 결정을 추가하면서 "프리워밍은 부모에 남긴다"는 옛 문장을 안 지워 P06-23·24가 빨개졌다. `/testrun`이 (c)로 돌려 정정
- 측정 도구는 scratchpad 소실로 `~/.cache/pdf-extractor-p06/p06m.py`로 재작성(레포 밖, admin만, 비밀번호는 환경변수)
- **PR #30 머지·dev 배포(main `3c06185`)** — 212쪽 업로드 1건으로 확인: 감지 49s 만에 DONE, 프리워밍(820문항) 자식에서 완료, 오류 0. 분석 중 `/health` 0.10s · `questions_all` p90 0.78s
- `templates` 평시 0.9s대: 표지·각주·워터마크 목록을 아무도 안 연 캐시 빈 상태(같은 날 "그대로 둔다" 결정). 1s 미만이지만 여유가 적다 — Phase 7에서 본다

### REQ-P06 — Phase 5: 현황판 계열 API 12.3s → 0.2s (메모리 캐시 + 쪽 목록, 실측 세 번 만에 통과)

- **실측이 두 번 계획을 고쳤다** — 코드 케이스가 전부 녹색인 뒤에도 dev 실측(P06-14)이 두 번 미충족이었다. 단위 테스트만으로는 둘 다 못 봤다:
  1. **옛 상태 파일**: dev job이 전부 Phase 5 이전 것이라 "쪽 목록 없으면 파일을 읽어 계산" 경로를 타 미탐지 12.3s·오탐 4~6s 그대로였다(계획서는 대체 경로만 정하고 채우기를 안 정했다)
     → **서버 시작 시 1회 채우기**(사용자 결정 — 일회성 스크립트·조회 때 저장(계약 #34 위반) 기각). 백그라운드 스레드, 최신 상태를 다시 읽어 쪽 목록만 얹는다. dev 첫 기동에서 76건 채움
  2. **admin `templates`**: 목록은 캐시였지만 응답이 템플릿마다 표지·각주·워터마크 메타를 R2에서 순차로 읽어(`_resolve_slots`) 피크 ① p90 1.06s → 각주·워터마크 목록도 캐시하고 단건 메타도 캐시에서(사용자 결정 — 병렬화만 기각)
- **재적재가 조회를 막으면 p90이 깨진다** — 첫 구현은 60초 재적재 동안 목록 조회를 잠가 60초마다 요청 하나가 R2 전체 읽기(~1s)를 기다렸다. 재적재는 뒤에서, 그동안 기존 목록을 준다.
  **재적재 도중 쓰기는 따로 적어 새 목록에 다시 얹는다** — 안 하면 방금 저장한 job이 최대 60초 목록에서 사라진다(계획서에 없던 것, 구현 중 발견)
- 메모리 캐시가 성립하는 전제는 프로세스 1개(uvicorn 워커 1 · 태스크 1) — 늘리면 다른 프로세스 쓰기가 60초 늦게 보인다. **R2에 직접 쓰는 새 경로는 캐시가 모른다** — `s3_service`의 save/delete 함수를 거칠 것
- **테스트 함정**: 테스트 env는 R2 계정 ID를 빈 값으로 덮어 `s3_service`를 임포트하면 `boto3.client`가 `Invalid endpoint`로 죽는다(지금까지 아무 테스트도 s3_service를 임포트하지 않아 몰랐다) → 픽스처가 `boto3.client`를 가짜로 바꾼 뒤 로드
- **그대로 둔 것**(사용자 결정): 재시작 직후 표지·각주·워터마크 목록을 아무도 안 연 상태의 `templates` — 1회차 1.08s · 이후 0.7s, 목록 화면이 한 번 열리면 0.12s. Phase 6에서 다시 본다
- 실측(앱 직접, 2 vCPU/4GB, 측정 데이터 포함): `stats_detail` 미탐지 12.3s → 0.16s · 오탐 6.2s → 0.14s · `stats` 1.45s → 0.20s · `jobs` 0.9s → 0.14~0.20s · admin `templates` 0.93s → 0.21s(평시 p90). 피크 ① 최대 0.89s(알림)
- **범위 밖으로 남은 1s 초과**(Phase 6 몫): 피크 ①의 `page_questions` 1.77s · `questions_all` 1.52s(user), 앞 측정의 `cover_image` 2.75s(admin)
- dev는 측정 동안 P06 브랜치 이미지로 떴다 — **ECR `:latest`가 머지 전 브랜치 이미지 `p06-32d4353`** 이다. 머지 후 main으로 다시 빌드할 것. B24도 같은 날 PR #28로 머지·dev 배포(비로그인 401·user 남의 job 0건 확인)

### REQ-B24 — 현황판 통계 API 인증 누락 (P06 Phase 5 원인 확인 중 발견, 계획서 + Phase 1)

- **발견 경위**: P06 Phase 5의 현황판 API 코드를 읽다가 `get_stats`·`get_stats_detail`에 `current_user`가 없는 것을 봤다. 라우터·앱 수준 인증도 없다.
  비로그인으로도 200, 응답은 전 사용자 SOURCE 합산, 상세는 **남의 `job_id`·`filename`·`workbook_name`**까지 준다.
  P06 Phase 1 측정의 "job 0건 계정도 같은 값"(데이터 비례 API 원인 추정 근거)이 사실 이 증상이었다 — 그 추정 "전체를 훑고 소유자로 거르는 구조"는 틀렸다(거르지 않았다)
- **P06과 분리**(사용자 결정): 같은 함수를 고치지만 P06 Phase 5의 완료 기준 "응답 내용은 바뀌지 않는다"를 지키기 위해. 오픈(10/6) 전 처리
- 규칙은 `list_jobs`와 같다 — user 본인 소유만, admin 전체, `owner_id` 없는 옛 job·문제집은 admin만(`workbook_count`도 문제집 `owner_id`로 거름 — 사용자 승인)
- **함정(계약 #30 재현)**: 기존 F12-18~24·B17-15~17이 무인증 `client`로 통계를 불러 401로 깨진다 → `authed_client`(admin)로 옮김(단언 불변).
  옮기지 않으면 F12-24("잘못된 field는 4xx")는 **401로도 통과**해 아무것도 검증하지 않게 된다 — 인증 추가 후 "그대로 녹색"인 4xx 단언은 의심할 것
- REQ-27 Phase 2가 엔티티 API에 인증을 걸 때 통계 두 엔드포인트가 범위에서 빠진 것으로 보인다(추정). 알림 피드(`/api/notifications`)의 사용자 구분은 이번에 확인 안 함 — 계획서 제외로 남김

### REQ-P06 — Phase 5 방식 확정: 원인은 "목록마다 파일 전부 GET"

- 원인(코드 확인): R2를 DB로 쓰므로 목록 1회 = LIST + 파일 수만큼 GET. `jobs`·`stats`는 status 전부(12 병렬), `stats`는 문제집 목록까지 한 번 더.
  `stats_detail` 미탐지·오탐·수동은 대상 job마다 경계·수동 파일을 **순차** GET(6.4s의 주범). `covers`·`templates`는 기존 병렬 헬퍼 `_get_json_many`도 안 쓰고 순차
- **결정**(사용자): 프로세스 메모리 캐시(write-through + 60초 R2 재적재) + 상태 파일에 쪽 목록 저장. 기각: R2 인덱스 파일(동시 쓰기 잠금 필요, 코드 최다) · 병렬화만(`jobs`·`stats` 0.9s 그대로, 데이터 늘면 초과)
- 메모리 캐시가 성립하는 근거: 상태 쓰기는 전부 메인 프로세스(생성 `ProcessPoolExecutor` 자식은 PDF만 만들고 `put_status`는 부모가 함), uvicorn 워커 1 · ECS 태스크 1.
  태스크·워커를 늘리면 다른 프로세스 쓰기가 60초 늦게 보인다 — 그때 R2 인덱스안을 다시 볼 것(계획서 제약)
- 순서: B24 먼저(보안·소규모), P06 Phase 5는 그 뒤

## 2026-10-01

### REQ-P06 — Phase 3·4: 터널 프로토콜은 무관, dev를 2 vCPU / 4GB로

Phase 1·2 뒤 조치 범위·순서를 정했다(사용자 결정): **터널 → 사양 → 현황판 API 셋 다**, 사양 2 vCPU / 4GB, 판정은 **p90 < 1s**, 측정 데이터는 정리하지 않는다
(데이터 비례 API엔 실사용에 가까운 양). 감지 프로세스 분리·동시 한도 축소는 택하지 않았다 — 2 vCPU에서 분석 CPU 포화가 풀려서.

**Phase 3 — 프로토콜 차이 없음, 튐은 재현 안 됨.** 같은 0.5 vCPU에서 cloudflared만 바꾼 측정 리비전(rev 7 `--protocol http2`)과 rev 4(QUIC)를 비교:
터널 경유 `/health` 100회 QUIC 0.21·0.30·0.38s / HTTP/2 0.20·0.29·0.42s(중앙값·p90·최대). 실제 연결 프로토콜은 cloudflared 로그 `Registered tunnel connection … protocol=`로 확인.
오후 16:40~16:50의 p90 5.1s·최대 14s는 18시대에 **재현되지 않았다** — 간헐적이고 프로토콜과 무관, 원인 미상. QUIC 유지. 터널 고정 비용 ≈ 0.2s.
간헐 튐은 Phase 6을 시간대를 나눠 재서 다시 보고, 재현될 때만 "다른 경로(ALB 등)" 미결을 연다. 지금 1s를 넘는 건 거의 앱 쪽이라 Phase 5에 표지 목록(`covers`, p90 1.2s)을 더했다.

**Phase 4 — rev 8(2 vCPU / 4GB, QUIC) 반영, 피크 ② 생존**(CPU 최대 56%·메모리 28%·재시작 없음). rev 4 deregister → **최신 활성 리비전 = rev 8**(콘솔 기본값 함정 없음, rev 1·2는 옛것).
dev는 **쓸 때만 켠다**(상시면 약 $85/월 추정). 피크 ② 응답 시간은 못 모았다 — 보안 그룹이 닫힌 채 측정 스크립트가 앱 직접 경로를 먼저 시도해 연결 타임아웃에 묶였고 그 사이 분석이 끝났다.
⚠️ 측정 스크립트에서 직접 경로는 보안 그룹을 열었을 때만 켜야 한다.

### REQ-P06 — 계획서 + Phase 1·2 dev 실측: 원인은 넷, 사양만으로는 1s 못 맞춘다

**목표가 같은 날 바뀌었다.** 처음엔 "분석 5건 중 평시의 2배 이내"로 정했다가 사용자 목표 "분석 중 여부 상관없이 모든 API 1s 미만"으로 교체
(평시 `/api/stats`가 이미 ~1s라 2배는 2s 허용이 된다). 예외는 파일 업로드·SSE 스트림, PDF·이미지 내려받기는 해결책이 안 보이면 3s까지.
운영 최소 사양도 함께 — 기준 사용량 사용자 10명 × (분석 5 + 생성 5)/일(오픈 후 내려갈 수 있음), 피크는 ① 한 사람 5건 ② 10명 동시 1건씩 둘 다.

측정 계정 `p06-loadtest@example.com`(dev 가입) + admin, 두 계정으로 GET 36종을 반복. 도구는 scratchpad(레포 밖).

| 상태 (0.5 vCPU / 1GB) | 앱 직접 중앙값·p90·최대 | 터널 경유 중앙값·p90·최대 |
|---|---|---|
| 평시 | 0.57 · 1.53 · 3.5s | 1.33 · 3.63 · 18.2s |
| 피크 ① 분석 5 | 1.51 · 5.02 · 17.1s (CPU 100%) | 1.81 · 4.92 · 15.7s |
| 피크 ② 분석 9 + 생성 3 | 1.99 · 4.38 · 17.7s | **backend OOM 사망**(exit 137, 메모리 94.6%) |

- **① 터널이 상당 부분이다** — CPU 5~12%로 한가한데 빈 `/health`가 0.24~13.6s. 같은 시각 정적 Worker 0.18s 고정, 앱 직접 0.01s, 터널 중앙값 0.43s·최대 14s.
  서버 로그 시각 = 클라이언트 수신 시각(차 0.02s)이라 **지연은 요청이 앱에 닿기 전**. 동시 업로드 때 앱은 200인데 클라이언트는 **520**(1건). cloudflared는 QUIC, 로그에 오류 없음 — QUIC 원인은 추정
- **② 앱도 일부는 혼자 1s를 넘는다** — `stats_detail` 미탐지 3.2s·오탐 1.5s, admin `templates` 1.1s. 측정 계정은 job 0건인데도 3.2s →
  **전체를 훑고 소유자로 거르는 구조**로 보인다(추정, 코드 미확인). 나머지는 0.2~0.85s
- **③ 분석 CPU 가설은 맞았다** — 분석 5건 동안 CPU 100% 6분, 앱 중앙값 2.6배. GIL인지 순수 CPU인지는 2 vCPU에서 포화가 풀리는 것(최대 58%)으로 보아 CPU 쪽(추정)
- **④ 메모리 — 새 발견**: B17이 분석만 동시 5로 묶었지만 생성(`ProcessPool` 2)이 위에 얹혀 1GB를 넘는다. 기준 사용량 피크에서 **지금 dev 사양은 죽는다**

**Phase 2 사양별**(rev 5 = 1 vCPU/2GB, rev 6 = 2 vCPU/4GB를 측정용으로 등록 → 끝나고 deregister · rev 4 · `desired 0` 복귀):

| 사양 | 피크 ② | CPU 최대 | 메모리 최대 | 앱 직접 피크 ② 중앙값 | 터널 피크 ② 중앙값·최대 |
|---|---|---|---|---|---|
| 0.5 / 1GB | OOM | 100% | 94.6% | 1.99s | — |
| 1 / 2GB | 생존 | 99% | 55% (≈1.1GB) | 1.23s | 1.10 · 17.6s |
| 2 / 4GB | 생존 | 58% | 26% (≈1GB) | 1.11s | 0.89 · 13.2s |

→ **최소 1 vCPU / 2GB, 여유 2 vCPU / 4GB.** 하지만 **사양만으로는 목표 불가**: `stats`·`stats_detail`은 데이터 양에 비례해 사양과 무관하게 느려졌고
(평시 미탐지 3.2→5.7→6.4s — 사양 순서대로 재며 측정 job이 15건씩 쌓였다. 그래서 이 열은 사양 효과로 읽으면 안 된다), 터널은 2 vCPU에서도 최대 10~13s.
job 상세·페이지·썸네일·각주 등은 앱 기준 0.2~0.6s라 터널만 풀리면 목표 안이다.
- 계획 밖으로 한 것: 터널/앱 분리를 위해 **보안 그룹 8000번을 측정자 IP로 일시 개방**(자동 모드 분류기가 막아 사용자가 `!`로 실행, 측정 후 revoke 확인)
- 측정 데이터가 dev에 남았다 — 측정 계정 SOURCE 약 35건·생성 약 9건(admin 목록·현황판에도 보이고 데이터 비례 API를 느리게 한다). 정리 여부 미정
- 남은 미결: 조치 방향(데이터 비례 API 수정 · 터널 프로토콜/경로 · 운영 사양) · 사양과 코드 조치의 관계 · "1s 미만" 판정 통계(중앙값/최대)

### REQ-C11 기각 — 오픈(2026-10-06) 후 재검토

착수 전 설명을 듣고 사용자가 폐기했다. 2026-10-06 오픈 뒤 실사용에서 케이스가 많이 쌓일 것으로 보고, 그때 상황을 보고 기능을 넣을지 정한다.
다시 할 때 알아 둘 것: 유제는 보이는 글자가 `유제`(10pt) 라벨뿐이고 번호는 0.1pt 숨은 글자에만 있다 — 계약 #35의 1pt 필터와 정면으로 부딪치고,
번호 없는 경계는 ADR-0006 복합키(번호 기반)와도 맞지 않는다. 시작점 후보(라벨 위치 vs 숨은 번호)부터 테스트02 배치 실측으로 정할 것.
지금은 수동 문항으로 대체한다.

### REQ-C10 — PR #27 머지, dev 배포·확인, 완료 · 어제 REQ의 dev 기준 밖 항목도 함께 확인

PR #27 main 머지(`b6edc0f`) → 백엔드 `c10-b6edc0f`(rev 4 `:latest`, `desired 0→1`, 태스크 digest `5e103d…` 일치) + 프론트 Workers 배포
(지연 로딩 조각에 새 코드 확인) → 사용자 육안 **C10 6건 전부 확인**(내신마스터 재감지 후 `문항 유형 01` ↔ `문항 1.` · 미재감지 `문항 N` ·
이름 수정 고정 접두어·처음 값·무변경 저장 · 수동 추가 접두어 · 편집 화면/PDF 라벨 · 옛 이름 `문항 문항 …`). 확인 후 `desired 0`.

같은 자리에서 **어제(09-30) REQ 중 dev 완료 기준에 없어 테스트로만 덮였던 4건**도 봤다 — 전부 OK:
B21 하단 조임 뒤 다음 문항 크롭 상단 10pt 여백(682건 이동분) · B22 "완료인데 0문항" 안내(dev 기준은 FAILED만이었다) ·
F14 전역 뱃지 색(대기 회색·분석 중 파랑·실패 빨강·완료 초록·오탐 주황·수동 보라, **정보성 칩은 파랑 테두리형** — 계약 #36 `INFO_CHIP`) ·
F15 이름 = 파일명(확장자 제외)이면 파일명 줄 생략. 교훈: dev 완료 기준을 "증상 재현" 하나로 적으면 단위 테스트로만 덮인 부속 동작이 dev에서 안 보인 채 닫힌다 —
완료 기준 밖 항목을 배포 때 목록으로 뽑아 한 번에 본다.

### REQ-C10 — 계획서 + Phase 1 (감지 원문) · Phase 2 (프론트 표시 이름), Phase 1에서 한 번 (c)로 되돌아갔다

B20에서 "TODO로 분리"만 하고 논의가 없던 항목이라 미결을 하나씩 닫았다(계획서 결정 표 9행). 표시는 **"문항 " 고정 접두어 + (사용자 이름 || 원문 || 번호)** —
"문항"은 이름 수정으로 바꿀 수 없다(사용자 메모). 수동 문항도 접두어, 이름 없는 옛 수동은 `문항 (수동)`. 이미 저장된 이름이 "문항 3 심화"면 `문항 문항 3 심화`로
보이는 것을 감수한다 — **데이터 일괄 정리는 한 번 골랐다가 같은 날 철회**("이미 저장된 이름은 그냥 냅두자"). 원문은 `title`이 아니라 별도 필드 `source_text`
(사용자 수정과 섞이지 않고, 필드 부재 = 옛 캐시). 접두어 키워드 목록은 감지의 `_PREFIX_KEYWORDS`와 **공유하지 않는다** — "유형"이 단어 병합에 들어가면
"유형01" 가상 단어가 정규식에 안 걸려 B18 "유형 N" 오탐 경계가 사라진다(계약 #11).

**첫 구현은 녹색인데 동기를 못 이뤘다.** 계획서는 "같은 줄 바로 앞 단어"를 접두어로 봤고 합성 무대(C10-01)도 그렇게 놓아 10/10 녹색이었지만,
`/testrun` 실측에서 기출 4종·테스트02 전체 **접두어 0건**. 내신마스터 실제 배치는 **"유형"(8pt)이 번호(16pt) 바로 위**(top 105.0 vs 114.6, x 겹침)였고,
키워드가 번호 위인 경계 63건 = 내신마스터 오탐 63건, 같은 줄 왼쪽 0건. (c)로 `/workplan`에 되돌려 **같은 줄 왼쪽 + 바로 위(x 겹침, top 간격 20pt 이내)**,
둘 다 있으면 같은 줄 우선으로 넓혔다. 개정 후 실측: 내신마스터 63건 전부 `유형 NN`(모두 오탐 경계), 다른 PDF 접두어 0, 경계 수·좌표·오탐 main과 동일.
- ⚠️ **합성 PDF로 "위에 얹힌 작은 글자"를 만들 때 기준선 간격 ≠ top 간격** — 기준선을 10pt 올린 8pt 라벨의 top은 20pt 번호 top과 거의 같다(143.6 vs 144.1)
  = 같은 줄이 된다. 무대 좌표는 pdfplumber로 재서 확인한 뒤 케이스로 쓴다(`/testgen`에서 실측해 top 간격 기준으로 고침)
- ⚠️ `pytest -k 'C10'`은 F09-15 파라미터 케이스 2건도 잡는다 — 한글 파라미터 ID가 `\uac10`으로 이스케이프돼 "c10"을 포함. 필터는 `-k 'test_C10'`
- 테스트02 원본은 dev R2 `uploads/19bdc399-0caa-48d9-a1d2-5f1f36e962d7/original.pdf`(읽기 전용으로 받아 scratchpad에서만 사용)

**Phase 2 — 프론트 표시 이름.** 화면마다 따로 쓰던 `title || (수동 ? "(수동 문항)" : "문항 N")` 폴백 7곳을 `utils/questionName` 하나로 모았다.
편집 화면 `label`이 이 이름이라 PDF 라벨은 따로 손대지 않고 따라간다(계약 #12). 고정 접두어 "문항"은 이름 수정·수동 추가 입력란에 `InputAdornment`로.
- 수정 입력란 처음 값은 **보이는 그대로**(원문·번호), **바꾸지 않고 저장하면 저장하지 않는다** — 안 그러면 더블클릭 후 Enter만으로 원문이 사용자 이름으로 굳어
  재감지 뒤에도 남는다(`/testgen` 미결 → 사용자 결정). 이름 없는 옛 수동 문항은 `/implement`가 계획 밖에서 빈칸으로 정한 것을 `/testrun` (c)로 올려 **빈칸 확정**
- 카드 제목이 `문항 …`이 되면서 기존 B20-26·27·D10-05~07이 `findByText('제목')` 정확 일치라 깨질 자리였다 — `/testgen`에서 찾는 문자열만 갱신(단언 의도 불변)
- `/testrun`에서 틀린 구현 4종(원문 우선 · 무변경 저장 · 옛 "문항" 걷어내기 · 접두어 제거)을 넣어 해당 케이스만 빨강 확인

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


# 지난 로그 (요약)

<!-- /digest 가 관리. 원본은 docs/progress/<분기>.md — 여기엔 요약만. 갈라지면 원본이 이긴다 -->

## 2026-Q3 ([원본](progress/2026-Q3.md))

- **REQ-B21** 조임 단어를 `top ≤ y_bottom`으로 골라 다음 문항 번호가 마지막 단어가 됐다(1,145건 중 563건). 기준은 bottom ≤ 다음 문항 시작(563→3). 기각: 3pt 허용(563→6), 엄격 부등호(563→38).
  하단이 조여지자 B13 상단 10pt가 처음 적용돼 y_top이 올라갔다(682건). 완료 기준의 "y_top 불변"이 틀려 보정했다.
- **REQ-B22** 세 증상은 "경계 캐시 없음" 한 원인이다. FAILED 안내는 모달로 막지 않고 화면 안에 둔다. 모달이면 재감지 경로가 사라진다. extract-v2 캐시 미스는 감지하지 않고 건너뛴다.
  함정: 진입 가드의 `jobInfo`는 진입 시점 상태라 재감지 성공 뒤에도 FAILED로 남는다. 조회 응답만으로는 "캐시 없음"과 "감지했는데 0개"를 구분 못 한다.
- **REQ-F14** 목록과 현황판이 다른 시점에 읽고 감지 시작 신호가 없어서 어긋났다. SSE에 저장하지 않는 `status` 이벤트를 더했다. 기각: 진행 중 주기 재조회(걷어낸 폴링), 같은 시점 읽기만(완료 전까지 어긋남).
  함정: 목록이 완료 알림마다 전역 딤을 켜고 있었다(배경 재조회는 `{ background: true }`). `default`는 팔레트 키가 아니라 `tintSx('default')`면 죽는다.
- **REQ-F15** 감지 알림도 새 알림부터 문제집 이름 우선이다. 파일명 병기는 편집 화면 파일 목록과 같은 모양으로 목록 카드와 작업 화면 헤더에만 둔다.
- **REQ-B20** HWP 출력 PDF의 0.1pt 숨은 번호를 adaptive가 거르지 않아 수열 1위가 되고, 보이는 번호가 "정규식 전용 = 오탐"이 됐다. adaptive 입력 두 곳(수열 탐색·여백 계산)에 같은 필터를 건다. 감지 변경 실측 세트에 HWP 출력 PDF를 넣는다.
  두 번째 번호 형식은 높이 규칙 200pt를 채택했다(조임 후 높이로 잰다). 연속 수열 규칙은 B18 되돌림이라 기각. 식별자는 같은 쪽·번호 안 순번 k를 항상 붙인다(ADR-0006). 기각: y 좌표, 쪽 안 전체 순번, 옛 문제집 마이그레이션(읽을 때 k=0).
  함정: 벌크 삭제는 지우기 전 대상을 모두 지목하고 prewarm도 k별 키로 저장한다. 완료 기준의 명사(`k` 필드)가 케이스로 옮겨졌는지 대조한다. 구현 전부터 녹색인 케이스는 틀린 구현을 넣어 빨강을 확인한다.
- **기록·문서 체계** 번호는 같은 화면·원인·모듈로 묶어 준다. 번호 점유는 PROGRESS "미착수 — 번호만 부여된 것" 표 하나로 모은다. 예약분이 인덱스에 없어 `ls docs/specs/`로 뽑으면 충돌할 뻔했다.
  미러링한 사본은 고치지 않고 지운다(TODO의 다음 번호 목록이 하루 만에 어긋났다). 완료 체크포인트가 TODO 절을 세 번 건너뛰었다. 여러 REQ 상태를 바꾸는 배포 뒤에는 계획서를 `grep '미배포'`로 전수 확인한다.
  계약은 진행 로그로 옮기지 않고 CLAUDE.md에 남긴다. git `--since`에 bare 날짜를 주면 조용히 0건이라 완전 ISO 형식을 쓴다.
- **REQ-C10** 원문 이름 표시. 감지 단계에서 원문을 남겨야 하고 계약 #12와 얽혀 F15와 분리했다.
- **REQ-C11** 유제 감지. B20에서 사라진 정상 경계 15개가 숨은 번호에만 의존한 유제였다. 회귀가 아니라 원래 없던 기능이라 분리했다.
- **REQ-P06** 분석 중 API 지연. 측정부터 한다. "분석이 API와 같은 프로세스 스레드에서 GIL과 0.5 vCPU를 잡는다"는 추정은 미검증이다.
- **REQ-B23** `getStatus`가 raw fetch라 인증 헤더가 없었다. raw fetch 유지 + `_authHeaders()`로 고쳤다. 기각: `apiFetch`(폴링마다 딤), 백엔드 무인증화(REQ-27 역행). 재발 방지로 `client.js` 소스 스캔 테스트를 뒀다.
  함정: 스캔이 주석을 raw fetch 호출로 오인했다. 틀린 구현을 넣어 보고서야 드러났다.
- **REQ-B19** 조회는 감지하지 않는다. 캐시가 없으면 빈 목록·썸네일 404이고 상태 파일도 안 쓴다. 기각: 캐시 미스 시 백그라운드 재감지 예약(실패 PDF는 들어갈 때마다 재감지), 동기 감지 + 세마포어(212쪽은 여전히 30초 504).
  함정: `TimeoutMiddleware`는 응답만 끊고 스레드의 감지는 끝까지 돈다. 전제를 없애는 변경은 빨간 테스트뿐 아니라 공짜로 녹색이 된 테스트(F09-06·07)도 찾는다. 504의 CORS 헤더는 uvicorn 뒤(cloudflared 또는 엣지)에서 빠진다.
- **REQ-B17** OOM 원인은 동시 실행이 아니라 감지 루프가 pdfplumber 페이지를 닫지 않은 것이다(`내신마스터` 1,033 → 170MB). "CORS 에러 + 530"이면 오리진 생존부터 본다.
  대기는 새 상태 `QUEUED`다. `PENDING` 재사용은 재시작 시 인메모리 대기열과 구분할 수 없어 기각. `BoundedSemaphore(5)`가 감지 + prewarm 전체를 감싼다.
  함정: `PDF.close()`가 `with` 끝에 전부 닫아 "닫힌 페이지 집합" 단언은 가짜가 된다. B16 그림 dict가 `stream` 참조를 붙잡는다. 메모리는 버텨도 CPU 100%로 212쪽 재감지가 50초 → 5분이 됐다.
- **REQ-B18** 원인은 정규식·adaptive 결과를 번호로 합친 병합이다. 위치(쪽·단·y)로 합치고 adaptive가 확인하지 않은 정규식 경계는 오탐 "표시"만 한다. 지우면 보이지 않는 누락이 된다. 폰트 임계값 보정과 오탐 숨김은 제외.
  함정: 5-b가 `is_false_positive`를 대입으로 덮어써 그 뒤에서 표시해야 한다. 오탐 경계도 자르기에 참여시킨다(318.9 → 390.5). 합성 PDF 본문에 숫자를 넣지 않는다.
- **REQ-B16** 하단 조임이 단어만 봐서 그림으로 끝나는 문항은 항상 잘렸다(기출 4종 92문항). images·rects·curves·lines를 y_bottom 계산에만 넣는다.
  함정: 단 구분선·꼬리말 브래킷과 옆 단 박스 테두리가 딸려 와 빈 공간이 붙는다. B13의 4종 실측 무대를 재사용해서 잡았다. 텍스트보다 오른쪽으로 넓은 그림은 제외.
- **배포·인프라** dev 프론트 실체는 Pages가 아니라 Workers `twilight-base-302d`이고 자동 배포가 애초에 없었다. SPA 폴백도 없어 직접 진입이 404였다. 배포 직후 확인은 루트가 아닌 경로나 workers.dev로 한다.
  콘솔 "서비스 업데이트"는 최신 활성 리비전을 채워 프로브 rev 3 이미지가 떴다. 실험 리비전은 deregister한다. 배포 확인은 태스크 하나가 아니라 서비스 리비전 `containerImages`와 최종 태스크로 본다.
  `backend-build.sh`는 `set -e`가 없어 원인 한 줄 뒤에서 에러가 났다. `--provenance=false`는 태그 없는 행 일부가 살아 있는 이미지 부속이라서다. JWT 서명 키가 코드 기본값이었다. `.env.dev`의 dev R2 키가 공개 레포에 7주 노출됐다(`.gitignore`가 `/*/.env`만 막음). 키 회전이 본체다. `backend/.env`가 s3라 로컬 백엔드가 dev R2에 쓴다. s3 경로는 이미 돌았고 미검증은 ECS 배포 경로뿐이다.
- **REQ-B15** `<img>`는 헤더를 못 붙인다. access token을 HttpOnly 쿠키로도 심고 이미지·파일 GET 6개에만 받는다(CSRF). 기각: `?token=`(URL 노출·캐시 파괴), fetch→blob(8곳+ 수정·캐시 상실), 이미지 인증 해제.
  서버 로그아웃이 실패해도 로컬은 로그아웃하고 딤을 켜지 않는다. 함정: 테스트는 헤더 없이 쿠키만 든 https 클라이언트로 한다(`Secure`). 쿠키 삭제는 심을 때와 Path가 같아야 한다. ADR-0005의 "다른 도메인" 서술은 틀렸다(같은 사이트라 `Lax`).
- **REQ-B13** 네 변 여백을 10pt로 통일했다(좌측이 쓰던 값). 상단은 이전 문항의 확정 y_bottom까지라 (페이지, 컬럼)별 y_top 오름차순으로 처리한다. 셀 배치 `top_left_fit`은 계약 #13 짝이라 제외.
  함정: 계획서의 `footer_y` 제거는 틀렸다. 단어 필터 상한도 겸해 지우면 푸터까지 내려간다(242 vs 822). 오탐 +1건은 "유형 11" 배지 오인식이 이제 표시된 것이라 허용 오차는 그대로 뒀다.
- **REQ-B14** 생성 경로도 로그인 강제 + `owner_id` 채움(게스트 허용 기각). extract-v2는 출처 하나라도 타인 소유면 전체 404다(부분 허용은 조용히 틀린 결과라 기각). `/api/files`는 로그인만 요구한다(잔여 위험 승인). v1 `/extract`·`/status`도 같은 수준으로 막는다.
  함정: notify 테스트가 로컬 모드 404 가드와 겹쳐 가짜로 통과할 뻔했다. 소유권 검사는 job이 없으면 admin도 404라 REQ-30 fixture 8건이 깨졌다.
- **REQ-27** 사용자 분리는 `owner_id` 필드(경로 분리 기각). 인증은 JWT(ADR-0005)이고 세션 쿠키는 세션 스토어가 없고 desired 0 토글 운영과 안 맞아 기각. 소유권 실패는 404로 고정.
  함정: 같은 초에 재발급한 토큰이 바이트 동일해 `jti`를 넣었다. 기존 라우터에 인증을 얹자 기존 테스트가 전부 401이 됐다(`authed_client`). raw fetch 3개가 로그인 후에도 401 날 뻔했다. 생성 경로가 범위 밖이라 무인증·`owner_id` 미기입으로 남았다(B14).
  Context 메서드는 mock되는 client 함수의 부수효과에 의존하면 안 된다. `pytest -k "27"`이 `test_30_27_`까지 주웠다. "D07이 슬롯을 만들어 뒀다"는 계획서 배경이 사실이 아니었다.
- **REQ-D07** 기록은 2안인데 화면은 1안 하이브리드였다. 구현을 2안에 맞추되 분석 목록은 의도적 예외, 편집은 카드 섹션까지만(단계형 기각). 리사이즈 핸들은 살렸다. 책등 색은 이름 해시(유형이 자유 입력)였다.
  출처 표시는 색 점 + 이름이다. 그룹 헤더는 DnD가 경계를 넘으면 순서 의미가 흐려져 기각. `이름 · 파일명`은 240px에서 공통 이름만 보여 기각.
  함정: flex 축소로 카드가 이미지를 잘랐다(133 vs 415px). `--mui-palette-*` 오용, `workbook_name` 비고유, `title || … + " · Np"` 우선순위. 수치 검증은 통과인데 스크린샷을 보고서야 잡혔다. 계약 번호는 재배치하지 않는다.
- **REQ-29** 각주는 텍스트, 워터마크는 이미지, 범위는 표지 제외 전 페이지, CRUD는 템플릿 관리 탭이다. 표지 삽입 전 grid PDF에 반영한다. 그리는 로직은 독립 함수로 빼 단위 테스트하고 배선은 소스 스캔으로 본다.
  함정: `insert_image`의 `mask`는 `Pixmap`이 아니라 bytes-like이고 `stream=`과 짝이다. GET mock은 `apiFetch`가 `res.clone()`을 불러 진짜 `Response`여야 한다.
- **REQ-30** 템플릿은 참조 조합이다(ADR-0004). 스냅샷 근거 "템플릿을 바꾸면 문제집도 바뀐다"는 사실이 아니었다. 결과 PDF는 구워진 정적 파일이다.
  dangling은 삭제 시 참조 검사(409 + 강제 삭제)와 생성 시 검증(400, 직접 id 경로 포함) 두 겹으로 막는다. 빈 템플릿은 입력 금지·저장 허용이고 `needs_review`를 저장한다(None만으로는 파생 판정 불가). PATCH가 없으면 재생성으로 id가 바뀌어 이력 복원이 깨진다.
  함정: `_resolve_assets()`는 `uuid4()` 앞이다(뒤면 PENDING 유령 job). delete 클라이언트가 서버 `detail`을 덮고 있었다. 소스 스캔은 JSX를 컴파일하지 않아 `npm run build`를 따로 돌린다. `git rm`은 삭제를 스테이징한다.
- **REQ-F13** 렌더 상수를 프론트에 복제하지 않고 `GET /api/templates` 응답에 실었다. 값이 미확정이라 짝을 새로 만들 이유가 없었다. 생성 PDF에 쪽 번호가 없어 표지는 표시용 번호만 민다. 확정값 15%·8pt·12pt.
  워터마크 연회색 박스는 `mask`가 알파를 곱하지 않고 대체해서다(255 위 217). 별도 REQ로 빼지 않고 Phase 3으로 합쳤다. 죽은 `Pixmap(src_pix, 0)` 코드가 버그를 가렸다.
  함정: 구현이 테스트보다 먼저면 `git stash`로 빨강을 직접 확인한다. 전역 `IntersectionObserver` 스텁은 콜백을 안 불러 단언이 전부 "없음"이 된다. REQ-30에서 미리보기를 제외하며 후속 우선순위를 낮게 본 것은 틀렸다.
- **테마 항목** 폐기했다. 갈래가 셋(생성 PDF 디자인, 앱 UI, 둘 다)으로 갈려 원문 한 줄로 정할 수 없었다. 다시 올라올 때를 위해 지우지 않고 ❌로 남겼다.
- **REQ-F12** 현황판은 작업 화면이 아니라 목록 화면이다. 감지 완료 시 문서별로 집계해 합산한다(매 요청 boundaries 재독 기각). 상세는 전용 `GET /api/stats/detail`이다. `/api/jobs`는 페이지네이션용이고 N+1, `JobSummary` 겸용 문제가 있어서다.
  `detection_rate` 0-분모는 `null`이다(0%면 "문항 없음"과 "감지 실패"가 구별되지 않는다). 페이지 전달은 `?page=`이고 `location.state`는 새로고침에서 안 살아남는다.
  함정: 새 파일로 옮기자 `vi.mock('components/StatCards')`가 아무것도 못 가로채 무관한 테스트가 깨졌다. `work.jsx`의 페이지 목록과 PDF URL 로드가 경쟁해 스크롤이 조용히 no-op될 수 있다.
- **REQ-B12** 원인은 벨이 아니라 작업 화면이 이름을 `location.state`에서만 읽는 것이다. 가드 응답 `jobInfo`에서 `workbook_name` → `filename` 순으로 꺼낸다. 증상 2(직접 진입 시 목록 복귀)는 사람 손 6회 미재현이라 도구 함정으로 보고 닫았다.
- **REQ-D11** 접점이 세 층(nav, 헤더·브레드크럼, 안내 문구)이었다. 라우트 경로도 바꾸고 리다이렉트는 두지 않았다. 기각: 경로 유지(REQ-30까지 이름·주소 불일치), 리다이렉트(옛 경로가 영영 남는다).
  함정: MUI `Breadcrumbs`는 `aria-label`을 기본으로 안 붙이고 `subtitle2`는 `h6`다. 경로 문자열은 따옴표 뒤 슬래시 정규식으로 찾는다(`navigate(` 인자를 놓쳤다). nav 활성은 `font-weight`로 읽는다.
- **REQ-D09** F10과 한 파일이라 계획서 하나로 묶었다. 주소창 `?q=`는 정리하지 않는다. URL을 지우던 주체가 흡수 로직 자신이었다. `Tooltip`의 `span` 래퍼가 `aria-label`을 가져가 버튼 이름이 비어 있었다.
  함정: cua-driver의 격리 Chromium 입력 라우팅이 불안정했다. 실패로 보고된 클릭이 나중에 전달될 수 있어 연달아 큐에 넣지 않는다. 드래그는 `delivery_mode:"foreground"`가 필요하다.
- **REQ-F10** "서버 검색 선행 필요"는 낡은 전제였다. 서버 검색은 P03-03에 이미 있어 백엔드 변경이 0건이 됐다.
- **REQ-D10** 상한 읽기 `ceil(W/T)`, T=420을 채택했다. 하한 읽기는 원문이 불평한 상황 그대로라 기각. 열 수는 상태값에서 순수 함수로 낸다. CSS `auto-fill`은 스크롤바로 OS마다 열 수가 갈리고 jsdom에서 못 재 기각.
  함정: 표지 쪽은 문항이 없어 그리드가 DOM에 없다. 수치 실측은 playwright-core, 클릭 육안은 cua-driver로 가른다. 요구 원문이 삭제된 문서에만 남아 있었다.
- **미리보기 캐시 키** Origin 없는 다운로드가 먼저 캐시를 채우면 CORS 헤더 없는 사본이 남아 미리보기가 깨진다. 미리보기 URL에만 `?preview=1`을 붙인다. presigned URL에 붙이면 서명 대상이라 403이다.
- **REQ-P05** 알림 지연은 전달이 아니라 `finally`의 프리워밍 대기였다(8.1초 단축). 목표 5s를 7s로 고쳤다. 캐시 저장 3.2s는 알림보다 먼저 끝나야 하는 필수 작업이다. 피드 GET은 `ThreadPoolExecutor.map`으로 순서를 지키며 병렬화했다(3.79s → 1.31~1.52s).
  함정: 기준 수치는 잰 파일과 함께 기억한다(393문항 job은 73.58s). 콜드 31s는 재현되지 않았다.
- **REQ-C09** 미결 6건 중 코드가 바뀌는 넷을 묶었다. 실패 문구는 서버 `message` 단일 출처다. `: connected` 선발송으로 warm 연결이 0.2~0.8s가 됐고 콜드 직후는 여전히 ~31초다.
  함정: 딤 측정에서 `api/client`를 mock하면 측정 대상이 사라진다. `fetch`만 스텁하고 양성 대조를 붙였다. 선발송으로 "첫 N청크" 케이스가 넷 깨졌다(예고는 하나).
- **REQ-B11** 기준선을 기준선 GET이 돌아온 뒤로 옮겼다. 신호는 별도 훅 `useNotificationsReady()`다. 기각: `useNotifications()`에 `ready` 얹기(P04-26이 키 고정), 데이터 `baseline` 표식, 첫 비어 있지 않은 렌더. GET이 실패해도 즉시 ready로 둔다.
  함정: 재현하려면 GET resolve 시점을 테스트가 쥐어야 한다. 컨텍스트 모듈에 export를 더하면 통째로 mock한 테스트가 깨진다. SSE 때문에 `networkidle`은 영영 안 돌아온다.
- **REQ-P04** SSE를 택했다. WS는 단방향에 양방향 프로토콜이라 기각했고 `EventSource`가 재연결과 `Last-Event-ID`를 준다. 폴링은 완전 제거(폴백 기각)하고 1태스크를 가정한다. 재동기는 서버가 `Last-Event-ID`로 하고 첫 연결엔 재전송이 없다.
  Phase 0: edge는 무전송 125초에 끊어 SSE는 앱 heartbeat가 필수다. 숨김 탭 스로틀링은 `EventSource` 메시지에 안 걸린다.
  함정: `emit()`은 threadpool이라 `call_soon_threadsafe`가 필요하다. 무한 스트림은 `TestClient`로 본문을 읽지 않는다. 서버 시계가 1.60~2.20s 빠르다. edge는 첫 본문 바이트까지 헤더를 붙잡는다. `Python-urllib` UA는 403이다.
- **REQ-F11** 판정을 순수 함수로 뽑아 목록과 상세가 같이 부른다. 훅을 `getJobInfo`의 유일 호출자로 둔다. 실패와 감지 중을 `reason`으로 가른다. 함정: `waitFor`가 내부에서 `setInterval`로 폴링해 타이머 스파이 단언을 깨뜨린다.
- **REQ-F09** 알림은 서버 파일이다. localStorage 추천은 "서버 저장은 비싸다" 전제가 틀려 뒤집혔다. 실패도 알린다(B10 상속 안 함). 쓰기는 백그라운드 감지 2곳뿐이고 조회 경로 지연 감지엔 붙이지 않는다.
  저장은 `notifications/{YYYY-MM}/{ISO}-{job_id}.json`이다. 단일 `feed.json`은 동시 append 시 유실돼 기각. `since`는 서버 `created_at`(클라 시계 오차). 주기는 활성 5초·숨김 30초 감속. 자동 다운로드는 훅 콜백 안에 둔다.
  함정: `apiFetch`는 GET에도 딤을 켠다. `unread_count`가 단조 증가하지 않아 개수 비교 억제가 뱃지를 죽였다. `os.environ.pop`은 `.env`를 못 막는다. 인용이 줄바꿈을 넘으면 0건이 된다. 케이스 46건이 녹색이어도 육안 첫 회에 결함이 나왔다.
- **REQ-B10** 해법은 A′(백엔드가 생성 성공 시 메타 저장)다. 기각: 요청 직후 프론트 선저장, 이력이 export job 직접 조회(편집 복원 불가), 요청 시점 저장, 복귀 시 다운로드 재시도. `workbook_name` 유무가 저장 주체 신호라 이중 저장 창이 사라졌다.
  고아 R2 dev 3건(21%)은 복구 없이 삭제했다. 배포는 백엔드 → 프론트 순서다. 함정: `workbook.py` docstring 근거가 틀렸다. `scale`이 생성 PDF에 빠져 있었다. PDF 비교는 크기·해시가 아니라 렌더한 픽셀로 한다.
- **REQ-D08** 선결 조건(하드코딩 286개)은 이미 해소돼 있었다. 기본은 OS 따름 + 3단 메뉴다. 2단 토글은 한 번 누르면 "OS 따름"으로 못 돌아가 기각. 다크에서도 밝아야 하는 것은 "종이인가"로 가른다.
  함정: `*.lighter`는 두 스킴이 공유해 다크에서 파스텔이 박힌다(`tint.js`). `tintSx`는 함수를 반환해 스프레드하면 조용히 빈다. FOUC는 테마 프로바이더로 못 막아 `index.html` 사전 페인트 스크립트와 `noSsr`로 막는다.
- **REQ-P03** P03-06(정규식 커버리지 80%면 adaptive 스킵)은 15문항 누락으로 기각했다. 커버리지가 페이지 단위라서다. 다시 한다면 문항 번호 단위로 본다. 썸네일 병목은 R2 전체 PDF 다운로드(~99%)였다.
  페이지네이션은 검색 서버 이관을 동반한다(안 하면 기능 회귀). R2 목록 조회 병렬화 1.311s → 0.314s. 프리워밍은 R2 PUT ~270ms라 12스레드로 돌린다. 타임아웃 미들웨어는 CORS보다 먼저 등록하고, 작업 스레드는 안 죽는다.
- **REQ-C08** 삭제는 연관 저장물 전부를 지운다. 소스를 지우면 이력은 남지만 편집 화면 이미지가 안 보여 다이얼로그에 명시했다.
- **REQ-P02** 뷰어 가상화는 react-window 대신 직접 구현했다(오버레이 좌표 계약 유지). 대상의 이전 페이지를 강제 렌더하면 0px로 누적돼 한 페이지 짧게 안착한다. GET dedup은 `Response.clone()`으로 공유한다.
  StrictMode는 껐다가 다시 켰다. 이중 요청은 dev 전용 착시이고 실질 중복은 dedup이 맡는다.
- **REQ-B08** 편집 문항 목록 내부 스크롤 복구와 파일 목록 내부 스크롤을 함께 처리했다.
- **REQ-F08** 편집 미리보기 스크롤을 좌우에서 상하로 바꿨다.
- **REQ-B07** 오탐 문항은 옵션 ②(완전 일반 취급)로 개별·전체 선택·벌크 삭제에 모두 포함한다.
- **REQ-B06** 벌크 삭제 경쟁 상태를 전용 bulk-delete 엔드포인트로 풀었다.
- **REQ-C07** 라벨의 문항 이름은 미리보기와 PDF가 `sel.label` 단일 출처를 쓴다.
- **REQ-B09** 한글 점 표시의 원인은 축약이 아니었다. PyMuPDF 1.25.5에 `Document.add_font`가 없어 helv로 폴백됐다. `TextWriter` + `fitz.Font("korea")`로 그린다.
- **REQ-B05** 깨진 flex 높이 체인과 smooth `scrollIntoView` 취소가 원인이다. 컨테이너 직접 `scrollTo({behavior:"instant"})`로 고쳤다.
- **REQ-F07** 좌표 변환은 `pt = cssPx / scale` 단일 공식이다. 데드코드 정리에서 `.pdf-page-wrapper`의 `position:relative`와 `qlist-*` 규칙까지 지워 회귀했다. 지운 게 살아 있는 코드였다.
- **REQ-D06** 표지 관리를 1패널 래핑 그리드 + 업로드 모달로 바꿨다. REQ-D05는 superseded 표기 후 파일을 유지한다.
