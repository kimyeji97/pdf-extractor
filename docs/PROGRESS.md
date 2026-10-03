# 진행 현황 (PROGRESS)

> 시간순 작업 로그. git이 말하지 못하는 **왜 / 함정 / 기각 이유**를 남긴다.
> 파일명·라인수처럼 `git show`로 볼 수 있는 건 적지 않는다.
> 깨면 회귀하는 **계약**은 이 파일이 아니라 [`CLAUDE.md`](../CLAUDE.md)에 둔다.
>
> 조회는 `/progress`, 갱신은 `/checkpoint`.
> 최종 갱신: 2026-10-03

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
| REQ-B10 | 생성 중 화면 이탈 시 문제집 메타 유실 | [plan](plans/PLAN-B10-workbook-meta-lost-on-navigate.md) | 2026-07-31 | ✅ dev 배포 완료 — 백엔드 2026-08-18 · 프론트 2026-08-21 |
| REQ-B11 | 알림 기준선이 피드 도착 전에 잡힘 — 새로고침마다 직전 알림 토스트 | [plan](plans/PLAN-B11-notification-baseline-before-feed.md) | 2026-08-28 | ✅ **Phase 1~2 완료**(`useNotificationsReady` + 세 소비처 게이트, 10/10 · dev Worker 배포 후 새로고침 5회 토스트 0건 · 계약 #27 정정) — PR #3 **main 머지 완료(2026-08-28, `3d35d65`)**. 미결 1건(ready 동승 알림)은 후속 |
| REQ-C09 | 알림 경로 후속 묶음 (실패 문구 서버 `message` 단일 출처 · `useNotificationRefresh` `kind` 필터 · 계약 #26 딤 회귀 케이스 · SSE `: connected` 선발송) | [plan](plans/PLAN-C09-notification-followups.md) | 2026-08-28 | ✅ Phase 1·2 완료 (10/10 · 백엔드 34/34 · 프론트 61/61 · dev 실측 warm `onopen` 0.2~0.8s) — PR #4 **main 머지 완료(2026-08-28, `91a911a`)**. Phase 1 육안 1건(실패 배너 문구) 미확인 |
| REQ-P05 | 알림 전달 지연 (감지 완료 알림을 프리워밍 앞으로 · 피드 GET 병렬화) | [plan](plans/PLAN-P05-notification-latency.md) | 2026-08-28 | ✅ Phase 1~3 완료 (10/10 · 백엔드 44/44 · 프론트 61/61) — 발행 전 대기 **8.1s 단축**, 피드 GET 3.79s → 1.43s. PR #5 **main 머지(2026-08-28, `6fba551`)** |
| REQ-P06 | API 응답 속도 — 목표 "분석 중 여부 상관없이 모든 API p90 1s 미만"(파일 업로드·SSE 제외, 내려받기 3s 허용) + 운영 사양 | [plan](plans/PLAN-P06-api-latency-during-analysis.md) | 2026-10-02 | ✅ **Phase 1~7 완료** — 현황판 API 캐시(PR #29) · 감지·썸네일 렌더링 nice 19 자식(PR #30) · 최종 측정 터널 경유 모든 API p90 < 1s(피크 ② 포함). 터널 튐 대응은 오픈 후로 이연 |
| REQ-F09 | 문항 분석·문제집 생성 완료 알림 | [plan](plans/PLAN-F09-completion-notification.md) | 2026-08-10 | ✅ v1(Phase 1~5) — 케이스 47/47 + 육안 확인 · dev 배포 완료(백엔드 08-18 · 프론트 08-21) · Phase 6 이연 |
| REQ-F11 | 재감지 중 상세 진입 차단 | [plan](plans/PLAN-F11-analysis-detail-entry-guard.md) | 2026-08-10 | ✅ 케이스 10/10 + 육안 확인 · 프론트 dev 배포 2026-08-21 |
| REQ-P04 | 상시 폴링 → 서버 푸시 전환 | [plan](plans/PLAN-P04-websocket-push.md) | 2026-08-27 | ✅ **Phase 0~3 완료** — SSE, 폴링 0건, dev 실측 전송 0.3~1.3s·숨김 탭 즉시 · PR #2 main 머지(`d176596`) · 후속: 콜드 스타트 기준, `: connected` 선발송, 발행 전 서버 작업 ~6s |
| REQ-D09 | 생성 이력 화면 구조 개편 (목록 전체 폭 카드 그리드 + 클릭 시 우측 아코디언 미리보기 720px) | [plan](plans/PLAN-D09-F10-history-screen-rework.md) | 2026-09-03 | ✅ **Phase 1~5 완료**(케이스 14/14 · `/testrun` 확인 · Phase 5 육안 검증 완료). dev 배포는 미실행(프론트 배포 정책상 로드맵 완료 시점에 모아서) |
| REQ-F10 | 생성 이력 이름 검색 | [plan](plans/PLAN-D09-F10-history-screen-rework.md) | 2026-09-03 | ✅ Phase 3(D09-08~12, 이 REQ의 전체 범위) + Phase 5 육안 검증 완료. dev 배포는 미실행(위와 동일 정책) |
| REQ-D10 | 문항 목록 n×n 바둑판 배열 — 임계 420px 초과 시에만 열 수 증가(D01과 공존) | [plan](plans/PLAN-D10-question-grid-columns.md) | 2026-09-03 | ✅ **Phase 1~2 완료**(케이스 7/7 · `/testrun` 확인 · Phase 2 로컬 육안 — 1↔2열 전환·이미지 잘림 0·상호작용 4종·다크 실측 통과, **오탐 배지만 미확인**(검증 PDF에 오탐 0건)). PR #8 **main 머지 완료(2026-09-03, `48e445d`)**. dev 배포는 미실행(프론트 배포 정책) |
| REQ-D11 | 메뉴 이름 변경(분석·생성·결과·템플릿 관리) + 경로 변경(`/create`·`/results`·`/templates`, 리다이렉트 없음) | [plan](plans/PLAN-D11-menu-rename.md) | 2026-09-04 | ✅ Phase 1·2 완료, 검증 계약 18/18. PR #9 **main 머지 완료(2026-09-04, `1fc5bac`)**, 브랜치 삭제됨. dev 프론트 재배포 시 옛 URL(`/editor`·`/history`·`/format`) 깨짐은 결정 사항 |
| REQ-B12 | 목록을 거치지 않는 작업 화면 진입 — 문서 이름이 job-id로 뜸(+직접 진입 목록 복귀 재현) | [plan](plans/PLAN-B12-work-entry-name.md) | 2026-09-07 | ✅ Phase 1(케이스 7/7) + Phase 2(재현 시도 6회 전부 미재현, Phase 3 없이 종결). 브랜치 `feat/B12-work-entry-name` 푸시됨, PR은 미생성(다음에 오픈 예정) |
| REQ-F12 | 문항분석 현황판 — 목록 화면 통계 5타일(분석중·미탐지·오탐·수동·탐지율, 기존 StatCards 대체) + 아코디언 상세 + 페이지 진입 스크롤 | [plan](plans/PLAN-F12-detection-stats-dashboard.md) | 2026-09-09 | ✅ **Phase 1~3 전부 완료**(케이스 40/40 · `/testrun` 확인 · 회귀 없음 백엔드 68/68·프론트 30파일 127/127). PR #11 **main 머지 완료(2026-09-09, `d1ad297`)**, 브랜치 삭제됨 |
| REQ-29 | 각주·워터마크 등록(표지 CRUD와 같은 모양) + 생성 PDF 반영(표지 제외 전 페이지) | [plan](plans/PLAN-29-footnote-watermark-registration.md) | 2026-09-11 | ✅ **완료**(Phase 1+2, 케이스 28/28 · `/testrun` 확인 · 회귀 없음 140/140). PR #12 **main 머지 완료(2026-09-13, `e0da607`)**. 잔여 위험 2건(s3 스토리지 경로 미검증 · 브라우저 end-to-end 미실시)은 머지 후에도 그대로 |
| REQ-30 | 템플릿 — 표지·각주·워터마크 조합 엔티티(**참조**, ADR-0004) + 생성 화면에서 `cover_id` 대신 `template_id` 선택 | [plan](plans/PLAN-30-template-entity.md) · [ADR](adr/0004-template-reference-not-snapshot.md) | 2026-09-13 | ✅ **Phase 1·2 완료**(케이스 41/41 · `/testrun` 확인 · 회귀 없음 백엔드 111·프론트 150). PR #13 **main 머지 완료(2026-09-13, `e1e4a7f`)**, 브랜치 삭제됨. 잔여 위험 2건(s3 경로 미검증 · 브라우저 e2e 미실시)은 머지 후에도 남는다 |
| REQ-F13 | 미리보기에 템플릿(표지·각주·워터마크) 반영 + 워터마크 알파 결함 수정(REQ-29에서 들어옴) | [plan](plans/PLAN-F13-preview-template-rendering.md) | 2026-09-13 | ✅ **Phase 1~3 완료**(케이스 23/23 · `/testrun` 확인 · 육안 검증 완료 · 회귀 없음 백엔드 122·프론트 162). 렌더 상수는 **프론트에 복제하지 않고 서버가 응답에 실어 보낸다**. PR #14 **main 머지 완료(2026-09-13, `2fb290b`)**, 브랜치 삭제됨 |
| REQ-B13 | 문항 크롭 여백을 네 변 10pt로 통일 (TODO 4단계 "서버 영역 버그") | [plan](plans/PLAN-B13-crop-margin-uniform.md) | 2026-09-21 | ✅ **Phase 1·2 전부 완료**. Phase 1(케이스 11/11 · `/testrun` 확인 · 회귀 없음 136) PR #15 **main 머지 완료(2026-09-18)**. Phase 2(2026-09-21) 실제 기출 PDF 4종·문항 1,141개로 오탐 실측 — 3종 0건 유지, 1종에서 1건 증가했으나 원인이 "유형 N 배지 오인식"이라는 기존 오탐지가 색상 필터에 정확히 걸린 것으로 확인돼 허용 오차 조정 없이 종결(사용자 확인) |
| REQ-27 | 로그인/회원가입 — 인증(JWT) · CORS 제한 · D07 잔여 슬롯(auth-layout·account-popover) | [plan](plans/PLAN-27-login-registration.md) · [ADR](adr/0005-jwt-auth.md) | 2026-09-18 | ✅ **Phase 1~5 전부 완료**(케이스 68/68 · `/testrun` 확인 · 회귀 없음 백엔드 167/167·프론트 185/185). 착수 중 배경 서술 오류 발견 — `auth-layout`·`ProfileMenu`는 실제로 존재하지 않고 주석 한 줄뿐이었다(계획서 § 배경 정정). PR #16 **main 머지 완료(2026-09-18, `88ba7a3`)**, 브랜치 삭제됨. D07 잔여 슬롯도 이걸로 해소 |
| REQ-B14 | 업로드/추출 생성 경로 무인증 + owner_id 미기입 (REQ-27 Phase 2 범위 밖에서 발견) | [plan](plans/PLAN-B14-upload-extract-auth-owner-id.md) | 2026-09-21 | ✅ **Phase 1~3 전부 완료**(케이스 16/16 · `/testrun` 확인 · 회귀 없음 백엔드 196/196·프론트 186/186). Phase 1이 남긴 REQ-30 회귀(`test_template_extract_wiring.py` 8건, fixture가 실제 job 없이 job_id만 참조)는 Phase 3에서 `_make_job`으로 해소. PR #17 **main 머지 완료(2026-09-21, `eeb79c4`)**, 브랜치 삭제됨 |
| REQ-B15 | 이미지 요청 401 — `<img>`가 인증 헤더를 못 보냄 (REQ-27 후속, dev 배포 후 발견) → access 쿠키 병행 | [plan](plans/PLAN-B15-image-auth-cookie.md) | 2026-09-28 | ✅ **Phase 1~3 전부 완료**(케이스 22/22 · `/testrun` 확인 · 회귀 없음 백엔드 221/221·프론트 192/192 · dev 육안 5개 화면). PR #18 **main 머지 완료(2026-09-28, `da8e1c1`)**, 브랜치 삭제됨 |
| REQ-B16 | 문항 끝에 붙은 그림이 크롭 하단에서 잘림 (dev 육안 제보, `0928 테스트4` 3p 5번) | [plan](plans/PLAN-B16-trailing-figure-crop.md) | 2026-09-28 | ✅ **Phase 1 완료**(케이스 6/6 · `/testrun` 확인 · 회귀 없음 백엔드 227/227 · 기출 4종 1,141문항 실측). PR #19 **main 머지 완료(2026-09-28, `7498854`)**, 브랜치 삭제됨. **dev 백엔드 배포 전** — 배포 후 기존 파일은 재감지 필요 |
| REQ-B17 | 분석 중 백엔드 OOM — pdfplumber 페이지 누수 + 동시 분석 무제한 (dev 연속 업로드 중 530) | [plan](plans/PLAN-B17-analysis-oom.md) | 2026-09-29 | ✅ **Phase 1~4 완료**(누수 수정 212쪽 1,033→170MB · 동시 5개·`QUEUED`·시작 시 FAILED·알림 · 프론트 "대기 중", 케이스 23건). PR #20 main 머지 `6862b75`. dev 확인 2026-09-29 `f93e525` — FAILED+알림·재감지 DONE, 9건 연달아 분석 태스크 생존·메모리 최대 65% |
| REQ-B18 | 목차·"유형 N" 제목이 문항으로 잡히고, 번호만 보고 합쳐 진짜 문항이 사라짐 (dev `0928 테스트2` 1쪽 목차 4문항 · 2쪽 0문항) | [plan](plans/PLAN-B18-regex-only-false-positive.md) | 2026-09-29 | ✅ **Phase 1·2 완료**(위치 기준 병합 + 정규식 전용 경계 오탐 **표시**, 케이스 8/8 · 기출 4종 실측: 심화대비 복구, 내신마스터 "유형 N" 62건 오탐). PR #21 main 머지 `c17f884`. dev 상세 육안 2026-09-29 `f93e525` |
| REQ-B19 | 분석 실패 파일 상세가 30초 504 — 조회 경로가 캐시 미스 시 요청 안에서 동기 감지 (B17 Phase 4를 막음, TODO §7) | [plan](plans/PLAN-B19-lookup-path-sync-detection.md) | 2026-09-29 | ✅ **Phase 1~3 완료**(조회 3곳 캐시 미스 → 감지 없이 빈 결과·404, 상태 파일 안 씀 · 케이스 10/10 · `/testrun` 확인 · 회귀 없음 백엔드 266/266 · 전제 소멸한 F09-06·07·16 폐기 · 504 CORS 헤더는 Cloudflare 쪽에서 빠짐 — 구간 특정까지). PR #22 main 머지 `46c464e`, dev 배포 `f93e525` 확인(FAILED 상세 즉시 200·재감지 DONE·stats 9s→0.9s). `/api/jobs`·`/api/notifications` 재측정과 미결 3건은 TODO §7·§9로 이관 |
| REQ-B20 | HWP 출력 PDF가 전부 오탐 — 보이지 않는 0.1pt 번호 글자 + 같은 쪽·같은 번호 식별자 충돌 (B18 회귀, dev `테스트02` 840경계·오탐 378) | [plan](plans/PLAN-B20-invisible-number-and-id-collision.md) | 2026-09-30 | ✅ **Phase 1~5 완료**(adaptive 1pt 이하 제외 · 정규식 전용 높이 규칙 200pt · 문항 ID 순번 k — ADR-0006 · 목록 k 필드 · 프론트 k 전달 · 케이스 27/27 · 백엔드 288/288·프론트 203/203). PR #23 `0d8c5d4`·PR #24 `ee27f2c` main 머지, dev 배포 `fe3d971` 사용자 확인 |
| REQ-B23 | 결과 PDF 상태 조회(`GET /api/status/{job_id}`)가 401 — `getStatus` raw fetch에 인증 헤더 누락(계약 #31 누락) | [plan](plans/PLAN-B23-status-poll-401.md) | 2026-09-30 | ✅ **Phase 1·2 완료**(`getStatus`에 `_authHeaders()` · raw fetch 인증 스캔 테스트 · 케이스 3/3 · 프론트 206/206). PR #25 main 머지 `4f26daf`, dev 프론트 배포 후 사용자 확인 |
| REQ-B24 | 현황판 통계 API(`/api/stats`·`/api/stats/detail`) 인증 누락 — 비로그인으로도 전 사용자 합산·남의 job_id·파일명 노출 | [plan](plans/PLAN-B24-stats-auth-missing.md) | 2026-10-02 | ✅ **Phase 1 완료**(인증 + user 본인·admin 전체 · 케이스 9/9 · 백엔드 326/326). PR #28 main 머지 `64b8a18`, dev 배포 후 비로그인 401·user 남의 job 0건 확인(admin 화면은 테스트로만) |
| REQ-B21 | 크롭 하단 여백이 문항마다 다름 — 하단 조임이 다음 문항 번호를 제 것으로 잡았다 | [plan](plans/PLAN-B21-crop-bottom-next-number.md) | 2026-09-30 | ✅ **완료**(B21-01~04 · PR #26 `f18c495` · dev 확인) |
| REQ-B22 | 경계 캐시가 없는 job 처리 — FAILED·DONE 0문항 화면 안 안내 · extract-v2 캐시 미스 감지 제거 | [plan](plans/PLAN-B22-missing-boundaries-cache.md) | 2026-09-30 | ✅ **완료**(B22-01~10 · PR #26 `f18c495` · dev 확인) |
| REQ-F14 | 현황판 개선 + 시스템 전체 뱃지 색 — 감지 상태 SSE `status` 이벤트 · 목록·현황판 함께 배경 재조회 · `utils/badges` 단일 정의 · 상세 영역 닫기·목록 우측 | [plan](plans/PLAN-F14-stats-board-and-badges.md) | 2026-09-30 | ✅ **완료**(F14-01~26 · PR #26 `f18c495` · dev 확인) |
| REQ-F15 | 문제집 이름·파일명 표시 — 감지 알림 제목 문제집 이름 우선 · 목록 카드·작업 화면 헤더에 파일명 병기 | [plan](plans/PLAN-F15-workbook-name-and-filename.md) | 2026-09-30 | ✅ **완료**(F15-01~11 · PR #26 `f18c495` · dev 확인) |
| REQ-C10 | 감지 문항 이름을 원문으로 표시("문항 유형 01" — 고정 접두어 "문항" + 사용자 이름 \|\| 원문 \|\| 번호) | [plan](plans/PLAN-C10-question-source-title.md) | 2026-10-01 | ✅ **Phase 1~3 완료**(백엔드 감지 원문 `source_text` + 조회 API · 프론트 `utils/questionName` 단일 표시 이름·입력란 고정 접두어, 케이스 30/30 · 백엔드 317 · 프론트 273 · 기출 4종·테스트02 경계 불변 실측). PR #27 main 머지 `b6edc0f`, dev 배포 `c10-b6edc0f` 후 사용자 육안 확인. 원문은 재감지한 파일부터 |
| REQ-B27 | 알림 사용자별 분리 + 알림별 읽음 — 알림 API 3종 무인증·전 사용자 알림 노출, 전역 읽음 커서 | [plan](plans/PLAN-B27-notification-per-user.md) | 2026-10-02 | ✅ **Phase 1·2 완료**(케이스 35/35 · 백엔드 374/374·프론트 290/290 · 리뷰 3회 후 `206af9b` (b)·(c) 0). PR #31 main 머지 `95b707c`, dev 백엔드·프론트 동반 배포 후 계정 둘로 확인(API 18항목 · 화면 계정 전환) |
| REQ-B26 | 문항 삭제 [되돌리기]가 복원하지 않음 → 삭제를 토스트 동안 미루고 되돌리면 그대로 | [plan](plans/PLAN-B26-delete-undo-restore.md) | 2026-10-02 | ✅ **Phase 1 완료**(케이스 22/22 · 프론트 312/312 · 리뷰 3회 후 `4c50d43` (b)·(c) 0). PR #32 main 머지 `7477a91` · **dev 프론트 배포 완료**(2026-10-02 18:57, 머지와 같은 분 — 2026-10-03 라이브 번들로 확인) |
| REQ-B25 | 현황판 페이지 번호 클릭 → 항상 1쪽 (로딩 전 이동 요청이 버려짐) | [plan](plans/PLAN-B25-stats-page-jump.md) | 2026-10-03 | ✅ **Phase 1 완료**(케이스 8/8 · `/review` 2회 — 회차 0의 (b) 2건을 회차 1에서 닫음 · 미결 2건 확정). dev 프론트 배포 후 212쪽 합성 PDF로 `?page=150·212·2` 육안 확인 |
| REQ-F17 | 출처 문구 형식 "n번) 문제집. p쪽. 문항이름." + 이름 표시 확장자 제거 | [plan](plans/PLAN-F17-source-label-format.md) | — | 🟡 **코드·테스트 완료**(케이스 21/23 ✅ · 프론트 337 · 백엔드 376) — `/review` 3회차에서 **(b) 2건 남음**(게이트 막힘). 재리뷰 상한 도달 |

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
| REQ-28 | 공유 기능 (분석 파일·생성 문제집을 계정에 공유) | [TODO](TODO.md) | 대 — REQ-27 선행 | ⏸ 보류 |
| REQ-C11 | "유제"(보이는 번호 없는 하위 문항) 감지 — HWP 출력 기본문제 PDF | [TODO §8](TODO.md) · B20에서 분리 | — | ❌ **기각(2026-10-01)** — 2026-10-06 오픈 후 실사용 케이스를 보고 넣을지 다시 정한다. 그때 새 번호로(번호 재사용 안 함) |
| REQ-F16 | 생성된 PDF 저장 — 브라우저 저장 위치 선택 창 | [plan](plans/PLAN-F16-pdf-save-picker.md) · 2026-10-02 dev 확인 | — | 📝 계획서만 |

> **REQ-B25는 2026-10-03에 계획서가 현행화되고 Phase 1 구현·리뷰가 끝나 이 표에서 빠졌다**(위 인덱스 🟡).
> dev 육안(212쪽)만 남았다 — 단위 테스트가 구조적으로 못 덮는 부분이다.

> **REQ-F17은 2026-10-03에 착수해 이 표에서 빠졌다**(위 인덱스 🟡). `/review` 3회차까지 돌았고
> **(b) 2건이 남아 게이트가 막혀 있다** — 재리뷰 상한(2회) 도달로 자동 수선 루프는 멈춘 상태다.

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
| prod 환경 | (추후 결정) | ❌ 미착수 |
| IaC / CI·CD 자동화 | — | ❌ 미착수 |

---

# 로그

## 2026-10-03

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

## 2026-09-30

### REQ-B21·B22·F14·F15 — PR #26 머지, dev 배포·확인, 네 건 완료

PR #26 main 머지(`f18c495`) → 백엔드 이미지 `b21-f18c495`(rev 4 `:latest`, `desired 0→1`) + 프론트 Workers 배포 → 사용자 육안 **전부 확인**.
- ⚠️ 배포 직후 `describe-tasks`가 **옛 이미지 digest(`b20-fe3d971`)**를 보였다 — 18:07:24에 잠깐 뜬 다른 태스크였고, 서비스 리비전은 새 digest(`a5ea…`)로
  고정돼 있었으며 곧 새 이미지 태스크 하나만 남았다. **배포 확인은 태스크 하나가 아니라 서비스 리비전 `containerImages`와 최종 태스크로 본다**
- 프론트 번들 확인은 **지연 로딩 조각까지** 받아야 한다 — 화면 코드(`work`·목록)는 `index.html`이 부르는 메인 번들에 없다
- dev 백엔드는 확인 끝나고 `desired 0`으로 내렸다(18:09 배포 후 사용자 확인 → 세션 끝에 내림)

### REQ-B21·B22·F14·F15 — 코드 Phase 전부 완료, 네 건 몰아서 `/testrun` (dev 확인은 함께)

사용자 결정으로 **한 브랜치(`fix/B21-crop-bottom-next-number`)에 네 REQ를 쌓고 테스트·dev 확인을 몰아서** 한다(커밋 9개, 미머지).
`/testrun` 결과: 백엔드 14 · 프론트 48 케이스 전부 녹색, 전체 백엔드 302 · 프론트 254. 틀린 구현 11종을 주입해 해당 케이스가 전부 빨개지는 것을 확인했다(가짜 녹색 없음).

**B21 — 원인은 경계 포함 조건이었다.** 조임에 넘기는 단어를 `top ≤ y_bottom`으로 골랐는데 다음 문항이 있으면 `y_bottom` = 다음 번호의 top이라
**그 번호가 이 문항의 마지막 단어**가 됐다(기출 4종 조임 1,145건 중 563건). TODO의 추정("B16 그래픽")은 틀렸다 — B16 이전 코드도 같았다.
기준은 **bottom ≤ 다음 문항 시작**(563→3, 남는 3건은 심화대비 목차 = B13 가드 정상). 기각: 3pt 허용(563→6, 키 큰 수식 글리프 3건 잔존) · 엄격 부등호(563→38).
- ⚠️ **실측이 완료 기준과 어긋났다 — 기준이 틀렸다.** 하단이 조여지자 다음 문항 **y_top이 거의 전부 정확히 10pt 올라갔다**(682건).
  B13 상단 규칙은 "위로 10pt, 단 이전 문항 확정 하단까지"인데 그 하단이 늘 이 문항 번호에 붙어 있어 **상단 여백도 한 번도 적용되지 않았던 것**이다.
  B13 결정("네 변 모두 10pt")대로라 올바른 동작으로 보고 계획서 완료 기준의 "y_top 불변"을 보정했다(사용자 결정). dev 육안에서 상단 여백도 본다
- 실측(main 대비): 기출 4종·테스트02 경계 수·x·오탐 표시 불변, y_bottom 감소만(684건, 증가 0). Red 3쪽 6번 425.2→315.1
- 별건: 푸터 선(쪽 높이 91%)에 걸친 마지막 줄은 **B21 이전부터 잘렸고** B21로 1~3pt 더 잘린다(테스트02 2건, 기출 0건) → TODO §10(사용자 결정)

**B22** — 셋 다 "경계 캐시 없음" 한 원인. dev R2 실데이터 조사(읽기 전용): SOURCE 15건 전부 DONE + 캐시 → DONE인데 캐시 없는 job **0건**.
FAILED 안내는 **진입을 막지 않고 화면 안에**(재감지 버튼이 작업 화면 안에만 있어 모달로 막으면 재감지 경로가 사라진다). 서버 `error`는 대부분 예외 원문이라 작은 글씨로만.
extract-v2 캐시 미스는 **감지하지 않고 건너뜀** — 감지 경로를 업로드·재감지(B17 한도 안) 하나로 모은다(계약 #34와 같은 방향).
- 계획 밖으로 한 것: 진입 가드의 `jobInfo`는 진입 시점 상태라 **재감지 성공 뒤에도 FAILED로 남아** 안내가 계속 뜬다 — 재감지 완료 시 DONE 기준으로 다시 판정하고 문항 수를 다시 읽게 했다
- 조회 응답만으로는 "캐시 없음"과 "감지했는데 0개"를 구분 못 한다 — DONE 0문항 문구는 "실패"라고 단정하지 않는다
- v1 `/api/extract`도 매번 감지·한도 밖이지만 프론트가 안 부른다 → TODO §9(사용자 결정)

**F14** — 업로드 직후 목록 "대기 중" vs 현황판 "분석 중"은 둘이 **다른 시점에 읽고 감지 시작 신호가 없어서**였다(QUEUED→PROCESSING이 즉시 이어짐).
SSE에 **저장하지 않는 `status` 이벤트**를 더했다(`read` 이벤트 선례) — 알림 피드·미읽음·벨에 섞이지 않는다. 기각: 진행 중 주기 재조회(P03·P04에서 걷어낸 폴링) · 같은 시점 읽기만(완료 전까지 어긋남 남음).
- **목록도 완료 알림마다 전역 딤을 켜고 있었다**(`listJobs`·`getStats`가 `apiFetch`, 계약 #26 위반 상태) — 배경 재조회는 `{ background: true }`(raw fetch + `_authHeaders()`)로
- 뱃지 규칙(사용자 결정): 대기 default "대기 중" · 분석 중 info · 실패 error "분석 실패" · 완료 success · 오탐 warning · 수동 secondary.
  완료 "N문항"에서 "완료=success"와 "개수 칩은 범위 밖"이 부딪쳐 **분석 결과 칩 = 상태 색, 그 외 정보성 칩 = primary 테두리형**으로 보강했다(/testgen 중 결정)
- ⚠️ `default`는 MUI 팔레트 키가 아니라 `tintSx('default')`면 죽는다 — 현황판 대기 타일은 `action.selected`·`text.secondary`로 칠한다(계약 #20 토큰)
- 상세 영역은 **현황판이 상태를 든 채 목록 줄에 포털로** 붙였다 — `components/StatCards` 경로·기본 export를 그대로 둬 다른 테스트의 `vi.mock`이 안 깨진다(계약 #28)
- `useStatusEvents`는 별도 컨텍스트 — `useNotifications()` 값 키가 P04 테스트에 고정돼 있다. Provider 밖 0(F12 목록 테스트가 Provider 없이 그린다)

**F15** — 감지 알림 제목만 파일명이었다(생성 알림은 이미 이름 우선). **새 알림부터** 문제집 이름 우선(저장된 제목은 발행 당시 기록). 파일명 병기는
편집 화면 파일 목록에 **이미 있어서** 같은 모양(이름 아래 작은 글씨)으로 목록 카드·작업 화면 헤더에만. 이름이 없거나 파일명에서 확장자만 뺀 것과 같으면 한 줄만.

남은 것: PR·머지 → dev 배포(백엔드 + 프론트) → 육안(B21 Red 3쪽 상·하단 여백 · B22 실패 안내 · F14 동기화·색·상세 · F15 이름).

### REQ-B20 Phase 5 — dev 확인, B20 완료

백엔드(이미지 `b20-fe3d971`, rev 4 `:latest`)와 프론트(Workers, 번들에 `?k=` 호출 확인)를 **함께** 배포했다 — 이번엔 프론트도 바뀌어
백엔드만 올리면 수정·삭제가 k=0에만 적용된다. 사용자가 테스트02 재감지, 내신마스터 4쪽 "유형 01" ↔ "1." 썸네일 분리·한쪽만 삭제,
저장된 옛 문제집 편집 복원을 확인했다. B20 ✅.

### 착수 대기 13건을 7개 REQ로 번호 부여

TODO §7~§10에 흩어진 착수 대기 항목을 **같은 화면·같은 원인·같은 모듈**로 묶어 번호를 줬다(인덱스 "미착수 — 번호만 부여된 것" 표):
B21(Red 3쪽 크롭 여백) · **B22**(B19 미결 3건 — 셋 다 "경계 캐시 없음"이라는 한 원인) · **F14**(현황판 한 화면 5건) · **F15**(이름 표시 2건 —
알림·목록에 걸쳐도 같은 규칙) · **C10**(원문 이름 — 감지 단계에서 원문을 남겨야 하고 계약 #12와 얽혀 F15와 분리) · **C11**(유제 감지 — B20이
"회귀가 아니라 원래 없던 기능"으로 분리) · **P06**(분석 중 API 지연 — 측정부터). §6 운영 환경은 인프라라 이 레포 관례대로 번호 없이 둔다.

같은 날 곁가지: `scripts/deploy/frontend-deploy.sh` 추가(사용자 작성 — `backend-build.sh`처럼 실행 위치 무관, `VITE_API_BASE_URL`을 셸로 덮음).
TODO §10(사용자 육안)의 추정 "B16 실측 무대에 이 PDF가 없었는지"는 **틀렸다** — Red는 B16 기출 4종에 포함돼 있었다. 정정해 둠.
`CLAUDE.md`의 넘버링 절(다음 번호·점유 범위·"REQ-30만 예약")과 「현재 위치(2026-09-18)」가 B14~B20을 반영하지 못해 현행화했고,
`PLAN-B16` 상태 줄의 "dev 배포 전"(09-28 `c17f884`로 배포됨)도 고쳤다.

### REQ-B23 — PDF 생성 후 상태 조회가 401 (계획서 + Phase 1)

다른 세션이 TODO §10에 올린 항목(원 대화는 transcript에 없음)이다. `/api/status/{job_id}`는 보호 라우트인데 `getStatus`는 raw fetch(계약 #26)라
인증 헤더가 없었다 — REQ-27 Phase 4가 `getJobInfo`·`uploadCover`·`uploadWatermark`에 헤더를 붙이며 계약 #31을 만들 때 **이 하나를 놓쳤다.**
`client.js`의 raw fetch 8개를 전수 확인하니 헤더 없는 셋 중 실제로 깨지는 건 `getStatus`뿐이었다(알림 둘·`logout`은 백엔드가 무인증).
고치는 방식은 계약대로 raw fetch 유지 + `_authHeaders()`(기각: `apiFetch` — 폴링마다 딤 · 백엔드 무인증화 — REQ-27 역행).
재발 방지로 **`client.js` 소스 스캔 테스트**를 뒀다(사용자 결정) — raw fetch 함수는 헤더를 쓰거나 무인증 예외 목록에 있어야 통과.

**기록 정정 둘.** ① 계획서 초안의 미결 "`get_status`에 소유자 확인이 없다"는 **틀렸다** — 함수 첫 몇 줄만 보고 적었고, 실제로는 조회 직후
`ensure_owner_or_admin`을 부른다(미결 정리 때 발견·정정). ② 무인증 예외 목록에서 **`logout`이 빠져 있었다**(`/testgen`에서 발견) — 백엔드 `/auth/logout`은
access 쿠키만 지우는 무인증 엔드포인트다.

테스트 함정: **B23-03이 주석을 스캔해** `// raw fetch(계약 #26 …)` 설명문을 raw fetch 호출로 오인했다. `getStatus`를 `apiFetch`로 바꾸는 틀린 구현을 넣어
보다 드러났다(헤더가 있는 지금 코드에선 우연히 통과) → 스캔 전 주석 제거((a) 수정). 틀린 구현 세 가지(원래 코드 · `apiFetch` 전환 · 헤더 없는
raw fetch 추가)를 각각 넣으면 그 케이스만 빨강이 되는 것을 확인했다.
B23-03 수정(`ed3886e`)까지 PR #25로 main 머지(`4f26daf`). 프론트만 바뀌어 dev 반영은 `frontend-deploy.sh`로 충분하다(백엔드는 켜야 확인 가능).
**Phase 2**: dev 프론트 배포(번들의 `getStatus`가 `{headers:…}`로 호출) 후 사용자가 PDF 생성 → 상태 폴링 200 → 결과 화면을 확인. B23 ✅.

## 2026-09-29

### REQ-B19 — FAILED 파일 상세 30초 504: 조회 경로의 동기 감지 폴백 제거 (계획서 + Phase 1)

09-28 dev 확인에서 막힌 TODO §7 1번에 번호를 줬다. 조회 엔드포인트 3곳(전체 문항·페이지 문항·문항 썸네일)이
경계 캐시가 없으면 **요청 안에서 감지**했고, 성공하면 상태를 무조건 `DONE`으로 덮어썼다. B17이 서버 시작 때
멈춘 작업을 FAILED로 바꾸면서 "캐시 없는 job이 목록에 정상적으로 뜨는" 경로가 생겨, 드물던 폴백이 주 경로가 됐다.
**`TimeoutMiddleware`(`asyncio.wait_for`)는 응답만 끊고 스레드풀의 동기 `def`는 끝까지 돈다** — 그래서
새로고침마다 212쪽 감지가 하나씩 쌓였다.

**결정(사용자) — 조회는 감지하지 않는다.** 캐시가 없으면 문항 목록은 빈 결과, 썸네일은 404이고 상태 파일도 쓰지
않는다. FAILED는 재감지 버튼으로 복구한다. 기각: ①캐시 미스 시 백그라운드 재감지 자동 예약 — 매번 실패하는 PDF는
상세에 들어갈 때마다 212쪽 감지가 다시 돈다 ②동기 감지 유지 + B17 세마포어 — 누적은 막지만 212쪽은 여전히 30초
504. 504에 CORS 헤더가 없던 것(계약 #8은 지켜져 있음)은 B19 Phase 2 조사로 넣었고, API 전반 지연은 Phase 3에서
재측정만 한다(원인 추정 "폭주"를 먼저 검증).

**계획 대비 이탈 — F09 검증 계약 3건 폐기.** Phase 1 구현 뒤 전체 스위트에서 F09-16이 `DID NOT RAISE`로
실패했다. 조회 경로 감지가 실패해도 알림이 없다는 회귀였는데 그 경로가 사라졌다. 같은 전제의 F09-06·07은
**통과했지만 공짜 녹색**이었다 — 캐시를 지워 감지를 강제하던 테스트가 이제 감지 없이 "알림 0건"을 만족했다
(테스트 주석이 스스로 경계하던 바로 그 모양). 세 건을 **폐기**(사용자 결정)하고 F09 표에 `⛔ 폐기 → B19`로
남겼다. 재작성안은 B19-01·03과 겹쳐 기각했고, `pytest.raises`만 걷어내는 안은 단언 약화라 기각했다.
→ **기존 계약의 전제를 없애는 변경은 "빨간 테스트"만이 아니라 "공짜로 녹색이 된 테스트"도 같이 찾을 것.**
빨간 1건만 보고 고쳤으면 F09-06·07은 아무것도 검증하지 않는 채로 남았다.

테스트 함정: 감지 대역이 빈 목록을 돌려주면 **현재 코드에서도 썸네일이 "문항 없음" 404로 떨어져** B19-05가
구현 전부터 녹색이 된다. 대역은 해당 문항(page 0의 1·2번)을 돌려주게 했다.

미결 4건(계획서): FAILED 상세 안내 문구(지금은 "0문항"으로만 보임) · DONE인데 캐시 없는 job · extract-v2
Step 2의 캐시 미스 감지(B17 한도 밖) · CORS 조사 결과 수정 범위.

**Phase 2 — 504에서 CORS 헤더가 빠지는 곳은 앱 밖이다(구간 특정까지로 종결, 사용자 결정).** 앱(TestClient)과
실제 uvicorn을 로컬에서 타임아웃 1초로 504를 내면 둘 다 `access-control-allow-origin`이 붙는다 — 계약 #8은 동작한다.
dev에서 인증된 요청으로 재현하자 uvicorn 로그엔 `504`가 찍혔는데 받은 응답엔 헤더가 없었다. 같은 경로의 401·200에는
있다. → **uvicorn 뒤(cloudflared 또는 Cloudflare 엣지)에서 5xx 응답의 헤더가 사라진다.** Cloudflare가 에러 페이지로
통째 바꿨는지는 확인 못 했다 — 두 번째 요청이 200이었다. 첫 요청이 504로 끊긴 뒤에도 **서버 안 감지는 끝까지 돌아**
캐시를 쓰고 FAILED를 DONE(820문항)으로 덮었기 때문이다. B19가 없애는 버그(계약 #34)가 dev에서 그대로 재현된 셈이고,
그 탓에 **Phase 3·B17 Phase 4의 "FAILED `내신마스터` 재감지" 확인은 그 job으로 더는 못 한다**(캐시 없는 FAILED job이
따로 필요). 수정은 하지 않는다 — 원인이 앱 밖이고, Phase 1로 30초 조회 경로가 사라졌다. 계약 #8에 한계만 적었다.

Phase 1·2를 PR #22로 main 머지(`46c464e`). dev 배포는 아직 — Phase 3는 배포 후, 캐시 없는 FAILED job을 마련하는 방법부터 정해야 한다.

**Phase 3 dev 확인(`f93e525`)** — 캐시 없는 FAILED job은 **B17이 FAILED를 만드는 실제 경로를 재현**해서 만들었다: 212쪽
`내신마스터`를 새로 올리고 분석 중에 ECS 태스크를 내려, 새 태스크 기동 시 FAILED + 실패 알림(`c0e2a5b1…`). 상세 진입은
즉시 200·0문항, 재감지는 DONE 820문항(사용자 확인·로그). `/api/stats`는 0.87~0.98s로 09-28의 9.06s 대비 약 1/10 —
"API 전반 지연은 폭주한 조회 경로 감지 탓" 추정을 뒷받침한다(`/api/jobs`·`/api/notifications`는 인증이 필요해 미측정).
B17 Phase 4의 FAILED·알림·재감지 항목도 이걸로 닫혔고 연속 업로드 6+만 남았다.
함정 둘: ①`aws ecs stop-task`는 Claude Code 자동 모드 분류기가 막는다(워크로드 간섭) — 사용자가 `!`로 직접 실행.
②태스크를 내린 뒤 서비스가 **desired 0**이 돼 있어 새 태스크가 안 떴다(원인 미확인 — 정지 방법 차이로 추정) —
기동 시 FAILED 전환은 새 태스크가 떠야 일어나므로 `update-service --desired-count 1`로 다시 올렸다.
실측: 같은 파일의 최초 감지는 **50초**(12:48:33 → 12:49:23), prewarm 포함 1분 29초. B17 이전 실측 "1분 40초+"보다 짧다.

사용자 육안 확인 중 UX 항목 4건이 나와 `docs/TODO.md` §8로 올렸다(뱃지 "대기 중" vs 현황판 "분석 중" 불일치 · 현황판/뱃지
색상 일치 · 알림 이름은 문제집 이름 우선 · 문제집 이름 옆 파일명 병기).

**B19 종결**(사용자 결정) — Phase 3의 `/api/jobs`·`/api/notifications` 재측정은 인증이 필요해 못 했고 **측정 없이 닫았다**
(TODO §7 "API 전반이 느림"에 남김). 미결 3건(FAILED 안내 문구 · DONE인데 캐시 없는 job · extract-v2 캐시 미스 감지)은
작업 단계 밖이라 완료를 막지 않아 TODO §9로 넘겼다.

### REQ-B17 Phase 4 · REQ-B18 Phase 2 dev 확인 — 둘 다 완료

dev `f93e525`에서 업로드 3건(내신마스터 212쪽 포함)과 재감지 6건(132~212쪽 4건 포함)을 연달아 걸었다. 초과분이 "대기 중"에서
"분석 중"으로 넘어가는 것을 사용자가 봤고(1건), 9건이 14:02~14:12 사이 전부 DONE, **태스크 정지 없음 · 메모리 최대 65%**.
09-28에 서버를 죽인 메모리는 이제 버틴다. 대신 **CPU가 10분 내내 100%**였고 212쪽 재감지 하나가 혼자 50초 → 5분이 됐다.
B18은 `0928 테스트2` 재감지 후 상세 화면을 사용자가 육안 확인. `0929 테스트2`(내신마스터)의 오탐 63건은 B18 설계대로다
— "유형 N" 제목 62건 + 기존 1건을 지우지 않고 **표시**하기로 한 결정(09-28, 오탐 숨김은 범위 제외).

**분석 중 API 지연 — 원인 추정(미검증)**: 분석은 API와 **같은 프로세스의 스레드**에서 돈다. 감지(pdfplumber)는 순수
파이썬 CPU 작업이라 GIL과 0.5 vCPU를 같이 잡아, 분석이 몰리는 동안 API 응답이 밀리는 것으로 보인다. 분석이 끝난
14:12 직후 `/api/stats`는 0.97~1.08s였다. TODO §7 "API 전반이 느림"에 적었다.

### REQ-B20 — HWP 출력 PDF가 전부 오탐: 보이지 않는 0.1pt 번호 + B18 위치 병합 (계획서 + Phase 1)

dev `테스트02`(`2026 P-Math 미적분1 Red_인쇄용 (HWP2005).pdf`, 198쪽)가 거의 모든 쪽에서 보이는 진짜 번호는 "오탐지 의심",
엉뚱한 위치(본문 한가운데·보기 오른쪽)는 문항이 됐다. 같은 PDF를 B18 이전(`6862b75`)과 main으로 돌려 보니 경계 393→840, 오탐 8→378,
같은 (쪽,번호) 중복 1→249. **이 PDF에는 보이는 번호 옆에 0.1pt짜리 보이지 않는 번호 글자가 따로 있다**(HWP 출력 텍스트 층으로 추정).
정규식 경로는 `size <= 1.0`을 이미 버리는데 **adaptive 입력은 거르지 않아** 0.1pt `N.`이 빈틈없는 수열로 최고 점수 그룹이 되고,
B18 위치 병합이 둘 다 남긴 뒤 adaptive가 확인하지 않은 보이는 번호를 "정규식 전용"으로 오탐 표시했다. B18 이전엔 번호 병합이라
보이지 않는 쪽이 "번호 이미 있음"으로 버려져 **우연히 정답**이었다. B18 실측 무대(기출 4종)엔 이런 글자가 거의 없어 안 보였다.
→ **감지 변경 실측 세트에 HWP 출력 PDF를 넣을 것.**

같은 조사에서 **식별자 충돌**도 드러났다. B18이 한 쪽에 같은 번호 두 개를 허용하자 ADR-0002 복합키 `{job_id}:{쪽}:{번호}`와
썸네일 캐시 `q_{쪽}_{번호}`가 겹쳐, 오탐 "문항 27"과 진짜 "문항 27"이 같은 이미지로 보였다(스크린샷). 저장 선택·생성 요청도
`question_num`으로 찾는다. 결정(사용자): 보이지 않는 글자는 **adaptive도 1pt 이하 제외**(기각: B18 번호 병합 복귀 — 심화대비 누락
재발) · 식별자는 **모든 ID에 위치 포함**(기각: 겹칠 때만 접미사 · B20 제외) · 원문 이름 표시는 TODO로 분리.
같은 날 사용자 질문 "`0929 테스트2`(내신마스터) 4쪽·24쪽 1번이 왜 둘인가"의 답도 이것이다 — `유형`(8pt) 아래 16pt `01` 제목을 번호 1로
읽어 진짜 `1.`과 번호가 같아졌고, 위치가 달라 둘 다 남는다(오탐 63 중 같은 쪽 같은 번호 5건).

**Phase 1** — adaptive의 단어 입력 두 곳(수열 탐색·여백 계산)에 같은 필터. 여백 계산 쪽 주석이 "`_run_adaptive_detection`과
동일 기준"이라 한쪽만 고치면 단 분할점이 두 곳에서 갈린다. 실측: 테스트02 840→378·오탐 378→106·중복 249→1, 28쪽 `27.`~`30.` 정상,
**기출 4종 경계 완전 동일**(계약 #11 누락 0).

**계획 대비 이탈 — Phase 1 완료 기준에서 "11쪽 `02`"를 Phase 2로 옮겼다.** 남은 오탐 106건은 전부 20pt `0N`(기본문제)인데
원인이 보이지 않는 글자가 아니라 **두 번째 보이는 번호 형식**이다 — adaptive는 최고 점수 한 그룹(13pt `N.` 272건)만 인정해서
두 번째 형식 전체가 B18의 "정규식 전용 = 오탐"에 걸린다. 그런데 내신마스터 "유형 01·02…"(B18이 잡으려던 62건)도 같은 "일관된
두 번째 그룹" 모양이라 규칙만 보고는 부작용을 모른다 → **실측 후 결정**(사용자 결정, 기각: 감수 · B18 오탐 규칙 중단).
B18 이전 대비 정상 경계 15개가 아예 사라진 것도 원인 미확인으로 Phase 2에서 본다.

테스트 함정 둘:
- **합성 PDF는 보이는 번호 형식이 섞여야 재현된다** — 한 형식이면 보이는 쪽 수열이 이겨 버그가 안 난다(`01` 20pt / `4.` 13pt로 재현).
- **adaptive 단독 결과는 정밀화 전이라 `col_x0`가 번호 x0가 아니라 단 왼쪽 경계다** — B20-03이 `col_x0 + 10 = 번호 x0`로 비교해
  수정 전 코드에서도 녹색이었다(/testrun (a), `y_top` 비교로 수정). 수정 전 코드(`git archive`)로 케이스를 돌려 **빨강을 확인**하는
  단계가 가짜 녹색을 잡았다 — 구현 전부터 녹색인 케이스는 의심할 것.

**Phase 2 — 두 번째 번호 형식: 실측 → 높이 규칙 200pt.** 테스트02에 남은 오탐 106건(정규식 전용)을 계측해 보니 세 부류로 깨끗이
갈렸다 — 기본문제 20pt 82건(조임 후 높이 440~648pt), 목차 "Chapter 0N …" 16pt 8건(29~65), 단원 표지 "Chapter 01"·"MEMO" 26pt 16건(68~98).
내신마스터 "유형" 제목 63건은 58~66, 심화대비 목차 4건은 26~36. 후보 둘을 5종에 돌렸다:
- **높이 규칙**(정규식 전용이라도 높이 ≥ 기준이면 정상) — 테스트02 106→24(남은 건 전부 목차·표지), 내신마스터 63·심화대비 4 유지 → **채택**
- **연속 수열 규칙**(같은 형식 +1 연속 3개 이상이면 정상) — 내신마스터 63→0·심화대비 4→0, 테스트02 목차 8건도 정상 → B18 되돌림, 기각
기준값은 150·200·300 결과가 같아(간격 98~440) 양쪽 여유를 맞춰 **200pt**. **높이는 조임 후(최종) 값으로 잰다** — 조임 전(다음 번호까지
거리)으로 재면 단원 표지 쪽에 다음 번호가 없어 81~413pt가 되고 표지가 진짜 문항으로 풀린다(사용자 결정 전 실측으로 확인).
감수: 보기 없는 아주 짧은 진짜 문항은 오탐에 남을 수 있다(5종 미발생). 규칙은 오탐 표시만 바꿔 5종 모두 경계 좌표 불변.

**사라진 정상 경계 15개의 정체** — 테스트02 **"유제" 문항**이었다. 보이는 라벨은 `유제`(10pt)뿐이고 번호는 0.1pt `31.`~`36.`에만 있다.
B18 이전엔 그 숨은 번호가 다른 번호와 안 겹쳐 **우연히** 살았고(위치도 라벨보다 한 줄 아래), 같은 구조의 11쪽 유제는 B18 이전에도 못 잡았다.
회귀가 아니라 원래 없던 기능이라 B20 범위 밖 → TODO(사용자 결정).

테스트 판정 보강: B20-03의 교훈으로 Phase 2 두 케이스를 **틀린 구현 두 개**에 돌렸다 — 높이 규칙 없는 Phase 1 코드에선 B20-04가,
정규식 전용을 전부 푸는 과잉 구현(기준 0)에선 B20-05가 빨강. 한 방향만 막는 케이스 둘이 서로를 보완한다.

Phase 1·2를 PR #23으로 main 머지(`0d8c5d4`, dev 미배포).

**Phase 3 설계 — 식별자에 순번 k (ADR-0006, ADR-0002 대체).** 조사하니 문항을 실제로 찾는 열쇠는 `question_id`가 아니라 `(쪽, 번호)`였다 —
PDF 생성은 "그 쪽 그 번호의 **첫** 경계", 삭제·벌크 삭제는 **같은 번호 전부**를 지운다. 그래서 공존 쌍(내신마스터 "유형 01" ↔ "1.")에서
진짜 1번을 담아도 위의 제목이 크롭될 수 있었다(추정). 미결 다섯을 하나씩 닫았다(모두 사용자 결정):
- 위치 = **같은 쪽·번호 안 순번 k, 항상**(기각: y 좌표 — 감지 코드가 바뀌어 y가 몇 pt만 움직여도 ID가 바뀜 · 쪽 안 전체 순번 — 위에 경계 하나
  늘면 아래 전부 밀림). k 순서는 (단, y)
- 옛 저장 문제집은 **읽을 때 k=0**(마이그레이션 기각) — k=0이 지금 동작("첫 경계")과 같아 결과가 안 바뀐다. 정규화는 **백엔드 문제집 상세
  조회**에서(프론트 복원 코드 불변)
- API는 **쿼리 `?k=`(기본 0)**, 벌크 삭제는 `(번호, k)` 쌍 + 옛 `question_nums`=k0. k 없는 삭제는 **k=0 하나만** — 지금은 같은 번호 전부를
  지우지만 규칙에 예외를 두지 않았다
- 썸네일 키는 k=0 **옛 이름 그대로**, k≥1만 `_{k}` — 재감지 prewarm이 덮어써서 정리 불필요
- PDF 생성은 선택의 `question_id`에서 k를 **파싱**(스키마·프론트 생성 코드 불변)

구현 함정 둘: **벌크 삭제는 지우기 전 원본에서 대상을 모두 지목한다** — 하나씩 지우면 같은 번호의 뒤 k가 밀려 엉뚱한 경계가 지워진다.
**prewarm도 k별 키로 저장해야** 공존 쌍이 한 썸네일 파일을 덮어쓰지 않는다(28쪽 "같은 이미지" 증상의 저장 쪽 원인).
프론트는 `question_id`를 만들거나 쪼개지 않고 받은 값을 키로만 쓴다(소스 확인) — **백엔드만 먼저 배포해도 목록·선택은 안 깨진다**.
k를 안 싣는 제목 수정·삭제는 그동안 k=0에만 적용된다(Phase 4).
테스트: 구현 전부터 녹색인 회귀 방지 3건(B20-11·18·20)은 막으려는 틀린 구현(k=0에도 접미사 · 옛 ID 번호를 k로 · 모든 ID에 `:0`)을
주입해 각각 빨강이 되는 것을 확인했다.

**계획 대비 이탈 — Phase 3 완료 체크를 한 번 되돌렸다.** Phase 4 `/testgen` 중, 완료 기준 "`question_id`…**와 k를 갖고**"인데
목록 응답에 `k` **필드가 없다**는 걸 발견했다(k는 ID·썸네일 URL 문자열 안에만). B20-06이 ID만 봐서 못 잡았다 — 완료 기준의 **명사 하나하나**가
케이스로 옮겨졌는지 대조해야 했다. 프론트가 ID를 쪼개 k를 읽는 안(기각 — "프론트는 ID를 만들거나 쪼개지 않는다" 구조를 깬다) 대신
**응답에 `k` 필드**(사용자 결정, B20-22)로 보완했다.

**Phase 4 — 프론트 k 전달.** 호출부는 분석 패널 하나(제목 수정·벌크 삭제)였다. 함수 형태(사용자 결정): `updateQuestionTitle`·`deleteQuestion`은
끝 인자 `k=0`(기존 호출 호환)을 `?k=`로, `bulkDeleteQuestions`는 자동 문항을 `questions:[{num,k}]`로(옛 `question_nums` 미사용). 이 패널은
렌더 테스트가 있어 **실제 더블클릭 수정·체크 후 삭제**로 검증했다. `deleteQuestion`은 현재 호출부가 없다(형태만 맞춤).

Phase 3·4를 PR #24로 main 머지(`ee27f2c`). dev는 내려 둔 채 `f93e525` — Phase 5는 백엔드·프론트 **둘 다** 배포한 뒤(이번엔 프론트도 바뀜)
테스트02 재감지(오탐 24·11쪽 `02` 정상) · 내신마스터 재감지(4쪽 "유형 01" ↔ "1." 썸네일 분리·한쪽만 삭제) · 옛 문제집 편집 복원을 본다.

## 2026-09-28

### REQ-B17·B18 dev 배포 (`c17f884`) — 확인 중 FAILED 파일 상세 504 발견, 계약 #33 승격

B18 PR #21을 main에 머지(`c17f884`, B17 기록 docs `66b324c`도 함께 원격 반영)하고 백엔드(이미지 태그 `c17f884`, rev 4 그대로)·
프론트(Workers)를 **함께** 배포했다(B17 `QUEUED`를 프론트가 알아야 해서). 기동 로그에 `중단된 분석을 FAILED 로 전환 |
job_id=5065d74a…`가 찍혔고 사용자가 실패 표시·알림을 확인했다. 세션 끝에 dev 백엔드는 **desired 0**으로 내렸다.

**막힌 것 — FAILED 파일 상세가 "Failed to fetch"라 재감지 확인을 못 했다.** 백엔드 로그상 `/questions`·`/pages/0/questions`가
30초 504(`TimeoutMiddleware`). FAILED job은 경계 캐시가 없어 조회가 **요청 안 동기 감지**로 폴백하는데, 212쪽은 0.5 vCPU에서
30초를 넘고 타임아웃은 응답만 끊어 **감지 스레드는 계속 돈다**(새로고침마다 하나씩 누적). B17이 "요청 경로 동기 감지"를
동시성 제한 범위에서 **제외**했던 바로 그 자리다 — 제외 당시엔 캐시 미스가 드문 경로였지만, B17이 FAILED 전환을 만들면서
**캐시 없는 job이 화면에 정상적으로 나타나는 경로**가 생겼다. 같은 시각 API 전반 지연(stats 9s·jobs 5.6s)도 이 폭주와
겹쳐 동일 원인으로 추정(미검증). 504에 CORS 헤더가 없던 건 계약 #8이 지켜져 있는데도 난 것이라 원인 미확인.
둘 다 `docs/TODO.md` §7로 올렸다(다음 번호 B19로 `/workplan` 예정).

B18의 "5-b가 `is_false_positive`를 덮어쓴다"·"오탐 경계도 자르기 참여"는 **계약 #33**으로 CLAUDE.md에 승격(사용자 승인).


### REQ-B18 — 목차가 문항으로 잡히고 진짜 1~4번이 사라짐: 번호로 합치던 병합이 원인 (계획서 + Phase 1)

dev `0928 테스트2`(`심화대비.pdf`)에서 1쪽 표지 목차(`1 삼각비`…`4 통계`)가 "4문항"으로 잡혔고, 사용자의 다음 질문
"2페이지는 왜 아무것도 안 잡히나"가 **같은 버그의 뒷면**이었다. 총 120개로 개수가 맞아 누락이 안 보였다.
원인은 두 결함의 합이다 — ① 폰트 임계값이 "13pt 이상 최빈값"을 무조건 우선해 목차 16pt 4개가 본문 12pt 120개를
이기고(임계값 14.72), 정규식 경로는 목차만 잡는다 ② Step 4가 정규식·adaptive 결과를 **번호로** 합쳐, adaptive가 제대로
찾은 2쪽 1~4가 "번호 이미 있음"으로 버려진다. 기존 오탐 판정은 "경계 = 페이지 전체"만 봐서 한 줄짜리 목차를 통과시킨다.

**결정 — 위치(쪽·단·y) 기준 병합 + adaptive가 확인하지 않은 정규식 경계는 오탐 "표시"**(사용자 결정). 판정이 경험칙이라
다른 PDF에서 진짜 문항이 걸릴 수 있는데, **지우면 이번 2쪽과 같은 보이지 않는 누락**이 되고 표시하면 기존 배지·현황판
오탐 타일·일괄 삭제로 드러나고 복구된다. 폰트 임계값 보정은 증상 해결에 불필요하고 다른 PDF 정규식 결과 전체를
흔들어 **제외**. 오탐 숨김(프론트)도 제외 — 1쪽 배지 "4문항"·내신마스터 62건 잡음은 감수.

**계획 대비 이탈 — 내신마스터 오탐은 58이 아니라 62건.** 분석 때 "정규식 전용"을 (쪽·번호)로 셌는데, 제목 번호가 같은 쪽
문항 번호와 겹친 4건이 빠졌다. 실제 구현은 위치로 판정하므로 62가 맞고, 63건(기존 1 포함) 전부 원문이 "유형"으로
시작하는 제목임을 확인했다. 좌표는 하나도 안 바뀌고 오탐 표시만 바뀌었다. 계획서 수치를 정정했다.

함정:
- **`_apply_precision_improvements`가 `is_false_positive`를 대입(OR 아님)으로 덮어쓴다** — 오탐 표시는 5-b 뒤에 해야
  남는다. Step 4에서 표시하면 에러 없이 사라진다.
- **오탐 표시한 경계도 `_fill_y_bottom` 자르기에 계속 참여시켜야 한다** — 빼면 "유형 N" 제목이 앞 문항 크롭에 딸려 들어온다
  (변형 실측: 앞 문항 하단 318.9 → 390.5).
- **합성 PDF 본문에 숫자를 넣지 않는다** — `(1) 1 (2) 2` 같은 줄이 수열을 이뤄 adaptive가 엉뚱한 그룹을 골랐다.
- **`유형`(korea 폰트)과 `2`(helv)는 같은 줄인데 top이 0.1pt 다르다** — 경계는 번호 단어에 붙는다. B18-04가 `유형`
  기준으로 재서 올바른 구현에서 실패했다(/testrun (a)).

### REQ-B17 — 분석 중 백엔드 OOM: 원인은 동시 실행이 아니라 pdfplumber 페이지 누수 (계획서 + Phase 1)

dev에서 PDF 여러 개를 연달아 "업로드 후 분석"하던 중 업로드가 `Failed to fetch`로 실패하기 시작했다.
콘솔엔 CORS 에러가 찍혔지만 **CORS는 부수 증상**이다 — 응답이 Cloudflare 530(터널 뒤 오리진 도달 불가)이었고,
530 응답엔 CORS 헤더가 없어서 따라 나왔다. ECS stopped task를 보니 16:09:55 백엔드가 `OutOfMemoryError`
(exit 137, 0.5 vCPU/1GB)로 죽고 새 태스크가 뜨는 ~1분 동안 전부 530이었다.
→ **"CORS 에러 + 530"을 보면 CORS 설정이 아니라 오리진 생존부터 볼 것.**

처음엔 동시 실행(212쪽 `내신마스터` 감지 + 다른 파일 prewarm 12스레드)이 원인으로 보였지만, 로컬에서 단계별로
프로세스를 분리해 최대 RSS를 재 보니 **`내신마스터` 감지 하나가 단독으로 1,032MB**였다(다른 32쪽 3종은 ~155MB,
prewarm은 +50MB). 메모리가 쪽수에 비례했다 — pdfplumber가 읽은 페이지의 파싱 캐시를 쥐고 있는데 감지 루프가
페이지를 닫지 않았다. 측정 스크립트에서 "다음 페이지로 넘어갈 때 이전 페이지 close"만 씌우니 **154MB, 결과 동일**.
동시 실행은 방아쇠였고 이 파일은 혼자 올려도 죽을 수 있었다.

**번호 충돌**: 같은 시각 다른 세션(`pdf-extractor-b9`)이 문항 끝 그림 크롭을 B16으로 작업 중이었고, 파일 수정 시각
(16:20:14)이 이 계획서(16:21:33)보다 앞서 **그림 크롭이 B16, OOM이 B17**(사용자 결정). 두 작업이 `question_parser`의
같은 페이지 루프를 고치므로 B16 main 머지(PR #19) 후 그 위에서 진행했다.

**Phase 1 — 누수 수정 완료.** 함정 둘:
- **pdfplumber 0.11.4의 `PDF.close()`는 `with` 끝에서 모든 페이지를 닫는다** — "닫힌 페이지 집합"을 단언하는
  테스트는 수정 전 코드도 통과하는 가짜가 된다. 누수는 **루프 동안** 쌓이는 것이라 "다음 페이지 단어를 읽기 전에
  이전 페이지가 닫혔다"(호출 순서)로 검증했다. 결과 동일성은 기준값 파일 대신 `Page.close`를 no-op으로 바꾼
  실행과 비교했다(감지 로직이 바뀌어도 안 깨지게).
- **B16의 그림 목록이 pdfplumber 객체 dict를 통째로 담았다** — 이미지 항목은 원본 `stream` 참조까지 들고 있어
  페이지를 닫아도 리스트가 쪽수만큼 붙잡는다. 쓰는 값인 `x0·x1·top·bottom`만 복사하게 했다(B16 세션 확인).

수정 전(main `20f5f21`을 git archive로 꺼내 같은 조건) 대비 수동 실측 — 기출 4종 모두 **경계 전체(반올림 없이)
동일**, 최대 RSS `내신마스터` 1,033 → **170MB**(기준 ≤200), 32쪽 3종 ~140 → ~94MB, 시간 동일(15s).
운영 환경 사이징 기준(파일당 ~120MB, 동시 N개 산식, CPU·비용표, 다중 태스크 함정)은 계획서 § 운영 환경 참고에 모았다.

**부수 피해 — 아직 남아 있음**: 죽은 태스크가 돌리던 `내신마스터` job이 dev R2에 `boundaries_status=PROCESSING`으로
멈춰 있다. Phase 2의 "시작 시 FAILED" 배포 후 재감지로 복구할 예정.

**Phase 2 결정·구현(같은 날)** — 미결 두 건을 닫았다. ①시작 시 FAILED 전환 때 **실패 알림을 보낸다**.
②대기는 **새 상태 `QUEUED`** — 이미 있는 `PENDING`("감지 대기")을 재사용하면 변경은 작지만, `PENDING`은
"업로드 notify 전"에도 쓰여(재시작돼도 notify가 오면 진행) **재시작 시 인메모리 대기열에 있던 작업과 구분할 수 없다**
→ FAILED로 못 돌려 영원히 남는다. 그래서 상태를 하나 늘렸다. 현황판엔 "대기 중" 타일을 따로 둔다(사용자 선택,
기존 "분석중 파일수"는 `PROCESSING`만). 필드명 `queued_count`는 `/testgen`에서 승인.
구현: 인프로세스 `BoundedSemaphore(5)`를 최초 감지·재감지가 공유하고 **감지 + prewarm 전체**를 감싼다(감지만 감싸면
prewarm 12스레드가 한도 밖에서 겹친다). 서버 시작(lifespan)에서 `QUEUED`·`PROCESSING` → `FAILED` + 감지 실패 알림.
**조회 경로의 `PROCESSING` 가드는 `QUEUED`로 넓히지 않았다** — `QUEUED`는 상세 진입을 허용하고 기존 문항을
보여 주기로 했으니 캐시를 돌려주는 게 맞다. 남는 틈: 캐시가 없는 최초 업로드 job이 `QUEUED`인 채로 상세에 들어가면
조회 경로가 한도 밖에서 동기 감지를 돈다(지금 `PENDING`과 같은 틈, 계획서 범위 제외).
테스트는 감지 대역을 이벤트로 멈춰 두고 스레드 6개로 흘려 관찰한다 — 부정 관찰("6번째가 안 들어갔다")은 0.3초
유예 뒤에 보고, `/testrun`에서 3회 연속 돌려 흔들림 없음을 확인했다. 세마포어가 모듈 전역이라 **테스트가 슬롯을
풀지 않으면 다음 테스트가 멈춘다** — 모든 케이스가 끝에서 풀고 join한다.
**같은 워킹 트리를 다른 세션(B18)이 동시에 쓰고 있다** — 그쪽 미추적 테스트(`test_parser_regex_only_fp.py`,
구현 전이라 빨강)가 이 브랜치 위에 올라와 있어 전체 스위트를 그 파일을 빼고 판정했다. 그쪽이 이 브랜치에서
커밋하면 B17 브랜치에 섞인다 — 브랜치 분리 또는 `git worktree` 필요.

**Phase 3(프론트) 완료** — `QUEUED`를 재감지 차단에 넣고(진입은 `PENDING`처럼 허용), 목록 배지·편집 화면 파일 칩에
"대기 중", 현황판에 "대기 중 파일수" 타일(클릭 시 대기 파일 아코디언)을 "분석중 파일수" 옆에 뒀다.
타일 제목·색은 계획서가 정하지 않아 구현이 골랐고 테스트는 testid·값·"대기 중" 문구만 본다.
**이제 백엔드·프론트가 모두 `QUEUED`를 알아 배포 가능** — Phase 2만 따로 올리면 프론트가 `QUEUED` 배지를 비워
두고 재감지 버튼을 열어 두는 상태였다. Phase 4는 dev에서 `내신마스터` 포함 연속 업로드(6건 이상), 멈춰 있는
`내신마스터` job의 FAILED·실패 알림·재감지 복구를 본다.
→ 사용자 결정으로 **Phase 4는 B18과 함께 dev에서 확인**하기로 하고 먼저 PR #20으로 main 머지(`6862b75`).

### REQ-B16 — 그림으로 끝나는 문항은 그림이 통째로 잘렸다 (계획서 + Phase 1)

dev 육안 제보("3페이지 5번문항의 그래프 이미지가 잘렸다"). 원인은 하단 조임(`_calc_tight_y_bottom`,
REQ-23 → B13)이 **단어만** 본다는 것 — 이 PDF의 그림은 임베디드 이미지라 단어 목록에 없다.
같은 페이지 4·7번은 **그림 아래 선지 텍스트가 있어서 우연히 살았다**. 그래서 "가끔 잘린다"로 보이지만
실제 규칙은 "그림으로 끝나는 문항은 항상 잘린다"이고, 기출 4종에서 **92문항**이 해당됐다.

pdfplumber 1패스에서 `images·rects·curves·lines`를 같이 모아 **y_bottom 계산에만** 넣었다.
실측 중 **장식이 딸려 오는 함정 두 개**가 나왔고 둘 다 에러 없이 크롭에 빈 공간만 붙는 모양이다:
- **단 구분선·꼬리말 브래킷** — p31 34번이 y 766까지 늘었다. → 머리말/꼬리말 띠(기존 11%/91% 상수)에
  걸치거나 높이가 페이지 절반 초과인 것은 수집 단계에서 제외
- **옆 단 박스 테두리** — 거친 컬럼 분할점이 테두리(x=288)보다 **왼쪽**에 있어 오른쪽 단 문항에 잡혔다
  (내신마스터 p107 45번, **빈 공간 243pt**). → 좌측 한계는 정밀화된 `col_x0`(번호 x0 − 10pt), 우측은
  정밀화 전 경계(텍스트보다 넓은 그림을 놓치지 않게). 첫 실측을 t4 한 개로만 했으면 못 봤다 —
  **B13 Phase 2의 4종 실측 무대(`importlib`로 main판·작업판 나란히 로드)를 그대로 재사용한 게 결정적**이었다

**실측(4종 1,141문항, main 대비)**: 문항 수·오탐 수 불변, 변경은 y_bottom 증가 92건뿐(축소·다른 변 0).
증가 상위 12건 + 무작위 7건 렌더 육안 — 전부 "잘렸던 그림이 온전해짐".
수집 단계 필터는 실제 PDF가 있어야 해서 케이스(B16-01~06)가 못 덮는다 — 실측으로만 확인된 상태다.

남은 것: **텍스트보다 오른쪽으로 넓은 그림의 우측 잘림**은 제외(4종에서 미발생). 기존 job은 재감지해야 반영.
번호: 같은 시각 다른 세션의 OOM 계획서와 B16이 겹쳐 **먼저 시작한 이 작업이 B16, OOM은 B17**(사용자 결정).

### dev 재배포 — 백엔드가 두 달 가까이 "배포돼도 안 바뀔 수 있는" 상태였다

REQ-27·B14를 dev에 처음 올리는 날이었다. 순서대로 걸린 것 넷.

**① `backend-build.sh`가 경로 때문에 빌드 실패** — 스크립트가 `scripts/deploy/`로 옮겨졌는데
`cd ../backend`가 남아 있었고, 그마저 **실행 위치 기준**이라 어디서 돌리든 틀렸다. `set -e`가 없어
실패한 `cd` 뒤에도 `docker login`·`buildx`가 계속 돌아 "Dockerfile 없음"으로 끝났다 — 원인이 한 줄
위에 있는데 에러는 끝에서 난다. 스크립트 위치 기준 `cd` + `set -euo pipefail`로 고쳤다(`7c03bf2`).
같은 커밋에서 **커밋 해시 버전 태그**(`[접두사-]해시[-dirty]`)와 **`--provenance=false`**를 넣었다.
buildx 기본값은 푸시 1회에 ECR 행 3개(Index·이미지·0MB attestation)를 만든다 — 증명서를 읽는
곳(서명 정책·감사)이 없고, 어느 커밋인지는 버전 태그가 대신한다. 무엇보다 **태그 없는 행 중 일부가
살아 있는 이미지의 부속**이라 나중에 "untagged 삭제" lifecycle 규칙을 걸면 현재 이미지가 깨진다.

**② 새 `latest`를 올렸는데 ECS가 옛 이미지를 띄웠다** — 원인은 이미지가 아니라 **태스크 정의
리비전**이었다. rev 3은 2026-08-18 P04 Phase 0 프로브용으로 이미지를 `:p04-probe`에 고정한 잔재였고,
그날 서비스를 rev 2로 되돌리면서 rev 3을 deregister하지 않았다. 8월 배포는 전부 CLI
`--force-new-deployment`(태스크 정의 미지정 → 기존 rev 2 유지)라 문제가 없었는데, 이번엔 **콘솔**로
배포했고 콘솔은 **최신 활성 리비전(rev 3)을 기본으로 채운다**(CloudTrail `UpdateService`
`taskDefinition: …:3`, 브라우저 UA로 확인). 실행 중 태스크 digest가 `p04-probe`와 같았다.
→ **실험용 리비전을 만들면 끝나고 반드시 deregister할 것.** 최신 리비전이 곧 콘솔 기본값이다.

**③ JWT 서명 키가 코드 기본값이었다** — 태스크 정의 `secrets`에 `JWT_SECRET_KEY`가 없어
`dev-insecure-secret-change-me`(공개 레포에 있는 값)로 서명하고 있었다. 누구나 토큰을 위조할 수 있는
상태로 REQ-27을 올릴 뻔했다. Secrets Manager `pdf-extractor/dev`에 무작위 키를 추가하고, rev 2를
바탕으로 **rev 4**(`:latest` + `JWT_SECRET_KEY`)를 등록·배포, rev 3은 deregister했다 — ②도 같이 닫힌다.
실행 digest `6505e71d…` = `7c03bf2`. 위조 토큰 401도 봤지만, 위조 페이로드의 사용자가 없어서 나는
401일 수도 있어 **서명 검증의 증거로는 약하다** — 실제 증거는 정상 로그인이 된다는 것뿐이다.

**④ admin 계정이 없었다** — REQ-27은 가입 시 항상 `user`이고 admin을 만드는 경로가 없다(테스트는
`users/{id}.json`을 직접 패치). `scripts/ops/promote-admin.sh`(승격 + `backfill_owner_id`)를 만들어
dev R2에 실행했다 — 실행 전 `.env.dev`의 R2 대상이 Secrets Manager와 같은지 값 노출 없이 대조했다.
백필 jobs 21 · workbooks 15 · covers 4 · footnotes/watermarks/templates 각 1, 재실행 시 전부 0(멱등).
사용자가 기존 데이터 노출을 확인했다. 프론트도 이날 사용자가 재배포했다(로그인 화면 확인) — 밀려 있던
C09~F13·REQ-27 프론트 변경이 한 번에 반영됐다.

⚠️ dev 백엔드는 현재 **desired 1**(rev 4)로 떠 있다.

### REQ-B15 — 이미지가 전부 401 (계획서 + Phase 1)

admin 로그인 후 목록·이력 **데이터는 보이는데 이미지만** 401이었다. `<img>`는 `Authorization` 헤더를
못 붙이는데 REQ-27 Phase 2가 썸네일 3종·표지·워터마크 이미지에도 헤더 전용 의존성을 걸었다(로컬 모드
`/api/files`도 같음). 테스트가 못 잡은 이유는 기존 케이스가 전부 헤더를 붙이는 `authed_client`라서다 —
**계약 #31(raw fetch)과 같은 계열이 브라우저 태그로 번진 것**이다.

**방식 — 쿠키 병행**: login·refresh가 access token을 HttpOnly 쿠키로도 심고, 이미지·파일 GET 6개만
헤더가 없을 때 쿠키를 본다. 기각: `?token=`(URL로 토큰 노출·1시간마다 URL이 바뀌어 캐시 파괴),
fetch→blob(`<img>` 8곳+ 수정·캐시 상실), 이미지 인증 해제(공개 노출). 쿠키를 **GET 6개에만** 받는 건
CSRF 때문이다 — 전체에 열면 쿠키만으로 POST/DELETE가 통하고, 같은 사이트의 다른 서브도메인발 요청은
SameSite로도 못 막는다. 속성은 `Lax`·`Secure`(로컬은 `AUTH_COOKIE_SECURE=false`)·`Max-Age=3600`·`Path=/api`.
"1시간 방치 후 첫 화면" 미결은 코드로 닫았다 — `<img>` URL을 만드는 3곳이 전부 `apiFetch`를 거친 응답으로
URL을 만들어, 만료 시 401 → refresh(새 쿠키) → 재시도 후에 이미지가 그려진다. 대신 **B15 배포 전에
로그인해 둔 세션**은 헤더로 API가 통하니 refresh가 안 일어나 최대 1시간 이미지만 401이다 — 재로그인으로
해결하기로 했다(코드 없음).

Phase 1(백엔드) 완료 — 케이스 16/16(parametrize 25), 전체 221/221. 테스트는 **헤더 없이 쿠키만 가진
`https://testserver` 클라이언트**로 `<img>` 조건을 재현한다(`Secure` 쿠키는 http 요청에 안 실린다 —
http로 띄우면 올바른 구현도 401). `AUTH_COOKIE_SECURE`는 케이스가 없어 자동 검증 밖이다.

**ADR-0005 서술 정정**: 배경에 "프론트·백엔드가 다른 도메인이라 쿠키면 `SameSite=None; Secure`가
필요하다"고 돼 있지만, 두 호스트는 `yejicraft-cf.com`의 서브도메인 = **같은 사이트**라 `Lax`로 실린다.
ADR의 결정(서버 세션 쿠키 기각)은 그대로다 — B15는 무상태 JWT를 쿠키로도 운반할 뿐이다.

**Phase 2(프론트) 완료** — login·refresh fetch에 `credentials: 'include'`, `api/client.logout()` 신설,
`AuthContext.logout()`이 서버 로그아웃을 부른다. 케이스 6/6(B15-17~22), 프론트 전체 192/192.
`/testgen`에서 미결 두 건을 닫았다 — ①**서버 로그아웃이 실패해도 로컬은 항상 로그아웃**(기다리지 않고
실패를 삼킨다). 실패 시 로그아웃을 막으면 백엔드가 꺼져 있을 때(dev `desired 0` 운영) 로그아웃 자체가
안 된다. 남은 쿠키는 최대 1시간 뒤 만료되고 다음 로그인이 덮어쓴다. ②**로그아웃 요청은 전역 딤을 켜지
않는다**(raw fetch, 계약 #26) — 기다리지 않으니 딤을 켜면 화면 전환 뒤 딤만 번쩍이고, `apiFetch`를
태우면 401 시 refresh를 시도해 로그아웃 도중 토큰을 새로 받는 역설이 생긴다.
함정 하나: 기존 27-64·65가 `logout()`을 동기로 부르고 곧바로 로컬 상태를 보며, `api/client` mock의
`logout: vi.fn()`은 Promise가 아니라 `undefined`를 돌려준다. 그래서 서버 호출은 **즉시 부르되 반환값을
`Promise.resolve()`로 감싸야** 한다 — `.then()` 안으로 미뤘더니 "호출 시 부른다"(B15-21)가 한 틱 늦어
실패했고, `apiLogout().catch()`로 쓰면 mock에서 TypeError가 난다.

**Phase 3(dev 확인) 완료** — 브랜치 이미지(`93dc8f2`, digest `7acb9a42…`)로 ECS rev 4 재배포 + 프론트
재배포. 사용자가 재로그인 후 5개 화면(분석 목록·작업·편집·결과·템플릿) 이미지 표시와 **로그아웃 후
이미지 URL 401**을 확인했다. curl로는 로그아웃 응답의 쿠키 삭제(`Max-Age=0`, 심을 때와 같은
`Path=/api`·`Secure`·`SameSite=lax` — path가 다르면 삭제가 조용히 안 먹는다), 무인증 이미지 401,
CORS preflight `allow-credentials: true` + 정확한 origin을 봤다. 이번 배포는 사용자가 직접 돌렸다
(자동 권한 판정 일시 장애로 Claude 쪽 배포 명령이 실행되지 않았다). **REQ-B15 Phase 1~3 완료.** CLAUDE.md 계약 #31에
"브라우저가 URL을 직접 여는 곳은 헤더를 못 붙인다"를 승격하고 PR #18로 main 머지(`da8e1c1`), 브랜치 삭제.

## 2026-09-21

### REQ-B13 Phase 2 — 오탐 판정 영향 실측 완료 (미결 질문 해소, REQ-B13 완전 종결)

REQ-B14를 마친 뒤 TODO.md 4단계에 남아 있던 REQ-B13 Phase 2("오탐 판정 실측, 기출 PDF
필요")를 이어서 진행했다. `local_storage/uploads`에 로컬 개발용으로 남아 있던 실제
기출 PDF 1개(중3 BLUE 심화기출, 32p)를 먼저 찾아 측정했고, 사용자가 `~/temp/pdf-extractor/`에
있던 나머지 3개(내신마스터·심화대비·Red)를 추가로 알려줘 총 4종·문항 1,141개로 검증을
넓혔다.

**측정 방법**: `question_parser.py`가 `re`·`pdfplumber`·`fitz`에만 의존하고 앱의 다른
모듈을 임포트하지 않는다는 걸 이용해, Phase 1 커밋(`58cf729`) 직전 버전과 현재 버전을
`importlib`로 각각 독립 로드하고 같은 PDF에 `detect_question_boundaries()`를 양쪽 다
돌려 `is_false_positive` 개수를 직접 비교했다 — API·백그라운드 태스크를 거치지 않고
순수 함수 비교라 빠르고 결정적이었다.

**결과**: 3개 PDF는 오탐 0건 유지(완료 기준 그대로 충족). 1개 PDF(내신마스터, 820문항)에서
1건 증가 — page 106 "문항 11". `fitz`로 크롭 영역을 실제 렌더링해 원인을 확인했다: 이건
진짜 문항이 아니라 **"유형 11"이라는 검정 배지**를 파서가 문항 번호로 오인식한 것이었다
(진짜 문항은 바로 아래 "45."). 이 오인식 자체는 Phase 1 이전에도 있었다(변경 전·후 둘 다
"문항 11"로 감지됨) — 달라진 건 확장된 크롭이 배지의 검은 배경을 더 많이 포함해 색상
필터(`_apply_bg_color_filter`)에 걸렸다는 것뿐이다. **원래 틀렸던 감지가 이제야 정확히
"오탐지 의심"으로 표시된 것**이라 완료 기준의 취지(정상 문항이 억울하게 오탐 찍히는 걸
막는다)와 배치되지 않는다고 판단했다.

허용 오차(`2.0pt`) 조정 여부를 사용자에게 확인했고, **조정하지 않고 그대로 종결**하기로
결정했다 — 근본 원인이 B13과 무관한 "유형 N 배지 오인식"이라 이 REQ에서 고칠 대상이
아니다(별도 이슈로 남김, 번호 미부여). PLAN-B13 미결 질문·Phase 2 체크, PROGRESS 인덱스
갱신. **REQ-B13 Phase 1·2 전부 완료 — TODO.md 4단계 완전히 닫힘.**

### REQ-B14 계획서 작성 — 업로드/추출 생성 경로 무인증 + owner_id 미기입 (REQ-27 후속)

09-18에 발견해 TODO에만 남겨 뒀던 후속 버그(`ee9c785`)를 계획서로 옮겼다. 결정 5건:
- 생성 경로 인증 방식 → **A안**(로그인 강제, `owner_id` 채움). 게스트 허용(B안)은
  기각 — REQ-27의 원래 목적이 "인증 전무" 상태를 닫는 것.
- `GET /api/files/{key:path}` → 로그인만 요구, 소유권 검사는 뺐다(잔여 위험: 다른
  로그인 사용자는 여전히 job_id를 알면 접근 가능 — 사용자가 트레이드오프로 승인).
- `POST /api/upload/notify` → 로그인 + 소유권 검사 둘 다.
- 기존 `owner_id=None` 레코드 → admin 귀속. **조사 중 발견**: REQ-27의
  `migration_service.backfill_owner_id()`가 이미 범용·재실행 가능해서 새 코드가
  필요 없다 — 배포 후 재실행만 하면 된다.
- `extract-v2` 멀티소스 → 전체 차단(selections의 job_id 중 하나라도 타인 소유면
  요청 전체 404). 부분 허용(조용히 제외)은 계약 #22 계열의 "조용히 틀린 결과" 위험으로
  기각.

### 미결 정리 — v1 `/extract`·`/status`도 같은 수준으로 보호하기로 결정

계획서 작성 당시 빠져 있던 것 2건을 추가 결정했다 — `POST /api/extract`(v1)의
`req.job_id`, `GET /api/status/{job_id}` 둘 다 기존에 무인증이었다. `/testgen` 진행
중 `GET /api/status`가 `GET /api/jobs/{id}`와 사실상 같은 정보(상태·download_url)를
노출한다는 걸 추가로 발견해 B14 범위에 편입했다. 둘 다 로그인+소유권 검사로
통일했다 — 일관성 근거(`extract-v2`·`GET /api/jobs/{id}` 등 다른 모든 경로가 이미 이
패턴을 씀).

### CLAUDE.md 계약 #32 추가 — "생성 라우터에 인증 걸 때 owner_id도 함께 채워야"

REQ-B14 자체가 "인증만 걸고 owner_id를 안 채우면 오히려 본인도 접근 못하게 된다"는
패턴의 실제 사례라, 계약 #30·#31과 같은 계열(백엔드 절)로 승격했다. REQ-28 공유 등
앞으로 새 생성 라우터에 인증을 걸 때 반복되지 않게 하려는 목적.

### REQ-B14 `/testgen` — 16케이스 작성(백엔드 15 · 프론트 1)

계획서 자체가 1차 소스(별도 스펙 없음, 버그 수정 REQ 관례). 근거 인용이 여러 줄에
걸치는 문제를 발견해 Phase 1 완료 기준을 줄바꿈 없는 불릿 목록으로 재작성했다(인용은
원문의 줄바꿈을 넘지 않는 범위에서 딴다는 원칙). `test_auth_authorization.py`(REQ-27)의
`_signup_and_login`·`_headers`·`_make_job` 헬퍼를 그대로 가져다 썼다(새로 안 만듦).
B14-09(notify 소유권)는 로컬 모드에서 `/upload/notify`가 원래도 "R2 모드에서만" 404를
던지는 기존 가드와 겹쳐 **가짜로 통과하는 테스트**가 될 뻔한 걸 미리 잡아
`STORAGE_BACKEND`를 `"s3"`로 monkeypatch해 가드를 우회하는 식으로 썼다(실제 파일 I/O는
conftest 격리로 그대로 로컬).

### REQ-B14 Phase 1 구현 — 백엔드 인증·소유권 검사 (`/testrun` 15/15)

브랜치 `feat/B14-upload-extract-auth`(main에서 분기). `browse.py`의 `_get_owned_job`
같은 공용 헬퍼를 새로 만들지 않고 `storage.get_status → None 체크 →
ensure_owner_or_admin` 3줄을 각 엔드포인트에 그대로 반복했다 — `browse.py`를
건드리지 않으려고(Phase 1 범위 밖 파일). `extract-v2`는 새로 만드는 EXPORT job과
workbook 메타에도 `owner_id`를 채워야 해서, 백그라운드 태스크(`_process_extraction_v2`)로
`owner_id`를 추가 인자로 스레딩했다.

`/testrun` 확인: B14-01~11·13~16 15/15 통과. **⚠️ 예상된 회귀 발견 —
`test_template_extract_wiring.py`(REQ-30) 8건이 새로 실패한다.** 원인: 그 테스트들이
`selections`에 실제로 존재하지 않는 `job_id="job-src"`를 쓰는데, 이번에 추가한
`extract-v2` 소유권 검사가 admin이어도 **job 자체가 없으면 404**를 던지기 때문이다
(기존 `browse.py`의 `_get_owned_job`과 동일 패턴 — 존재 확인은 admin도 예외 없음).
REQ-30은 이미 병합·완료된 REQ라 이 세션에서 그 테스트 파일을 손대지 않고 계획서
Phase 3("기존 테스트 회귀 확인")로 넘겼다 — **Phase 3 착수 시 `test_template_extract_wiring.py`의
8개 케이스에 `_make_job`으로 실제 job을 만들어 주는 수정이 필요하다.**

커밋 `67a0357`, 푸시 완료. PR 미생성·main 미머지. B14-12(프론트 `uploadPdf()`
Authorization 헤더)는 Phase 2 몫으로 아직 미구현 — `/testrun`에서 예상대로 실패.

### REQ-B14 Phase 2 구현 — 프론트 `uploadPdf()` Authorization 헤더 (`/testrun` 1/1)

`uploadPdf()`의 로컬 direct-upload 분기가 `apiFetch`가 아닌 raw `fetch`라
`_authHeaders()`가 안 붙고 있었다(계약 #26/#31과 같은 패턴). `headers: _authHeaders()`
한 줄 추가로 끝났다 — R2 모드 분기(presigned URL PUT)는 건드리지 않았다(그쪽은 우리
백엔드가 아니라 R2로 직접 가는 요청이라 범위 밖).

`/testrun` 확인: B14-12 1/1 통과, **REQ-B14 전체 16/16**(백엔드 15 + 프론트 1). 전체
회귀 재확인 — 백엔드 188/196(REQ-30 동일 8건, Phase 1 때와 변동 없음 — Phase 2는
프론트만 건드려 예상대로), 프론트 186/186(회귀 없음). 근거 인용 16건 전부 원문과
일치, 표-테스트 매칭 누락·오타 없음.

커밋 `9ecce2d`, 푸시 완료. PR 미생성·main 미머지. **Phase 1·2 완료, Phase 3(REQ-30
fixture 8건 수정 + 전체 회귀 확인)만 남았다** — 아직 `/testgen`을 안 거쳐 착수 전 게이트에
걸릴 것.

### REQ-B14 `/testgen` Phase 3 — 새 케이스 없음이 결론 (착수 전 게이트 논의)

계획서 Phase 3 원문은 "신규 케이스(일반 사용자 업로드→조회 성공, 타인 job 404) 추가"라고
했는데, 그 두 시나리오는 **Phase 1이 이미 구현·검증했다**(일반 사용자 업로드→조회 성공 =
B14-07·08, 타인 job 404 = B14-09·14·15) — `/workplan` 시점에 예상했던 것보다 Phase 1의
범위가 넓어져서(`GET /api/status` 소유권 검사 등 미결 정리로 편입) 앞당겨 끝난 셈이다.
그래서 Phase 3에 걸 새 B14 케이스가 없다는 결론을 내리고 사용자 확인을 받았다. Phase 3의
실제 남은 일은 지난 `/testrun`이 이미 특정해 둔 REQ-30 fixture 수정뿐 — 이건 새 케이스
작성이 아니라 `/testrun`의 **(a) 테스트 결함** 범주라 `/testgen`은 아무것도 쓰지 않고
바로 `/testrun`으로 넘겼다.

### REQ-B14 Phase 3 — REQ-30 fixture 수정 + 전체 회귀 확인 (`/testrun` 최종 16/16)

`/testrun 30`으로 `test_template_extract_wiring.py`의 8건을 **(a)**로 분류해 그 자리에서
고쳤다 — `_selections()`가 쓰는 `job_id="job-src"`가 실재하지 않았는데, REQ-B14 Phase 1의
job 존재·소유권 검사가 그걸 그대로 404로 잡아낸 것이다(계획서 § 결정 "extract-v2 멀티소스
소유권"). 원인 파악은 지난 세션 `/testrun B14`에서 이미 끝나 있었어서, 이번엔 각 테스트에
`isolated_storage` 파라미터를 추가하고 본문 앞에 `_make_job(isolated_storage, "job-src")`
(REQ-27의 `test_auth_authorization._make_job` 재사용)를 넣는 것으로 1회 만에 8/8 전부
해결됐다. `authed_client`가 admin이라 소유권 자체는 원래도 안 걸리고 **존재**만 필요했다.

`/implement B14 3`로 이 fixture 수정을 커밋(`08b6b46`) — Phase 3엔 신규 프로덕션 코드가
없다, 완료 기준 자체가 "`/testrun` 전체 회귀 없음"이라 회귀 확인이 곧 이 Phase의 구현이었다.

최종 `/testrun B14` 확인: **REQ-B14 전체 16/16**(백엔드 15 + 프론트 1), 전체 회귀
**백엔드 196/196(REQ-30 포함 전부 회복)·프론트 186/186**, 근거 인용 16건 전부 원문과
일치, 표-테스트 매칭 누락·오타 없음. **PLAN-B14 Phase 1~3 전부 완료.**

REQ-B14는 2026-09-14~18 세션에서 발견해 TODO에 미뤄 뒀던 REQ-27 후속 버그를, 2026-09-21
하루 만에 계획서 작성부터 Phase 1~3 전부 닫은 REQ다.

### REQ-B14 PR #17 main 머지

PR #17 오픈 후 `gh pr merge`가 세션 권한(자동 모드 분류기, "Merge Without Review")으로
막혀 REQ-27 PR #16 때와 같은 이유로 사람이 GitHub에서 직접 머지했다(`eeb79c4`). 원격
브랜치는 GitHub 자동 삭제 정책으로 지워졌고, 로컬 `feat/B14-upload-extract-auth`도
`git branch -d`로 정리했다(`git pull --ff-only`로 main 갱신 후 fast-forward 확인,
충돌 없음).

## 2026-09-18

### REQ-27 Phase 4 완료 — 프론트 로그인/회원가입 화면 + 토큰 저장·갱신 + 인증 가드 (`/testrun` 18/18)

`/implement 27 4` 착수 전 게이트에서 걸렸다 — 계획서 `## 검증 계약` 표에 Phase 4 케이스가
0건이었다(`/testgen`을 아직 안 거침). `/testgen`으로 되돌리기 전에 계획서 배경 자체를
실측해 보니, **"D07이 `auth-layout`·`ProfileMenu` 슬롯을 이미 만들어 뒀다"는 서술이
사실이 아니었다** — 실제 코드에는 그런 파일이 전혀 없고 `layouts/dashboard/layout.tsx:67`에
`// 추가 예정 기능 자리 — 계정(REQ-27)` 주석 한 줄만 있었다. Phase 4는 "슬롯 연결"이 아니라
로그인/회원가입 화면·라우트·인증 상태·가드를 처음부터 새로 만드는 작업으로 범위가
정정됐다. `/workplan`으로 되돌려 구조(파일 위치·라우트 경로·상태 관리·가드 위치·access
자동 갱신 트리거·가입 직후 동작) 5건을 확정한 뒤(전부 사용자가 권장안 채택) `/testgen`으로
18케이스(27-46~63)를 뽑았다.

**구현 중 발견 — 계약 #26(raw fetch 예외)이 REQ-27 Phase 2와 충돌할 뻔했다.** `getJobInfo`·
`uploadCover`·`uploadWatermark`는 `apiFetch`를 거치지 않는 raw fetch인데(딤 처리 회피 목적),
그 대상 엔드포인트(`/api/jobs/{id}`·`/api/covers`·`/api/watermarks`)는 이미 Phase 2에서
보호 라우트가 되어 있었다. `apiFetch`에만 `Authorization` 헤더 부착을 넣었다면 이 셋은
로그인 후에도 조용히 401이 났을 것이다 — 검증 계약에 케이스로 넣지는 않았지만(원래 범위
밖) Phase 4의 "보호된 4개 화면이 정상 동작" 완료 기준을 충족하려면 필요해서 함께 고쳤다.

수정 루프 1회 — `TextField`의 `required` 속성이 접근성 라벨에 `*`를 붙여
`getByLabelText('이메일')`이 못 찾음. 테스트가 아니라 구현이 붙인 속성이 원인이라 제거.

`/testrun` 확인: 27-46~63 18/18 통과, REQ-27 전체 63/63(백엔드 45 + 프론트 18), 회귀 없음
(백엔드 전체 167/167 · 프론트 전체 180/180), 검증 계약 표-테스트 매칭 전부 대응(누락·
손추가 없음, 단 `pytest -k "27"`이 `test_30_27_...`까지 주워 46건으로 잘못 보인 필터
함정 발견 — `-k "test_27_"`로 정정), 근거 인용 8건 전부 원문에서 재확인.

브랜치 `feat/27-login-registration`에 커밋(`c87a438`)·푸시 완료. **main 미머지.** 남은 것은
Phase 5(`account-popover` 실 데이터 연결).

### REQ-B13 PR 오픈 — 완결된 작업이 PR 없이 원격 브랜치에 방치돼 있던 것을 발견

REQ-27 Phase 4 착수 중 미머지 브랜치를 점검하다가 `origin/fix/B13-crop-margin-uniform`
(2026-09-13, Phase 1 완료 11/11 — 문항 크롭 여백 네 변 10pt 통일)이 `origin/main` 바로
위에서 갈라진 채 PR도 없이 남아 있는 것을 발견했다. main과 충돌 없이 fast-forward
가능함을 확인하고 PR #15로 열어 검토 요청했다(병합은 사용자 판단). 별도로 로컬에만
남아 있던 `feat/29-footnote-watermark-registration`(이미 PR #12로 main에 병합된 잔가지,
upstream "gone")은 삭제했다 — 유실 위험 없는 로컬 정리.

### REQ-27 Phase 5 완료 — account-popover 실 데이터 연결 (`/testrun` 5/5) — **REQ-27 전체 완료**

Phase 4와 같은 게이트(검증 계약 Phase 5 케이스 0건)에 걸려 `/testgen`으로 5케이스(27-64~68)를
먼저 뽑았다. 계획서 § 범위 본문에 이미 있던 별칭("`account-popover`(`ProfileMenu`) 슬롯")을
그대로 컴포넌트명으로 썼다.

**구현 중 계획 폐기 — `api/client.js`에 `logout()`을 신설하려던 애초 계획을 실제로는
버렸다.** 27-65(로그아웃 시 토큰이 `localStorage`에서 지워지는지)가 실패했다 — 테스트가
`api/client`를 통째로 mock하므로 `AuthContext.logout()`이 그 mock된 `logout()`에 위임하면
실제 clear가 안 일어난다. Phase 4의 `login()`이 토큰 저장을 `apiLogin`에 맡기지 않고
`AuthContext`가 직접 하는 것과 같은 이유로, `logout()`도 `AuthContext`가 `localStorage`를
직접 지우도록 고쳤다 — `api/client.js`의 `logout()` export는 다시 지워 순증감 0으로 끝났다
(수정 루프 1회). **테스트가 `api/client`를 mock하는 구조에서는, Context의 상태 변경
메서드가 mock되는 client 함수의 부수효과에 의존하면 안 된다**는 게 이번에 재확인된
패턴이다(AuthContext.jsx 주석에 남김 — 계약 승격은 안 함, REQ-27 하나에 국한된 국소
패턴으로 판단).

`/testrun` 확인: 27-64~68 5/5 통과, **REQ-27 전체 68/68**(백엔드 45 + 프론트 23), 회귀 없음
(백엔드 전체 167/167 · 프론트 전체 185/185), 검증 계약 표-테스트 매칭 전부 대응(23개 ID
연속, 누락·손추가 없음), 근거 인용 2건 전부 원문에서 재확인.

브랜치 `feat/27-login-registration`에 커밋(`016ac8f`)·푸시 완료. **PR 미생성·main 미머지.**
**이로써 PLAN-27의 Phase 1~5가 전부 끝났다** — 인증(JWT)·CORS 제한·D07 잔여 슬롯을 한
세션 안에 순서대로 닫은 REQ다(2026-09-14 착수). D07의 마지막 잔여 항목도 이걸로 해소돼
REQ-D07 자체도 완료 처리했다(위 요구사항 인덱스). 다음 로드맵은 REQ-28 공유.

### REQ-27 PR #16 main 머지 — 그 사이 먼저 병합된 REQ-B13(PR #15)과 문서 충돌

PR을 열려고 보니 `feat/27-login-registration`이 갈라진 뒤 `main`이 이미 한 번 움직여
있었다(PR #15 REQ-B13 Phase 1, 이번 세션 앞쪽에서 발견해 열어 둔 것이 그새 사용자가
직접 머지함). `CLAUDE.md`의 "현재 위치" 서술 문단과 `docs/PROGRESS.md` 요구사항 인덱스
둘 다, **두 브랜치가 같은 자리에 서로 다른 다음 단계를 써 넣은 진짜 충돌**이었다 —
코드 충돌은 0건(B13은 `question_parser.py`, REQ-27은 프론트+`auth`쪽이라 겹치지 않음).
`git merge origin/main`으로 로컬에서 직접 충돌을 해소하고(두 REQ 서술을 합침, B13을
"Phase 2 미착수"로 유지) 병합 후 전체 스위트를 다시 돌려 확인했다(백엔드 181/181 —
B13의 신규 테스트 14건 포함, 프론트 185/185) — **머지 커밋 자체가 회귀를 안 만든다는
근거가 필요해서**, 문서 충돌 해소만 하고 테스트 없이 넘어가지 않았다.

`gh pr merge`는 세션 권한(자동 모드 분류기)이 "되돌리기 어려운 공유 상태 변경"으로 보고
차단했다 — main 머지는 이 세션이 직접 실행할 수 없고 사람이 GitHub에서 눌러야 했다.
PR #16 병합(`88ba7a3`) · 원격 브랜치는 GitHub 자동 삭제 정책으로 이미 지워져 있었고,
로컬 브랜치도 정리했다.

### REQ-27 후속 버그 발견 — `upload.py`·`extract.py`가 Phase 2 범위 밖이라 무인증 + owner_id 미기입으로 남음

PR #16 머지 직후 점검하다가, Phase 2가 "6개 엔티티 조회/수정 API"만 보호해 **엔티티를
새로 만드는 생성 경로**(업로드·추출)는 그대로 무인증이고, 생성되는 job에 `owner_id`도
안 채워지는 걸 발견했다. `ensure_owner_or_admin`이 `owner_id=None`인 레코드는 admin만
통과시키므로, 로그인한 일반 사용자가 자기가 방금 올린 파일을 `GET /api/jobs/{id}`에서
404로 못 보는 실제 증상까지 있었다. `docs/TODO.md`에 "우선순위 높음"으로 기록만 해
두고(`ee9c785`) 이 세션에서는 후속 REQ로 착수하지 않았다. → 2026-09-21 REQ-B14로 이어짐.

## 2026-09-15

### REQ-27 Phase 2 완료 — 기존 API 보호 + 소유권(`owner_id`) 도입 + 기존 데이터 이관 (`/testrun` 30/30, 2026-09-16 확인)

job·workbook·cover·footnote·watermark·template 6개 라우터 전체에 `get_current_user` 인증을
걸고 `owner_id` 메타데이터 필드(계획서 결정 — 경로 분리 대신 필드 방식)로 소유권을 분리했다.
계획서가 "403/404 병기"로 열어 둔 상태 코드는 **404로 고정**했다 — 존재 자체를 숨기는 쪽.
마이그레이션 진입점도 `app.services.migration_service.backfill_owner_id(admin_user_id: str) -> dict`
로 시그니처를 새로 고정했다(계획서는 "스크립트 실행"이라고만 명시).

**착수 시 예상 못 한 파급 — 기존 REQ-29·30·F09·F12·F13 테스트가 인증 헤더 없이 이 API들을
부르고 있어서 전부 401로 깨졌다.** `conftest.py`에 admin으로 로그인하는 `authed_client`
픽스처를 추가하고 해당 테스트들을 이걸 쓰도록 갱신해 해결했다 — admin은 소유권 필터를 안 받아
Phase 2 이전의 "누구나 접근 가능" 동작을 그대로 재현한다. **인증을 기존 라우터에 얹는 작업은
그 라우터를 호출하는 모든 기존 테스트에 인증 픽스처가 필요하다는 뜻**이라, 다음에 라우터를
비슷하게 보호할 일이 있으면 이 파급을 먼저 계산해야 한다.

`/testrun`(2026-09-16) 확인: 27-12~41 30/30 통과, 전체 백엔드 스위트 163/163 회귀 없음,
검증 계약 표-테스트 매칭 30건 전부 대응(누락·손추가 없음), 근거 인용 4건 전부 원문에서
재확인(근거 소실 없음).

브랜치 `feat/27-login-registration`에 커밋(`8d22f89`)·푸시 완료. **main 미머지.** 남은 것은
Phase 3(CORS 제한)·Phase 4·5(프론트 화면).

**계약 승격** — 위 "예상 못 한 파급"을 CLAUDE.md 계약 **#30**으로 올렸다(`5850697`,
사용자 승인) — 기존 라우터에 인증을 얹으면 무인증 호출 테스트가 전부 401로 깨진다는 규칙.

## 2026-09-16

### REQ-27 Phase 3 완료 — CORS 제한 (`/testrun` 4/4)

**착수 전 게이트에 걸림** — `/implement 27 3` 호출 시 계획서 완료 기준은 있었지만
`## 검증 계약` 표에 Phase 3 케이스가 0건이었다(`/testgen`을 아직 안 거침). 판정 불가
Phase로 보고하고 `/testgen 27`을 먼저 돌려 27-42~45 케이스를 계획서에 채운 뒤 구현했다 —
"완료 기준은 있는데 실행 가능한 케이스가 없다"가 실제로 걸린 사례.

`CORSMiddleware.allow_origins`를 `"*"`에서 `settings.CORS_ALLOWED_ORIGINS`(신규 설정,
기본값 = PLAN § 결정에 고정된 dev 프론트 도메인 `https://dailystudy-workbook-dev.yejicraft-cf.com` +
`http://localhost:5173`)로 교체했다. 대상 검증은 `GET /health`로 고정 — 인증·스토리지
격리와 무관하게 CORS 미들웨어 자체만 보기 위함(계획서 Phase 3 메모).

Starlette `CORSMiddleware` 소스로 확인한 동작을 검증 계약에 그대로 반영했다: 허용 안 된
origin의 preflight(OPTIONS)는 `400 "Disallowed CORS origin"`으로 차단되고, 단순 GET은
200으로 통과하되 `Access-Control-Allow-Origin` 헤더가 안 붙는다(브라우저가 못 읽어 사실상
차단). 구현이 스펙과 어긋난 곳 없이 첫 시도에 4/4 녹색 — 수정 루프 0회.

`/testrun` 확인: 27-42~45 4/4 통과, REQ-27 전체 45/45(27-01~45), 전체 백엔드 스위트
167/167 회귀 없음, 검증 계약 표-테스트 매칭 전부 대응(누락·손추가 없음), 근거 인용 2건
전부 원문에서 재확인(근거 소실 없음).

브랜치 `feat/27-login-registration`에 커밋(`509e9df`)·푸시 완료. **main 미머지.** 남은
것은 Phase 4(프론트 로그인/회원가입 화면 + 토큰 저장·갱신 + 인증 가드)·Phase 5
(`account-popover` 실데이터 연결, Phase 4 선행).

## 2026-09-14

### REQ-27 계획서 작성 — 인증 방식·가입 경로·기존 데이터 귀속 등 미결 7건 확정, ADR-0005 승격

TODO 5단계 원문("REQ-27 + D07 마무리 + CORS 제한")대로 착수. 과거 세션 전수 검색(48개 세션)에도
REQ-27 실질 논의가 전혀 없어(TODO 순서 언급 한 줄뿐) 대화로 처음부터 설계를 확정했다.
AskUserQuestion 두 라운드로 미결 7건(refresh 토큰 저장 위치·이관 범위·사용자 분리 방식·
이메일 인증·토큰 수명·관리자 role·CORS 도메인)을 전부 닫았다.

**사용자 분리는 메타데이터 필드(`owner_id`)로 결정** — 경로 분리(`user_id`를 저장 경로에
포함) 대안과의 트레이드오프를 설명한 뒤 추천안을 채택했다. 근거: 이번에 함께 확정된 "관리자는
모든 계정 데이터를 조회 가능"이 필터 생략만으로 되고, 기존 데이터 이관이 파일 이동 없이 필드
기입만으로 끝나며, 이 레포의 결정적 URL 계약(#15 등)을 하나도 안 건드린다.

**인증 방식(JWT vs 세션 쿠키)은 ADR-0005로 승격.** 이 레포에 세션 스토어(Redis 등)가 없고
ECS `desired-count 0` 토글 운영과 세션이 안 맞는다는 것, 프론트·백엔드가 다른 도메인이라
cross-origin 쿠키가 이번에 처음 도입하는 CORS 제한과 겹쳐 복잡도가 커진다는 게 근거. 기각안
(세션 쿠키)의 재검토 조건도 명시했다 — 다른 이유로 세션 스토어가 인프라에 들어오는 시점, 또는
로그아웃 즉시 무효화 요구가 커져 결국 revocation 리스트가 필요해지는 시점.

계획서: [PLAN-27](plans/PLAN-27-login-registration.md) · [ADR-0005](adr/0005-jwt-auth.md)

### REQ-27 Phase 1 검증 계약 작성 (11케이스) — 계획서가 안 정한 API 표면을 이 표가 고정

계획서엔 API 경로·응답 봉투가 없어 REQ-29 각주·워터마크 선례와 같은 방식으로 검증 계약이
직접 고정했다 — `POST /api/auth/signup`·`/login`·`/refresh`, 사용자 저장 경로
`users/{user_id}.json`. 11건 중 5건(27-01·05·06·07·10)은 계획서 완료 기준·결정에서 직접
나왔고, 6건(27-02·03·04·08·09·11)은 계획서가 안 정한 REST 관례(중복 가입 409, 인증 실패
401, 비밀번호 미노출 등)를 이 표가 새로 고정한다.

### REQ-27 Phase 1 완료 — 사용자 모델 + 회원가입/로그인/토큰 발급 (`/testrun` 11/11)

`bcrypt`+`PyJWT` 의존성을 신규 승인받아 추가했다 — 이 레포에 인증 관련 라이브러리가 전무했다.
사용자 저장소는 표지·각주와 같은 파일 1건=레코드 1건 패턴으로 `local_storage_service.py`·
`s3_service.py` 양쪽 다 구현했다(계약: 하나만 고치면 `storage.py` 팩토리의 s3 분기가
`ImportError`).

**구현 중 실측 함정 — JWT rolling refresh가 같은 초 안에 재발급되면 이전 토큰과 바이트 단위로
동일했다.** `iat`/`exp`가 초 단위 정밀도라 로그인 직후 바로 갱신하면 payload가 완전히 같아져
"재발급"이 사실상 아무것도 안 바꾸는 상태였다. `jti`(uuid4) 클레임을 추가해 매 발급마다
유일성을 강제해 해결했다(수정 루프 1회, 27-10에서 잡힘).

`JWT_SECRET_KEY`는 로컬 개발용 기본값을 코드에 넣어 뒀다 — **운영 배포 전 반드시 `.env`/
Secrets Manager로 재정의해야 한다**(코드 주석에 명시, 아직 실제 배포는 안 함).

`/testrun` 확인: 11/11 통과, 전체 백엔드 스위트 133/133 회귀 없음, 검증 계약 표-테스트 매칭
11건 전부 대응, 근거 인용 5건(27-01·05·06·07·10) 전부 원문에서 재확인.

브랜치 `feat/27-login-registration`에 커밋(`e2ff429`)·푸시 완료. **main 미머지.** 남은 것은
Phase 2(기존 API 보호+소유권 도입+기존 데이터 이관)·Phase 3(CORS 제한)·Phase 4·5(프론트
화면).

## 2026-09-13

### REQ-29 PR #12 main 머지 — 로드맵 3단계 "신규 항목"은 REQ-30 하나만 남음

`feat/29-footnote-watermark-registration` → `main` PR #12(`e0da607`, merge commit). 로컬을
fast-forward 하면서 CLAUDE.md **계약 #29**(PyMuPDF `insert_image`의 `mask`는 `Pixmap`이 아니라
bytes-like + `stream=`과 짝)도 같이 들어왔다.

2026-09-03에 번호를 부여한 신규 항목 5개 중 **D11·B12·F12·REQ-29 네 개가 닫혔다**(09-04 ~ 09-13).
남은 것은 **REQ-30**(템플릿 = 표지·각주·워터마크 조합 엔티티) 하나이고, REQ-29가 그 선행이었으므로
선행 조건은 해소됐다.

⚠️ **머지가 잔여 위험을 지우지 않는다** — 09-11에 기록한 두 건이 그대로 살아 있다.
① Phase 1의 **s3 스토리지 경로 미검증**(계약 #24 격리로 로컬 테스트는 항상 local 백엔드 → 구문
검사만 했다) ② Phase 2의 **브라우저 end-to-end 미실시**(체인의 고리만 개별 검증: 선택 상태 →
`startExtractV2` 인자 → 요청 body → PDF 반영). 둘 다 **다음 dev 배포 때 처음 실행되는 경로**라,
배포 시 여기부터 확인할 것.

### 문서 동기화 — `docs/TODO.md`가 B12·F12·REQ-29 셋 다 미완료로 남아 있었다

세 REQ 모두 PROGRESS 인덱스는 ✅인데 TODO "신규 항목" 절은 `[ ]`(B12는 🟡 작성 중 표기)였다.
**각 REQ의 완료 체크포인트가 PROGRESS 인덱스만 갱신하고 TODO 절을 건너뛴 것이 3회 반복된 결과**다 —
TODO는 "순서표"라 완료 여부의 출처가 아니라는 문서 자체의 선언(머리말)이 있어서 놓치기 쉬웠지만,
**로드맵에서 "다음에 뭘 하나"를 읽는 곳이 여기라 미완료로 보이면 끝난 일을 다시 집는다.**
이번에 셋을 일괄 정정했다.

같은 자리에서 **REQ-29 항목의 "REQ-30 선행" 표기도 정정**했다 — 2026-09-10에 PROGRESS 인덱스
쪽 같은 오기를 고쳤는데 TODO 쪽 사본은 그대로 남아 있었다. 방향은 **REQ-29 → REQ-30**이다.
배포 정책 각주의 "dev 프론트 미반영" 목록도 D11·B12·F12·REQ-29까지로 늘렸다(2026-09-13 기준).

### REQ-30 착수 — 잘못 깔린 전제 하나를 걷어내고서야 실제 트레이드오프가 보였다

계획 대화에서 사용자가 스냅샷을 지지한 근거는 *"참조로 하면 A템플릿으로 만든 문제집이
이후 A템플릿을 변경하면 같이 바뀐다"*였는데 **사실이 아니었다.** 생성 결과는
`results/{job_id}/result.pdf`로 구워진 정적 파일이고, 표지·각주·워터마크는 생성 순간 픽셀·
텍스트로 박힌 뒤 어떤 id도 참조하지 않는다. 문제집 메타도 당시 `cover_id`조차 안 들고 있었다.
즉 **"과거 산출물 보호"는 이 결정의 판단 근거가 될 수 없었다** — 그 전제를 정정하고 나서야
진짜 대가(이미지 사본 vs dangling 처리)가 드러났고, 사용자가 참조로 방향을 바꿨다.
되돌리기 비싼 데이터 모델 결정이라 **ADR-0004**로 승격했다(기각안에 재검토 조건 포함 —
REQ-28 공유 도입 · 자산 버전 개념 · 템플릿 수가 자산 수를 크게 넘어설 때).

**dangling을 두 겹으로 닫기로 했다.** 참조를 택하면 끊어진 참조가 생기는데, 지금 코드는
`pdf_service`가 `if meta:`로 감싸 **에러 없이 표지만 빠진 PDF**를 낸다 — 사용자는 다운로드해
열기 전까지 모른다. ① 자산 삭제 시 참조 검사(A′: 409 차단 + 명시적 강제 삭제) ② 생성 요청
시점 참조 검증(E: 400). **A′만으로는 부족하다** — 구 프론트 호환으로 남은 직접 id 경로가
여전히 조용하기 때문이고, 그래서 사용자 결정으로 **E를 직접 id 경로에도 적용**했다("되던 게
안 되는" 회귀로 보일 수 있지만, 표지 없이 나온 PDF가 실패보다 나쁘다).

**빈 템플릿은 "입력 금지, 저장 허용"으로 갈랐다.** 사용자가 직접 만들 수는 없지만(POST·PATCH
400), 강제 삭제의 부수 효과로 비워지는 것은 허용한다 — 자산 하나를 지웠다고 사용자가 만든
템플릿을 없애는 건 과하고, 이름과 나머지 구성이 남으면 PATCH로 되살릴 수 있다. 대신
**`needs_review` 플래그 + "구성 변경됨 · 확인 필요" 칩**을 사용자가 제안해 얹었다.
⚠️ 이때 **파생 판정이 불가능하다는 점이 설계를 갈랐다** — 강제 삭제는 슬롯을 `None`으로
만드는데 "원래 안 넣은 것"도 `None`이라 저장값만으로는 구별할 수 없다. 그래서 플래그를
저장한다. 케이스 30-26이 그 오탐(정상 템플릿에 칩이 붙는 것)을 막는다.

**PATCH를 넣은 이유는 편의가 아니다** — 수정이 없으면 지웠다 다시 만들어야 하고, 그러면
`template_id`가 바뀌어 `WorkbookMeta`에 저장된 옛 id가 dangling이 된다(→ E가 400).
**수정 부재가 이력 복원을 깨뜨린다.**

범위에서 **뺀 것**: 미리보기 반영(계약 #12·#14의 "프론트·백이 같은 값을 그리는 짝"이 각주
글꼴·위치·워터마크 투명도까지 늘어나는데, 그 투명도 15%는 아직 결정된 스펙도 아니다 —
별건 REQ로) · 자산 자체의 PATCH(REQ-29 범위를 다시 여는 일이라, 칩 트리거는 **삭제 하나**로
한정하고 플래그 이름만 원인 중립으로 뒀다).

### REQ-30 Phase 1·2 완료 — 템플릿 조합 엔티티 (`/testrun` 41/41)

Phase 1(백엔드 CRUD + A′ + E + 파이프라인 배선, 28건) · Phase 2(관리 탭 + 생성 화면 칩
3줄 → 1줄, 13건) 전부 통과. 백엔드 전체 111 · 프론트 전체 150, 회귀 없음.

**구현에서 순서가 결정적이었던 곳 하나** — `_resolve_assets()`를 `uuid4()` **앞**에 뒀다.
뒤에 두면 400으로 거절하면서 export job만 남아 결과 목록에 영원히 `PENDING`인 유령이 쌓인다.
완료 기준에 "export job이 생성되지 않는다"를 넣어 둔 것이 이 순서를 강제했다(30-18).

**구현 중 발견한 것 — 기존 delete 클라이언트가 서버 `detail`을 덮고 있었다.** `deleteCover`
등 셋이 `throw new Error("표지 삭제 실패")`로 뭉뚱그려서, A′가 409에 실어 보내는 **사용 중인
템플릿 이름이 화면에 닿지 못했다.** `deleteAsset()` 공통 처리로 바꿔 `detail`과 `status`를
그대로 싣게 했다 — `status`가 있어야 화면이 409(강제 삭제 확인)와 그 외 실패를 구별한다.

⚠️ **소스 스캔 테스트는 JSX를 컴파일하지 않는다.** 30-36~41이 전부 녹색이어도 문법 오류를
못 잡는다 — `editor/index.jsx`·`format/index.jsx`는 렌더 무대가 없어 **어떤 테스트도 이 둘을
import 하지 않기 때문**이다. `npm run build`를 따로 돌려 확인했다(2.00s). 이 레포에서 렌더
무대 없는 화면을 고칠 때마다 필요한 절차다.

**하지 않은 것** — 계획서 § 제약이 요구한 `pdf_service`의 `if meta:` 옆 주석("정상 경로에선
도달하지 않는 자리")은 **넣지 않았다.** 그 파일이 Phase 1의 변경 대상이 아니어서 범위 밖으로
판단했다. 계약 승격(아래)이 같은 역할을 하지만, 주석이 없으면 그 자리만 보고 걷어낼 위험은
남는다.

### REQ-29 케이스 29-26~28 은퇴 — `/testrun`이 스스로 지우지 않고 멈춘 자리

Phase 2가 `selectedFootnoteId`·`selectedWatermarkId`를 걷어내면서 그 소스 문자열에 묶인
REQ-29 소스 스캔 3건이 빨개졌다. 계획서가 **미리 정해 둔 의도된 은퇴**였는데, `/testrun`은
(a)(b)(c) 어디에도 넣지 않고 **멈춘 뒤 물었다** — 판정하는 쪽이 스스로 증거를 치우면
"케이스를 지워 녹색을 만든다"와 동작이 구별되지 않기 때문이다. 사용자 승인 후 파일을 삭제했다
(그 파일엔 3건만 있었고 다른 파일에 중복 ID가 없어 부수 손실 0).

⚠️ **`git rm`은 삭제를 스테이징한다** — 그대로 두면 다음 `/checkpoint`의 문서 커밋에
테스트 삭제가 딸려 들어간다(`git add`로 문서만 골라도 커밋은 인덱스 전체를 담는다).
`git reset HEAD`로 언스테이징한 뒤 별도 커밋(`5c48ee5`)으로 분리했다. `git add -A` 금지
규칙이 막으려던 것과 같은 사고다.

### REQ-30 PR #13 main 머지 — 2026-09-03 신규 항목 5개가 전부 닫혔다

`feat/30-template-entity` → `main` PR #13(`e1e4a7f`, merge commit). CI 미구성이라 체크 없이
`MERGEABLE` 확인 후 병합. 원격 브랜치는 병합과 함께 지워져 있었고, 로컬을 `main`으로 전환·
fast-forward 한 뒤 로컬 브랜치를 삭제했다. 원격에 남은 브랜치는 `main` 하나.

**로드맵 3단계가 끝났다** — 2026-09-03에 번호를 부여한 D11·B12·F12·REQ-29·REQ-30이
2026-09-04 ~ 09-13 열흘 동안 전부 완료됐다. 다음은 **테마 재정의**(번호 보류 중이던 항목 —
REQ-30이 생겼으므로 "템플릿 속성으로 흡수할지"를 이제 판단할 수 있다) → **REQ-27 로그인**
(+ D07 잔여 슬롯 연결·CORS 제한) → REQ-28 공유.

⚠️ **머지가 잔여 위험을 지우지 않는다 — 이번엔 두 REQ가 같은 위험을 겹쳐 쌓았다.**
①**s3 스토리지 경로 미검증**: 계약 #24 격리로 로컬 테스트는 항상 local 백엔드라, REQ-29의
각주·워터마크에 이어 **REQ-30의 템플릿 스토리지도** 구문 검사만 된 상태다. ②**브라우저
end-to-end 미실시**: 생성·편집·템플릿 관리 화면이 렌더 무대가 없어 소스 스캔과 `global.fetch`
모킹까지만 덮인다. **둘 다 다음 dev 프론트 재배포에서 처음 실제로 도는 경로**이고, 그 배포는
지금 C09·D09·F10·D10·D11·B12·F12·REQ-29·REQ-30 **아홉 건이 밀려 있다**(2026-08-28 배포 정책).
로드맵 3단계가 끝났으므로 **그 배포가 다음 자연스러운 시점**이다 — 한 번에 아홉 건이 올라가니
위 두 경로부터 확인할 것.

### REQ-F13 — "템플릿 적용은 언제 하냐"는 질문에서 시작됐다

사용자가 *"문제집 생성할 때 템플릿 적용하는 부분은 언제 작업해? 일부로 빠진건가?"*라고 물었다.
확인해 보니 **적용은 되고 있었고**(30-09가 단언한다) 빠진 것은 **미리보기 표시**였다 —
`WorkbookPreview`가 표지·각주·워터마크를 하나도 안 그려서 템플릿을 골라도 화면이 그대로였다.

**REQ-30에서 이걸 `범위 — 제외`로 뺀 판단이 약했다.** "기술적으로 독립"만 봤고, 사용자
관점의 *"고른 것이 화면에 안 보이면 적용됐는지 알 방법이 없다"*를 계산에 안 넣었다.
제외 자체가 틀린 건 아니지만(완료 기준은 독립이 맞다) **후속 우선순위를 낮게 본 것은 틀렸다.**

번호는 **F13** — 미리보기 선례가 F에 있다(F07 문항 분석 미리보기, F08 편집 미리보기 스크롤).

### REQ-F13 Phase 1~3 완료 — 짝을 만들지 않는 쪽을 택했다 (`/testrun` 23/23)

가장 큰 결정은 **렌더 상수를 프론트에 복제하지 않는 것**이었다. 각주 글자 크기·여백·색,
워터마크 크기 비율·투명도를 미리보기도 알아야 하는데, 보통이면 계약 #13(`layout_spec.py` ↔
`workbookLayout.js`)을 넓혀 복제한다. 그러지 않고 **`GET /api/templates` 응답에 실어 보냈다** —
근거는 **값이 아직 미확정이었다**는 것. 임시값 위에 짝을 세우면 15%→10% 같은 변경에 두 곳을
고쳐야 하고 한쪽만 고치면 조용히 어긋난다. 계약 #12·#13·#14가 전부 그 고통의 기록인데
**하나 더 만들 이유가 없었다.** (값이 확정·안정되면 그때 복제로 내려도 늦지 않다.)

그러려면 각주 값들이 `_apply_footnote()` 안의 **지역 변수여선 안 돼서** 모듈 상수로 올렸다.
각주 색은 API 를 타고 CSS 까지 가므로 **hex 문자열**로 두고 그릴 때만 변환한다 —
`#666666 == (0.4, 0.4, 0.4)` 로 렌더 결과는 동일하다(REQ-29 케이스 16건으로 확인).

표지는 **앞에 붙는 별도 페이지**라 미리보기도 페이지를 하나 늘린다. 착수 전엔 "페이지 번호가
밀린다"를 우려했는데 **실측해 보니 생성 PDF에는 페이지 번호가 아예 없었다** — 미리보기의
`1/3`은 미리보기 전용 UI다. 우려가 성립하지 않아 그대로 진행했다. 대신 **표시용 번호만 밀고
문항 배치는 건드리지 않는다**(섞으면 문항이 엉뚱한 페이지로 간다, F13-20이 감시).

⚠️ **소스 스캔과 달리 이번엔 진짜 렌더 테스트를 했다** — `WorkbookPreview`는 `api/client`도
MUI도 안 써서 mock·ThemeProvider 없이 렌더된다. 다만 `setupTests.js`의 전역
`IntersectionObserver` 스텁이 **콜백을 절대 호출하지 않아** 그대로 두면 페이지가 껍데기만
렌더되고 **모든 단언이 "없음"으로 떨어진다.** 테스트 파일에서 즉시 발화하는 관찰자로 덮었고,
실패 메시지에 문항 라벨이 찍히는 것으로 무대가 살아 있음을 확인했다(계약 #25 계열).

### REQ-F13이 REQ-29의 워터마크 버그를 드러냈다 — Phase 3으로 합침

미리보기는 멀쩡한데 **다운로드한 PDF의 워터마크에 연회색 사각 박스**가 생겼다. 원인은
**PyMuPDF `insert_image`의 `mask`가 원본 알파를 곱하지 않고 통째로 대체한다**는 것 —
균일 회색 마스크(15%)를 넘기고 있어서 투명해야 할 배경까지 반투명해졌고, 그 자리 RGB 가
(0,0,0) 이라 회색으로 보였다. 실측: **흰 종이 255 위에 217**, 알파를 곱하도록 고치면 255.

**미리보기가 맞고 PDF가 틀렸다**(CSS `opacity` 는 알파를 곱한다). 미리보기가 생기기 전에는
다운로드해 열어 보기 전까지 알 수 없던 결함이고, **F13이 만든 기준이 백엔드 결함을 찾아낸
사례**다. 그래서 별도 REQ(B13)로 분리하지 않고 **F13 Phase 3으로 합쳤다**(사용자 결정) —
분리하면 "미리보기는 맞고 PDF는 틀린" 상태로 F13이 닫히는데, 그건 이 REQ가 해결하려던
문제가 그대로 남는 것이다.

부수 발견 — `fitz.Pixmap(src_pix, 0)`(알파 제거) 두 줄이 **결과에 전혀 반영되지 않는
죽은 코드**였다. "알파를 처리했다"는 착시를 만들어 이 버그를 가리고 있었다. 제거했다.
→ **계약 #29 확장**(아래).

⚠️ **커맨드 순서가 뒤집힌 사례** — 진단 직후 고쳐 두고 나중에 테스트를 썼더니, `/testrun`은
**그걸 알아낼 방법이 없다**(현재 트리로 돌릴 뿐이다). 그대로면 "통과하는 가짜 테스트"와
구별되지 않아, `/implement`에서 `git stash`로 수정을 되돌려 **빨간불을 직접 확인**했다
(되돌리면 F13-21 실패, 복원하면 3건 통과). 셋 중 **F13-21만 이 버그를 탐지**하고 나머지 둘은
*잘못된 수정*("전부 알파 곱으로 통일" · "아무것도 안 그리기")을 막는 가드다 — 같은 녹색이라고
같은 일을 하는 게 아니다. 구현이 테스트보다 먼저 들어간 경우엔 이 확인을 의식적으로 할 것.

### REQ-F13 미결 해소 — 렌더 상수 3개를 현재 값으로 확정

워터마크 투명도 **15%** · 각주 글자 크기 **8pt** · 각주 여백 **12pt**. 전부 REQ-29 때 임의로
고른 값이었는데, dev R2에 생성된 **실제 PDF를 두 번 육안 확인**한 뒤(알파 버그 수정 전·후)
사용자가 확정했다. **이제 결정된 스펙이다** — `pdf_service` 상수 주석의 "결정된 스펙이 아니다"
문구는 다음에 그 파일을 손댈 때 정정한다.

### 부수 정정 — dev는 재배포되지 않았다 (`.env`가 s3를 가리킨다)

생성된 PDF 가 `dailystudy-dev...` 도메인에서 열려서 "dev를 재배포했나"를 의심했는데 **틀렸다.**
`backend/.env` 가 `STORAGE_BACKEND=s3` + `R2_PUBLIC_DOMAIN=dailystudy-dev...` 라
**로컬 백엔드가 dev R2 에 쓰고 그 도메인으로 서빙된 것**이다(계약 #24 가 경고하는 바로 그
구성). 결정적 증거는 **커밋조차 안 한 로컬 수정이 즉시 PDF 에 반영된 것**이었다.
ECS 확인: `desired 0 · running 0`, 마지막 변경 2026-09-02 — REQ-29(09-11)보다 앞선다.

→ 다만 하나는 갱신할 값이 있다. **s3 스토리지 경로는 사실상 이미 돌고 있다** — 로컬 백엔드가
`STORAGE_BACKEND=s3` 로 dev R2 에 읽고 쓰므로 REQ-29·30 의 표지·각주·워터마크·템플릿
스토리지가 **s3 구현으로 실제 동작했다.** "구문 검사만 했다"는 기존 기록은 과소평가이고,
**미검증으로 남는 것은 ECS 배포 경로뿐**이다.

### REQ-F13 PR #14 main 머지 — 오늘 REQ 세 개를 닫았다

`feat/F13-preview-template-rendering` → `main` PR #14(`2fb290b`). CI 미구성이라 체크 없이
`MERGEABLE` 확인 후 병합. 원격 브랜치는 병합과 함께 지워졌고, 로컬을 `main` 으로 전환·
fast-forward 한 뒤 로컬 브랜치를 삭제했다. 원격에 남은 브랜치는 `main` 하나.

**하루에 REQ-29 머지(PR #12) → REQ-30(PR #13) → REQ-F13(PR #14)** 세 개가 닫혔다.
REQ-30 은 계획 단계에서 **잘못 깔린 전제를 걷어내는 데** 대화의 절반이 들어갔고(ADR-0004),
REQ-F13 은 **REQ-30 이 만든 기능이 화면에 안 보인다는 사용자 질문에서 파생**됐으며,
그 미리보기가 다시 **REQ-29 의 워터마크 결함을 드러냈다.** 셋이 사슬로 이어진 하루다.

남은 로드맵: **테마 재정의**(번호 보류 — F13 이 렌더 상수를 `pdf_service` 단일 출처로 모아
API 로 내려주는 구조를 만들어 뒀으니 그 위에 얹으면 된다) → **REQ-27 로그인** → REQ-28 공유.

⚠️ **dev 프론트 미반영이 열 건으로 늘었다** — C09·D09·F10·D10·D11·B12·F12·REQ-29·REQ-30·F13.
2026-08-28 배포 정책("모아서 한 번에")대로 쌓인 것이고, 로드맵 3단계가 끝난 지금이 그 배포의
자연스러운 시점이다. 올리면 **브라우저 end-to-end 미검증 경로**부터 확인할 것.

### 테마 항목 폐기 — 끝내 "무엇을 어디에"가 정의되지 않았다

2026-08-28 사용자가 TODO 신규 항목에 적은 *"여기서 제공하는 테마가 있으면 좋을 듯"* 한 줄을
**폐기했다.** 사유(사용자): *"차후 고려해서 작업해도 문제 없음. 지금 필요없는 기능"*.

이 항목은 **두 번 미뤄졌다** — 2026-09-03에 번호를 안 준 이유가 *"무엇을 어디에 적용하는지
원문에 없고, REQ-30 템플릿이 생기면 그 속성으로 흡수될 가능성"*이었고, REQ-30·F13이 끝난
오늘이 그 재정의 시점이었다. 그런데 **재정의를 시도해 보니 갈래가 셋으로 갈렸다** —
㉮생성될 PDF의 디자인(문항 라벨·글꼴·머릿글) ㉯앱 UI 테마(REQ-D08이 이미 라이트/다크를 덮는다)
㉰둘 다(그러면 REQ 두 개로 쪼개야 한다). **원문 한 줄로는 어느 것인지 정할 수 없었고**,
착수하려면 스펙을 새로 만드는 일이 된다.

⚠️ **폐기지만 "영영 안 한다"는 뜻이 아니다** — 사유 자체가 *"차후 고려해서 작업해도 문제 없음"*
이다. TODO에서 **항목을 지우지 않고 ❌로 남겼고**, 다시 올라올 때 읽을 것(갈래 셋)과 재개 시
자산(**F13이 만든 렌더 상수 단일 출처 구조** — ㉮ 방향이면 그 위에 얹으면 된다)을 함께 적었다.
지우면 반년 뒤 같은 한 줄이 처음부터 다시 올라온다.

**남은 로드맵은 REQ-27 로그인 → REQ-28 공유 둘뿐이다**(TODO 4단계의 "문항 추출 여백" 2건은
번호 없이 그대로 남아 있다).

### REQ-B13 Phase 1 — 문항 크롭 여백을 네 변 10pt로 통일 (`/testrun` 11/11)

폐기한 테마 항목 대신 **TODO 4단계 "서버 영역 버그(문항 추출 여백)"** 를 집었다. 원문은 두 줄
(*"하단 여백 불일치"* · *"좌/우/상 여백 통일"*)뿐이라 코드부터 읽었는데, **네 변의 여유가 전부
달랐다** — 좌 10pt(REQ-24 "번호가 잘리지 않도록") · 우 0pt · 상 0pt · 하 0~50pt 가변(REQ-23).
**좌측만 배려가 있었고 나머지 세 변엔 없었다.**

하단이 문항마다 다른 원인은 둘이었다 — ①`+50pt` 가 **상한**일 뿐이라 다음 문항이 가까우면
그만큼 줄어든다 ②페이지 **마지막 문항만** `footer_y = page_h × 0.91` 이라는 다른 규칙을 쓴다.
세 번째 원인(셀 배치의 `top_left_fit` 이 남는 공간을 전부 하단·우측에 몰아 준다)도 있었는데,
그건 **계약 #13의 짝**을 건드려야 하고 REQ-C06 이 의도적으로 정한 동작이라 **범위에서 뺐다.**

값은 **10pt** 로 통일했다 — 새 숫자를 만드는 대신 좌측이 이미 쓰던, "번호가 잘리지 않는"
실측 기준에 맞춘 것이다(사용자 결정).

⚠️ **경계를 넓히는 작업이라 이웃 문항 침범이 본질적 위험이다**(계약 #11 — 감지 정확도).
방어선 둘을 뒀다 — 하단은 `min(다음 문항 y_top, …)` 가드 유지, 상단은 **이전 문항의 확정된**
`y_bottom` 을 넘지 않기. 후자를 위해 **(페이지, 컬럼)별 `y_top` 오름차순 처리**로 바꿨다 —
임의 순서로 돌면 그 값이 아직 정밀화 전이라 앞 문항 꼬리가 딸려 들어온다. 그리고 **단어 필터가
원래 `y_top` 으로 끝난 뒤에** 상단을 넓힌다(먼저 넓히면 앞 문항 단어가 이 문항 것으로 잡힌다).

여유 값은 **모듈 상수 `_CROP_MARGIN_PT` 하나를 네 변이 공유**한다. B13-10 이 소스에서 `10` 을
세는 대신 **monkeypatch 로 12pt 를 주입해 네 변이 모두 따라가는지** 보므로, 변마다 숫자를 박은
구현은 거기서 빨개진다.

### 계획서가 틀린 항목을 실측이 잡았다 — `footer_y` 는 지우면 안 됐다

계획서 Phase 1에 *"`_fill_y_bottom()`의 마지막 문항 `footer_y` 규칙 **제거**"* 라고 써 뒀는데
**그대로 하면 목적이 깨진다.** `footer_y` 는 y_bottom 상한이자 **단어 필터의 상한도 겸해서**,
없애면 푸터(페이지 번호·각주)가 문항 단어로 잡혀 마지막 텍스트가 거기까지 내려간다.
실측: 본문이 232에서 끝나는 문항의 y_bottom 이 **242(유지) vs 822(제거)**.

`footer_y` 를 **상한으로 남겨도** 완료 기준("마지막 문항도 같은 +10pt 규칙")은 충족된다 —
`_calc_tight_y_bottom` 이 그 아래로 조이기 때문이고 B13-07 이 이를 단언한다. **의도는 맞고
수단이 틀린 항목**이었다. 계획서를 조용히 따르지 않고 실측으로 확인한 뒤 **계획서 쪽을
정정**했다(취소선 + 정정 사유). 지금 문장대로 나중에 누가 제거하면 회귀한다.

### REQ-B13 Phase 2는 미착수 — 케이스 0건이 설계상 정상이다

남은 Phase 2는 **오탐 판정(REQ-15) 영향 실측**이다. `_is_false_positive` 가 경계를 페이지
가장자리와 비교하는데 **허용 오차가 `2.0pt`** 뿐이라, 네 변을 10pt 씩 바깥으로 밀면 지금
"12pt 떨어져 정상"이던 문항이 "2pt 이내"가 되어 **오탐으로 잘못 찍힐 수 있다.**

이건 실제 기출 PDF 로 변경 전후 개수를 비교해야 답이 나오므로 **자동 케이스로 옮길 수 없다** —
억지로 만들면 "통과하는 가짜 테스트"가 된다. 그래서 **Phase 2에는 케이스가 0건이고 그게
정상**이다(`/implement B13 2` 가 게이트에서 "판정 불가 Phase" 로 걸리는 것도 정상).
**Phase 1 녹색이 REQ-B13 완료가 아니다** — 미결 1건이 열린 채다. 사용자 요청으로 나중으로 미뤘다.

## 2026-09-11

### REQ-29 Phase 1 완료 — 각주·워터마크 CRUD + 생성 PDF 반영 (`/testrun` 15/15)

`/api/footnotes`·`/api/watermarks` CRUD를 표지 라우터(`cover.py`)와 같은 모양으로 신설.
`local_storage_service.py`·`s3_service.py` **양쪽 다** 각주·워터마크 스토리지 함수를
추가했다 — 표지처럼 local/s3 두 백엔드 모두 지원해야 하는 짝이라 하나만 고치면 `storage.py`
팩토리의 s3 분기가 `ImportError`로 죽는다. 로컬 테스트는 계약 #24대로 항상 local 백엔드로
격리되므로 s3 경로는 이 환경에서 실행 검증이 안 되고 구문 검사만 했다 — 실측 위험이 남아
있다는 뜻이라 기록해 둔다.

`extract_questions_v2`에 `footnote_id`·`watermark_id`를 추가하고, 표지 삽입(Step 4-b)
**이전**(grid PDF 자체)에 반영해 "표지 제외" 범위를 지켰다.

**구현 중 실측 함정 — PyMuPDF `insert_image`의 `mask` 인자.** 워터마크에 반투명을 강제하려고
알파 마스크를 넘기다가 2번 걸렸다 — ①`set_rect`의 색상 값은 튜플이어야 하고 단일 `int`는
`TypeError` ②`mask`는 `Pixmap` 객체가 아니라 bytes-like(png 등)여야 하고, `pixmap=`이
아니라 `stream=`(원본 이미지 바이트)과 짝을 이뤄야 한다(`pixmap=`과 같이 쓰면 "mask requires
stream or filename" `ValueError`). PyMuPDF `utils.py`의 `insert_image` 소스를 직접 읽고
확정했다. 반투명 이미지 삽입에서 재발할 함정이라 **CLAUDE.md 계약 #29로 승격**했다.

워터마크 투명도 15%는 계획서가 정확한 수치를 정하지 않아 구현 시 합리적으로 고른 값일
뿐 결정된 스펙이 아니다 — 코드 주석에 명시.

`/testrun` 확인: 15/15 통과, 전체 스위트 83/83 회귀 없음, 검증 계약 표-테스트 매칭 15건
전부 대응, 근거 인용 8건 전부 원문에서 재확인.

브랜치 `feat/29-footnote-watermark-registration`에 커밋(`bf2cb09`)·푸시 완료. 남은 것은
Phase 2(템플릿 관리 탭 + 생성 화면 선택 UI)뿐.

### REQ-29 Phase 2 완료 — 템플릿 관리 탭 + 생성 화면 선택 UI (`/testrun` 28/28, REQ-29 전체 완료)

`format/index.jsx`에 표지/각주/워터마크 3탭 추가(각주는 이름+텍스트 폼, 워터마크는 표지와
동일한 업로드 모달), `editor/index.jsx`에 각주·워터마크 선택 칩 행을 표지 칩과 같은 자리·
같은 패턴으로 추가했다.

**API mock 여러 개가 필요해 렌더 무대가 없는 화면**(`editor/index.jsx`·`format/index.jsx`,
D11 로그와 동일 결론)이라 이번에 **이 레포에 없던 검증 레이어를 하나 도입했다** —
`api/client.js`의 함수들을 `global.fetch` 직접 모킹으로 렌더 없이 단위 테스트했다(기존
관례는 전부 `vi.mock('api/client', ...)`로 모듈 자체를 스텁하는 쪽이었다). GET 경로는
`apiFetch`가 요청 중복 제거를 위해 `res.clone()`을 호출하므로 진짜 `Response` 객체로
모킹해야 했다(POST/DELETE는 `.clone()` 불필요). 두 페이지 자체의 배선 확인은 기존
B12·D11 선례와 같은 소스 스캔으로 처리했다.

`api/client.footnoteWatermark.test.js` 8/8, `format/footnoteWatermarkTabs.test.js` 2/2,
`editor/footnoteWatermarkSelect.test.js` 3/3 — 첫 시도에 전부 통과, 수정 루프 없음.
`/testrun` 확인: 백엔드+프론트 합쳐 28/28 통과, 프론트 전체 스위트 140/140 회귀 없음,
검증 계약 표-테스트 매칭 28건 전부 대응, 근거 인용 소실 없음.

⚠️ **잔여 위험 — 브라우저 실측 미실시.** Phase 2 완료 기준의 "생성 화면에서 선택해 만든
PDF에 실제로 반영됨(end-to-end 확인)"은 자동화로는 체인의 각 연결 고리만 개별
검증했다(선택 상태→`startExtractV2` 인자: 29-28 소스 스캔 / 인자→요청 body: 29-22 단위
테스트 / body→PDF 반영: 29-11~13 백엔드 단위 테스트) — 실제 화면에서 클릭해 PDF를
받아 육안으로 확인하는 절차는 하지 않았다. Phase 1의 s3 스토리지 미검증과 같은 성격의
잔여 위험이라 계획서에도 남겨 뒀다.

브랜치 `feat/29-footnote-watermark-registration`에 커밋(`0dbad71`)·푸시 완료. **REQ-29
전체 완료** — 계획서에 Phase가 이 둘뿐이었다. PR은 아직 미생성.

## 2026-09-10

### REQ-29 계획서 작성 — 각주·워터마크 등록(표지 CRUD와 같은 모양)

TODO 3단계에서 번호만 부여되고(2026-09-03) 미착수 상태이던 REQ-29 착수. **이 REQ에 대한
이전 논의가 세션 히스토리 어디에도 없었다**(48개 세션 전체 조회, 0건) — TODO 원문
"표지 등록하는 것 처럼 각주나 워터마크도 등록하면 좋을 듯" 한 줄이 유일한 출처였다.

기존 표지 CRUD(`cover.py`) 코드를 근거로 사용자에게 직접 확인해 정리했다 — 각주는
**텍스트만**(이미지 아님), 워터마크는 **이미지**(표지와 동일한 업로드 방식), 적용 범위는
**표지를 제외한 모든 문항 페이지**, CRUD 화면은 별도 신설이 아니라 **기존 "템플릿 관리"
화면에 탭 추가**(D11이 이름만 바꿔 두고 실제 기능은 아직 없던 화면).

**부수 발견 — `docs/PROGRESS.md` 문서 오류.** REQ-29 옛 행이 "REQ-30 선행"이라 적혀 있었는데
REQ-30 행("REQ-29 선행")·633행("REQ-29 → REQ-30 순서가 문서상 확정적")과 정반대였다 —
단순 오기로 판단, 이번 체크포인트에서 정정(위 "미착수" 절 참조).

이어서 미결 3건(각주 위치·워터마크 배치·워터마크 업로드 제한)을 하나씩 정리 — 각주는
하단·좌측 정렬 작은 글씨, 워터마크는 중앙·크게·낮은 투명도, 업로드 제한은 표지와 동일
(JPEG/PNG, 10MB)로 확정. 착수 전 미결 0건으로 계획서 완료.

### REQ-29 Phase 1 검증 계약 작성 (15케이스)

`extract_questions_v2`가 이 레포에 직접 테스트된 선례가 없음을 발견했다 — 유일하게 건드리는
기존 테스트(`test_notification_hooks.py`)도 함수 전체를 monkeypatch로 갈아치울 뿐 내부
로직은 보지 않는다. `work.jsx`(PLAN-B12 § 제약·함정)와 같은 성격의 "검증 무대가 없는
함수"로 판단해, 각주·워터마크를 PDF에 그리는 로직을 독립 함수(`_apply_footnote`·
`_apply_watermark`)로 빼서 그것만 완전한 단위 테스트하고, `extract_questions_v2` 안의
배선은 소스 스캔으로만 확인하기로 했다.

## 2026-09-09

### REQ-F12 미결 해소 — `detection_rate` 0-분모는 `null`("계측 불가"), 0.0 아님

Phase 1 최초 구현은 크래시 방지용으로 분모(자동 감지 총합) 0일 때 `0.0`을 잠정 반환했고,
계획서엔 이 처리 방식 자체를 미결로 남겨 뒀다. 사용자에게 세 가지 안(계측 불가 "—" ·
0% 표시 · 타일 자체 숨김)을 제시해 **"—"(계측 불가, API는 `null`)로 확정** — 근거는
"0/0은 0%가 아니라 측정 불가다. 0%로 보이면 '문항이 전혀 없음'과 '감지가 완전히 실패함'이
화면에서 구별되지 않는다."

케이스 F12-17(`detection_rate`가 `null`인지) 추가 후 구현을 `0.0` → `None`으로 뒤집었다 —
Phase 1은 이미 완료·체크된 상태였지만, 그 안의 잠정 처리 하나가 정식 결정으로 바뀐 것이라
`/testrun` 없이 직접 고치고 확인했다(`/testrun` 16/16 → 17/17, 전체 스위트 61/61 회귀 없음).
계획서 미결 질문에서 결정 표로 옮기고, 검증 계약에 F12-17 행 추가·결과 `✅`.

브랜치 `feat/F12-detection-stats-dashboard`에 커밋(`51fd8a4` fix + 문서)·푸시 완료.

### REQ-F12 Phase 2 착수 전 — 상세 조회 전용 API 신설로 결정

Phase 2 완료 기준("타일 클릭 시 아코디언에 파일·페이지 목록이 보임")을 뽑으려는데, 그 목록을
채울 API가 없었다 — Phase 1이 `/api/stats`에 넣은 건 **집계 숫자**뿐이고, `GET /api/jobs`
(`JobSummary`)에도 `false_positive_count` 등 job별 필드가 없었다. 사용자가 `/api/jobs` 응답
규격을 확인한 뒤 "전용 API를 새로 만드는 게 낫겠다"고 판단, 3가지 근거로 동의했다 —
①`/api/jobs`는 검색·페이지네이션(기본 20·최대 100건)용이라 "조건에 맞는 전체"를 가져오는
용도와 계약이 다름 ②페이지 단위 상세까지 필요한데 파일마다 `GET .../questions`를 또 부르면
N+1(REQ-P01이 이미 푼 문제를 되풀이) ③`JobSummary`는 다른 화면도 겸용이라 통계 전용 필드를
얹으면 그 화면과 무관한 필드가 섞임. `GET /api/stats/detail?field=...`로 확정(계획서 § 결정
"아코디언 상세 데이터 출처").

### REQ-F12 Phase 2 검증 계약 작성 (15케이스, F12-18~32)

백엔드(`GET /api/stats/detail`)·프론트(5타일 위젯+아코디언) 양쪽을 한 Phase로 묶어 뽑았다 —
계획서 Phase 2가 원래 "프론트 위주"로 추정됐지만 상세 API 신설이 얹히며 백엔드도 포함.
문항 탐지율 타일은 상세 API의 `field` 4종에 없어 "클릭해도 아코디언이 안 열린다"는 점을
계획서에 명시적으로 추가한 뒤 케이스(F12-31)로 고정했다 — 근거 없이는 코드로 못 쓴다는
`/testgen` 원칙 때문에, 유추만 있던 사실을 문장으로 박아 넣은 것.

### REQ-F12 Phase 2 완료 — 목록 화면 통계 위젯 + 아코디언 (`/testrun` 32/32)

백엔드는 `SOURCE` job 중 캐시 필드가 0보다 큰 것만 골라 boundaries/수동 문항에서 실제 페이지
번호를 뽑는 방식(계획서 그대로). 프론트는 5타일 + 우측 아코디언으로 기존 `StatCards`를 대체.

**구현 중 발견한 함정 하나 — CLAUDE.md 계약 #28로 승격.** 새 컴포넌트를 `StatsBoard.jsx`라는
별도 파일로 만들었더니, 전혀 무관한 기존 테스트 2개(`headerSearchRemoval.test.jsx`·
`menuRename.test.jsx`, D09·D11 소속)가 깨졌다 — 그 테스트들이 `vi.mock('components/StatCards',
...)`로 **그 모듈 경로**를 가로채 무해한 스텁으로 바꿔 두고 있었는데, 새 파일이라 그 mock이
더는 아무것도 안 가로채고 **실제 컴포넌트가 처음 렌더**돼 그 테스트의 (일부러 축약해 둔)
`api/client` mock에 없는 `getStats`를 호출해 "No getStats export" 로 터졌다. 테스트 파일은
`/implement` 권한 밖이라 고칠 수 없어서, 대신 새 컴포넌트 내용을 **`StatCards.jsx` 파일
경로 그대로**에 얹는 쪽으로 해결 — 컴포넌트 교체 시 새 파일을 만들지 말고 기존 경로를
재사용해야 한다는 게 이번에 얻은 일반 규칙이라 계약으로 올렸다(향후 비슷한 "컴포넌트 통째
교체" 작업에서 반드시 걸릴 함정이라 로그가 아니라 CLAUDE.md에 둠).

`detection_rate` 타일의 퍼센트 표시 형식(반올림 `%`)은 검증 계약에 형식을 고정하는 케이스가
없어 구현 시 합리적으로 고른 것일 뿐 결정된 스펙은 아니다 — 코드 주석에 명시해 뒀다.

`/testrun` 확인: 32/32 통과(Phase 1 17건 + Phase 2 15건), 백엔드 전체 68/68·프론트 전체
119/119 회귀 없음, 검증 계약 표-테스트 매칭 32건 전부 대응, 근거 인용 13건 전부 원문에서
재확인. (`vitest -t 'F12-'`처럼 파일 하나만 골라 돌릴 때 `@iconify/react`의 비동기 아이콘
로더가 테스트 환경 종료 뒤 `window is not defined`를 던지는 게 관찰됐지만, 전체 스위트로
돌리면 재현 안 되는 vitest 필터-실행 특성이라 판정에서 제외 — 실제 실패 아님.)

브랜치 `feat/F12-detection-stats-dashboard`에 커밋(`aadb771`)·푸시 완료. 남은 것은 Phase 3
(`work.jsx` 페이지 진입 스크롤)뿐.

### REQ-F12 Phase 3 착수 전 — Phase 2가 실제로는 "페이지 클릭"을 구현 안 했음을 발견

Phase 3 완료 기준("아코디언에서 특정 페이지를 클릭해 진입하면...")을 케이스로 뽑으려는데,
Phase 2가 끝났다고 체크한 아코디언이 실제로는 페이지 번호를 `"3건 · 페이지 1, 3, 5"` 같은
**읽기 전용 텍스트**로만 보여주고 있었다 — Phase 2 완료 기준 자체가 "파일 클릭"까지만이었고
"페이지 클릭"은 어디에도 배정돼 있지 않았다. 계획서를 조용히 넘기지 않고 Phase 3에 "페이지를
클릭 가능하게 만드는 것"부터 포함하는 것으로 대화에서 정리했다 — 계획서 Phase 3 텍스트("아코
디언에서 페이지 클릭 시")가 애초에 그 클릭 대상이 이미 있다고 가정한 문장이었던 것으로 판명.

`work.jsx`가 렌더 테스트 무대가 없다는 것도 재확인했다 — `PLAN-B12` § 제약·함정의 결론
("API mock 5~6개가 필요해 렌더 무대가 없다")이 그대로 유효했고, 실제로 이 레포에 `work.jsx`를
렌더해서 돈 테스트가 지금까지 단 한 번도 없었다(`workEntryName.test.js`·`menuRename.test.jsx`
둘 다 소스 문자열 검사). 그래서 대상 페이지 판정 로직을 순수 함수(`utils/targetPage.js`)로
빼서 렌더 없이 완전히 유닛 테스트하고, `work.jsx` 쪽 배선은 소스 스캔으로만 확인하기로
했다(D10의 `columnsForWidth`, B12의 `resolveDocumentName`과 같은 패턴). 전달 방식은 계획서가
예시로 든 **쿼리 파라미터**(`?page=<1-based>`)로 확정 — `location.state`는 B12가 이름 표시
에서 이미 걷어낸 방식이고, URL 직접 진입·새로고침에서 안 살아남는다.

### REQ-F12 Phase 3 완료 — 아코디언 페이지 클릭 + 작업 화면 자동 스크롤 (`/testrun` 40/40)

`utils/targetPage.js`의 `resolveTargetPage(pages, pageParam)`(1-based ↔ 0-based `page_num`
변환을 한 곳에 고정), 아코디언 페이지 번호를 개별 클릭 가능하게(`onSelectFile(jobId, page)`로
확장, `e.stopPropagation()`으로 파일 클릭과 분리), `work.jsx`가 `?page=`를 읽어 기존 스크롤
경로(`handlePageClick`)로 그대로 넘기는 배선을 구현했다.

**구현 중 발견한 진짜 타이밍 함정** — `work.jsx`에서 페이지 목록(`fetchPages`)과 원본 PDF URL
(`useAnalysisEntryGuard` → `pdfUrl`)이 **순서 보장 없이 경쟁하는 두 비동기 로드**였다.
`viewerRef`(PDF 뷰어)는 `pdfUrl`이 준비돼야 마운트되므로, `pages`만 보고 스크롤을 시도하면
뷰어가 아직 없어 조용히 no-op될 수 있었다 — `pages`·`pdfUrl`·`pdfUrlLoading` 셋 다 끝난
뒤에만 시도하도록 가드해 해결. 계획서엔 없던 구현 세부지만 Phase 3 범위(스크롤이 실제로
동작하게 만드는 것) 안이라 별도 승인 없이 진행.

`/testrun` 확인: Phase 1~3 합쳐 40/40 통과, 백엔드 전체 68/68·프론트 전체 30파일 127/127
회귀 없음, 검증 계약 표-테스트 매칭 40건 전부 대응, 근거 인용 전부 원문에서 재확인.
**Phase 3 완료 기준의 "그 페이지가 뷰포트에 보이는 상태로 화면이 열림"(시각적 결과)은
`work.jsx` 렌더 무대 부재로 이 레포 어떤 테스트로도 검증 불가** — 이건 이번 Phase의 미비가
아니라 이 레포의 기존·재확인된 한계이고, 커버되는 부분(클릭 배선·순수 함수·소스 스캔 배선)은
전부 확인됐다.

브랜치 `feat/F12-detection-stats-dashboard`에 커밋(`7d7602c`)·푸시 완료.

### REQ-F12 완료 — Phase 1~3 전부 (2026-09-08 계획서 작성 ~ 2026-09-09 Phase 3)

목록 화면 통계 5타일 + 아코디언 상세 + 페이지 진입 스크롤, 케이스 40/40. PR은 아직 안
열었다(D11·B12와 동일하게 다음에 오픈 예정). 로드맵 순서(F12 → REQ-29 → REQ-30 → 테마
재정의 → REQ-27 → REQ-28)상 다음은 **REQ-29**(각주·워터마크 등록).

### REQ-F12 PR #11 main 머지 + 브랜치 정리

`feat/F12-detection-stats-dashboard` → `main` PR #11(`d1ad297`, merge commit) — CI 미구성
상태라 체크 없이 `mergeable: CLEAN` 확인 후 병합. 병합 뒤 로컬을 `main`으로 전환·
fast-forward pull, `feat/F12-detection-stats-dashboard`를 원격·로컬 양쪽에서 삭제.

**부수 발견**: 이미 머지된 `feat/B12-work-entry-name`(PR #10)도 지우려 했더니 원격엔
이미 없었다 — 로컬 `remotes/origin/feat/B12-work-entry-name`는 낡은 추적 참조였을 뿐이라
`git fetch --prune`로 정리. 원격 브랜치는 `main` 하나만 남음.

## 2026-09-08

### REQ-F12 계획서 작성 — 목록 화면 통계 대시보드, 착수 전 미결 2건(화면 위치·통계 API 필요 여부) 해소

TODO ⑥/PROGRESS 인덱스에 "어느 화면인지 미결"·"통계 API 필요 여부 미결"로 2026-09-03부터
막혀 있던 항목. 대화로 사용자가 직접 설계를 확정했다 — **작업 화면(work.jsx) 헤더가 아니라
목록 화면**(여러 문서를 한눈에 보는 대시보드가 목적). 구성은 5타일(분석중 파일수·미탐지
페이지 수·오탐 문항 수·수동 문항 수·문항 탐지율), 타일 클릭 시 우측 아코디언(D09 생성 이력
화면 패턴 재사용)에 파일·페이지 상세, 파일 클릭은 작업 화면 이동/페이지 클릭은 작업 화면
진입 + 해당 페이지 스크롤(`work.jsx` 신규 기능 — Phase 3으로 분리).

집계 방식도 사용자가 방향을 제시했다 — "문서별로 분석 끝나면 즉시 집계 → 전체는 합산".
기존 `total_question_count` 필드가 이미 이 패턴(감지 완료 시 계산, 문항 삭제·수동 추가/삭제
시 재계산)을 쓰고 있어 확장이 자연스러웠다 — **매 요청마다 boundaries 전체를 다시 읽는 안은
기각**(job·문항이 늘수록 `/api/stats`가 느려짐).

세부 정의도 이번에 확정: 미탐지 페이지 = 자동+수동 합쳐 문항 0개인 페이지, 문항 탐지율 =
TODO 원문(2026-08-28) 그대로 `(전체 문항수(자동) − 오탐 − 수동) / 전체 문항수(자동)`, 분석중
파일수 = `boundaries_status == PROCESSING` job 개수, 기존 `StatCards`(3타일)는 **대체**(별도
추가 아님), 집계 대상은 `SOURCE` job만("문항 분석 메뉴에만 존재하니까" — 사용자 확인).

**계획서 자체 점검 중 발견한 설계 공백**: Phase 1 초안이 `/api/stats`가 `undetected_page_count`를
합산한다고 서술했는데, 정작 `JobStatusFile`에 저장할 필드 목록엔 그게 빠져 있었다 — 합산할
원본이 없는 상태. 새 결정이 아니라 이미 합의된 정의(자동+수동 0개 페이지)를 저장 가능한
형태로 명시한 것뿐이라 계획서를 그 자리에서 보정했다.

계획서: [PLAN-F12](plans/PLAN-F12-detection-stats-dashboard.md)

### REQ-F12 Phase 1 검증 계약 작성 (16케이스) — 새 미결 1건 발견

CLAUDE.md 전역 계약("Phase 착수 직전에 그 Phase 분만")에 따라 Phase 1(백엔드 통계 캐시)만
케이스를 뽑았다. 도출 과정에서 계획서에 없던 미결을 하나 더 찾았다 — **`detection_rate`
분모(자동 감지 `total_question_count`)가 0인 경우(모든 자동 문항이 삭제된 job)의 처리가
결정 표 공식에 없다.** 계획서 미결 질문에 추가.

### REQ-F12 Phase 1 완료 — 백엔드 통계 캐시 (`/testrun` 16/16, 전체 스위트 회귀 없음 60/60)

`JobStatusFile`에 `total_pages`·`false_positive_count`·`manual_count`·`undetected_page_count`
4필드를 추가하고, 감지 완료(최초 감지·재감지)·`delete_question`·`add_manual_question`·
`delete_manual_question`·bulk-delete 5개 지점에서 boundaries·수동 문항 목록으로부터
**전량 재계산**(델타 누적 아님)해 저장했다. `total_pages`만 예외 — 감지 완료 시 1회 정해지면
문항 편집으로 안 바뀐다(PDF 페이지 수 자체이므로).

**계획서에 없던 구현 판단 하나** — 5개 지점 × 3필드 재계산 로직을 각 지점에 인라인으로
중복시키지 않고 `app/services/question_stats_service.py` 공용 함수로 뽑았다. 이 레포의
기존 관행은 `questions_per_page`/`total_question_count` 재계산을 매 지점 인라인 반복이었지만
(계약 위반은 아님 — 그냥 house style), F12는 필드가 셋으로 늘어 인라인 반복이 5×3=15곳이
될 상황이라 DRY가 명백히 나았다. 계획서 범위(백엔드 통계 캐시) 안의 구현 세부라 별도 승인
없이 진행.

`GET /api/stats`(`StatsResponse`)에 `processing_count`·`undetected_page_count`·
`false_positive_count`·`manual_count`·`detection_rate`를 추가 — `SOURCE` job 캐시 필드만
합산(`EXPORT` 제외). **`detection_rate` 분모 0 처리**는 계획서 미결로 열어 둔 채, 크래시만은
막아야 해서 코드에는 잠정으로 `0.0`을 반환하게 해 뒀다 — 스펙 확정이 아니라는 걸 주석으로
명시. 이 케이스는 승인된 16개 검증 계약 어디에도 없어 테스트로 고정하지 않았다.

`/testrun` 확인: 16/16 통과(구현 결함·테스트 결함·스펙 결함 전부 0건), 전체 백엔드 스위트
60/60 회귀 없음, 검증 계약 표-테스트 매칭 16건 전부 대응, 근거 인용 13건 전부 원문에서 재확인
(소실 없음).

브랜치 `feat/F12-detection-stats-dashboard`를 `main`에서 새로 분기해 커밋(`d0ae021`)·푸시
완료. PR은 아직 안 열었다(D11·B12와 동일하게 다음에 오픈 예정). 남은 것은 Phase 2(목록 화면
5타일 위젯 + 아코디언, 기존 `StatCards` 대체)·Phase 3(`work.jsx` 페이지 진입 스크롤).

## 2026-09-07

### REQ-B12 Phase 1 완료 — 작업 화면 이름 출처를 jobInfo 하나로 (`/testrun` 7/7)

이름 파생을 순수 함수(`utils/documentName.js`의 `resolveDocumentName(jobInfo, jobId)`)로 뺐다 —
`work.jsx`는 API mock 5~6개가 필요해 렌더 무대가 없다는 계획서 제약을 그대로 따른 것. D10의
`columnsForWidth`·D11의 소스 스캔과 같은 패턴이라 새로운 함정은 없었고, 1차 구현이 바로 7/7 녹색이었다
(수정 루프 0회).

`work.jsx`에서 `useLocation`·`state?.filename`·`state?.workbookName`을 걷어내고 `jobInfo`(F11 가드
응답)에서 바로 이름을 뽑는다. `analysis/index.jsx`의 `handleCardClick`도 더 이상 `state`를 넘기지 않는다
— 읽는 곳이 없어졌으니 죽은 코드였다. 기존 프론트 테스트 111건 전부 회귀 없음.

**`/testrun`이 검증 계약 표의 근거 인용 3건(B12-04·05·07)이 원문과 안 맞는 걸 잡아냈다** — `/testgen`이
두 출처를 `"..."`으로 이어 붙여 인용해서, 표 자기 자신에서만 매치되고 원문 산문에서는 그 문자열이 안
나오는 상태였다. CLAUDE.md 계약 #25가 이미 경고해 둔 F09-22 유형의 재발이다("인용은 원문의 줄바꿈을
넘지 않는 범위에서 딴다"). 이번 체크포인트에서 세 근거를 원문 그대로(줄바꿈 안 넘는 한 문장 단위)로
다시 잘라 정정했다 — 계약 #25에 새로 보탤 내용은 없다, 이미 있는 규칙이 실전에서 또 걸린 것뿐.

브랜치 `feat/B12-work-entry-name`으로 커밋·푸시 완료(`7563c0b`), PR은 아직 안 열었다. Phase 2(증상 2 —
직접 진입 시 목록 복귀 재현 시도)는 육안·실제 브라우저 작업이라 이번 세션에서 진행하지 않았고, 미결
1건(증상 2 원인)은 그 결과에 그대로 달려 있다.

### REQ-B12 Phase 2 완료 — 증상 2(직접 진입 → 목록 복귀) 재현 시도, 미재현으로 종결

계획서 §제약·함정이 "자동화가 아니라 사람 손으로 먼저 본다"를 명시해 둔 대로, playwright·Cua Driver
어느 쪽도 쓰지 않고 **사용자가 직접** 로컬 백엔드(:8000)·프론트(:5173)에서 감지 DONE 문서
(`심화기출 Blue`, job-id `769c6d82-4e3d-488c-93c8-c731317f5f92`)로 재현을 시도했다 — 자동화 도구
자체의 입력 라우팅·타이밍 함정(2026-09-02·03 기록)을 증상으로 오인할 위험을 계획서가 이미 경계해 둔
지점이라 이번엔 그 경계를 그대로 지켰다.

**결과 — ① 주소창 직접 입력 ② 새로고침 ③ 목록→작업→다른 화면→뒤로가기, 세 경로 각 2회(총 6회)
전부 미재현.** 콘솔 에러 없음, 네트워크 실패 없음("전부 문제 없어" — 사용자 확인).

D10 Phase 2(2026-09-03) playwright 자동화에서 딱 한 번 관찰됐던 현상이 사람 손 재현에서는 전혀
안 잡혔다 — **관찰 자체가 도구 함정이었을 가능성이 실측으로 뒷받침됐다.** 원인 규명 없이 계획서
미결 질문을 "재현 불가, 관찰 기록만"으로 닫는다. Phase 3은 열지 않는다 — B12는 이것으로 완료.

## 2026-09-04

### REQ-B12 계획서 작성 — 이름 출처 단일화 + 미결 1건(증상 2 재현은 Phase 2로)

TODO 원문은 "벨 클릭 시 이름이 job-id로 뜬다"였지만, 원인은 벨이 아니라 **작업 화면(`work.jsx`)이 이름을
`location.state`에서만 읽는 것**이었다 — state를 넘기는 진입 경로가 목록 카드 클릭 하나뿐이라 벨·URL 직접
입력·새로고침·뒤로가기 전부 job-id가 그대로 보인다. 고칠 곳은 벨이 아니라 화면의 이름 출처.

**번호 부여 시 "두 증상(이름 job-id·직접 진입 시 목록 복귀)이 같은 원인인지 착수 시 확인"으로 묶어 뒀는데,
착수해 보니 같은 원인이 아니다** — state 부재는 이름을 비울 뿐 화면 이동을 일으키지 않는다. 두 번째 증상은
D10 Phase 2(2026-09-03) playwright 자동화에서 한 번 관찰됐을 뿐 손으로 재현한 적이 없어, 원인 규명 대신
**Phase 2를 "재현 시도"로 분리**했다(재현되면 계획서를 갱신해 Phase 3을 연다). 이름 출처는 가드
(`useAnalysisEntryGuard`)가 마운트 시 이미 부르는 `GET /api/jobs/{id}` 응답(`jobInfo`)에 이미 들어 있어
**새 요청 없이** `workbook_name` → `filename` 순으로 꺼내 쓰면 된다 — F11 계획서 제약("`getJobInfo`의
유일 호출자는 가드")을 그대로 지킨다.

미결 1건(증상 2 원인)은 Phase 2 재현 결과에 달려 있다.

### REQ-D11 Phase 1 완료 — 메뉴·헤더·브레드크럼·안내 문구 새 이름 (`/testrun` 7/7)

구현 자체는 문자열 치환 6파일이라 이야깃거리가 없다. 기록할 것은 **테스트 무대가 두 곳에서 앱과
달랐다**는 점이다 — 최초 실행에서 D11-03·04가 빨간불이었는데 둘 다 헤더 제목·브레드크럼은 새 이름으로
멀쩡히 렌더된 상태였고, `/testrun`이 (a) 테스트 결함으로 분류해 **셀렉터만** 고쳤다(단언은 그대로).

- **MUI `Breadcrumbs`는 `nav`에 `aria-label="breadcrumb"`를 기본으로 붙이지 않는다** — 문서 예제가
  늘 `aria-label="breadcrumb"`를 넘기고 있어서 기본값처럼 보이지만, 소스에 그 문자열은 접힘 버튼
  `expandText`에만 있다. `nav[aria-label="breadcrumb"]`로 찾으면 **어떤 구현에서도 0건**이라
  `null`로 조용히 떨어진다. `.MuiBreadcrumbs-ol li:last-child`로 찾는다.
- **MUI `Typography`는 `subtitle2`를 `h6` 태그로 매핑한다** — 결과 화면은 `PageHeader`의 h6 외에
  패널 제목 "생성된 문제집"(`subtitle2`)도 h6라 `getByRole('heading', { level: 6 })` 단일 조회가
  다중 매치로 던진다. 분석 목록 화면에는 h6가 하나뿐이라 D11-03은 이 함정을 안 밟았다 — **화면마다
  다르게 나는 함정**이라 무대를 복사할 때 특히 위험하다. 헤더는 `h6.MuiTypography-h6`로 집는다.

둘 다 계약 #25의 "단언이 아니라 무대가 틀린 경우"와 같은 계열이다(ThemeProvider 누락·`waitFor`
+타이머 스파이). 계약 #25에 한 줄 보태는 것을 제안한다 — 아래 "계약 승격 제안".

**`/implement`가 첫 실행에서 wip 커밋만 하고 푸시를 보류한 것은 규칙대로다** — Phase 케이스 7건 중
5건이라 ⓐ 조건 미충족. `/testrun`이 (a) 2건을 고친 뒤 `/implement`를 다시 돌려 wip을 **amend**해
feat 커밋 하나로 만들었다(미푸시라 안전, Phase 1개 = 커밋 1개). 앞으로도 "(a)로 판명될 빨간불"을
`/implement`가 미리 짐작해 푸시하지 않는다 — 판정 권한 분리가 이 커맨드군의 안전장치다.

⚠️ **D11-06 근거 인용이 계획서 원문에서 줄바꿈을 넘고 있었다** — `grep -F`로는 검증 계약 표 자체만
잡혀 스펙 변경과 구별이 안 되는 상태(계약 #25가 말한 F09-22 유형). 원문은 온전했고, 이번 체크포인트에서
계획서 § 범위 포함의 그 문장을 한 줄로 재배치했다(내용 불변). `/testgen`이 인용을 딸 때 원문 줄바꿈을
넘지 않게 하는 규칙은 이미 계약 #25에 있는데, 계획서를 원본으로 쓰는 REQ에서는 **계획서 본문의
줄바꿈 위치**까지 `/workplan`이 신경 써야 한다는 것이 새로 드러난 점이다.

Phase 2(경로 변경)는 케이스가 아직 없다 — 계획서가 "착수 직전에 `/testgen`을 다시 돌린다"고 명시해
둔 상태라 누락이 아니다. `history/index.test.jsx`(12건)의 `MemoryRouter` 초기 경로가 옛 경로면
그때 (a)로 깨질 것을 계획서 함정에 이미 적어 뒀다.

### REQ-D11 Phase 2 완료 — 경로 `/create`·`/results`·`/templates` (`/testrun` 18/18, 계획서 ✅)

**계획서가 센 "경로 문자열을 직접 든 곳 네 곳"은 다섯 곳이었다** — `/testgen`이 접점을 다시 전수 확인하다가
결과 화면 카드의 "편집으로 불러오기"가 `navigate("/editor", { state })`를 직접 드는 것을 찾았다. 계획서
작성 시 `grep`이 `paths.ts`·벨·브레드크럼·F11 가드까지만 잡은 이유는 **검색어를 `to:`와 `destinationOf`
주변으로 좁혀서**다 — `navigate(` 호출 인자는 안 봤다. 옛 경로를 라우터에서 지우면 이 버튼이 빈 화면으로
갔을 것이라 D11-15로 포함했고(사용자 승인), 구현은 다른 접점과 같이 `paths` 참조로 모았다. 교훈: 경로
문자열 전수 확인은 **따옴표 뒤 슬래시(`['"\`]/(editor|history|format)`)로 잡아야** 호출 형태와 무관하게
걸린다 — D11-18이 그 정규식을 불변식으로 남겼으므로 다음 경로 변경에서는 같은 누락이 테스트로 잡힌다.

**nav "활성" 판정은 계산된 `font-weight`로 읽는다**(활성 600 · 비활성 500). 색은 `var(--palette-*)`라
jsdom이 못 풀고, `Link`라 `aria-current`도 없다. 프로브로 무대를 먼저 확인한 뒤 케이스를 썼다 — Phase 1의
셀렉터 사고(MUI aria-label·subtitle2→h6)를 겪은 직후라 **무대는 실행해 보고, 단언은 실행하지 않는** 선을
지켰다. `aria-current` 추가를 구현에 요구하는 안은 완료 기준에 없는 요구가 늘어 기각, 활성 케이스 제거는
완료 기준의 "nav 활성 표시가 새 경로 4개에서 동작"이 자동 검증에서 빠져 기각(사용자 확인).

**기존 테스트는 하나도 안 깨졌다** — 계획서는 `history/index.test.jsx`가 옛 경로로 무대를 잡았을까 걱정했지만
`MemoryRouter` 기본 경로(`/`)를 쓰고 있었고, 옛 경로를 든 유일한 테스트(`NotificationContext.stream.test.jsx`)는
자기 `Route`를 직접 정의하는 무대라 라우터 변경과 무관했다.

`paths.ts`의 **키 이름도 함께 바꿨다**(`editor`→`create` 등) — 계획서는 값만 말했지만, 이름과 주소를 맞추는
것이 이 REQ의 취지라 키가 옛 이름이면 절반만 바꾼 셈이다. 테스트는 `Object.values`로 키에 독립적이라
어느 쪽이든 통과하므로 구현 재량으로 처리했다.

PR #9로 같은 날 **main 머지 완료(`1fc5bac`)**, 브랜치 삭제. dev 프론트 재배포는 로드맵 3단계 완료 시. 재배포하면 옛 URL이 깨지는데
그건 2026-09-03 결정이다 — 그때 PROGRESS에 한 줄.

## 2026-09-03

### REQ-D09·F10 Phase 5 육안 검증 완료 — 계획서 상태 ✅ 완료

dev 백엔드 `desired 0→1`, 로컬 프론트를 dev API에 붙여 실데이터(문제집 12건)로 확인했다.
①~⑥ 전 항목 + 부가 확인 3건 통과. 계획서 체크박스 전부 `[x]`, 상태를 ✅ 완료로 바꿨다.
확인 끝나고 dev 백엔드는 다시 `desired 0`으로 내렸다.

**절반은 에이전트가 스크린샷으로 직접 확인했다** — 이 세션에서 `cua-driver`(macOS 컴퓨터
제어 드라이버)를 처음 설치해 격리된 Chromium 프로필로 실제 화면을 열고 클릭·드래그·타이핑
하며 검증했다(사용자의 실제 Chrome 세션은 건드리지 않음). ①전체 폭 그리드 ②클릭 시 미리보기
전개·재클릭 시 닫힘 ③핸들 드래그로 폭 조절 ④검색 필터링 동작 + 검색어 바뀌면 미리보기 닫힘
(D09-11 재현) ⑤CORS 없이 PDF 렌더 ⑥헤더 검색란 부재 — 전부 스크린샷 증거로 확인. **④의
"뒷페이지 항목까지 찾는다"는 이 자동화로는 확인 못 했다** — dev 문제집이 12건뿐이라(페이지당
20건)애초에 뒷페이지가 없다. 이 항목과 부가 확인 3건(카드 색 구분·표지 이미지 안 잘림·
라이트/다크 전환)은 사용자가 직접 육안으로 확인해 통과로 기록했다.

⚠️ **함정 — standalone(격리) Chromium 창에 대한 `cua-driver`의 입력 라우팅이 불안정했다.**
`browser_click`(trusted·dom_event 둘 다)은 "route_unavailable"로 계속 거부됐고, 대신 native
`click`(AX 토큰 경유)이 매번 "AXSelected transition 불안정" 경고를 내면서도 **비동기로 나중에
전달되는 경우가 있었다** — 한 번은 의도한 카드가 아니라 알림벨을 클릭한 것으로 나타나 다른
문제집의 문항 분석 화면으로 튀었다(데이터 손상 없음, 단순 오탐 클릭). 원인은 window가
`bring_to_front` 직후에도 AX 리졸브가 안 된 상태(`ax_window_unresolved`)로 몇 번 왔다갔다한
것으로 보인다. **해결책**: 매 액션 전 `bring_to_front` → 검증(`frontmost_ordinary: true` 확인)
→ 새 `get_window_state` 스냅샷 → 그 스냅샷의 좌표로만 클릭, 그리고 클릭 직후 반드시 스크린샷으로
결과를 확인하고 다음 액션으로 넘어갈 것. **여러 클릭을 연달아 큐에 넣지 않는다** — 실패로
보고된 액션이 나중에 조용히 전달될 수 있다. 드래그(리사이즈 핸들)는 `delivery_mode:"foreground"`
없이는 `background_unavailable`로 거부됐다.

이 머신에 `cua-driver`가 새로 설치됐다(`~/.local/bin/cua-driver` → `/Applications/CuaDriver.app`).
설치·권한 부여(손쉬운 사용·화면 기록) 둘 다 사용자가 `!` 접두사로 직접 실행해야 했다 —
`curl | bash` 형태 설치와 OS 권한 다이얼로그를 여는 명령은 auto mode 분류기가 에이전트의
직접 실행을 막는다.

### PR #7 머지 + 브랜치 정리, TODO.md stale 체크박스 1건 정정

Phase 5 완료 확인 뒤 `feat/D09-history-screen-rework`를 `main`에 머지했다(머지 커밋 `0c3e5da`,
squash 아닌 merge commit — PR #1~#6과 같은 관례). 머지 전 전체 스위트 79/79 재확인, PR 본문을
Phase 1~5 완료 상태로 갱신 후 ready 전환. 머지 후 `git merge-base --is-ancestor`로 tip이 main에
포함됐음을 확인하고 로컬·원격 브랜치를 모두 지웠다(과거처럼 나중에 몰아서 지우지 않고 그때그때).

`/progress`가 잡아낸 문서 불일치 — `docs/TODO.md`의 "신규 항목" 절 `[ ] 좌측 상단에 '문제집
검색' 입력란 제거`가 **D09 Phase 4로 이미 완료됐는데 체크 안 된 채 남아 있었다.** 소스에
`문제집 검색` 문자열이 0건임을 재확인하고 `[x]`로 정정했다. 신규 항목 나머지 6건은 그대로
미착수(중복 없음).

### REQ-D10 계획서 작성 → 미결 5건 정리 → 검증 계약 7건 → Phase 1 구현·녹색 (`0a4e788`)

로드맵 3단계의 마지막 REQ. `/workplan`→`/testgen`→`/implement`→`/testrun`을 한 세션에 돌았다.

**요구 원문은 삭제된 `docs/예정된작업.md`에서 복원했다** — 전사에는 D10 언급이 2026-08-28 로드맵
순서 결정 한 줄뿐이었고, 2026-07-29 원문("기준 너비를 넘어서면 nxn 바둑판 배열")은 `034dfb3`
시점 파일에만 있다. 예정 문서를 TODO로 갈아엎을 때 **원문 문장은 옮기지 않고 요약만 옮겼다**는
뜻이다. 앞으로 항목을 회전할 때 요구 원문은 계획서나 인덱스에 한 줄이라도 남길 것.

**미결 5건을 케이스 예시(패널 200~800, 기본 420)로 하나씩 닫았다.** 핵심은 "기준 너비"의 두 읽기다.
- **상한 읽기 `ceil(W/T)`**(채택): 이미지 폭이 T를 안 넘는다. **하한 읽기 `floor(W/T)`**(기각):
  열 폭이 T 밑으로 안 내려가지만 2열이 2T부터라 T=400이면 799까지 1열 — **원문이 불평한 상황
  그대로**다. 어느 산식이든 1→2열 전환 순간 이미지가 반으로 주는 건 피할 수 없고, 값이 정하는 건
  이미지가 머무는 범위 `[T/2, T]`뿐이다.
- **T=420**(section3 기본 너비와 같은 값): 진입 직후 화면이 현행과 동일하고 넓힐 때만 2열.
  400이면 아무것도 안 건드린 사용자의 진입 화면이 2열(210px)로 바뀐다. 상한 800이라 3열은 없다.
- **열 수는 `panelWidths.section3` 상태값에서 순수 함수로**, CSS `auto-fill`은 기각 — 브라우저가
  세는 폭은 안쪽 폭(420 − 패딩 24 − 간격)이라 전환점이 파생값이 되고, **스크롤바가 보이는
  환경(Windows·macOS 항상 표시)에선 15px 더 줄어 같은 421에서 OS마다 열 수가 갈린다.** jsdom은
  레이아웃을 안 해 테스트도 불가. section3은 `flexShrink:0` 고정폭이고 section2가 `flex:1`이라
  상태값이 곧 실제 폭이다.
- **제목 툴팁**: 2열(카드 ~192px)에서 긴 제목이 잘리는데 **현행은 잘린 제목을 읽을 방법이
  없었다** — 툴팁이 "더블클릭하여 타이틀 수정" 고정(오탐 문항만 제목 표시). D10이 만든 구멍이
  아니라 드러낸 것이라 이 작업에 포함("전체 제목 · 더블클릭하여 수정"). 두 줄 제목은 같은 행
  카드의 이미지 시작 위치가 어긋나 기각.
- **육안은 로컬 + 텍스트 기반 기출 PDF 1건**: 확인할 것이 전환·잘림·배지·편집·다크뿐이라 원본
  1건이면 된다. **이 머신엔 `tesseract`가 없어 스캔본은 감지 실패** — 그건 D10 결함이 아니라 무대.

**검증 계약 7건(D10-01~07), 구현 없이 테스트가 경로·이름을 먼저 고정했다** — `utils/questionGrid.js`
`columnsForWidth`, prop `columns`, 컨테이너 `data-columns`. 계획서 검증 계약 머리에 적어 `/implement`가
따르게 했다. **코드로 못 쓴 완료 기준 둘**: "열 수가 같은 동안 `QuestionCard`(memo) 리렌더 없음"은
memo 내부 렌더 횟수를 밖에서 셀 수단이 없어 리뷰로 대체(카드에 열 수를 안 넘기면 구조적 충족 —
Phase 1에서 확인), "이미지 폭이 열 폭을 따른다"는 jsdom 레이아웃 부재로 Phase 2 육안.

Phase 1 구현은 `main` 위에서 시작하려다 게이트에 걸려 `feat/D10-question-grid-columns`를 먼저 팠다.
카드의 `flexShrink:0`(계약 #5)은 grid 아이템용 `minWidth:0`으로 바꿨다 — **계약 #5의 원인(flex
축소)이 grid에서는 없어지지만, grid 아이템의 `min-width:auto`와 `overflow:hidden`이 만나는 다른
경로가 있어** Phase 2에서 이미지 높이를 실측해야 한다. 빈 상태는 grid 바깥 스크롤 래퍼에 남겨
종전처럼 세로 중앙. 자체 실행 7/7, 전체 86/86. 레포에 `eslint.config.*`가 없어 lint는 못 돌렸다.

⚠️ **`/testrun`이 D10-01~03 근거 인용을 단일 라인 grep 0건으로 잡았다** — 스펙이 바뀐 게 아니라
계획서 Phase 1 원문에서 "800 → 2," 뒤에 줄바꿈이 있어 인용이 두 줄에 걸쳤다. 계약 #25가 경고한
바로 그 모양(F09-22). 이번 `/checkpoint`에서 원문의 줄바꿈을 옮겨 한 줄로 맞췄다 — **인용을 짧게
자르는 대신 원문을 한 줄로 만든 이유**는 D10-01의 근거가 "200 → 1"이라 짧게 자르면 케이스와
인용이 안 맞기 때문이다.

### REQ-D11 계획서 작성 → 미결 3건 정리 → 검증 계약 7건 (구현은 내일부터)

메뉴 이름 변경의 접점을 전수 확인하니 **세 층**이었다 — 사이드바 `nav-config` 4개, 각 화면 `PageHeader`
제목·브레드크럼 5곳, 그리고 **옛 메뉴명을 가리키는 안내 문구 2곳**(결과 빈 상태 "문제집 편집 탭에서…",
분석 삭제 확인 "생성 이력은 남지만, 편집 화면에서…"). 셋째 층은 원문에 없지만 메뉴만 바꾸면 안내가
없는 메뉴를 가리키므로 포함했다. 원문의 as-is "문제집 생성"은 오기다 — 현재 메뉴는 "문제집 편집"이고
to-be "생성"은 그 화면(`/editor`)이다.

**미결 3건을 닫으면서 범위가 하나 늘었다 — 라우트 경로도 이번에 바꾼다**(`/create`·`/results`·`/templates`,
리다이렉트 없음). 근거: dev 프론트는 로드맵 끝에 재배포되므로 옛 URL이 실제로 깨지는 시점은 그때 한 번뿐이고,
"템플릿 관리"도 지금 바꾸면 REQ-30은 기능만 확장하면 된다. 기각 — 경로 유지(REQ-30에서 한꺼번에):
이름·주소가 어긋난 채 REQ-30까지 감 / 리다이렉트 유지: 라우트 3개가 늘고 옛 경로가 코드에 영영 남는다.
안내 문구는 단순 치환("생성 탭에서")이 어색해 **문장을 계획서에 박았다** — 구현자 재량으로 두면
`/testrun`이 판정할 근거가 없다.

⚠️ **경로 문자열을 네 곳이 각자 든다** — `paths.ts` 외에 `NotificationBell`의 이동 대상(`/history`)과
편집 화면 브레드크럼(`to: "/editor"`)이 직접 문자열이다. 벨만 안 고치면 "문제집 생성 완료" 클릭이
404가 아니라 **빈 화면**으로 간다(라우터 폴백 없음). Phase 2 완료 기준에 벨 이동을 넣었고, 구현은
직접 문자열을 `paths`로 모으는 쪽이 맞다. 아직 회귀를 낸 적이 없어 계약이 아니라 계획서 함정에 뒀다.

검증 계약은 **Phase 1 분 7건만**(D11-01~07). 편집·표지·작업 화면은 렌더 무대(API mock 5~6개)가 없어
D11-06·07은 **소스 문자열 스캔**으로 대체했다(승인) — "화면에 뜬다"까지는 보증하지 않는다는 한계를
표에 적었다. D11-02(옛 이름 0건)는 주석을 걷어낸 제품 소스를 스캔한다 — 옛 이름이 주석·훅 설명에
10곳 넘게 남아 있고 그건 화면에 안 보인다. Phase 2 케이스는 착수 직전에 `/testgen`을 다시 돌린다.

### TODO 3단계 신규 항목 6건 → 작업 단위 5개로 묶고 번호 부여 (D11·B12·F12·REQ-29·REQ-30)

D10이 닫히고 남은 "신규 항목"을 파일·계층 접점으로 묶었다(코드 델타 0). 접점 확인 결과 —
메뉴명은 `nav-config.tsx` + 각 화면 `PageHeader`뿐이라 단독이고, 벨 클릭은 `/analysis/{job_id}`로
navigate하는데 작업 화면 제목이 `workbookName || filename`이라 **목록이 넘겨주는 상태 없이 들어오면
이름이 빈다**(추정). 이건 D10 Phase 2에서 본 "URL 직접 진입이 목록으로 돌아감"과 같은 무대(목록을
거치지 않는 진입)라 하나로 묶었다. 각주·워터마크는 표지 CRUD와 같은 모양을 하나 더 만드는 일이고
템플릿은 그 결과물을 조합하는 엔티티라 **REQ-29 → REQ-30 순서가 문서상 확정적**이다(30은 29 없이는
조합할 게 표지뿐).

**TODO 원문 순서와 다른 점 둘.** ⑤(벨 job-id)는 버그라 앞으로 당겨 B12로, **②(테마)는 번호를 주지
않았다** — "컬러·글씨체·머릿글/바닥글 디자인"이 생성 PDF의 라벨인지 앱 UI인지 원문에 없고, REQ-30
템플릿이 생기면 그 속성으로 흡수될 가능성이 커서 지금 번호를 주면 빈 계획서가 된다. REQ-30 뒤에
`/workplan`에서 다시 정의한다.

번호는 CLAUDE.md 메모(2026-08-28 기준)를 믿지 않고 스펙 파일 + 인덱스 + TODO + 계획서 파일명을
합쳐 다시 뽑았다 — 결과가 메모와 일치했다(D11·B12·F12·29). CLAUDE.md 점유 범위 표를 2026-09-03
기준으로 갱신했고 다음 자유 번호는 `B13`·`C10`·`D12`·`F13`·`P06`·숫자 `31`.

**D11 착수 전 미결 둘**(`/workplan D11`의 안건): 라우트 경로도 바꿀지(`/history` 등) · 표지만 있는
지금 "템플릿 관리"로 먼저 바꿀지. F12는 **어느 화면의 현황판인지**(목록 `StatCards` vs 작업 화면
헤더)가 원문에 없어 착수 시 결정.

### REQ-D10 PR #8 머지 + 브랜치 정리

`feat/D10-question-grid-columns`를 `main`에 머지했다(머지 커밋 `48e445d`, merge commit — PR #1~#7과
같은 관례). 머지 전 전체 스위트 86/86 재확인. 머지 후 `merge-base --is-ancestor`로 tip 포함을 확인하고
로컬·원격 브랜치를 지웠다. dev 프론트 배포는 정책대로 하지 않는다 — 3단계 신규 항목이 끝나면 모아서.

### REQ-D10 Phase 2 육안 검증 완료 — 계획서 상태 ✅ 완료 (코드 델타 0, 커밋 없음)

로컬 백엔드(빈 로컬 스토리지) + 로컬 프론트에 `~/temp/pdf-extractor/`의 **"2026 2학기 중3 학교별
심화기출 Blue(1~3회).pdf"**(32쪽, 텍스트 기반)를 올려 확인했다 — 감지 99문항, 오탐 0건. 같은 폴더의
"내신마스터"(212쪽)는 첫 3쪽 텍스트가 147자뿐이라 스캔본으로 보고 제외(이 머신엔 tesseract가 없다).

**실측(playwright-core로 DOM 값을 직접 읽음, 1600×1000)** — 2페이지(4문항), 핸들 드래그로
420→421→800→200 순회:
- 420: `data-columns=1`, 카드 396 / 이미지 394px(패널 폭을 채움 — D01 보존). 200: 1열, 이미지 174px.
- **421: 2열**, 카드 192.5 / 이미지 190.5px. 800: 2열, 카드 382 / 이미지 380px. 3열은 나오지 않는다.
- **이미지 잘림 0** — 네 장 모두 렌더 높이가 `naturalHeight × (렌더 폭 / naturalWidth)`와 소수점까지
  일치하고 카드 `scrollHeight > clientHeight` 0건. 계약 #5가 걱정한 "grid 아이템 min-width:auto +
  overflow:hidden" 경로는 이 구성(`minWidth:0` + `width:100%` 이미지)에서 안 열렸다.
- 상호작용(2열, 421): 체크 → "삭제 (1)" · 더블클릭 → 입력란 → 긴 제목 저장 시 **말줄임(폭 145 /
  내용 345px)** + `title` 속성에 전체 제목·"더블클릭하여 수정" · 수동 추가 드래그 → 5문항 + "수동" 배지 ·
  수동 문항 벌크 삭제 → 4문항 + 되돌리기 토스트.
- 다크: 배경 `rgb(20,26,33)`, 카드·배지 정상. **오탐 문항이 없어 warning 색조 배경은 못 봤다.**

**⑤ 오탐 배지는 미확인으로 남긴다** — 계획서가 예고한 경우(2026-09-03 미결 ⑤: "없으면 그 사실을
PROGRESS에 적고 dev 확인 여부를 판단")다. 판단: **dev를 켜지 않는다.** 오탐 카드는 배지·설명 문장이
추가될 뿐 같은 `QuestionCard`이고, 2열에서 달라지는 건 제목 폭(~65px)뿐이라 D10-07 툴팁이 덮는다.
다음 dev 배포 후 실데이터에서 한 번 보는 것으로 충분하다(C09 육안 1건과 같은 묶음).

스크린샷 11장은 레포 밖 `~/temp/pdf-extractor/d10-shots/`에 있다(`light-w421`·`light-w800`·
`light-w200`·`dark-w421`·`light-04-edit/manual/delete-421` 등). D09 때와 같이 레포에 넣지 않는다.

**무대 함정 셋.**
- **1페이지(표지)는 문항 0건이라 그리드가 DOM에 없다** — 빈 상태를 grid 바깥에 뒀기 때문(Phase 1
  설계). 스크립트가 "그리드 없음"으로 죽어서 2페이지를 골라야 했다. `data-columns`를 기다리는
  자동화는 **문항이 있는 페이지를 먼저 선택**할 것.
- **URL 직접 진입(`/analysis/:jobId`)이 목록으로 돌아갔다.** 카드 클릭 진입은 정상. 감지 상태는
  DONE이라 F11 가드 대상은 아닌데 이유를 안 팠다 — D10 범위 밖이라 관찰만 남긴다. 재현되면 별건.
- **cua-driver 대신 playwright-core를 썼다** — 열 수·이미지 높이처럼 **숫자를 읽어야 하는 검증은
  DOM 접근이 있어야** 하고 cua-driver엔 JS 평가 도구가 없다(스크린샷·AX 트리뿐). 드라이버 격리
  Chromium은 띄웠다가 안 쓰고 닫았다. playwright-core는 레포가 아니라 스크래치패드에 설치
  (`channel:'chrome'`, 헤드풀). 클릭·드래그가 필요한 D09식 육안에는 cua-driver, 수치 실측에는
  playwright — 목적에 따라 갈린다.

## 2026-09-02

### REQ-D09·F10 Phase 5 체크리스트 구체화 (계획서만, 코드 델타 0)

Phase 5 완료 기준의 ①~⑥ 한 줄 요약을 실행 가능한 체크박스 20여 개로 풀어 계획서에 남겼다
(사전 준비·①~⑥ 각 항목·부가 확인·사후 정리). 계약 #1·#2·#5·#7·#17·#19·#18/#20이 육안에서
어디를 봐야 하는지까지 항목에 직접 연결해 뒀다 — 예: "③ 핸들 드래그 중 애니메이션 없이
마우스를 그대로 따라온다"는 계약 #19(간격 두 배 방지)와 짝, "카드 표지 이미지가 안 잘린다"는
계약 #5(flexShrink 미설정 시 증상이 "이미지가 좀 짧다"로만 보이는 함정)와 짝이다.

**육안 검증 자체는 아직 안 했다** — 체크박스는 전부 미체크로 남겨 뒀다. 다음 세션에서 dev
백엔드 `desired 0→1` 후 이 리스트를 그대로 따라가며 확인하면 된다.

## 2026-09-01

### REQ-D09·F10 Phase 1~4 구현 완료 + 전 케이스 녹색 확인 (`/implement` ×3 + `/testrun`)

전날 미판정이던 Phase 1 무대 결함을 먼저 걷었다 — `index.test.jsx`에 `MemoryRouter`를 씌우고,
jsdom에 없는 `IntersectionObserver`를 `setupTests.js`에 전역 스텁으로 추가했다. `HistoryPage`·
`AnalysisFilePage` 둘 다 `usePaginatedList`(무한 스크롤)를 쓰는데 이 화면들을 렌더하는 테스트가
지금까지 없어서 처음 드러난 환경 공백이었다. 두 수정 모두 이후 `/implement D09 2` 커밋에 함께
실렸다(`af423cd`) — `/testrun`이 남긴 무대 결함은 다음 `/implement`가 코드와 같이 커밋한다.

**Phase 2**(`af423cd`) — 미리보기 패널을 720px 고정폭(480~1000 리사이즈, `analysis/work.jsx`의
`section3` 패턴 재사용)으로 바꾸고 `CardResizeHandle`을 연결, 225ms width 전환(드래그 중엔 꺼서
마우스보다 늦게 따라오지 않게 함). **다운로드 아이콘 버튼의 접근성 이름 버그를 같이 고쳤다** —
`Tooltip`이 `disabled` 대응용 `<span>` 래퍼를 클론하면서 `aria-label`이 그 `span`에만 붙고 실제
`<button>`엔 이름이 없었다. 이 화면에 테스트가 지금까지 하나도 없어서(계획서에도 명시) D09-07이
처음 드러낸 기존 결함이지 D09가 새로 만든 게 아니다. `IconButton`에 `aria-label`을 직접 달아
해결 — `Tooltip`/`span` 구조 자체는 건드리지 않았다(다른 버튼까지 고치는 건 범위 밖).

**Phase 3**(`407e1c7`) — 이름 검색. `analysis/index.jsx`의 기존 검색 패턴(`useDebouncedValue`
300ms → `fetchPage` 참조 교체 → `usePaginatedList`가 처음부터 재로드)을 그대로 모방해 새 패턴을
만들지 않았다. `git diff backend/`가 빈 결과 — 백엔드 변경 0건을 계획서가 요구한 그대로 확인.

**Phase 4**(`daa3f38`) — 헤더 전역 검색 제거(`layout.tsx`)와 분석 화면의 `/?q=` 흡수 로직 제거
(`analysis/index.jsx`). **주소창은 정리하지 않았다** — URL을 지우던 주체가 흡수 로직 자신
(`setSearchParams({}, {replace:true})`)이라 "파라미터 무시"와 "`?q=`가 안 남는다"를 동시에
만족하는 구현이 없다는 게 전날 `/testgen` 단계에서 이미 판명된 사실이고, 그대로 반영했다.

`/testrun D09` — **14/14 케이스 전부 통과**, 전체 스위트 79/79, `tsc --noEmit` 에러 없음.
표 ↔ 테스트 매핑 완전 일치(누락·오탈자 없음), 근거 인용 7건 표본 검사 소실 없음. Phase 1~4는
완료 기준 충족으로 판정 — 계획서 체크박스·검증 계약 결과 열을 이번 기록에서 갱신했다.

**Phase 5(육안 검증)만 남았다** — 자동화 밖 영역이라 이 세션에서 못 봤다. dev 백엔드
`desired 0→1` 후 로컬 프론트로 6개 항목(전체 폭 그리드·225ms 전개·핸들 리사이즈·이름 검색이
뒷페이지까지 닿는지·CORS 없는 미리보기·헤더 검색란 부재)을 확인하고 `desired 0`으로 되돌려야
계획서가 완료 상태가 된다.

## 2026-08-31

### 문서 불일치 2건 정정 — 미러링한 값은 원본이 움직여도 안 움직인다 (문서만, 코드 델타 0)

`/progress 전주`가 잡아낸 것. 08-28 이후 커밋이 없고 작업 트리도 깨끗해서 **이 세션의 델타는 이 정정뿐**이다.

**① `TODO.md`의 "다음 REQ 번호" 목록이 하루 만에 어긋나 있었다.** 08-28에 CLAUDE.md의 번호표를
TODO.md 머리에 옮겨 적었는데, **같은 날 `C09`·`P05`를 소진하면서 CLAUDE.md만 `C10`·`P06`으로 갱신됐다.**
사본은 그대로 남아 다음에 `/workplan`이 이 줄을 보면 **이미 쓴 번호를 재발급한다** — 번호는 재사용하지 않는
규칙이라 충돌이 조용히 난다. 값을 고쳐 맞추지 않고 **미러링 자체를 지웠다**(CLAUDE.md 참조만 남김).
값을 고치면 다음 번호를 쓸 때 또 같은 자리에서 어긋나기 때문 — **틀린 사본을 고치는 것과 사본을 없애는 것은
수명이 다르다.** 어긋났던 사실은 그 자리에 한 줄로 남겼다(왜 목록이 없는지가 설명되어야 다시 안 적는다).

**② PROGRESS 인덱스의 "미착수 — 번호만 부여된 것" 절 서술이 표 상태와 반대로 남아 있었다.**
`REQ-P04`에 **"착수는 아직이다"**가 그대로 있었다 — 같은 파일 위쪽 인덱스는 `✅ Phase 0~3 완료`(08-27 머지)다.
같은 문단의 `F09`·`F11`도 `(위 인덱스 🟡)`로 굳어 있었는데 둘 다 이미 ✅다. **표는 매번 갱신되는데
그 표를 설명하는 산문은 갱신 대상으로 안 잡히는 것**이 원인이고, 셋 다 같은 모양이라 하나만 고치면
나머지가 다음에 또 걸린다. 넷을 한 번에 정정했다.

⚠️ **이 절은 "번호만 부여된 것"인데 본문이 *번호가 떠난 이유*까지 설명한다** — D08·F09·P04·F11이
"이 표에서 빠졌다"는 서술로 남아 있는 구조다. 이력으로는 값이 있지만 **REQ가 진행될 때마다 이 산문이
낡는다**는 부채가 있다. 이번엔 상태 표기만 맞췄고 구조는 건드리지 않았다 —
다음에 또 같은 정정을 하게 되면 그때 "떠난 이유" 서술을 로그 쪽으로 내리는 것을 검토한다.

### REQ-D09·F10 계획서 작성 + Phase 1 착수 (커밋 `22c28a8`·`f0d1021`·`645b6a3`)

D09(생성 이력 화면 개편)·F10(이름 검색)을 계획서 하나로 묶었다 — 둘 다 `pages/history/index.jsx`
한 파일이라 목록 UI를 갈아엎으면서 검색 바를 나중에 얹으면 같은 파일을 두 번 뜯는다.

**F10의 "서버 검색 선행 필요"가 낡은 전제였다는 걸 이번에 발견했다.** 그 메모는 2026-07-29에
적혔는데, 서버 검색은 나흘 앞선 2026-07-25(P03-03)에 이미 `list_workbooks(name=…)`로 들어가
있었다 — 메모를 쓸 때 `workbook.py`를 안 열어봤던 것. 규모 추정이 "소~중"에서 "소"로 내려가고
이 작업의 백엔드 변경은 0건이 된다.

미결 4건(폭 배분·검색 시 미리보기 유지 여부·애니메이션 길이·육안 검증 장소)을 같은 세션에서
전부 닫았다(계획서 §결정). 통계 카드·유형 검색·레이아웃 필터는 범위에서 뺐다(§범위 — 제외).

**Phase 1**(전체 폭 카드 그리드 + 클릭 전 미리보기 미렌더)을 구현하고 테스트 12건(D09-01~03,
그 다음 Phase 케이스까지 포함)을 작성했으나 **전부 무대 결함으로 미판정** — `PageHeader`의
브레드크럼 `Link`가 `Router`를 요구하는데 `renderPage()`가 감싸지 않아 단언 전에 터졌다.
`(a)` 무대 결함으로 분류해 `/testrun` 소관으로 넘겼다(다음 세션에서 처리). Phase 4 케이스
(D09-13·14, 헤더 전역 검색 제거)도 먼저 작성해 뒀다 — 구현 전이라 실패가 정상인 상태로 커밋.

## 2026-08-28

### 세션 마감 — 머지된 브랜치 정리 · 남은 상태

오늘 머지한 브랜치 4개를 로컬·원격 모두 지웠다. 삭제 전에 `git merge-base --is-ancestor` 로 네 tip 이 전부
main 에 포함됨을 확인했다 — **"머지됐다"를 PR 상태가 아니라 커밋 도달성으로 확인하는 것**이 유실을 막는 방법이다.
되살릴 일이 있으면: `feat/B11-…` `2e66c2d` · `feat/C09-…` `d4469f6` · `feat/P05-…` `e893dfc` · `fix/preview-cache-key` `b0ebaa6`.

**남은 상태** — dev 백엔드는 P05 이미지(`p05-c319903`=`latest`)로 배포된 뒤 `desired 0`. **dev 프론트는 B11 빌드에
멈춰 있고 그게 정상이다** — 2026-08-28 결정으로 프론트는 모아서 배포한다(로드맵 완료 시점 또는 백엔드 배포에
딸려야 할 때). `docs/TODO.md` 머리에 정책으로 적었다. 그래서 **"dev 에서 새 기능이 안 보인다"를 버그로 읽으면 안 된다.**

테스트는 오늘 28건 → **109건**(백엔드 44 · 프론트 65)이 됐다. 여전히 알림 경로 위주이고 문항 감지·PDF 생성은 0건이다.

### 생성 이력 미리보기 URL의 캐시 키 분리 (PR #6 `dd8c7bc`, REQ 번호 없음)

TODO 2단계의 마지막 항목. **계획서 없이 진행했다**(사용자 결정) — 한 줄짜리 우회이고 결정할 것이 없었다.

문제는 **같은 URL을 `Origin` 있는 요청과 없는 요청이 나눠 쓴다**는 것이다. 다운로드는 `<a href>` 이동이라
`Origin` 이 없고, 미리보기는 react-pdf 의 XHR 이라 있다. 버킷 CORS 응답에 `Vary: Origin` 이 없어 둘이 같은
캐시 키를 공유하므로, **다운로드가 먼저 캐시를 채우면 CORS 헤더 없는 사본이 남아 그 뒤 미리보기가 통째로 깨진다**
(2026-08-27 dev 실제 발생. 버킷 CORS 를 고쳐도 캐시된 사본은 그대로였고, wrangler OAuth 토큰에 캐시 퍼지 권한이
없어 만료를 기다렸다). 미리보기 쪽에만 `?preview=1` 을 붙여 키를 가른다.

⚠️ **presigned URL 에는 붙이면 안 된다** — 쿼리가 서명 대상이라 파라미터를 더하면 403 이 된다.
`R2_PUBLIC_DOMAIN` 이 없으면 백엔드가 presigned 를 돌려주므로(`generate_download_presigned_url` 의 폴백)
`X-Amz-Signature` 유무로 걸러야 한다. **dev 에서만 테스트하면 이 분기를 안 밟는다.**

문항 분석의 원본 PDF 미리보기는 같은 URL 생성기를 쓰지만 **다운로드 링크가 없어** 캐시 오염 경로가 없다 —
그래서 건드리지 않았다.

### REQ-P05 Phase 1~3 — 알림 지연의 정체는 전달이 아니라 **발행 전 대기**였다 (PR #5 main 머지 `6fba551`)

P04가 전달을 SSE로 바꿔 전송은 0.3~1.3s가 됐는데도 "재감지 클릭→벨 뱃지"가 9~12s였다. 코드를 보니
`emit_detection`이 `finally`에 있어 **썸네일 프리워밍이 끝나야** 알림이 나갔다. 프리워밍은 실패해도 온디맨드로
폴백되는 최적화인데 그것이 완료 통지를 붙잡고 있었다. **재감지·최초 감지 두 경로가 같은 구조**였다.

**dev 로그가 개선을 직접 증명한다**(샘플 24문항·6페이지, 최초 감지):

| 시각 | 사건 |
|------|------|
| 08:49:28.883 | 감지 완료 |
| 08:49:32.097 | DONE 상태 저장 |
| **08:49:32.0977** | **알림 발행** (저장 직후 0.6ms) |
| 08:49:40.224 | 프리워밍 끝 |

개선 전이라면 알림은 08:49:40에 나갔다 — **8.1초 단축**. "클릭→뱃지"를 통째로 재는 것만으로는 이 구간이
안 보이므로 **로그 타임스탬프로 구간을 갈라야** 판정이 된다.

**목표 5s를 7s로 정정했다**(2026-08-28 2차 결정). 실측 6.95s = 태스크 시작 1.2s + 감지 0.2s + **캐시 저장 3.2s**
+ 전송 1.3s인데, 캐시 저장(경계·페이지·상태 R2 PUT)은 **알림보다 먼저 끝나야 하는 필수 작업**이다 — 알림을 보고
들어간 화면이 읽을 것이 없으면 안 된다. 5s는 이 구간의 존재를 모르고 잡은 값이었다. 계획서 제약에 "알림을
캐시 저장보다 앞으로 보내지 않는다"로 명문화했다.

**측정 대상을 잘못 고르면 판정이 통째로 어긋난다.** 처음엔 dev의 실제 job(393문항)으로 쟀는데 73.58s가 나왔다 —
감지 자체가 69s인 큰 파일이라 P04 기준(9~12s, 작은 샘플)과 비교가 성립하지 않는다. PyMuPDF로 6페이지 24문항
샘플을 만들어 다시 쟀다. **기준 수치는 그것을 잰 파일과 함께 기억해야 한다.**

**피드 GET 3.79s → 1.31~1.52s**(26건, 중앙값 1.43s. 왕복 하한은 `/health` 0.28s). `list_feed`의 마지막 단계에서
50건을 순차로 읽던 것을 `ThreadPoolExecutor.map`으로 병렬화했다 — **`map`이 입력 순서를 보존**하므로 최신순 정렬이
그대로 유지된다(`as_completed`를 쓰면 순서가 깨진다). 키 이름만으로 거르는 앞단은 손대지 않았다.
1회가 1.52s로 목표를 살짝 넘었으나 편차 범위로 보고 충족 판정(2026-08-28).

**콜드 31s가 재현되지 않았다.** C09에서 desired 0→1 직후 `EventSource.onopen`이 두 번 ~31초였는데, 같은 조건
3회가 이번엔 **1004·269·344ms**였다. 조건이 같은데 값이 다르므로 원인은 태스크 콜드가 아니라 edge 쪽 상태로
보인다 — 재현 조건 불명으로 남겼다. **"콜드라서 그렇다"는 설명이 틀렸을 수 있다는 기록이 이 항목의 값이다.**

부수: 실측 스크립트가 dev에서 403을 받았다 — Cloudflare가 `python-urllib` UA를 막는다(curl은 통과). UA를 갈면 된다.
`POST /api/upload/notify`의 `job_id`는 body가 아니라 **쿼리 파라미터**다(422로 나타난다).

### REQ-C09 Phase 1·2 — 알림 경로 후속 4건 (PR #4 main 머지 `91a911a`)

**1단계 미결 6건을 먼저 닫고 시작했다.** F09·P04·B11 계획서에 흩어져 있던 것 — 실패 문구 출처(→ 서버 `message` 단일 출처,
계약 #12 계열) · `kind` 필터(→ 가려 받는다) · P04 콜드 기준(→ 정상 상태 기준, 콜드 제외) · 전역 딤 측정법(→ `GlobalDim` DOM,
카운터 노출은 기각 — 그 자체가 표면 변경) · B11 동승 알림(→ 기준선, 현재 동작 명문화) · F09 Phase 6 지연 상한(→ **질문이 소멸**했다.
전달이 타이머가 아니라 네트워크 이벤트 구동으로 바뀌어 숨김 탭 7.5분 drift 최대 485ms). 그중 **코드가 바뀌는 넷을 REQ-C09로 묶었다** —
넷 다 알림 경로의 소규모 변경이라 계획서를 넷으로 쪼갤 이유가 없었다.

**전역 딤 케이스(C09-10·11)는 이 파일만 `api/client`를 mock 하지 않는다.** 딤을 켜는 것이 `client.js`의 `_setLoading`이라
client 를 통째로 mock 하면 **측정 대상이 사라져 어떤 구현이든 통과한다.** `fetch`만 스텁하고 실제 client 를 태운다.
그래서 **양성 대조(C09-11)를 짝으로 붙였다** — 같은 무대에서 `apiFetch` 경유 GET 은 딤을 켠다. 이게 없으면 C09-10의 "안 켜짐"이
측정 도구의 고장인지 구현의 정상인지 구별되지 않는다.

**`: connected` 선발송의 실측**(dev, 백엔드 재배포 후):

| 측정 | 값 |
|------|-----|
| raw fetch 첫 청크 | **107ms** · 내용 `": connected\n\n"` |
| `EventSource.onopen` (콜드 태스크 직후) | 31.0s · 30.1s · 0.11s |
| `EventSource.onopen` (warm, 새 탭 5회) | **762 · 324 · 250 · 196 · 267 ms** |

종전 최대 30초 `CONNECTING`이 정상 상태에서 0.2~0.8s로 해소됐다. 다만 **콜드 직후 두 번은 여전히 ~31초**였고 그 값이 heartbeat
주기(30s)와 정확히 겹친다 — 첫 바이트가 edge/터널 warm-up 구간에서 붙잡히는 것으로 보인다. 코드가 아니라 콜드 구간의 문제라
P04 미결 ①(콜드 첫 3건이 느림)과 같은 계열이고, TODO 2단계 "콜드 원인 조사"로 넘겼다. **desired 0 운영이라 실사용자는 매번 이
콜드를 만난다**는 점이 이 항목의 우선순위를 정한다.

**예고된 무대 붕괴가 또 그대로 났다** — `: connected`가 맨 앞에 오자 "첫 N청크"를 세던 P04-05·06·07·10이 한꺼번에 깨졌다.
계획서가 P04-07 하나를 예고했는데 실제로는 넷이었다(같은 수집기를 쓰는 케이스를 다 세지 않았다). `/testrun`이 (a)로
`_collect_after_connected()` 헬퍼를 넣어 **선발송 한 줄만 걷어내고** 그 뒤를 세게 했다 — 각 케이스의 단언은 그대로다.
헬퍼가 첫 청크의 `connected`를 단언하므로 선발송이 사라지면 이 케이스들도 빨간불이 된다. P04-08은 `/testgen`이 미리 갱신했다.

⚠️ **Phase 1 완료 기준 중 육안 항목 하나가 미확인이다** — "재감지·생성 실패 시 화면 배너 문구 = 서버 `message`". 실패를 인위적으로
유발해야 해서 이번 dev 실측(성공 경로)에 넣지 못했다. 케이스 7건은 전부 녹색이고 훅이 알림 객체를 그대로 넘기는 것(C09-05)까지는
검증됐다. 화면 표시 자체는 **미검증**으로 남긴다.

**작업 순서를 문서로 고정했다** — `docs/TODO.md`에 6단계 로드맵(미결 결정 → 후속 → D09/F10/D10/신규 → 서버 여백 → REQ-27 → 운영).
사용자가 적어 둔 신규 항목 7건은 3단계 끝에 붙였다. 구 `docs/예정된작업.md`는 삭제하고 참조를 TODO.md로 돌렸다 —
미착수는 TODO.md, 완료 이력은 PROGRESS 인덱스가 이미 담고 있어 고유 정보 유실이 없다.

### REQ-B11 Phase 2 — dev 배포·육안 확인·계약 #27 정정 (PR #3 main 머지 `3d35d65`)

**육안 확인은 손이 아니라 스크립트로 했다** — `playwright-core` + `channel:'chrome'`(이 머신의 Chrome, 브라우저 다운로드 없음)으로
dev 사이트를 새로고침 5회: 매회 스낵바 **0건**, `/api/jobs` **1회**(추가 재조회 0), `/api/notifications` 1회 + `stream` 1회.
피드에 08-27 알림이 남아 있어 **재현 조건은 충족된 상태**였다(빈 피드였다면 통과가 의미 없다). 확인 뒤 dev 백엔드는 다시 `desired 0`.

**무대 함정 둘**: ① `page.goto(..., waitUntil:'networkidle')`은 **영영 안 돌아온다** — SSE 스트림이 상시 열려 있다. `load` + 고정
대기(8s, 스낵바 자동 닫힘 6s보다 길게)로 관찰해야 한다. P04 이후 이 앱에는 "네트워크가 조용해지는 순간"이 없다.
② ESM 스크립트에서 상수 이름을 `URL`로 지으면 전역 `URL` 생성자를 가려 `new URL()`이 죽는다 — 사소하지만 첫 실행을 통째로 날렸다.

**계약 #27 정정**: "렌더 중에"는 데이터가 있는 렌더를 전제한 문구였다. "기준선 GET이 돌아온 뒤의 렌더 중에(`useNotificationsReady()`가
참이 되는 렌더)"로 고치고, 첫 렌더에서 잡으면 빈 기준선이 되는 이유를 붙였다. 육안 절차에도 "새로고침 후 토스트 0건"이 들어갔다.

dev 프론트는 `feat/B11-notification-baseline` 빌드였고 같은 날 PR #3로 main에 머지돼 main과 동일하다.

## 2026-08-27

### REQ-P04 Phase 1·2 — 폴링이 코드에서 사라졌다 (브랜치 `feat/P04-sse-push`, 미머지)

**Phase 1(백엔드)의 미판정이 풀렸다.** 08-26 wip에서 P04-04(`GET /stream`이 `text/event-stream`)가 판정 불가였던 이유는
구현이 아니라 **Starlette `TestClient.stream()`이 응답 본문 생성기가 끝나야 컨텍스트를 빠져나오기** 때문 — heartbeat
루프가 무한이라 테스트가 영원히 매달린다(SIGALRM으로 확인). 라우트 헤더만 보는 케이스라 생성기를 유한한 것으로
`monkeypatch`해 무대만 바꿨다((a)). 본문 형식은 P04-05~10이 생성기를 직접 돌려 검증하므로 커버리지 손실 없음.
**교훈: 무한 스트림 엔드포인트는 `TestClient`로 본문을 읽지 말 것** — 생성기 단위로 잘라 검증한다.

**Phase 2(프론트)는 P04 케이스 8건이 첫 실행부터 녹색**이었고, 걸린 것은 F09 잔여 케이스 쪽이었다.
- F09-19~24(since·주기·감속·복귀·실패 재시도)는 **폴링 자체를 단언**하므로 정의상 깨진다 → 계획대로 삭제(P04-20~27 대체).
- **F09-28(증분 누적)은 단언은 유효한데 무대가 폴링 전제**였다 — 증분을 "2번째 GET"으로 흘리는데 GET이 1회뿐이 됐다.
  증분을 스트림 이벤트로 흘리게 무대만 정정((a)). 계획서 문구 "데이터 처리는 안 바뀌고 도착 경로만 바뀐다"가 분류 근거.
  **"잔여 케이스 회귀 0건"을 완료 기준으로 둘 때는 잔여 케이스의 *무대*도 전제를 공유하는지 봐야 한다** — 단언만 보면 놓친다.

**구현에서 정한 것 하나**: 스트림 URL은 `client.js`에서 export하지 않고 컨텍스트가 `VITE_API_BASE_URL`로 직접 만든다.
테스트가 `api/client`를 통째로 mock하므로 새 export는 거기서 `undefined`가 돼 EventSource 생성 자체가 죽는다.
`EventSource`가 없는 환경(jsdom·SSR)에선 기준선 GET만 살고 스트림은 건너뛴다 — F09 잔여 테스트가 이 경로를 탄다.

`grep -rn setInterval frontend/src` 0건 달성 — 마지막 1건은 `useJobCompletion.js` 주석이었고 문구를 바꿨다.
**계약 승격 후보**(구현 뒤 재검토 조건 충족): `emit()` threadpool → `call_soon_threadsafe` 함정(08-26 예고분, P04-02가 지킨다).

Phase 3 착수 전 상태: dev 백엔드 `desired 1` 켜져 있음(08-21부터). 배포 시 프론트는 Worker 수동 배포(CLAUDE.md "배포 (프론트엔드)").

### REQ-P04 Phase 3 — dev 배포 + CLI 실측 (브라우저 실측·desired 0 남음) · R2 CORS 별건

**배포**: 백엔드 이미지 `latest`=`p04-2a343a4`(ECS rev 2, desired 0→1), 프론트 Worker 번들 `index-6kxyztXv.js`.
배포 직후 `/stream`이 502를 한 번 냈다 — uvicorn이 뜨기 전 요청이 닿은 롤아웃 레이스일 뿐, 재현 안 됨.

**CLI 실측**(이 머신 → HKG edge → 터널, stdlib SSE 클라이언트 2개, 트리거는 정크 job 재감지 16회):

| 항목 | 결과 | 수치 |
|------|------|------|
| ① 완료(`created_at`)→도착 | 정상 상태 ✅ · **배포 직후 3건 ❌** | 13건 **0.26~1.29s** / 03:17 첫 3건 **2.3~3.1s** (시계 편차 보정 후) |
| ② 구독자 2개 | ✅ | 같은 이벤트 12건, 도착 편차 ≤ 0.03s |
| ③ 5분 idle 후 도달 | ✅ | 318s 무이벤트 → 0.26~0.87s 도달, keepalive 28.0~30.5s |
| ④ 끊김 중 발생 → `Last-Event-ID` | ✅ | 재연결 첫 이벤트 = 놓친 알림, 살아 있던 클라는 실시간 |

**측정 함정 셋 — 다음에 재려면 먼저 알아야 한다.**
- **서버(ECS) 시계가 이 머신보다 1.60~2.20s 빠르다.** raw `도착−created_at`은 0.7~0.9s(첫 3건)·**음수**(나머지)로
  나와 그대로 읽으면 첫 3건이 "통과"로 보인다. 편차는 `POST /api/upload`의 `uploaded_at`을 로컬 시각 창으로 5회 감싸
  교집합으로 잡았다(프로브 job은 삭제). **절대 지연을 서버 타임스탬프로 잴 때는 편차부터 잰다.**
- **Cloudflare edge는 첫 본문 바이트가 나올 때까지 응답 헤더를 붙잡는다.** 로컬 uvicorn 직결은 헤더 4ms, 터널 경유는
  30s heartbeat까지 무응답. 브라우저 `EventSource`가 최대 30초 `CONNECTING`으로 보이지만 유실은 없다(origin 구독은 즉시).
  Phase 0 프로브(15s heartbeat)로는 안 보였던 것. 해법 후보: `event_stream()` 구독 직후 `: connected` 1줄 선발송.
- **`Python-urllib` UA는 Cloudflare가 403으로 막는다** (curl은 통과). 측정 클라이언트에 브라우저 UA를 준다.

**배포 직후 3건이 느린 원인은 미확인**(콜드 태스크의 R2 PUT+LIST 뒤 publish 추정). "N ≤ 2s"를 정상 상태 기준으로
볼지는 미결로 올렸다. 계획서 ①의 "벨 뱃지 반영, 활성·숨김 탭"과 ②의 "네트워크 탭"은 **브라우저에서 사람이 봐야 한다** —
CLI로 잰 것은 전송 지연이지 화면 반영이 아니다. 뜻밖의 확인 하나: 브라우저에서 벨을 열자 `read` 이벤트가 CLI 클라이언트에
도달했다(읽음 동기화 실측 통과).

**브라우저 실측(사용자) 통과 → Phase 3 완료, dev 백엔드 `desired 0`.** 네트워크 탭: 목록 GET 1회 + stream 1건 유지, 탭 2개도 각 1개.
재감지 클릭→벨 뱃지 활성 12·9·9s, 숨김 탭은 복귀 즉시. 9~12s의 대부분은 **재감지 완료→알림 발행 사이 서버 작업**
(경계·페이지 캐시 R2 PUT + 문항별 루프 ~6s)이라 P04 범위 밖 — 후속 성능 후보. 첫 진입 `GET /api/notifications`가
**3.79s**인 것도 같은 계열(R2 LIST + 50 GET, 후속 후보).

**발견 — 새로고침마다 직전 알림 토스트가 뜬다(F09 Phase 5부터, P04 회귀 아님).** `NotificationSnackbar`가 기준선을
첫 렌더에 잡는데 그때는 기준선 GET이 아직 안 돌아와 목록이 비어 있다 → GET 도착분 전부가 "신규"로 보여 최신 1건이
토스트로 뜬다. 벨 숫자는 서버 `unread_count`라 안 는다. 계약 #27의 "렌더 중 기준선"이 **데이터가 아직 없는 렌더**에서는
성립하지 않는 사례 — 기준선은 "첫 GET 응답"이 돌아온 뒤에 잡아야 한다. **B11 후보.**

**R2 edge 캐시 결정**: 캐시는 유지하고(R2까지 매번 가지 않게), 재발하면 대시보드 퍼지로 처리한다(소규모 개인 프로젝트,
2026-08-27 사용자 결정). 재발 조건 — **`Origin` 없는 요청(다운로드 링크·직접 열기)이 먼저 캐시를 채우면** 그 사본엔
CORS 헤더가 없고 `Vary: Origin`도 없어 미리보기가 깨진다. 프론트에서 미리보기 URL에만 쿼리를 붙여 캐시 키를 가르는
한 줄 우회가 있다(후속 후보). wrangler OAuth 토큰은 zone 조회는 되지만 **캐시 퍼지 권한은 없다.**

**별건 — 생성 이력 PDF 미리보기 CORS.** `download_url`이 R2 공개 도메인 `dailystudy-dev.yejicraft-cf.com`인데 버킷 CORS가
`localhost:5173`만 허용하고 있었다(업로드 PUT용으로 만든 것). dev 프론트 오리진 + `HEAD` + `Range` 허용 + `Content-Range`
등 노출로 갱신(`wrangler r2 bucket cors set`, OAuth). **이 설정은 코드에 없다** — dev R2 API 토큰은 `GetBucketCors`
권한조차 없어 aws cli로는 못 보고, wrangler 로그인으로만 닿는다. 설정 후 ~20초 전파 지연.

### REQ-B11 Phase 1 — 알림 기준선을 "기준선 GET이 돌아온 뒤"로 옮겼다 (브랜치, 미머지)

**결정 셋(사용자, 오늘)**: 신호는 **`useNotificationsReady()` 훅 하나를 더 내는 방식(D)** — `useNotifications()`의 반환 형태에
`ready`를 얹는 안(A)은 P04-26이 키를 글자 그대로 고정하고 F09 47건이 그 표면 위라 기각. 데이터에 `baseline` 표식(B)은
`Last-Event-ID` 복구분과 구분이 애매, "처음 비어있지 않은 렌더"(C)는 새 설치에서 첫 알림을 놓치는 추정이라 기각.
**GET 실패 시에도 즉시 ready** — 안 켜면 스낵바·재조회·완료 훅이 영영 침묵한다(재시도 로직 없음). **세 소비처 모두 게이트** —
`useJobCompletion`은 `jobId`가 클릭으로만 들어와 지금은 재현되지 않지만, "생성 중 복원" 류가 들어오면 자동 다운로드가 튀는 자리다.

**08-10 육안 검증에서 놓친 이유**: 봤는데 "방금 끝난 게 떠서 그런 줄" 정상으로 오해했다. 절차에 "새로고침 후 토스트 0건"이
없었다 — Phase 2 육안 항목으로 넣었다. **재현 무대의 핵심은 GET의 resolve 시점을 테스트가 쥐는 것**(deferred) — 즉시 resolve면
버그가 안 보인다. F09-45가 이 버그를 못 잡은 이유가 그것("데이터가 있는 마운트"만 봤다).

**예고된 무대 붕괴가 그대로 났다**: 소비처가 새 훅을 import하자 F09 테스트 3파일의 `vi.mock`(훅 하나짜리)에서 13건이 죽었다.
계획서에 미리 적어 둔 대로 `/testrun`이 (a)로 mock을 보강했고 단언은 손대지 않았다. **컨텍스트 모듈에 export를 추가하면
그 모듈을 통째로 mock한 테스트가 전부 깨진다** — 부분 mock(`importOriginal`)을 안 쓰는 대가이고, 다음에도 같은 모양으로 난다.

미결 1건 후속: `ready`가 켜지는 같은 렌더에 신규 알림이 실려 오면 기준선인가 신규인가(현재 동작: 기준선. 결정이 아니라 부산물).

## 2026-08-26

### 계획서 헤더 정정 — B10·F09·F11 "미배포/배포 보류"가 인덱스와 어긋나 있었다 (문서만)

`/progress 예정`에서 잡힌 불일치. 08-21에 dev 배포를 끝내며 CLAUDE.md와 인덱스는 갱신했지만
**계획서 헤더 세 개는 그대로 "미배포"(F09·F11)·"배포 보류"(B10)로 남아 있었다.** 그날 `/checkpoint`가
계획서 대조를 "이번 델타의 REQ"로만 좁혀서 — 배포는 REQ 작업이 아니라 세 REQ의 헤더가 델타에서 빠졌다.
**배포처럼 여러 REQ의 상태를 한꺼번에 바꾸는 일은 계획서를 `grep '미배포'`로 전수 확인할 것.**

B10 헤더에 남긴 사실 하나: 배포 보류 기간(7-31 ~ 8-21)에 dev에서 생긴 고아 결과물은 청소하지 않았다.
코드 변경 0건.

### REQ-P04 계획 확정 — 미결 4건 답 + Phase 1~3 정의 + 숨김 탭 실측 (코드 변경 0건)

**미결 4건을 사용자 결정으로 닫았다** — SSE(WS 기각: 단방향에 양방향 프로토콜을 쓸 이유가 없고, `EventSource`가
재연결·`Last-Event-ID`를 공짜로 준다. 승인 조건 문구 "웹소켓"은 방식이 아니라 "푸시로 바꾼다"는 뜻으로 읽었다) ·
1태스크 가정을 주석으로(스토리지 폴링 브로드캐스트 기각 — 없는 문제를 미리 푸는 비용) · 폴링 **완전 제거**(폴백 기각 —
경로 2개를 영구 유지하면 스로틀링·다중 탭 문제가 조용히 되돌아온다) · 완료 기준 **N ≤ 2s, 활성·숨김 동일**.
근거와 재검토 조건은 계획서 결정 표에.

**계획서를 채우며 정한 것 둘**: 재동기는 프론트가 아니라 **서버가 `Last-Event-ID`로 재전송**(프론트 코드 0줄, 첫 연결/
재연결 분기가 테스트 대상이 되지 않는다), **첫 연결엔 재전송 없음**(안 그러면 앱을 열자마자 스낵바가 쏟아진다 — 계약 #27과
같은 사고). `unread_count`는 이벤트에 동봉하고 읽음도 `read` 이벤트로 흘린다 — 프론트가 세면 다른 탭의 읽음이 안 보인다.

**함정을 하나 미리 적어 뒀다**: `emit()`은 `BackgroundTasks` threadpool에서 돌아 asyncio 루프 밖이다. `Queue.put_nowait`를
거기서 직접 부르면 **에러 없이 구독자가 안 깨어난다.** `call_soon_threadsafe`가 필요하고, 같은 스레드에서 도는 단위 테스트는
이걸 못 잡으므로 케이스 하나는 threadpool 경유로 발행해야 한다. 구현 뒤 계약 승격 후보.

**숨김 탭 실측(Phase 0 잔여 1건) — 통과.** 로컬 stdlib SSE 서버 + 실제 브라우저, 7.5분 숨김: 91건 전량 도달, drift 평균 10ms·
최대 485ms, **5분 경과(intensive throttling) 이후도 0~4ms.** 타이머 스로틀링은 `EventSource` 메시지에 안 걸린다 —
"활성·숨김 동일"이 성립. 터널 없이 잰 이유: 재는 대상이 인프라가 아니라 브라우저라서. 미측정: 화면 잠금·다른 데스크톱.
**P04 미결 0건.**

## 2026-08-21

### dev 프론트 배포 — "Pages 자동 배포 불통"이 아니라 **자동 배포가 없었다** (Worker에 수동 배포로 반영)

**8-18 진단이 틀렸다.** 프론트의 실체는 Cloudflare Pages가 아니라 **Workers 정적 자산 `twilight-base-302d`**
(계정 `kimyeji2035`)다. 근거 셋 — `twilight-base-302d.pages.dev`는 DNS 자체가 없고,
`twilight-base-302d.kimyeji2035.workers.dev`가 커스텀 도메인과 같은 번들(`index-BP07yiY1.js`)을 주며,
Worker에 Builds(GitHub 연결) 설정이 없다. `wrangler deployments list`로 본 이력은 **2026-05-16
"Source: Upload" 2건**이 전부 → 5월에 한 번 수동으로 올린 뒤 아무도 다시 안 올린 것이다. 8-10·8-18 push에
배포가 안 생긴 건 고장이 아니라 **고장날 자동화가 없었기 때문**이다. `plan-infra-frontend.md`의
"main push → 자동 빌드"는 계획으로만 쓰이고 실제로 구성된 적이 없다.

> 분기점은 사용자가 대시보드에서 이름(`twilight-base-302d`)을 찾아 준 것이었다 — 레포 어디에도 프로젝트명이
> 없어 그 전엔 Pages를 전제로 대시보드/토큰만 기다리고 있었다. "형용사-명사-hex" 랜덤 이름은 Workers가
> 붙이는 형식이고, Cloudflare가 2025년부터 신규 Git 프로젝트를 Pages 대신 Workers로 유도한다.
> **문서가 "Pages"라고 해도 실체는 확인하고 믿을 것.**

**배포**: 이 머신에서 `wrangler login`(OAuth) → `frontend/wrangler.jsonc` 신설(name · assets=`./dist` · SPA 폴백)
→ `npx wrangler deploy`. 8-18에 만들어 둔 `dist`(8-10 `12b38be` 빌드, API URL dev로 박힘, 이후 `frontend/src`
변경 없음)를 재빌드 없이 그대로 올렸다. 버전 `77f71a1f`. **B10·F09·F11·D07·D08 프론트가 dev에 처음 반영됐다.**
검증은 dev 백엔드를 `desired 1`로 켜서 했다(`/health` 35초 만에 200 · `/api/notifications`가 8-10 실데이터 응답).
**백엔드는 켜 둔 채 마감** — 사용자 육안 확인 후 `desired 0`으로 내릴 것.

**덤으로 잡힌 결함 하나** — 옛 배포본은 `/analysis`·`/history` **직접 진입이 404**였다(SPA 폴백 미설정).
새로고침·URL 공유가 전부 깨져 있었는데 아무도 dev를 쓰지 않아 드러나지 않았다.
`not_found_handling: single-page-application`으로 함께 해소(배포 후 200 확인).

**엣지 캐시 함정** — 배포 직후 커스텀 도메인 **`/`만** `cf-cache-status: HIT`로 옛 HTML을 줬고 `/analysis`와
workers.dev는 새 번들이었다. 쿼리스트링을 붙여도 HIT였다(존 캐시 규칙이 무시하는 듯). 퍼지 없이 몇 분 내
스스로 갱신됐다 — **배포 직후 "안 바뀌었다"는 판단은 루트가 아니라 다른 경로나 workers.dev로 한다.**

**문서 정정**: CLAUDE.md · 인덱스 B10/F09/F11의 "프론트 미배포" · 인프라 표 · `plan-infra-frontend.md` ·
`spec-infra.md`의 Pages 표기를 Workers로. 자동 배포를 원하면 Worker Settings → Builds에서 GitHub 연결을
**새로 만드는** 별도 작업이다(루트 `frontend`, `npm run build`, env `VITE_API_BASE_URL`) — 이번엔 하지 않았다.

### 🔴 시크릿 점검 — `backend/.env.dev`의 dev R2 키가 공개 레포에 7주간 노출 (추적 해제, 키 회전은 미완)

사용자 요청으로 전체 히스토리를 훑었다. **`backend/.env.dev`가 `206bea0`(2026-07-04 "실행 환경 정리")에
실제 `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`를 담은 채 추적됐고**, 레포는 public이다. 원인은
`.gitignore`가 `/*/.env`만 막아 **접미사 붙은 실제 값 파일이 패턴을 비껴간 것** — 계약 #24가 "`.env`와
바이트 동일"이라고 적어 두고도 추적 여부는 아무도 안 봤다. 그 외(AWS 키·터널 토큰·개인키·JWT)는 0건.

조치: `git rm --cached` + `.env.*` 무시(템플릿 `.env.example`·`.env.local`만 예외) + 계약 #24 정정. **키 회전은
사용자 몫으로 남았다** — 공개 7주면 수집됐다고 봐야 하므로 **회전이 본체고 이 커밋은 재발 방지일 뿐이다.**
회전 후 Secrets Manager `pdf-extractor/dev`·로컬 `.env` 갱신 + ECS 재배포가 따른다. 히스토리 세탁(filter-repo
+ force push)은 사용자 결정 대기.

## 2026-08-18

### REQ-P04 Phase 0 — 인프라 실측 완료 (경로 통과 · idle 컷 125s) + 이 머신 배포 환경 구성

**계획서의 "코드 변경 없음"에서 한 발 벗어났다 — 스트리밍 엔드포인트 없이는 잴 수 없다.**
그래서 `main`은 그대로 두고 **throwaway 브랜치 `feat/P04-phase0-probe`(`8b50a57`·`e8ac995`)** 에
프로브 라우터(`/api/_probe/sse`·`/api/_probe/ws`) + 측정 클라이언트 + 원본 JSONL을 넣어 dev에
`p04-probe` 태그·태스크 정의 rev 3로 배포했다. `latest`는 건드리지 않았고, 브랜치는 결과를 계획서로
옮긴 뒤 삭제했다(커밋은 reflog에 한동안 남는다). **결과 표·수치·결론은 [PLAN-P04 § Phase 0 결과]
(plans/PLAN-P04-websocket-push.md)에 있다** — 여기엔 판단과 함정만 적는다.

**핵심 수치 셋**: (1) SSE·WS 모두 **15분 통과, 버퍼링 없음**(drift ~0.3s 상수 = 서울→HKG edge 왕복).
(2) **오리진 무전송 125초에 edge가 끊는다** — Cloudflare 문서 Proxy Read Timeout 125s와 일치, 60s
heartbeat 생존·130s 사망으로 양쪽에서 조였다. (3) **WS는 uvicorn 기본 프로토콜 ping(20s)만으로
살고**, SSE는 앱 heartbeat가 필수. → 인프라는 프로토콜 선택에 **중립**이고, 미결 5건 중 "인프라
통과"는 닫혔고 "완료 기준 수치"는 절반(heartbeat 30s·전달 지연 0.3s)이 채워졌다.

> **로컬에서는 절대 안 잡히는 종류다.** 터널이 없으면 heartbeat 없이도 멀쩡하다. 그래서 계획서
> 함정에 "heartbeat는 나중에 붙이는 게 아니라 구현의 일부"로 박아 뒀고, P04 구현이 들어가면
> 계약 승격 후보다(아직 코드가 없어 지금은 승격하지 않는다).

**측정 도구 결함이 결과를 하나 삼켰다.** 3번(SSE idle) 런이 summary 없이 죽었다 — 프록시가 청크
스트림 중간을 끊으면 EOF가 아니라 `http.client.IncompleteRead`가 나는데 `OSError`로만 잡고 있었다.
서버 로그(CloudWatch)의 `close after 125.1s`로 먼저 값을 읽고, 분류를 고쳐 2회 재확인했다.
**"끊김"에는 EOF 말고도 모양이 있다** — 다음 하니스를 쓸 때 첫 번째로 볼 것.

**미측정 1건이 남았다 — 브라우저 숨김 탭.** P04의 존재 이유(타이머 스로틀링 회피)를 직접 확인하는
항목인데 노드 클라이언트로는 재현이 안 된다. Phase 1 착수 전 dev 프론트 콘솔에서 EventSource로
5분 확인해야 한다(계획서 Phase 0 항목에 적어 둠).

**이 머신에 배포 환경을 새로 마련했다.** 착수 시점엔 `aws`·`docker`·`~/.aws`가 없어 실측이
"하니스 준비"에서 멈췄고, 사용자 결정으로 brew 설치: awscli 2.36 · docker CLI + buildx ·
**colima**(Docker Desktop 대신, `--vm-type vz --vz-rosetta`, 로그인 시 자동 기동). Rosetta binfmt로
`--platform linux/amd64` 빌드가 되는 것까지 확인했다. AWS 키는 사용자가 IAM에서 새로 발급해
직접 등록했다(`user/yjkim`, 이전 배포 머신의 키는 그대로 유효).

**dev 상태 두 가지 — 둘 다 예상과 달랐다.**
- 서비스는 **`desired 0`으로 의도적으로 내려져 있었다**(530의 정체). 실측을 위해 `desired 1`로
  올렸고 **그대로 켜 두었다**(rev 3 = 프로브 이미지). 내릴지, 이 김에 `main`을 정식 배포할지 미결.
- ECR `latest`가 **2026-05-16**이다. 즉 미배포는 B10·F09·F11 세 건이 아니라 **6~8월 작업 전체**
  (P02·P03·D07·D08 포함)다. "미배포 3건"은 7-31 이후만 센 것이었다 — 인덱스의 배포 상태 표기가
  실제 dev와 어긋나 있었던 셈이다.

**곁가지 발견**: `backend/`에 `.dockerignore`가 없어 `COPY . .`가 `venv/`(163MB)·`tests/`를 이미지에
넣는다. 배포 머신에 `.env`가 있으면 그것도 들어가는 구조. 이번엔 손대지 않았다.

### dev 배포 — 백엔드 ✅ / 프론트 ⚠️ 막힘 (Cloudflare Pages 자동 배포가 안 돈다)

**백엔드**: `main`을 `latest`로 빌드·푸시하고 서비스를 **`latest` 기반 rev 2로 되돌려** 강제 재배포했다
(프로브용 rev 3은 남겨 두되 미사용). 실행 태스크의 이미지 digest = 새 `latest` digest 확인, `/api/_probe/*`
404(프로브 제거), `/api/notifications` 200 — **F09 알림 API가 dev에 처음 올라갔다.** 5-16 이후 백엔드
작업 전체가 이 한 번으로 올라간 셈이다. 검증 후 **`desired 0`으로 다시 내렸다**(원래 상태·비용).
다시 켤 땐 `aws ecs update-service … --desired-count 1`이면 된다(이미지·리비전은 그대로).

**프론트는 못 올렸다.** 배포된 프론트가 **5월경 빌드**다 — 단일 1MB 번들에 D07 이후 코드 스플리팅도,
D08 사전 페인트 스크립트도 없다. 문서(`docs/infra/plan-infra-frontend.md`)상 Pages는 `main` push
자동 빌드인데, **08-10 push(프론트 코드 포함)도, 오늘 push도 배포를 만들지 않았다**(4분 30초 관찰).
GitHub 연결이 끊겼거나 빌드가 실패 중인데 **Cloudflare 대시보드/API 토큰이 없어 어느 쪽인지 알 수 없다.**
→ 대시보드 Deployments 확인 또는 API 토큰(Pages 편집)이 선행. 그동안 **직접 업로드용 빌드는
`frontend/dist/`에 준비**해 뒀다(`VITE_API_BASE_URL`을 dev API로 박아 빌드).

> **함정 — `frontend/.env.local`이 `localhost:8000`을 가리킨다.** 그냥 `npm run build`하면 dev용
> 번들에 localhost가 박힌다. Vite는 셸 환경변수가 `.env*`보다 우선하므로
> `VITE_API_BASE_URL=https://dailystudy-workbook-api-dev.yejicraft-cf.com/api npm run build`로 덮어야
> 한다. Pages 자동 빌드는 대시보드 환경변수를 쓰니 이 함정은 **직접 업로드 경로에서만** 난다.

**오늘은 여기까지.** 미결로 넘긴 것: 프론트 dev 배포(Pages 원인 규명) · P04 Phase 1~ 정의(`/workplan`) ·
브라우저 숨김 탭 측정.

<!-- 최신이 위. 날짜 헤딩은 `## YYYY-MM-DD` 형식을 반드시 지킬 것 (/progress 가 파싱) -->

## 2026-08-10

### 피처 브랜치 2개 병합 → `main` · 미결 7건 정리 · REQ-P04 계획서

**병합**: `feat/F09-…` → `feat/F11-…` 순서로 쌓여 있어(F11이 F09를 통째로 포함) **분기가
없었고 fast-forward로 끝났다**(`7611272..f32127e`, 15커밋). 병합 커밋이 안 생기므로
**"언제 병합했나"는 git에 안 남는다** — 그래서 여기 적는다. 병합 후 `main`에서 백엔드 18/18 ·
프론트 42/42 · 빌드를 다시 확인했고, 원격·로컬 피처 브랜치는 삭제했다.
(`claude/*` 브랜치 3개는 예전 세션 잔재로 보이나 **내용을 확인하지 않아 그대로 뒀다.**)

**미결 7건 정리 — 코드 변경 0건.** 넷은 현행 구현을 그대로 확정했고, 셋은 성격을 정리했다.

- **`since` 출처 = 마지막 알림의 `created_at`** — 서버가 찍은 시각이라 **클라이언트 시계 오차가
  안 낀다.** "마지막 폴링 시각"은 증분이 작아지지만 **브라우저 시계가 빠르면 그 사이 알림을
  영영 놓친다.** 유실이 조회 비용보다 비싸다는 판단은 § 단일 피드 파일 기각과 같은 기준이다.
- **백오프 없음** — 서버가 죽으면 5초마다 실패 요청이 나가지만 로컬·1인 서비스라 실질 부하가
  없고, **P04가 오면 이 폴링 경로 자체가 사라진다.** 사라질 코드에 복잡도를 넣지 않는다.
- **`unread_count`는 서버 값 그대로** — 프론트가 재계산하면 다른 탭에서 읽은 것이 반영되지
  않는다. F09-47이 이 구조 위에 뱃지 억제를 키 기반으로 굳혔다.
- **F11 모달 ESC·바깥 클릭 = 확인과 동일** — 어느 경로로 닫든 차단이 유지된다(현 동작 확정).
- **`PENDING` 문구는 갈린 채 유지** — 목록("처리 중")은 여러 상태를 한 단어로 훑는 자리고,
  상세("재감지 대기 중")는 **무엇을 기다리는지** 말해야 한다. 계약 #12(라벨 단일 출처)와 달리
  **생성물이 아니라 화면 문구**라 갈려도 회귀가 아니다.
- **다중 탭 → P04 이관**, **스로틀링 상한 → Phase 6에 존치**(이연된 동안 답이 필요 없다).

> **4건이 전부 "현행 확정"으로 닫힌 것 자체가 기록할 만하다.** 구현이 앞서고 결정이 뒤따른
> 상태였는데, 되돌릴 이유가 없다고 판단해 **코드를 건드리지 않고 문서만 맞췄다.**

**REQ-P04 계획서 작성** — 전사에서 출발점을 찾았다(2026-08-03): *"차후 상시 폴링 하는 부분
모두 웹소켓으로 변경 계획 있음"*. **P04는 성능 개선이 아니라 상시 폴링 승인에 붙은 조건의
이행**이라는 성격이 여기서 나온다. 그리고 **전환 대상이 줄었다** — 8-03에는 폴링이 3곳이었지만
F09 Phase 3이 지역 폴링 2개를 걷어내 **지금 남은 상시 폴링은 알림 피드 하나뿐**이다.
인덱스의 "중~대" 추정은 그 전에 매긴 값이다.

**작업 단계를 Phase 0만 남기고 비워 뒀다.** 프로토콜(WebSocket vs SSE)·재연결·폴백이 미결이라
단계를 쪼갤 수 없고, **완료 기준을 못 적는 단계는 단계가 아니다.** Phase 0을 인프라 실측으로
둔 이유는 `브라우저 → Cloudflare → cloudflared → FastAPI` 경로가 장수명 커넥션을 통과시키지
못하면 **나머지 계획이 통째로 무의미**해지기 때문이다 — 코드를 먼저 쓰면 "다 만들고 배포에서
막히는" 순서가 된다.

### REQ-F11 Phase 1·2 — 감지 중 상세 진입 차단 (케이스 10/10, 육안 미확인)

**판정을 순수 함수(`utils/jobStatus`)로 뽑아 목록과 상세가 같은 함수를 부르게 했다.**
이게 이 REQ의 핵심이다 — 원래 구멍이 "목록만 자체 조건으로 막고 상세는 아무 판정도 하지
않아 URL 직접 진입·뒤로가기가 열려 있던 것"이었으므로, **규칙을 한 곳에 두지 않으면 같은
불일치가 다시 생긴다.** 주석으로 "둘을 맞추세요"라고 쓰는 대신 구조로 막았다.

**제약 하나가 설계를 바꿨다.** *"상태 조회를 새로 추가하지 않는다"* — `getJobInfo`는 raw
`fetch`라 `apiFetch`의 dedup(REQ-P02-03) 대상이 **아니다.** 훅과 화면이 각자 부르면 같은
응답을 두 번 받는다. 그래서 **훅을 유일한 호출자로 두고** `original_pdf_url`도 그 응답에서
꺼내도록 `work.jsx`의 기존 조회를 걷어냈다. 호출 수는 이전과 같은 1회다.

**조회 실패 시 막되 사유를 구분한다.** 감지 중과 실패가 같은 경로로 차단되므로, 사유를
뭉뚱그리면 **실패에 "재감지 중입니다"라고 말하는 화면**이 나온다. 사용자는 기다리면 끝난다고
믿게 된다. 훅이 `reason`을 갈라 주고 문구는 화면이 정한다(F11-05가 이걸 잰다).

**빨간불 1건은 또 하니스였다.** F11-06(자체 인터벌 없음)이 `setInterval 1회`로 떨어졌는데,
**`waitFor` 자신이 `setInterval`로 폴링한다**(`@testing-library/dom` `wait-for.js`).
스파이를 걸고 `waitFor`로 기다리면 **어떤 구현도 통과할 수 없다** — 측정 도구가 측정 대상에
섞인 것이다. `/testrun`이 (a)로 분류해 대기 방식만 `act` 플러시로 바꿨다(단언 불변).

> **프론트 테스트에서 같은 계열이 이번이 세 번째다** — `unmount` 뒤 `rerender`,
> `ThemeProvider` 없는 렌더, 그리고 타이머 스파이. 셋 다 단언이 아니라 **무대가 틀렸고**,
> 셋 다 단언에 닿기 전에 터져 원인 판독을 방해했다. 계약 #25에 모아 뒀다.

**배지 문구는 손대지 않았다.** 목록 "처리 중" ↔ 상세 "재감지 대기 중"으로 갈려 있고 카드가
눌리게 되면서 더 드러나지만, **문구 통일은 미결**이라 바꾸지 않는 쪽(= 결정하지 않는 쪽)을 택했다.

**같은 날 육안 검증도 마쳤다 — 결함 0건.** 진입 차단 모달, `PENDING` 카드 클릭 가능,
'재감지' 비활성 + "재감지 대기 중", 라이트/다크 네 가지를 확인했다. F09는 첫 회에 결함이
나왔는데 F11은 나오지 않았다는 **사실만** 적어 둔다 — 규모 차이인지 계획서가 계약 #20·#27을
미리 제약으로 걸어 둔 덕인지 **단정할 근거는 없다.** 두 REQ 모두 체크는 사용자 보고에 근거한다.

**F11은 이것으로 완료다.** 미결 2건(모달 ESC·바깥 클릭 / `PENDING` 배지 문구)이 남아 있지만
둘 다 **현재 동작이 정의돼 있고**(MUI 기본 · 문구 유지) 완료 기준을 막지 않는다. 남은 것은 배포다.

### REQ-F09 v1 완료 — 육안 검증까지 닫음 (미배포)

사용자 확인으로 **육안 부채 4건(Phase 2~5)을 닫았다.** 첫 회에 벨 뱃지 결함이 나와 고친 뒤
(F09-47) 재확인에서 이상 보고가 없었다. 계획서 체크는 **내가 잰 것이 아니라 사용자 보고에
근거한다**는 사실을 함께 적어 뒀다 — 나중에 "누가 언제 봤나"가 구분되어야 한다.

**남은 것은 배포뿐이다.** Phase 6(브라우저 알림)은 런칭 준비 시점으로 이연했으므로 REQ 전체가
아니라 **v1이 닫힌 것**이다. 미배포 코드는 이제 B10(7-31)과 F09 두 건이다.

### REQ-F09 육안 검증 착수 → **첫 회에 결함 1건** (벨 뱃지) · REQ-F11 파생

**케이스 46건이 녹색인 상태에서 실제로 써 보자마자 결함이 나왔다.** 미뤄 둔 육안 부채가
첫 회에 값을 했다 — "검증은 수치 + 육안을 함께 간다"(D07 Phase 3-4·3-5의 교훈)가 또 맞았다.

**증상**: 스낵바는 뜨는데 **벨 뱃지만 갱신되지 않는다.**

**원인은 서버 값의 성질을 잘못 가정한 것이었다.** 뱃지의 로컬 억제를 **개수 비교**
(`unreadCount > readUpTo`)로 짰는데, 서버의 `unread_count`는 **읽음 커서 이후 개수**라
`mark_all_read()` 뒤 0으로 리셋되고 새 알림마다 1부터 다시 센다(`list_feed`가 `since`
필터 **전에** 센다). 그래서 미읽음 3건일 때 팝오버를 열면 `readUpTo=3`이 되고, 이후
도착한 알림은 `unread_count=1`이라 `1 > 3`이 거짓 → **뱃지가 영영 안 뜬다.**
개수가 아니라 **"무엇까지 읽었는지"(최신 알림 키)**로 바꿔 고쳤다.

> **스낵바만 멀쩡했던 것이 원인을 가리키고 있었다** — 스낵바는 `notifications`(증분 배열),
> 뱃지는 `unread_count`(절대값)를 본다. 같은 피드를 보는데 값의 출처가 달랐다.

**왜 46건이 녹색인데 새어 나갔나** — 검증 계약에 **"읽은 뒤 새 알림이 오면 뱃지가 다시
뜬다"**가 없었다. F09-40은 표시만, F09-42는 읽음 후 사라짐만 본다. **읽음과 새 알림이
이어지는 경로가 통째로 비어 있었다.** 고치기 전에 F09-47을 먼저 써서 빨간불을 확인했다 —
바로 고쳤으면 **같은 구멍이 열린 채로 닫혔다.**

**확인된 것 하나**: 분석 목록이 아닌 화면에서도 `GET /api/notifications`가 나가는 것을
사용자가 직접 확인했다. Phase 2의 전역 폴링은 성립한다(육안 부채 일부 해소).

> **dev 백엔드는 지금 내려가 있다** — `/health`·`/api/notifications` 모두 **530**
> (Cloudflare 터널이 오리진에 못 붙음). 그리고 **F09 Phase 1은 dev에 배포된 적이 없어**
> 터널이 살아나도 알림 API는 404다. dev에 붙여 F09를 검증하려면 백엔드 배포가 선행이다.

### REQ-F11 — 재감지 중 상세 진입 차단 (번호 부여, 미착수)

문항 분석 상세는 **URL 직접 진입·뒤로가기로 들어갈 수 있다.** 목록의 `isAnalyzing()`이
클릭만 막고 있어서 생긴 구멍이고, **F09 이전부터 있던 것**이다(F09가 만든 게 아니다).

사용자와 확정한 것 — **감지 중(`PROCESSING`)이면 진입 자체를 막고**(확인 버튼 있는 모달 →
목록으로), **대기 중(`PENDING`)이면 진입은 허용하되 '재감지' 버튼만 막고 "재감지 대기 중"을
표시**한다. 나간 뒤 자동 재진입은 없다(사용자가 다시 클릭).

착수 전 확인할 것: **작업 화면이 진입 시점에 `boundaries_status`를 이미 갖고 있지 않다** —
`getJobInfo`를 부르지만 `original_pdf_url`만 쓴다. 그 응답을 재사용할지 별도 조회를 넣을지
계획서에서 정해야 한다.

## 2026-08-07

### REQ-F09 Phase 5 — 헤더 벨 + 팝오버 + 스낵바 (7/7) → **v1 코드 완료, 육안 검증만 남음**

벨은 헤더 `rightArea`(D07이 *"알림(REQ-F09)"* 주석과 함께 비워 둔 자리), 스낵바는 `App.tsx`의
`Outlet` **밖**에 뒀다 — 라우트에 묶으면 Phase 2~3이 폴링을 앱 셸로 올린 일이 무의미해진다.

**뱃지를 로컬에서 즉시 가린다.** 읽음은 서버 커서라 다음 폴링(최대 5초)까지 `unread_count`가
그대로다. 그 사이 뱃지가 남아 있으면 사용자에겐 **"눌렀는데 안 읽혔다"**로 보인다. 서버 값이
갱신되면 자연히 일치하므로 로컬 가림은 임시 상태일 뿐이다.

**확정한 미결 둘** — 이동 목적지는 `detection → /analysis/{job_id}`, `export → /history`.
**이 결정으로 `kind` 필드를 처음 쓰게 됐다**(Phase 4에서 "계획서에 없는 필드"라며 미결로
남긴 것의 답이 여기서 나왔다). 스낵바는 최신 1건 6초 — 큐로 순차 표시하면 동시 5건에 20초간
하단 UI가 가리고, 놓친 것은 팝오버에 남으므로 유실이 아니다.

> **알아 두고 안 고친 것**: 알림으로 작업 화면에 들어가면 제목이 `jobId`로 폴백된다.
> 그 화면이 `filename`·`workbookName`을 `location.state`로 받기 때문이다. Phase 5 범위가
> 아니라 미결로 적어 뒀다.

**빨간불 2건이 났고 둘 다 구현 결함이 아니었다.**

- **F09-46이 내 주석을 잡았다.** 소스 스캔이라 금지 토큰을 *쓴* 것과 *경고한* 것을 구분하지
  못한다. 방어선을 무디게 하느니 문장을 바꿨다 — 그리고 "금지 토큰은 주석에도 적지 않는다"를
  그 자리에 남겼다.
- **`theme.vars` 크래시** — `tint.js`가 CSS 변수 테마를 전제하는데 테스트가 `ThemeProvider`
  없이 렌더했다. 계약 #20을 **지킨 결과** 난 빨간불이라 `/testrun`이 (a)로 분류해 렌더 조건만
  앱과 맞췄다. **F09-34와 같은 계열이다** — 두 번 모두 단언이 아니라 **테스트가 그리던 무대**가
  실제와 달랐다. 프론트 컴포넌트 테스트에서 반복될 패턴이라 적어 둔다.

**여기서 F09 v1의 코드가 끝났다.** 다만 **완료가 아니다** — Phase 5 완료 기준이 명시적으로
요구하는 "라이트/다크 양쪽에서 확인"을 포함해 **육안 검증 4건이 통째로 남아 있다.**
계획서 상태를 ✅로 올리지 않은 이유가 이것이다. **케이스 46/46 녹색은 "완료 기준 충족"이 아니다.**

### REQ-F09 Phase 4 — 목록 화면 자동 반영 (4/4 통과) + **육안 검증 부채 명시**

분석 목록·생성 이력이 새 알림에만 목록을 다시 읽는다. 두 화면 모두 `usePaginatedList`가
이미 노출하던 `reload`를 그대로 넘겨, 목록을 다시 읽는 경로를 새로 만들지 않았다.

**이 Phase의 위험은 "안 되는 것"이 아니라 "너무 자주 되는 것"이었다.** 재조회를 폴링 틱에
걸면 **5초마다 목록 API(페이지네이션 + 썸네일)가 돈다** — 기능은 멀쩡해 보이는데 REQ-P03에서
걷어낸 병목이 되살아난다. 그래서 검증 계약 4건 중 **2건(F09-38·39)이 "부르지 않는다"를 잰다.**
신규가 없으면 아무것도 하지 않고, 한 응답에 여러 건이 와도 재조회는 1회다.

**`kind` 필드를 쓰지 않았다.** 구현 스키마에는 `detection`/`export`가 있는데 **계획서에는
한 번도 안 나온다** — Phase 1이 만들고 계획서가 모르는 필드다. 지금은 감지 완료에도 생성
이력이 재조회된다(무해하지만 낭비). 근거 없이 정하면 그게 테스트로 굳으므로 미결로 남겼다.

> **⚠️ 여기서 한 번 멈추고 적어 둔다 — F09는 아직 한 번도 실제로 써 본 적이 없다.**
> 케이스 39건이 전부 녹색이지만 훅 단위 테스트는 "폴링이 돈다"까지만 알고 **"사용자가 완료를
> 알아챈다"는 모른다.** Phase 2(라우트 이동 후 수신)·Phase 3(두 화면 UI 유지)·Phase 4(배지
> 해제와 **카드 클릭 가능**)가 전부 육안 미검증이다. 계획서 § 제약·함정의 "검증은 수치 + 육안을
> 함께 간다"는 D07 Phase 3-4·3-5에서 **스크린샷을 눈으로 보고서야 결함이 잡힌** 경험에서 나온
> 문장이다. 녹색 숫자만 쌓고 넘어가면 같은 실패를 반복한다. Phase 5에서 화면이 생기면 한 번에 본다.

### REQ-F09 Phase 3 — 화면 지역 폴링 2개 이관 (7/7 통과, 두 화면의 `setInterval` 0건)

`work.jsx`(재감지)·`editor`(생성)의 폴링을 걷고 `hooks/useJobCompletion`으로 대체했다.
Phase 2가 만든 전역 피드를 화면이 **구독만** 하는 구조다.

**훅의 핵심은 기준선이다.** 피드는 최근 30일치를 담고 있어서(첫 진입 시 최신 50건)
"내 job의 알림이 피드에 있나"로 짜면 **재감지를 시작하자마자 지난주 알림을 보고 즉시
완료로 튄다.** 그래서 감시를 시작하는 순간 이미 있던 알림을 전부 '처리됨'으로 찍는다.
기준선을 `useEffect`가 아니라 **렌더 중에** 잡는 것도 같은 이유다 — effect로 미루면 그
사이 한 커밋이 지나가고 그 커밋에서 옛 알림이 이미 처리된다. **계약 #27로 승격했다.**

**계획 단계에서 안 보였던 것 — 알림에 `download_url`이 없다.** 편집 화면은 완료를 안 뒤
`getStatus`를 **한 번** 불러야 한다. 즉 **폴링은 사라져도 조회가 0이 되지는 않는다**(2초마다
N회 → 완료 시점 1회). 기각한 대안은 알림 스키마에 `download_url`을 넣는 것 — 백엔드 Phase 1을
다시 열어야 하고 **만료된 URL을 30일간 알림 파일에 들고 있게 된다.**

**자동 다운로드를 훅 콜백 안에 둔 것이 곧 B10 불변식이다.** 훅은 화면이 살아 있을 때만
콜백을 부르므로 "떠난 사용자에게 다운로드가 튀어나오지 않는다"가 **구조로** 보장된다 —
조건문으로 막는 게 아니라 애초에 불릴 수가 없다.

**빨간불 1건이 났는데 구현 결함이 아니었다.** F09-34(언마운트 뒤 미발생)가
`Cannot update an unmounted root.`로 터졌다 — `renderHook().unmount()` 뒤에 `rerender()`를
부른 탓이고 **단언에 닿지도 못했다.** `/testrun`이 (a)로 분류해 하니스만 고쳤다: 루트는
살려 두고 **훅을 쓰는 화면 컴포넌트만** 언마운트한다. 실제 상황(사용자가 편집 화면을 떠나도
앱 셸과 전역 폴링은 살아 있다)에도 이쪽이 맞다 — **종전 하니스는 검증하려던 것과 다른
상황을 그리고 있었다.** 단언은 글자 하나 바뀌지 않았다.

> `wip` 커밋을 amend로 정리했다. 원격에 없음을 `git branch -r --contains`로 먼저 확인했으므로
> 강제 푸쉬가 필요 없었다. 그대로 뒀으면 이력에 **존재하지 않는 결함**("F09-34 빨간불")이
> 영구히 남는다 — 이 레포는 git 메시지를 기록으로 쓰므로 사실과 맞춰 뒀다.

### REQ-F09 Phase 2 — 앱 셸 전역 폴링 (프론트 테스트 기반 신설, 11/11 통과)

폴링을 화면에서 앱 셸(`App.tsx`의 `Outlet` 바깥)로 올렸다. **F09의 실제 무게중심이 여기였다** —
벨 아이콘이 아니라 "화면을 떠나도 감시가 죽지 않게 하는 것".

**프론트에 테스트 프레임워크를 들였다**(vitest + jsdom + @testing-library). 백엔드 8-06과
같은 판단이고, 이제 두 스위트가 같은 케이스 ID 규약(`F09-NN`)을 공유한다. jsdom을 고른
이유는 DOM 렌더가 아니라 **`document.visibilityState`와 `visibilitychange`** 때문이다 —
탭 감속·재동기가 이 Phase의 완료 기준이라 브라우저 환경 없이는 잴 수가 없다.

**결정 두 가지를 코드가 아니라 물어서 정했다** — 계획서에 숫자가 없었다.

- **주기: 활성 5초 / 숨김 30초.** 기존 화면 폴링은 2초였지만 그건 **작업 중에만** 돌았다.
  이건 앱이 떠 있는 내내 돈다 — 같은 숫자를 쓰면 R2 LIST가 분당 30회씩 영구히 나간다.
- **숨김은 정지가 아니라 감속.** 계획서 용어가 "감속"이고, **Phase 6(브라우저 알림)이 숨긴
  상태에서 알리는 기능**이라 정지시키면 그때 이 결정을 되돌려야 한다.

**구현 중 발견한 함정 — `apiFetch`는 GET에도 전역 딤을 켠다.** 알림 조회를 관례대로
`apiFetch`로 짰으면 **5초마다 화면 전체가 번쩍였을 것이다.** 기존 폴링 함수(`getStatus`·
`getJobInfo`)가 raw `fetch`인 게 우연이 아니라 같은 이유였다 — 그 사실이 어디에도 적혀
있지 않아 **관례를 따를수록 틀리는 구조**였다. 계약 #26으로 승격했다.

**`since`를 `useRef`로 들고 있다.** state로 두면 응답마다 폴링 effect가 재구독돼
`setInterval`이 리셋된다 — 주기가 사실상 무의미해지는데 **증상이 "좀 자주 부른다"로만
보여 눈치채기 어렵다.**

**계획 밖에서 한 것**: `npx tsc -b`가 `npm run build`를 깨뜨리는 것을 발견했다 —
`/testgen`이 넣은 `test` 블록을 `vite`의 `defineConfig` 타입이 모른다. `vitest/config`
참조 한 줄로 해소했다. 겸사겸사 알게 된 것 하나 — **`frontend/vite.config.js`는 추적되는
컴파일 산출물이다.** `tsc -b`를 돌리면 `.ts`와 함께 바뀌므로 커밋에서 빠뜨리면 둘이 어긋난다.

### REQ-F09 Phase 1 검증 실행 — 17건 전부 통과, 다만 첫 실행은 격리 가드가 막았다

`/testrun`으로 Phase 1 케이스 17건(수집 18건 — F09-15가 최초감지·재감지로 parametrize)을
돌려 **전부 통과**했다. 구현 결함(b) 0건, 스펙 모호(c) 0건. Phase 1 완료 기준을 충족한다.

**첫 실행은 18건 전부 `ERROR`였고, 그게 정상 동작이었다.** `conftest.py`의 격리 검증
픽스처가 `R2_BUCKET_NAME=dailystudy-dev`를 보고 수집 단계에서 중단시켰다. 설계 의도대로
"조용한 오염 대신 굉음"이 난 것이다 — 실제로 dev R2에 붙은 적은 없다(1차 방어선인
`STORAGE_BACKEND=local` 강제는 통과했다).

**막힌 원인은 2차 방어선의 수단이 틀린 것이었다.** conftest가 R2 자격증명을
`os.environ.pop()`으로 지우는데, **값의 출처가 `.env` 파일이면 pop은 아무 효력이 없다** —
pydantic이 거기서 다시 읽어 온다. 환경변수가 `.env`보다 우선한다는 성질은 1차 방어선에서만
쓰이고 있었다. `os.environ[k] = ""`(빈 값 덮어쓰기)로 바꿔 `.env` 유무와 무관하게 같은
결과가 되도록 했다. **단언은 건드리지 않았다** — 빨간불을 지우는 방향의 수정이 아니라
검사 전제를 실제로 만들어 주는 수정이다.

> **8-06 기록이 사실과 달랐다.** 그날 미결을 확정하며 "7-31에 실측된 `.env`가 s3라 테스트가
> dev 실데이터에 붙는다는 위험은 **현재 성립하지 않는다**(`backend/.env` 부재)"고 적었는데,
> 실제로는 **`backend/.env`가 그때도 있었다** — mtime `2026-07-29 23:06`이고 내용이
> `.env.dev`와 **바이트 단위로 동일**하다(`STORAGE_BACKEND=s3` + dev R2 자격증명).
> 8-06 이후에 새로 만들어진 게 아니다. 즉 **"되살아날 수 있는 상태"가 아니라 이미 되살아나
> 있는 상태에서 테스트를 도입했다.** 격리를 "그대로 박는다"고 결정한 것이 결과적으로 이
> 오판을 덮었다 — 판단은 맞고 근거는 틀렸던 경우다. `.env`는 gitignore라 git에 흔적이 없어
> **이런 오판은 문서로만 잡힌다.**

**계약 #24로 승격했다** — 다음에 테스트 설정을 손대는 사람이 같은 곳에서 미끄러진다.

> **근거 인용이 자기검증 능력을 잃은 사례를 하나 잡았다.** F09-22의 근거로 단 인용문이
> `grep -F`에서 **표 자신 1건만** 잡혔다. 스펙이 사라진 게 아니라 **원문이 줄바꿈으로 쪼개져
> 있어서**다(계획서 본문이 80열로 접힌다). 문제는 이 상태가 "스펙 삭제"와 구별되지 않는다는
> 것이다 — 인용을 쓰는 이유가 "바뀌면 스스로 신고한다"인데 **그 경보가 울린 채 고장 나 있었다.**
> 인용을 한 줄 안에 들어가는 범위로 좁혀 고쳤다. **인용은 원문의 줄바꿈을 넘지 않게 딴다.**

**남은 것**: Phase 1은 로컬 검증까지 끝났고 배포는 하지 않았다(B10과 같은 상태 —
미배포가 실수가 아니라 현재 위치다).

## 2026-08-06

### REQ-F09 Phase 1 구현 — 알림 저장소 + 완료 시점 쓰기 + 조회·읽음 API

8-05에 승인 대기로 멈춰 있던 **테스트 의존성 도입안이 승인**되면서 Phase 1을 착수했다.
남아 있던 미결 3건을 함께 확정해 검증 계약이 14 → 17건으로 늘었다.
(문서 커밋 `7611272`은 8-07에 올라갔지만 **결정 시점은 8-06**이다.)

**확정된 미결 3건**

- **실패 시 알림 — 쓴다(`severity: success | error`).** B10의 "생성 실패 → 메타 저장 안 함"을
  **상속하지 않기로 했다.** 메타는 산출물 기록이고 알림은 상태 통지라 목적이 다르다. 결정적인
  근거는 따로 있었다 — 실패 알림이 없으면 **Phase 4의 목록 배지가 완료 알림만 보고 배지를
  푸는 구조라, 감지가 실패한 카드는 "분석 중"에 영원히 남는다.** 사용자에게는 "느린 것"과
  "죽은 것"이 구분되지 않는다.
- **`since` 미지정 = 최근 30일 + 최신 50건 상한.** 8-05에 "그럴듯하지만 근거가 없다"며
  지어내지 않고 올린 값이다.
- **테스트 의존성** — `pytest` + `httpx`를 `requirements-dev.txt`로 **분리**(Dockerfile이
  `requirements.txt`를 설치하므로 섞으면 운영 이미지에 pytest가 실린다).

**Phase 6(브라우저 알림)을 런칭 준비 시점으로 이연했다.** 기각이 아니라 이연이다 — 아직
로컬 개발만 하는 단계라 탭을 떠나 있을 일 자체가 적고, 완료 기준에 박을 **비활성 탭
스로틀링 지연 상한(`___`초)을 실측할 하니스가 스크래치패드(세션별)라 이미 한 번 사라졌다.**
지금 다시 만들어도 Phase 1~5 도는 동안 또 사라지므로 **Phase 6 직전에 만드는 것이 재작업
0회**다. Phase 5까지가 v1.

**쓰기 훅을 붙일 위치를 계획 단계에서 못박은 것이 이 Phase의 핵심이었다.**
`BoundariesStatus.DONE`을 찍는 곳은 4곳인데 그중 2곳(`list_all_questions`·`list_questions`)은
**조회 경로의 지연 감지**다. 거기에 알림을 달면 **사용자가 지금 보고 있는 화면에 대해
"완료됐습니다"가 뜬다.** 성공뿐 아니라 `FAILED` 경로도 같은 기준으로 갈랐다 — 실패 쓰기를
`try/except`에 무심코 달면 조회 경로까지 번진다. 이 두 가지가 F09-06·07·16(회귀 케이스)로
그대로 고정됐고 8-07 검증에서 통과를 확인했다.

## 2026-08-05

### REQ-F09 Phase 1 검증 계약 작성 → 의존성 승인 대기로 중단 (코드 변경 없음)

`/testgen`으로 Phase 1 케이스 14건(정상 5·회귀 4·경계 4·불변식 1)을 뽑아 계획서
`## 검증 계약` 절에 기입했다. **테스트 코드는 쓰지 않았다** — 이 레포엔 테스트 프레임워크가
아예 없고(테스트 파일 0건), **프레임워크 없는 레포에 의존성을 임의로 추가하지 않는다**는
규칙에 걸려 도입안만 올리고 멈췄다. 계획서 미결에 승인 대기로 남겼다.

**도입안에서 제일 중요한 건 프레임워크 선택이 아니라 스토리지 격리다.** `backend/.env`가
`STORAGE_BACKEND=s3`라 **테스트를 그냥 돌리면 dev 실데이터에 붙는다**(7-31에 실측으로 확인된
사실이다). `conftest.py`에서 `STORAGE_BACKEND=local` + `LOCAL_STORAGE_DIR=tmp_path`를 강제하지
않으면 **테스트가 dev R2에 알림 파일을 쓰고 지운다.** 첫 테스트를 들이는 지금이 이걸 못 박을 시점이다.
`requirements-dev.txt` 분리도 같은 계열 — `Dockerfile`이 `requirements.txt`를 설치하므로
섞으면 운영 이미지에 테스트 의존성이 실린다.

**근거 없는 케이스 2건은 코드로 만들지 않고 미결로 올렸다.** ① 실패(`FAILED`) 시 알림을 쓰는가 —
B10이 "생성 실패 → 메타 저장 안 함"으로 정했지만 **알림은 목적이 달라 그대로 상속하면 안 된다**
("생성 실패했습니다"야말로 알려야 할 일이다). ② `since` 미지정 시 기본 동작. 둘 다 그럴듯한
기대값을 지어낼 수 있었지만, **틀린 기대값이 테스트로 굳으면 올바른 구현을 막는다.**

> 근거 인용은 라인 번호가 아니라 **원문 문자열**로 달았다 — 스펙이 바뀌면 `grep`이 0건을 반환해
> 스스로 신고한다. 기입 후 9개 인용 전부 원문과 일치하는지 실제로 grep해 확인했다.

## 2026-08-03

### REQ-B10 배포 보류 (코드 변경 없음)

**사용자 결정으로 B10 배포를 미룬다.** 기각이 아니라 **보류**다 — 코드는 7-31에 끝나 있고
배포만 남았다. 이 결정을 적어 두는 이유는, 7-31 기록이 "다음에 할 일"로 배포를 지목한 채
끝나 있어서 **미배포 상태가 실수로 방치된 것처럼 읽히기 때문이다.** 의도된 보류다.

배포할 때 지켜야 할 것은 7-31 기록 그대로다 — **백엔드 → 프론트 순서 고정**(뒤집으면
프론트가 `createWorkbookMeta`를 이미 버렸는데 백엔드는 아직 저장하지 않아 **저장 주체가
아무도 없는 구간**이 생긴다), 배포 후 `EXPORT job 수 == 문제집 메타 수`로 재발 여부 확인.

**보류가 막는 것**: 배포 전까지 **운영(dev)에서는 고아가 계속 생긴다.** 7-31에 0으로
만들어 뒀지만 그건 청소일 뿐 원인 제거는 배포 시점에 발효된다. 즉 배포를 미루는 동안
**7-31 청소 결과는 계속 낡는다.** 배포가 길어지면 청소를 한 번 더 해야 할 수 있다.

**F09(완료 알림)는 B10을 선행으로 잡고 있다.** 선행 조건은 "B10 배포"가 아니라 "B10 코드
확정"이므로 F09 착수 자체는 지금 가능하다 — 다만 F09가 알림을 띄울 완료 시점이 곧
백엔드가 메타를 쓰는 시점이라, **두 건이 같은 배포에 함께 나가는 편이 검증이 싸다.**

### REQ-F09 미결 6건 확정 → 성격 변경 + REQ-P04 파생 (코드 변경 없음, 문서 3건)

> 이 절의 마지막 구간은 커밋 시각만 자정을 넘겼다(8-4 00:06). 작업은 전부 8-3이다.

**계획서를 코드와 대조하는 것으로 시작했다.** B10이 그 사이 프론트를 건드렸기 때문인데,
계획서 본문은 대체로 정확했고 어긋난 건 행 번호 하나(`editor/index.jsx` 247 → 253)뿐이었다.
**Phase 0(B10 선행)은 이미 충족돼 있었다** — 완료 기준이 노린 실질 조건("이관할 생성 폴링이
순수 UI 상태 전환만 남을 것")까지 확인했다. `DONE` 분기에 남은 것은 `setState` 3개와 다운로드
앵커뿐이다.

**대조 중 계획서에 없던 충돌 하나를 찾았다 — 자동 다운로드.** B10이 "이 화면에 머문 경우에만
다운로드한다"고 못 박아 뒀는데, **그 결정은 "폴링이 화면에 묶여 있다"를 전제로 성립한다.**
F09가 폴링을 앱 셸로 올리면 전제가 사라져 **다른 라우트에 있는데 다운로드가 튀어나온다.**
B10 미결에 "확정"으로 닫혀 있던 항목이라 그냥 지나칠 뻔했다 — **전제를 바꾸는 작업은 남이
닫아 둔 결정을 다시 열어야 한다.** 미결 6번으로 신설해 "다운로드는 화면 책임 유지"로 확정했다.

#### 내 전제가 틀렸던 것 — "서버 저장은 비싸다"

미결1(알림 이력 보관처)에 **localStorage를 추천했다가 뒤집혔다.** 근거로 "서버 저장은 인증
부재로 소유자를 정의할 수 없고 비싸다"를 들었는데, **이 앱이 이미 전부 파일 기반**(`status/`,
`boundaries/`, `workbooks/`, `manual_questions/`)이고 storage 팩토리가 local↔s3를 추상화해 둔
상태다. 알림은 새 저장소가 아니라 **기존 패턴에 하나 더 얹는 것**이었다. 사용자 결정(서버 파일,
DB화 전까지 / 인증 전까지 "모두의 알림")이 맞다.

**이 결정이 F09의 성격을 바꿨다.** 계획서는 "백엔드는 이미 상태를 노출하니 프론트만 손대면
된다"를 전제로 쓰여 있었는데, 이제 **백엔드 Phase가 앞에 붙고 프론트가 가벼워진다** —
프론트가 완료를 판정하지 않고 서버가 쓴 알림을 읽기만 한다. 총량은 비슷하고, 대신 알림이
기기·브라우저를 넘고 **계약 #22를 구조적으로 지키게 된다.**

**두 결정이 우연히 잘 맞물린 지점** — 미결5를 "팝오버 열면 전체 읽음 + 서버 상태"로 정하면서
읽음 상태가 **커서 파일 1개**로 줄었다. 항목별 읽음이었으면 읽을 때마다 N개 파일을 다시 써야
했다. 미결5의 선택이 미결1의 비용을 크게 깎았다.

#### 상시 폴링 확정 → REQ-P04 파생

**"모두의 알림"은 폴링을 상시화한다.** 내가 시작한 작업이 없어도 남이 시작한 게 끝날 수 있어
조건부 폴링이 성립하지 않는다. 계획서 Phase 1의 완료 기준("레지스트리가 비면 폴링이 멈춘다")이
**폐기됐다.**

사용자가 "차후 상시 폴링을 전부 웹소켓으로 전환할 계획"을 조건으로 승인해 **REQ-P04**를 부여했다.
**P04은 성능 작업만이 아니다** — 비활성 탭 타이머 스로틀링은 폴링으로 없앨 수 없고 그게 곧 F09
브라우저 알림의 지연인데, **웹소켓은 타이머가 아니라 메시지 구동이라 제약 자체가 사라진다.**
번호는 `예정된작업.md`와 **PROGRESS 미착수 표 양쪽에** 등록했다 — 표가 점유의 단일 출처라
한쪽만 적으면 다음 `/workplan`이 같은 번호를 다시 발급한다.

#### 착수 전에 코드로 확인해 둔 것 (Phase 1에서 제일 잘 틀릴 자리)

**`BoundariesStatus.DONE`을 찍는 곳은 4곳인데 알림을 붙일 곳은 2곳뿐이다.**

| 위치 | 성격 | 알림 |
|---|---|:--:|
| `upload.py:156` | 최초 감지 (백그라운드) | ✅ |
| `browse.py:313` `_run_refresh_detection` | 재감지 (백그라운드) | ✅ |
| `browse.py:507` `list_all_questions` 내부 | **조회 경로의 지연 감지** | ❌ |
| `browse.py:606` `list_questions` 내부 | **조회 경로의 지연 감지** | ❌ |

뒤 2개에 알림을 붙이면 **사용자가 지금 보고 있는 화면에 대해 "완료됐습니다"가 뜬다.**
grep으로 훑으면 4곳이 전부 잡히므로 착수 시 이 구분을 놓치기 쉽다. 생성 쪽은
`extract.py:208`(`_save_workbook_meta` 옆) 1곳.

**`list_workbooks()` 패턴을 알림 피드에 복사하면 안 된다.** 그 함수는 `glob("*.json")`으로
전체 파일을 매번 읽어 메모리 정렬한다. 문제집 목록은 화면 열 때만 부르니 괜찮지만 **알림은 몇
초마다 부른다** — R2에서 매 폴링마다 LIST + N GET이 돌고 30일치가 쌓일수록 N이 자란다.
**REQ-P03에서 겪은 썸네일 병목과 같은 계열이다.** 저장 레이아웃을 `notifications/{YYYY-MM}/
{ISO}-{job_id}.json`으로 잡아 **LIST 결과의 키 이름만으로 신규 판정**하고 신규가 있을 때만
GET하게 했다(평상시 GET 0회).

> **기각 — 단일 `feed.json`.** 조회는 더 싸지만 append가 read-modify-write라 두 작업이 비슷하게
> 끝나면 **하나가 조용히 사라진다.** 알림 유실은 F09의 존재 이유를 깎으므로 조회 비용보다 우선했다.

#### 스파이크 순서를 바꿨다 + 자동화 함정

원래 "스로틀링 실측 → 계획서 갱신" 순서로 잡았는데(실측 전 갱신하면 두 번 고치게 되므로),
**브라우저 확장이 연결돼 있지 않아**(7-31과 동일) 측정이 사용자 손에 달렸다. 측정치가 걸리는
곳은 Phase 6 완료 기준 **한 줄**뿐이라, 그 자리를 비워 두고 나머지를 먼저 갱신하는 쪽으로
바꿨다 — 6건의 결정 반영을 6분짜리 수동 측정 뒤로 미룰 이유가 없다.

> ⚠️ **headless/자동화로 재려다 오답을 얻기 쉽다.** Puppeteer 등의 기본 실행 플래그에
> `--disable-background-timer-throttling`이 들어 있어 **재려는 현상 자체를 끄고 측정하게 된다.**
> "스로틀링 없음"이라는 그럴싸한 결과가 나오므로 틀린 줄도 모른다. 실측 하니스는 스크래치패드에
> 만들어 사용자에게 넘겼다(실제 Chrome 탭에서 **5분 이상** 숨겨야 intensive throttling 구간이 잡힌다).

#### Phase 재구성

백엔드 Phase가 앞에 붙고, **구 Phase 5(목록 자동 반영)를 벨·팝오버보다 앞으로 당겼다** —
신규 UI 없이 앞 Phase가 실제로 도는지 **가장 싸게 증명하는 화면**이기 때문이다. 벨을 먼저
만들면 신규 컴포넌트와 전역 폴링을 동시에 디버깅하게 되어 증상이 나왔을 때 원인 후보가 둘이 된다.
브라우저 알림은 마지막으로 미뤘다 — 외부 변수가 가장 많은데 **거기서 막혀도 F09는 제품으로
성립**하므로 부분 출하 지점이 생긴다.

> 자잘한 것 하나 — 계획서 미결2는 **알림 대상 범위**를 묻고 있었는데 받은 답("최근 한달치")은
> **보관 기간** 쪽이었다. 미결1의 "모두의 알림"이 범위를 이미 닫아서 실질 누락은 없었다.
> 계획서에는 1번=범위·보관처 / 2번=보관 기간으로 재배치해 적었다.

## 2026-07-31

### REQ-B10 Phase 0~3 — 문제집 메타 유실 수정 (수정 완료, 고아 처리만 남음)

**Phase 0 — 재현과 실측.** 브라우저 대신 **API 레벨**로 재현했다. 생성 요청 후
`createWorkbookMeta`를 호출하지 않는 것이 "화면을 떠난 프론트"와 정확히 같은 상태이고,
화면 이탈·새로고침·탭 종료를 한꺼번에 포괄하며 브라우저 타이밍에 의존하지 않아 더 결정적이다.
완료 기준 3개 전부 성립했고, **대조군**(같은 export job에 `createWorkbookMeta`만 호출)에서
즉시 이력에 등재되는 것까지 확인해 **그 호출 하나가 등재 여부를 가른다**는 것이 직접 증명됐다.

**고아 실측 — R2 dev에서 3건. EXPORT job 14건 중 3건이니 21%다.** 전부 `status=DONE`이고
결과 PDF가 실재하며(1.9MB/246KB/2.6MB), **1건은 2026-07-29 생성**이다. 과거에 끝난 일이
아니라 현재 진행형이었다. 계획 단계의 체감보다 훨씬 잦았다.

> **정정** — 계획서에 "로컬에 `local_storage`가 없어 R2에서만 셀 수 있다"고 적었는데
> 실제 위치는 `backend/local_storage`였다(레포 루트에서 찾아 놓쳤다). 다만 `backend/.env`가
> `STORAGE_BACKEND=s3`라 **로컬에서 백엔드를 띄우면 dev 실데이터에 붙는다** — 실측은 그 덕에
> 됐지만, 재현은 산출물이 dev에 남으므로 `STORAGE_BACKEND=local`로 분리해 돌렸다.
> 이번 작업 전 구간에서 **R2에는 읽기만 했다.**

**Phase 1 — 스키마 확장 + 설계 결정.** `ExtractV2Request.workbook_name`(만들 문제집 이름),
`SelectionItem.workbook_name`(**출처** 이름)·`source_filename` 추가. 한 요청 안에 같은 이름이
반대 뜻으로 두 번 나오므로 docstring으로 못 박았다.

**핵심은 "`workbook_name`의 유무가 저장 주체를 가르는 신호"라는 설계다.** 있으면 새 프론트로
보고 백엔드가 저장하고, 없으면 구 프론트로 보고 저장하지 않는다. 이 분기 덕에 **계획서에
"정상"이라 적어 뒀던 과도기 이중 저장 창이 통째로 사라졌다** — 백엔드를 먼저 배포해도 중복도,
이름 없는 메타도 생기지 않는다. 대신 **프론트 배포가 원자적이어야 한다**는 새 제약이 생겼다
(필드 전송과 `createWorkbookMeta` 제거가 갈라지면 그때 2건이 뜬다).

> ⚠️ **별건 발견 — `scale`이 생성 PDF에 반영되지 않고 있었다.** `client.js`의 `startExtractV2`
> 전송 맵에 `scale`이 빠져 있었다(백엔드는 `pdf_service._sel_scale()`로 실제 사용 중).
> **저장에는 들어가서 미리보기·편집 복원은 맞았기 때문에 "결과 PDF만 다르다"로만 나타났다** —
> `예정된작업.md`에 ✅로 적힌 항목이 반쪽만 동작한 것이다. 사용자 결정으로 Phase 1에 끼워 고쳤다.

> ⚠️ **함정 — PDF 비교에 파일 크기를 쓰면 안 된다.** scale 1.0과 1.6의 결과가 **바이트까지
> 동일**(둘 다 1,986,288)해서 한 번 "미반영"으로 오판했다. 원본 페이지를 벡터로 임베드하니
> 크기는 그쪽이 지배한다. 해시도 생성 시각이 박혀 무의미하다. **1페이지를 렌더해 픽셀로
> 비교**해야 한다 — 그렇게 하니 1.0과 1.6은 다르고, 신규 필드만 추가한 대조군은 동일했다.

**Phase 2 — 백엔드 저장 이관.** `_process_extraction_v2`가 성공 직후 `_save_workbook_meta()`를
호출한다. 세 경로를 다 확인했다: `workbook_name` 있음 → 저장·이력 등재, 없음 → 저장 안 함
(구 프론트 경로 보존), 생성 실패 → 저장 안 함(이력에 미완성 항목이 안 생긴다).
**메타 저장 실패는 생성 실패로 둔갑시키지 않는다** — PDF는 이미 만들어졌으므로 상태는 `DONE`으로
두고 `error`에만 사유를 남긴다. 이 분기는 유도가 어려워 미검증으로 남겼다.

**`workbook.py`의 낡은 docstring을 정정했다.** 프론트 주도 저장을 택한 이유로 "extract-v2는
selections/layout을 모르기 때문"이라 적혀 있었는데 **사실이 아니다**(`ExtractV2Request`가 둘 다
받는다). 이 낡은 근거 때문에 서버 저장을 비싼 안으로 오판할 뻔했다. 실제 격차는 3필드뿐이었다.

**Phase 3 — 프론트 정리.** 신규 필드 전송과 `createWorkbookMeta` 제거를 한 묶음으로 넣었다
(원자성 제약). `catch {}`와 미사용 import도 함께 정리했다.

**브라우저 확장(claude-in-chrome)이 연결되지 않아** UI 클릭 왕복 대신 **headless Chrome/CDP로
실제 모듈을 실행해 페이로드를 가로챘다** — 페이지 컨텍스트에서 `import('/src/api/client.js')` 후
`fetch`를 스텁으로 갈아끼우는 방식이라 정적 읽기가 아닌 진짜 실행 결과다. 최상위·선택별 신규
필드와 `scale`이 전부 실리고 요청은 `extract-v2` 1건뿐(`POST /api/workbooks` 없음)임을 확인했다.
그 페이로드 형태로 백엔드까지 왕복해 **신규 메타 1건**(2건이면 이중 저장)·`scale` 1.4 보존·
출처 2필드 보존을 봤다. **편집 화면 버튼부터 도는 육안 확인은 미검증으로 남는다.**

> 자잘한 것 하나 — API 검증 스크립트의 헬퍼가 반환값과 상태 코드를 따로 얻느라 **같은 요청을
> 두 번 POST**해 export job이 호출당 2개씩 생겼다. 페이로드가 같아 검증 결과에는 영향이 없었지만
> 산출물 정리에서 3개를 놓칠 뻔했다. 생성 API를 헬퍼로 감쌀 때는 호출 횟수를 먼저 볼 것.

**Phase 4 — 고아 3건 삭제로 마무리.** 사용자가 **내용을 기억하지 못해 복구는 기각**했다 —
이름·선택 목록이 없어 편집 복원이 안 되는데 내용도 모르면 "정체를 모르는 항목"만 3개 느는 셈이다.
**손으로 R2 키를 고르지 않고 앱의 `DELETE /api/jobs/{id}`를 썼다** — 무엇이 "연관 저장물"인지는
앱이 알고 있고, 수작업으로 고르면 빠뜨리거나 더 지운다. 삭제 직전 참조 여부를 한 번 더 확인했다.
결과: EXPORT job **14 → 11**, 문제집 메타 11 → 11, **고아 3 → 0**, R2 잔존 0개(4,792,912 bytes 회수).
남은 문제집 11건은 전부 결과 PDF가 살아 있어 **다른 데이터를 건드리지 않은 것**까지 확인했다.

> **미검증으로 남는 2건**: 편집 화면 버튼부터 도는 UI 왕복(브라우저 확장 미연결 — D07 Phase 3-5·4와
> 같은 이유로 사용자 육안 확인에 맡긴다), 메타 저장 실패 분기(유도 곤란).

**⚠️ B10은 코드만 끝났고 아직 배포하지 않았다.** 이어서 할 때 먼저 볼 것 —

- **배포 순서는 백엔드 → 프론트로 고정이다.** 뒤집으면 프론트가 `createWorkbookMeta`를 이미
  버린 상태에서 백엔드는 아직 저장하지 않아 **저장 주체가 아무도 없는 구간**이 생긴다.
  프론트 쪽은 필드 전송과 호출 제거가 이미 한 커밋에 함께 들어가 있어 원자성은 확보돼 있다.
- 배포 후 실환경에서 **고아가 다시 늘지 않는지** 한 번 세어 볼 것(오늘 0으로 만들어 뒀으므로
  `EXPORT job 수 == 문제집 메타 수`가 유지되면 정상이다). 재발 여부를 이보다 싸게 알 방법이 없다.

## 2026-07-30

> 아래 D08은 **2026-07-29 저녁부터 이어진 작업**이다. 커밋 시각만 자정을 넘겼다.

### REQ-F09 계획 점검 → REQ-B10 파생 (코드 변경 없음, 계획서 2건)

**F09를 점검하다 B10이 튀어나와 계획이 두 갈래로 갈라졌다.** 원래는 F09 하나를 계획하려던
자리였는데, 근거 코드를 확인하는 과정에서 데이터 손실 버그가 나와 **그쪽을 먼저 하기로**
순서를 바꿨다(사용자 결정).

**D07 스펙 §6의 F09 규모 추정이 틀렸다.** §6은 "폴링은 이미 있으니 **알림 표면만 추가**, 소~중"으로
적어 뒀는데, 실제로는 **두 폴링이 모두 화면 수명에 묶여 있다**(`work.jsx`·`editor/index.jsx` 둘 다
언마운트에서 `clearInterval`). 알림의 존재 이유가 "다른 일 하는 동안 알려주는 것"이므로
**표면만 붙이면 화면을 떠나는 순간 알림도 함께 죽는다.** 작업의 무게중심은 벨 아이콘이 아니라
폴링을 앱 셸로 올리는 쪽이다.

> **바로 아래 D08과 정확히 반대 방향의 사례다.** D08은 §6 추정이 좋은 쪽으로 빗나갔고
> (선결 조건이 이미 해소돼 있었다), F09는 나쁜 쪽으로 빗나갔다. 공통 원인은 같다 —
> **§6의 추정은 2026-07-25에 한 번 적힌 뒤 갱신되지 않았다.** 규모는 착수 시점에 다시 잰다.

**곁가지로 확인된 것**: 문항 분석 목록 화면에는 폴링이 아예 없다. 업로드 후 `fetchJobs()`를
한 번 부르고 끝이라 "분석 중" 배지가 뜬 카드는 **새로고침 전까지 영원히 그 상태**고,
`isAnalyzing()`이 클릭까지 막는다. F09의 실질 가치가 가장 큰 지점이 여기다.

#### REQ-B10 — 생성 중 화면 이탈 시 문제집 메타 유실

문제집 메타를 만드는 유일한 주체가 **프론트 폴링의 `DONE` 분기**다(`extract.py`에 `workbook`
언급 0건 — 백엔드는 메타를 만들지 않는다). 그 폴링이 언마운트에서 죽으므로, 생성 중 화면을
떠나면 **PDF는 `results/`에 만들어지는데 생성 이력에는 영원히 안 나타난다.** 이력 화면은
`workbooks/`만 읽기 때문이다. 사용자에겐 "생성 실패"로 보이고 결과물은 고아가 된다.
자동 다운로드(`a.click()`)도 같은 분기 안이라 함께 사라진다.

> ⚠️ **함정 — `workbook.py`의 docstring이 사실과 다르다.** 프론트 주도 저장을 택한 이유를
> "extract-v2는 PDF만 생성하고 selections/layout 정보를 모르기 때문"이라 적어 뒀는데,
> **`ExtractV2Request`는 `selections`와 `layout`을 둘 다 받는다.** 언젠가 사실이었는지는
> 확인하지 않았지만 지금은 아니다. 실제 격차는 3개뿐 — 문제집 이름(`filename`/`name`),
> 선택 항목의 `workbook_name`·`source_filename`(`title`은 이미 `label`로 온다).
> **이 낡은 근거 때문에 해법 A′를 "비싼 안"으로 오판할 뻔했다.** 수정 시 docstring도 함께
> 고치기로 했다 — 안 고치면 다음 사람이 같은 근거로 되돌린다.

**해법은 안 A′ — 백엔드가 생성 성공 시 메타를 쓴다.** 프론트 수명과 완전히 분리된다.
- **기각 · 안 B(프론트가 요청 직후 선저장)**: 백엔드 무변경이 장점이나 저장 호출 실패 창이 남고
  갱신이 여전히 폴링 의존이라 **`PROCESSING`에 멈춘 메타**가 생긴다.
- **기각 · 안 C(이력이 export job 직접 조회)**: 유실을 막는 게 아니라 표시로 덮는 것이라
  이름·선택 목록이 복구되지 않아 **편집 복원이 안 된다.**
- **기각 · 요청 시점 선저장**: 이력에 미완성·실패 항목이 노출되고 상태 필드가 따라붙는다.
  → **성공 시에만 쓴다.**
- **기각 · 복귀 시 다운로드 재시도**: 의도치 않은 시점에 다운로드가 시작되고 F09 알림과
  역할이 겹친다. → 자동 다운로드는 **편집 화면에 머문 경우로 한정.**

**배포 순서가 제약이다.** 백엔드 저장 이관을 프론트 정리보다 **먼저** 내보내야 한다 —
뒤집으면 저장 주체가 아무도 없는 구간이 생긴다. 그 사이 과도기에는 백엔드·프론트가 둘 다
저장해 **같은 문제집이 이력에 2건** 뜬다(`workbook_id`가 매번 새로 발급됨). 검증 때
버그로 오인할 자리라 계획서에 명시했다.

**고아 건수는 아직 모른다** — 로컬에 `local_storage`가 없어(실데이터는 R2 dev) 셀 수 없었다.
복구 여부는 B10 Phase 0의 실측 결과에 위임했다. 0건이면 복구 작업 자체가 불필요하다.

**계약 #22 승격** — "프론트 폴링의 `DONE` 분기에 영속 부수효과를 두지 않는다."
그 분기에 넣어도 되는 것은 화면이 살아 있는 동안만 의미가 있는 것뿐이고, 저장·기록처럼
남아야 하는 일은 서버가 완료 시점에 한다. **서버·프론트 어느 쪽도 에러를 내지 않아
로그로도 안 잡히는** 부류라 계약 기준을 충족한다.

#### CLAUDE.md 현행화 — 유령 파일 10개, API 6곳

F09가 전역 상태를 놓을 자리를 찾다가 **`providers/`가 실재하지 않는다는 것**을 발견했다
(D07 Phase 1 도달성 분석에서 제거됨). 확인해 보니 프론트 구조 항목 상당수가 유령이었다 —
`views/` 4개 파일 · `types/` · `settings-panel/` · `PageBrowser` · `QuestionPicker` ·
`SelectionBasket` · `FilePagePanel` · `StatusPoller` · `layouts/main-layout/`.
D07이 화면을 갈아엎는 동안 구조 표만 그대로 남은 것이다.

같은 파일의 API 표도 6곳이 어긋나 있었다(`GET /api/stats` · `DELETE /api/jobs/{id}` ·
`GET /api/jobs/{id}/questions` · `POST …/bulk-delete` · `DELETE /api/workbooks/{id}` 누락,
`browse.py` 665 → 982줄). 같은 성격이라 함께 맞췄다.

> **CLAUDE.md는 매 세션 자동 로드된다** — 여기가 틀리면 매번 틀린 지도를 들고 시작한다.
> 화면·라우터를 크게 손댄 작업(D07 같은) 뒤에는 구조·API 표를 한 번 훑는 편이 싸다.

### REQ-D08 — 라이트/다크 모드

**추정이 크게 빗나갔다 — 좋은 쪽으로.** D07 스펙 §6은 D08을 "중~대, 하드코딩 286개가 선결"로
잡아 뒀는데 착수해 보니 **선결 조건이 이미 다 해소돼 있었다.** JSX hex는 Phase 2에서 0개가 됐고,
`qlist-*` 하드코딩 22개는 Phase 3-5에서 (당시 "D08의 선결 조건"이라고 명시하며) 제거됐고,
`--mui-palette-*` 오용 5곳은 Phase 4에서 잡혔다. 테마 골격도 이미 다크를 받을 형태였다 —
`palette`/`shadows`/`customShadows`가 전부 `Partial<Record<ThemeColorScheme, …>>`인데
**D07 Phase 1에서 light 키만 채워 이식했을 뿐**이었다. 구조 변경 없이 dark 키만 채우면 됐다.

> 규모 추정을 **착수 시점에 다시 하는 것**이 왜 필요한지 보여주는 사례다. §6의 추정은
> 2026-07-25 기준이었고 그 뒤 Phase 3-5·4가 선결 조건을 대신 치웠는데 표는 갱신되지 않았다.

**사용자 결정 2건.** ① 기본값은 **OS 설정 따름**(`defaultMode:'system'`). ② 토글은 **3단 메뉴**
(라이트/다크/시스템). 2단 아이콘 토글을 기각한 이유가 결정적이다 — **기본이 system인데 2단으로
만들면 한 번 누르는 순간 선택이 고정되고 "OS 따름"으로 되돌릴 방법이 사라진다.** 두 결정은 묶여 있다.

> ⚠️ **함정 1 — `*.lighter`·`*.darker`는 두 색상 스킴이 공유한다.**
> `palette.ts`에서 모드별로 갈리는 것은 `text`·`background`·`action` **셋뿐**이고
> `basePalette`(primary·success·warning·…)는 공유다. 그래서 선택 강조에 흔히 쓰는
> `primary.lighter`가 다크에서도 `#D0ECFE` 그대로다.
> **하드코딩 hex가 아니라 정상 토큰을 썼는데 깨지므로 grep으로 안 잡힌다** — 콘솔도 빌드도 조용하다.
> 더 나쁜 건 `StatCards.jsx`에 **이미 예방 주석이 있었다**는 것이다: *"배경은 lighter 계열을 쓴다 —
> 하드코딩 hex를 넣으면 다크에서 튄다."* D07 Phase 4에서 D08을 대비해 적은 것인데
> **전제가 틀려서 예방책이 오히려 함정을 고정시켰다.**
> → `theme/tint.js`(`tintBg`/`tintSx`/`tintFg`) 신설, 사용처 13곳 중 11곳 교체.
> **계약 #20으로 승격.**

> ⚠️ **함정 2 — `tintSx`/`tintFg`는 함수를 반환한다.** 객체 리터럴 sx에
> `...tintSx('primary')`로 스프레드하면 함수엔 열거 가능한 속성이 없어 **아무것도 안 들어가고
> 에러도 안 난다.** 함정 1을 고치는 도중에 같은 부류의 조용한 실패를 두 곳(`nav.tsx`·
> `QuestionListPanel`)에 새로 만들었고, **빌드가 아니라 재측정에서** 잡았다.
> 조용한 실패를 고치는 코드가 조용히 실패한 셈이다.

**"종이인가, 종이를 담는 도구인가"가 판별 기준이 됐다.** 다크 전환의 진짜 어려움은 색을 바꾸는
것이 아니라 **바꾸면 안 되는 것을 가려내는 일**이었다. `WorkbookPreview`의 지면·셀(계약 #14),
`workbookLayout.DIVIDER_COLOR`(계약 #13), `.pdf-page-wrapper`의 흰 바탕, 그리고 **흰 지면 위에
떠 있는** 배율 컨트롤·드래그 오버레이는 전부 다크에서도 밝아야 한다. 스펙 §3에 표로 고정했다.

**FOUC는 테마 프로바이더로 못 막는다.** 번들 495KB가 로드되기 전까지 문서는 비어 있고 캔버스는
브라우저 기본 흰색이라, 다크 사용자는 **흰 화면을 본 뒤 어두워진다.** `index.html`에 사전 페인트
스크립트를 넣어 파싱 시점에 속성과 배경만 먼저 심었다. 이 스크립트는 저장 키(`mui-mode`)·
속성명(`data-color-scheme`)·배경 hex 세 가지가 앱과 짝이다 → **계약 #21로 승격.**
`ThemeProvider`에 `noSsr`도 켰다 — 없으면 CSR인데도 2패스로 그려 한 번 번쩍인다.

**Phase 3-4·3-5의 교훈이 세 번째로 재확인됐다.** 함정 1은 **스크린샷을 눈으로 보고서야** 잡혔다.
그 시점에 자동 검증 17개는 **전부 통과 상태**였다(변수 정의·콘솔 에러·문서 스크롤·지면 흰색).
수치 검증은 "내가 재기로 한 것"만 재므로, 재기로 하지 않은 실패는 통과로 보인다.

**실측**(headless Chrome/CDP, 1600×1000, SOURCE 5개·2,686문항): 참조 CSS 변수 12개 전원 정의 확인,
그중 7개가 모드별로 갈림(`action.hover`·`primary.main` 등 4개는 설계상 공유). 4개 라우트 콘솔 에러
0건 · 문서 스크롤 0(계약 #1 유지). 다크 body `rgb(20,26,33)`, 툴바 `rgb(40,50,61)`, 지면
`rgb(255,255,255)`. 통계 카드 3장 + nav 배지의 배경·글자색이 모드별로 전부 다름.
**미검증 2건**: FOUC 부재(첫 페인트의 찰나라 CDP 스크린샷으로 못 집음)와 "시스템" 선택 시
OS 테마 변경 즉시 반영(headless 프로필 밖 조작) — 사용자 육안 확인에 맡겼다.

**검증 도구는 매번 다시 만들어야 했다.** Phase 3-5에서 쓴 CDP 드라이버가 스크래치패드에만 있어
세션이 끝나면 사라진다. 이번에도 같은 것을 다시 짰다(node 22 내장 `WebSocket`, 의존성 0).
레포에 넣지 않는 판단은 유지하되, **재작성 비용이 매번 든다는 것**은 적어 둔다.

---

## 2026-07-29

### REQ 번호 부여 체계 — 점유 목록 일원화

`예정된작업.md`의 미번호 항목 3건에 번호를 부여하다가(D09·F10·D10) **번호 점유가 두 곳에
흩어져 있다는 걸 발견했다.** D08·F09·REQ-27은 D07 스펙 §6에서 제안돼 이미 예약된 상태인데
요구사항 인덱스에는 없었다. `ls docs/specs/`로 다음 번호를 뽑는 종전 방식대로 했으면
**D08부터 부여해 예약분과 충돌할 뻔했다.**

CLAUDE.md가 "스펙 파일이 없는 REQ가 있어 위 명령만으로는 부족하다"고 경고하고 있었지만
예로 든 것이 C08 하나뿐이라, **구현됐는데 스펙이 없는 경우**만 예외로 읽혔다.
실제 함정은 그 반대쪽 — **아직 구현 안 됐는데 번호만 잡아 둔 제안**이다. 이쪽이 훨씬 잦다.

→ PROGRESS.md에 **"미착수 — 번호만 부여된 것"** 표를 신설해 예약분까지 한곳에 모으고,
CLAUDE.md의 조회 명령을 `{ ls docs/specs/; cat docs/PROGRESS.md; }`로 바꿨다.
prefix 점유 범위 표도 실제와 어긋나 있어(`D01~D05`로 적혀 있는데 D07까지 존재) 맞췄다.
**"점유 범위는 미착수·기각 번호를 포함하고 번호는 재사용하지 않는다"**를 명시했다.

> 이 규칙을 `## 계약`이 아니라 넘버링 절에 둔 이유: 어겨도 **코드가 회귀하지는 않는다.**
> 계약 절은 "모르고 고치면 버그가 재발하는 것"만 담아야 밀도가 유지된다.

**D10은 REQ-D01과 방향이 반대다.** D01이 "문항 이미지 대형화"였고 D10은 "과도하게 커지면
너비 조절 의미가 사라진다"는 요구다. 착수 시 D01 폐기가 아니라 **임계 너비 초과 시에만
열 수를 늘리는 것**임을 스펙에 명시해야 한다 — 안 적어 두면 다음 사람이 둘 중 하나를 버린다.

**F10은 프론트만으로 안 된다** — 생성 이력도 페이지네이션돼 있어(REQ-P03-03) 클라 필터로는
아직 안 불러온 뒷 페이지를 못 찾는다. `list_workbooks` 서버 검색이 선행돼야 한다.
분석 목록에서 이미 한 번 겪은 것과 같은 이유다.

### REQ-D07 Phase 4 — 2안 적용 범위 확정 및 구현 정렬

**기록과 구현이 갈라져 있었다.** 사용자가 아티팩트(1안 vs 2안 비교)와 대조를 요청해 발견했다.
§8 #8은 "2안 채택"인데 실제로 지어진 화면 4개 중 3개가 아티팩트 **1안**이었다 — 작업 화면 둘은
맞붙은 패널 그대로였고 리사이즈 핸들도 남아 있었다(2안이면 사라진다고 아티팩트가 명시). 즉
아티팩트가 하단에서 *권장*한 하이브리드로 지어졌는데 **그 이탈이 어디에도 적히지 않았다.**
스펙 §5 Phase 표에는 3-4·3-5가 "카드 섹션 재구성"으로 적혀 있었으니 계획과도 어긋난 상태였다.

> 반년 뒤 "2안으로 했다는데 화면은 왜 1안이지"가 될 자리였다. 결정 기록은 **무엇을 골랐는지**만
> 적고 **무엇을 실제로 지었는지**는 안 적으면 이렇게 조용히 벌어진다.

**사용자 결정: 기록이 아니라 구현을 2안에 맞춘다.** 적용 범위와 예외는 스펙 §4-2에 표로 고정했다.
요점 두 가지 —

- **분석 목록은 의도적 예외**로 남긴다. 2안이 "테이블 + 툴바"인데 조건 ①이 테이블 전환을 금지하고
  B안 책 카드가 확정안이라 정면충돌한다. 2안의 공통 요소(페이지 헤더·브레드크럼)만 받는다.
- **문제집 편집은 카드 섹션까지만.** 단계형(한 번에 한 단계)은 기각 — 선택→정렬→결과가 동시에 보이는
  것이 이 화면의 핵심이고 조건이 "유저 플로우를 깨지 않는 선"이었다. 아티팩트 스스로 "익숙한
  사용자는 단계를 오가야 한다"고 적어 뒀다.

**리사이즈 핸들은 살렸다** — 아티팩트 2안은 버리라고 했지만 206페이지 문서에서 뷰어를 넓혀 보는
용도가 실제로 쓰인다. 카드에 붙이지 않고 카드 사이 여백에 알약으로 둬 라운드 모서리를 침범하지 않게 했다.

> ⚠️ **함정 — 테마 CSS 변수 접두사는 `--palette-*`인데 `--mui-palette-*`로 쓴 코드가 5곳 있었다.**
> 틀린 변수는 **에러 없이 상속색으로 떨어진다**(실측: 의도한 `rgb(145,158,171)` 대신 `rgb(99,115,129)`).
> Phase 3-5에서 잡은 Aurora 잔재와 **완전히 같은 실패 방식**이다 — 죽은 CSS 변수는 콘솔에도
> 빌드에도 안 잡히고 색만 조용히 틀린다. 두 번 밟았으므로 **계약 #18로 승격**.
> 이번엔 반대로 내가 의심한 `background.neutral`은 정상이었다(sx는 CSS 변수가 아니라 테마 객체로
> 해석한다). **raw `var()`만 위험하고 sx 토큰은 안전하다**는 것이 정확한 구분선이다.

**공용 컴포넌트로 뽑았다**(`PageHeader`, `WorkCanvas`/`CardRow`/`PanelCard`/`CardResizeHandle`).
카드 도입으로 높이 체인 래퍼가 한 겹 늘어나는데 화면마다 손으로 쓰면 계약 #1이 깨지는 지점이 4곳이
된다. → **계약 #19로 승격.** `CardRow`에 `gap`과 핸들을 같이 걸면 간격이 두 배가 되는 것도 함께 적었다.

**신규 API `GET /api/stats`** — 통계 카드용. 목록 API가 페이지네이션돼 있어(REQ-P03-03) 프론트에서
합계를 낼 수 없다. 한 페이지분만 더하면 **스크롤할수록 숫자가 커지는** 카드가 된다.

**워크스페이스 선택기는 표시 전용**으로 뒀다. 2안의 대표 요소지만 인증이 없어 고를 것이 없다(REQ-27).
동작하지 않는 드롭다운을 열어 주는 것보다 눌리지 않게 하고 툴팁으로 이유를 알리는 편을 택했다.

**실측**(headless Chrome/CDP, 1600×1000): 4개 라우트 문서 스크롤 0 · 콘솔 에러 0건.
편집 화면에서 카드 4장 `clipped:false`, 뷰포트 넘침 없음(카드 하단 984 = 캔버스 1000 − 패딩 16),
핸들 3개(각 16px, 알약 4×28). 계약 #1·#5·#7·#8과 멀티 파일 노출을 카드 재구성 **후** 재측정해
전부 유지 확인. **미검증**: 실제 마우스 드래그 리사이즈, PDF 생성 왕복 — Phase 3-5와 같은 이유로
사용자 육안 확인에 맡겼다.
→ **2026-07-29 사용자 확인**: PDF 생성 왕복(이력 → 편집 이동) 정상. **`CardResizeHandle` 마우스
드래그 리사이즈는 여전히 미확인** — 확인된 DnD는 바스켓 항목 정렬(Phase 3-5)로 이것과는 별개다.

### REQ-D07 Phase 3-5 — 문제집 편집 + 멀티 파일 선택 노출

**사용자 결정 3건.** ① 출처는 **책등 색 점 + 이름** — 출처별 그룹 헤더로 묶는 안은 기각했다.
바스켓 순서가 곧 PDF 배치 순서인데 DnD가 그룹 경계를 넘나들면 순서의 의미가 흐려진다.
② `QuestionListPanel`을 MUI로 전환하고 `qlist-*` CSS를 **제거**. ③ 분해는 **바스켓 패널만**
(4패널 전부 분리하면 basket/layout/generating 상태를 대량 props 드릴링해야 해 회귀 위험이 커진다).

**스펙이 코드보다 늦어 있었다.** D07 스펙 §5-2가 "`SelectionBasket`이 출처를 안 쓴다"고 지목했지만
그 파일은 **Phase 1 도달성 분석에서 데드코드로 이미 삭제**됐고, 같은 로직이 `editor/index.jsx`의
인라인 `SortableItem`으로 살아 있었다. 스펙의 지목 대상을 곧이곧대로 찾으면 헛돈다.

**조건 ②는 예상대로 가시성 작업이었다.** 파일을 바꿔도 선택은 원래부터 유지됐고(`handleJobSelect`가
jobId만 교체), 항목마다 출처가 저장돼 있었으며, 복합키(ADR-0002) 덕에 충돌도 없었다.
화면에 흔적이 없어 기능이 없는 것처럼 보였을 뿐이다. 노출 지점 3곳(컨텍스트 바 요약 · 파일 카드 배지 ·
바스켓 항목 출처)을 추가하는 것으로 끝났고 **동작 로직은 한 줄도 안 고쳤다.**

> ⚠️ **함정 — `workbook_name`은 고유하지 않다.** 출처 색을 목록 화면과 같은 이름 해시
> (`spineColorOf`)로 잡았는데 브라우저 검증에서 **색이 1종만** 나왔다. 실데이터의 서로 다른 두 파일이
> 똑같이 "테스트03"이다(사용자 자유 입력). 목록 화면은 책 1권 = 1카드라 충돌이 안 드러나지만,
> 출처가 나란히 놓이는 편집 화면에서는 구분 기능이 통째로 죽는다. → 색 키를 `job_id`로.
> **CLAUDE.md 계약 #17로 승격.**

**라벨 표기 기각 1건**: 이름이 겹칠 때 `이름 · 파일명`으로 덧붙이는 안은 실측 후 버렸다.
240px 패널에서 앞의 **공통** 이름만 보이고 정작 구분되는 파일명이 잘린다. 겹치는 순간 이름은
정보가 아니므로 **파일명 단독**으로 대체한다. 복원 시에도 유지되게 `source_filename`을
저장 스키마에 추가했다(Optional — 예전 저장분은 `None`으로 로드되는 것까지 확인).

**계약 #4는 번호를 밀지 않고 일반화했다.** `qlist-*`가 정당하게 죽어 계약이 수명을 다했지만,
Phase 3-4에서 #5 신설로 #5~#15가 통째로 밀리며 "같은 `#6`이 두 표에서 다른 걸 가리키는" 혼란을
겪었다. 같은 자리에서 "CSS 클래스는 지우기 전 사용처 전수 확인, 살아있는 접두사는 `wbp-*`·`pdf-*`뿐"으로
바꿔 번호 재배치를 피했다. **죽은 계약을 지우는 것보다 자리를 유지하며 교훈을 남기는 편이 싸다.**

**부수 버그 2건.**
- `editor/index.jsx`에 Phase 1에서 사라진 `var(--aurora-palette-text-secondary)`가 남아 있었다.
  존재하지 않는 CSS 변수는 조용히 무시되므로 **에러 없이 색만 죽는다** — grep으로만 잡힌다.
- 바스켓 라벨이 `title || (…) + " · Np"`였다. `+`가 `||`보다 먼저 묶여 **제목이 있으면 페이지 번호가
  통째로 사라진다.** 감지 문항은 대부분 제목이 있어 사실상 상시 발생했는데, "원래 페이지가 안 나오나 보다"로
  읽혀 아무도 버그로 신고하지 않았다.

**검증 도구**: 레포에 puppeteer/playwright가 없어 **node 22 내장 `WebSocket`으로 최소 CDP 드라이버**를
짜서 headless Chrome을 몰았다(스크래치패드에만 둠). 의존성 추가 없이 되므로 다음에도 같은 방식이면 된다.

**Phase 3-4의 교훈이 그대로 재확인됐다** — 라벨 잘림과 중복 부제목("파일 선택" 헤더 아래
"업로드된 파일")은 **스크린샷을 눈으로 보고서야** 잡혔다. 수치 검증(스크롤·개수·콘솔)은 전부 통과 상태였다.

**실측**(headless Chrome/CDP, SOURCE 5개·601문항 실데이터): 계약 #1·#4·#5·#7·#8 전부 통과.
바스켓 행 `flexShrink` 0 / 썸네일 36×36 유지, 파일 카드 높이 76px 균일, memo 비교자 생존
(다른 항목 토글 후 첫 항목 DOM 동일 참조), 출처 색 2종 구분, 4개 라우트 콘솔 에러 0건.
이로써 D07 스펙 §4의 9개 계약이 **전부 실제 화면에서 한 번 이상** 확인됐다.

**미검증으로 남긴 것**: 실제 마우스 DnD 정렬과 PDF 생성 왕복(생성 → 이력 → 편집 복원)은
사용자 스토리지에 산출물을 남기므로 자동 검증에서 제외하고 사용자 육안 확인에 맡겼다.
→ **2026-07-29 사용자 확인 완료 — 둘 다 정상.** 남은 미검증 없음.

## 2026-07-27

### REQ-D07 Phase 3-4 — 문항 분석 작업 화면 (커밋 `fa67b98`)

**사용자 결정 2건.** ① 페이지 목록은 **텍스트 행 유지**(썸네일 카드 그리드 기각) —
카드 어휘와는 통일되지만 패널 폭을 200 → 280px로 넓혀야 해서 ② 뷰어가 좁아지고
페이지당 썸네일 요청이 늘어난다. ①②③ 번호는 **제거**하고 아이콘 + 제목으로.

**번호 제거는 스타일 작업이 아니라 문구 동기화 작업이었다.** "② 미리보기에서 수동 추가로
직접 지정" 같은 **상호 참조 문구**가 빈 상태 안내·주석에 흩어져 있다. 훑는 김에 주석 오기도
하나 나왔다 — `③ QuestionListPanel도 같은 API를 쓴다`고 적혀 있었으나 이 화면의 ③은
`QuestionAnalysisPanel`이고 `getPageQuestions`를 쓴다. `QuestionListPanel`은 편집 화면 소유다.

**함정 — 카드가 flex 아이템으로 축소돼 이미지가 잘렸다.** 목록 컨테이너가 flex 컬럼이라
카드에 기본 `flex-shrink:1`이 걸리고, 카드의 `overflow:hidden`이 축소분만큼 문항 이미지를
잘라 낸다(실측 카드 **133px** vs 이미지 **415px**). REQ-D01 "대형 이미지"가 통째로 깨지는데
**목록이 스크롤되지 않아 증상이 "이미지가 좀 짧다"로만 보인다.**

> ⚠️ **검증 방법론이 이번의 진짜 교훈이다.** 스크롤 여부·카드 개수·콘솔 에러는 전부 정상으로
> 측정됐다. 스크린샷을 **눈으로 보고서야** 잡혔다. 계측만으로는 "레이아웃이 콘텐츠를 삼킨"
> 부류를 못 잡는다 — 화면 작업은 수치 검증 + 육안 확인을 함께 가야 한다.

원인은 예상과 달랐다. 종전 순수 CSS 카드는 자기 자신이 `display:flex`라 min-content 높이가
버텨 주고 있었고, MUI `Paper`는 블록이라 그 보호가 사라진 것이다. → **CLAUDE.md 계약 #5로 승격**.

**실측**: `App.css` 708 → 405줄. 카드 133 → 453px, 목록 scrollHeight 803 → 2411.
좌표 공식 왕복 오차 **0.00px**, `scrollToPage` 50→50·100→100·9→9, 콘솔 에러 0건
(headless Chrome/CDP, 206페이지·601문항 실데이터).

**계약 번호 재배치**: #5 신설로 기존 #5~#15가 #6~#16으로 밀렸다. 외부 참조는 D07 스펙의
검증 표뿐이라 함께 갱신했고, 스펙 §4에 **로컬 번호 표가 따로 있어 `#6`이 두 표에서 다른 것을
가리키던** 혼동도 명시로 정리했다.

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
