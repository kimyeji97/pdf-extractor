# PDF 문항 추출기 — v3 마스터 플랜 (인덱스)

> **버전**: v3.0 | **작성일**: 2026-04-26  
> **전제 버전**: SDD spec v2 (REQ-01~REQ-09 구현 완료 기준)

---

## 개요

v2 시각적 문항 선택 UX 위에 세 가지 목적 메뉴를 도입하고, 문항 감지 정밀도를 개선한다.

| 메뉴 | 목적 |
|------|------|
| **문항 분석** | 자동/수동 문항 관리 (재감지, 타이틀 수정, 수동 추가, 삭제, 오탐지 표시) |
| **문제집 생성** | 문항 선택 + 레이아웃 지정 → PDF 생성 |
| **생성된 문제집** | 생성 이력 확인 + 재다운로드 + 편집 복원 |

---

## 요구사항 목록

### 공통 메뉴

| ID | 요구사항 |
|----|----------|
| REQ-10 | 상단 탭 메뉴로 세 가지 화면 전환 |

### 문항 분석

| ID | 요구사항 |
|----|----------|
| REQ-11 | 파일 선택 후 해당 파일의 문항 재감지 실행 |
| REQ-12 | 감지된 문항의 타이틀을 수정할 수 있다 |
| REQ-13 | 드래그로 수동 문항 영역 추가 (타이틀 필수). 서버에 영속 저장 |
| REQ-14 | 문항들을 선택해 일괄 삭제할 수 있다 |
| REQ-15 | 오탐지 문항(경계 = 페이지 전체 크기) 하이라이트 표시 |

### 문제집 생성

| ID | 요구사항 |
|----|----------|
| REQ-16 | 파일 → 페이지 → 문항(타이틀 기반 목록) 탐색 및 선택 |
| REQ-17 | 선택 문항 Canvas 미리보기 (실제 PDF와 레이아웃 일치) |
| REQ-18 | 페이지 레이아웃 선택: 2단(1×2) / 4단(2×2) / 6단(3×3) |
| REQ-19 | 선택 문항 드래그 앤 드롭으로 순서 재배치 |
| REQ-20 | 기존 문제집 불러와 편집 (문항 추가/제거) |

### 생성된 문제집

| ID | 요구사항 |
|----|----------|
| REQ-21 | 생성된 문제집 이력 목록 확인 |
| REQ-22 | 이력에서 문제집 재다운로드 |

### 문항 감지 정밀도 개선

| ID | 요구사항 |
|----|----------|
| REQ-23 | y_bottom = min(다음 문항 y_top, 마지막 텍스트 bottom + 50pt) |
| REQ-24 | col_x0 = 문항 번호 텍스트 x0 − 10pt / col_x1 = 문항 내 최대 x1 |
| REQ-15 | (상동) 오탐지 감지 로직 추가 |

---

## 기능별 plan 문서

| 기능 | 디렉토리 | plan 문서 | 관련 REQ |
|------|---------|-----------|---------|
| 상단 탭 메뉴 | `nav-menu/` | [plan-nav-menu.md](nav-menu/plan-nav-menu.md) | REQ-10 |
| 감지 정밀도 개선 | `detection-precision/` | [plan-detection-precision.md](detection-precision/plan-detection-precision.md) | REQ-15, 23, 24 |
| 문항 분석 메뉴 | `question-analysis/` | [plan-question-analysis.md](question-analysis/plan-question-analysis.md) | REQ-11~15 |
| 문제집 생성 메뉴 | `workbook-editor/` | [plan-workbook-editor.md](workbook-editor/plan-workbook-editor.md) | REQ-16~20 |
| 생성된 문제집 메뉴 | `workbook-history/` | [plan-workbook-history.md](workbook-history/plan-workbook-history.md) | REQ-21~22 |

---

## 아키텍처 변경 요약

### 백엔드

```
backend/app/
├── routers/
│   ├── browse.py      (기존 확장 — 문항 CRUD 엔드포인트 추가)
│   ├── extract.py     (기존 확장 — layout 파라미터)
│   ├── upload.py      (기존 유지)
│   └── workbook.py    (신규 — 문제집 메타데이터 CRUD)
├── services/
│   ├── pdf_service.py      (기존 확장 — 레이아웃 그리드 PDF 빌드)
│   └── local_storage_service.py  (기존 확장 — manual/workbook 메서드)
├── utils/
│   ├── question_parser.py  (기존 확장 — 정밀도 개선 로직)
│   └── layout_spec.py      (신규 — 레이아웃 상수 + contain_fit)
└── models/
    └── schemas.py     (기존 확장 — ManualQuestion, WorkbookMeta, LayoutType)
```

### 프론트엔드

```
frontend/src/
├── App.jsx                       (변경 — NavMenu + 뷰 라우팅)
├── views/                        (신규 디렉토리)
│   ├── QuestionAnalysisView.jsx
│   ├── WorkbookEditorView.jsx
│   └── WorkbookHistoryView.jsx
├── components/
│   ├── NavMenu.jsx               (신규)
│   ├── QuestionListPanel.jsx     (신규)
│   ├── WorkbookPreview.jsx       (신규)
│   └── WorkbookHistory.jsx       (신규)
├── utils/
│   └── workbookLayout.js         (신규 — 레이아웃 상수 + containFit)
└── api/client.js                 (기존 확장)
```

### 저장소 추가

```
local_storage/
├── manual_questions/{job_id}.json      (신규 — 수동 추가 문항)
├── workbooks/{workbook_id}.json        (신규 — 문제집 메타데이터)
└── thumbnails/{job_id}/
    └── manual_{page}_{manual_id}.png   (신규 — 수동 문항 썸네일)
```

---

## 신규 API 전체 목록

| Method | Path | 설명 | 요구사항 |
|--------|------|------|---------|
| `PATCH` | `/api/jobs/{id}/pages/{n}/questions/{q}` | 자동 문항 타이틀 수정 | REQ-12 |
| `POST` | `/api/jobs/{id}/pages/{n}/questions/manual` | 수동 문항 추가 | REQ-13 |
| `PATCH` | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}` | 수동 문항 타이틀 수정 | REQ-12 |
| `DELETE` | `/api/jobs/{id}/pages/{n}/questions/{q}` | 자동 문항 삭제 | REQ-14 |
| `DELETE` | `/api/jobs/{id}/pages/{n}/questions/manual/{mid}` | 수동 문항 삭제 | REQ-14 |
| `GET` | `/api/workbooks` | 문제집 이력 목록 | REQ-21 |
| `GET` | `/api/workbooks/{wid}` | 문제집 메타데이터 | REQ-20 |
| `POST` | `/api/workbooks` | 문제집 메타데이터 저장 | REQ-20 |

**기존 API 변경**:
- `GET /api/jobs/{id}/pages/{n}/questions` 응답에 `title`, `is_false_positive`, `is_manual`, `manual_id` 추가
- `POST /api/extract-v2` 요청에 `layout` 필드 추가

---

## 구현 순서 (Phase별)

> 상세 작업 목록은 각 plan 문서 참고.

```
Phase 1  감지 정밀도 개선 (백엔드)
         └─ detection-precision/plan-detection-precision.md
         의존성: 없음. 먼저 처리 가능.

Phase 2  문항 CRUD API (백엔드)
         └─ question-analysis/plan-question-analysis.md §3 (백엔드)
         의존성: Phase 1 (QuestionBoundary 모델 확장)

Phase 3  레이아웃 PDF 생성 + 문제집 API (백엔드)
         └─ workbook-editor/plan-workbook-editor.md §5 (백엔드)
         의존성: Phase 2 (수동 문항 API)

Phase 4  메뉴 전환 UI (프론트엔드)
         └─ nav-menu/plan-nav-menu.md
         의존성: 없음. Phase 1~3과 병행 가능.

Phase 5  문항 분석 메뉴 UI (프론트엔드)
         └─ question-analysis/plan-question-analysis.md §4 (프론트엔드)
         의존성: Phase 2 API + Phase 4 메뉴

Phase 6  문제집 생성 메뉴 UI (프론트엔드)
         └─ workbook-editor/plan-workbook-editor.md §6 (프론트엔드)
         의존성: Phase 3 API + Phase 4 메뉴

Phase 7  생성된 문제집 메뉴 UI (프론트엔드)
         └─ workbook-history/plan-workbook-history.md
         의존성: Phase 6 완료 (workbook API 완성)
```

---

## 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 수동 문항 저장 | 1초 이내 응답 |
| Canvas 미리보기 갱신 | 선택 변경 후 200ms 이내 |
| 레이아웃 PDF 생성 시간 | 기존 대비 +10% 이하 |
| 캐시 하위 호환 | 기존 `boundaries/*.json` 신규 필드 기본값 역직렬화 |
| 수동 문항 영속성 | 새로고침 후 서버에서 복원 |
| DnD 반응성 | 드래그 중 지연 없음 |

---

## 용어 정의

| 용어 | 설명 |
|------|------|
| `manual_id` | 수동 추가 문항 고유 식별자 (UUID) |
| `workbook_id` | 생성된 문제집 고유 식별자 (UUID) |
| `result_job_id` | `extract-v2`가 반환하는 export job UUID |
| `layout` | 그리드 레이아웃 타입 (`2단` / `4단` / `6단`) |
| `is_false_positive` | 경계가 페이지 전체 크기와 일치하는 오탐지 여부 |
| `title` | 사용자 지정 문항 이름. `null`이면 "문항 {number}"로 표시 |
| `contain_fit` | 종횡비 유지로 셀에 맞추는 letterbox 피팅 방식 |
