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



---

## 추가 요구사항 (v3.1)

> 구현 완료 후 발견된 버그 및 UX 개선 사항.  
> 상세 설계는 각 plan 문서 참고.

### 버그

| ID | 요구사항 | 관련 plan |
|----|----------|----------|
| REQ-B01 | 생성된 문제집 메뉴에서 이력 목록이 표시되지 않음 → `POST /api/workbooks` 저장 연결 수정 | plan-workbook-history |
| REQ-B02 | 문제집 생성 시 미리보기와 다른 문항이 다운로드됨 → 문항 식별자를 `{job_id}_{page_num}_{title}` 형식으로 통일하고 모든 통신에 적용 | plan-workbook-editor |

### 문제집 생성 개선

| ID | 요구사항 | 관련 plan |
|----|----------|----------|
| REQ-C01 | 문제집 생성 시 파일명 입력 받기 (기본값: `문제집_YYYY-MM-DD`) | plan-workbook-editor |
| REQ-C02 | 그리드 레이아웃 6단을 3×3(9문항) → 2×3(6문항)으로 변경 | plan-workbook-editor |
| REQ-C03 | 그리드 레이아웃 `2단` 명칭을 `세로 2단`으로 변경 | plan-workbook-editor |
| REQ-C04 | 그리드 레이아웃 `가로 2단` 추가 (2행 1열) | plan-workbook-editor |
| REQ-C05 | 열 간 세로 구분선 추가 (Canvas 미리보기 + 생성 PDF 동시 적용) | plan-workbook-editor |
| REQ-C06 | 문항 이미지를 셀 좌측 상단에 고정 배치 (기존 가운데 letterbox 방식 변경) | plan-workbook-editor |

### 문항 분석 개선

| ID | 요구사항 | 관련 plan |
|----|----------|----------|
| REQ-D01 | 문항 이미지를 현재 대비 8배 크기로 표시 (반응형), 문항 타이틀을 이미지 상단으로 이동 | plan-question-analysis |
| REQ-D02 | 문항 분석 메뉴에서 담기 및 PDF 다운로드 기능 제거 (문제집 생성 메뉴로 이관) | plan-question-analysis |
| REQ-D03 | 재감지 버튼을 문항 목록 툴바에서 파일 선택 섹션으로 이동 (파일 단위 재감지) | plan-question-analysis |
| REQ-D04 | 파일 선택 패널과 페이지 선택 패널을 하나의 섹션으로 통합: 파일 선택 후 동일 영역이 페이지 선택 모드로 전환, 뒤로가기 버튼으로 복귀, 페이지 선택 모드에서는 썸네일 없이 감지 문항 수만 표시, 페이지 선택 시 두 번째 섹션에 전체 썸네일 표시, [수동 추가] 버튼을 두 번째 섹션으로 이동 | plan-question-analysis |

### 감지 UX 개선

| ID | 요구사항 | 관련 plan |
|----|----------|----------|
| REQ-E01 | 문항 감지 중 WebSocket으로 페이지별 진행률 스트리밍 (총 n페이지 중 n페이지 완료) | plan-detection-precision |

---

## 구현 순서 (v3.1 Phase)

> v3 Phase 1~7 완료 후 이어서 진행.  
> 버그 수정 → 백엔드 공통 변경 → 기능 개선 순으로 진행한다.

```
Phase A  버그 수정 (최우선)
         ├─ REQ-B02: question_id 식별자 체계 도입
         │    백엔드: browse.py QuestionInfo에 question_id 추가
         │           pdf_service.py question_id 기반 탐색으로 교체
         │           schemas.py WorkbookSelectionItem.question_id 추가
         │    프론트: QuestionListPanel, client.js, WorkbookEditorView
         │    의존성: 없음. 가장 먼저 처리.
         │
         └─ REQ-B01: 생성된 문제집 목록 미노출 수정
              백엔드: workbook.py 디렉토리 자동 생성 보장
              프론트: WorkbookEditorView PDF DONE 후 POST /api/workbooks 연결
              의존성: REQ-B02 완료 후 (WorkbookSelectionItem 스키마 확정)

Phase B  레이아웃 상수 변경 (백엔드 + 프론트 동시)
         ├─ REQ-C02: 6단 2×3으로 변경
         ├─ REQ-C03: 세로 2단 명칭 변경
         ├─ REQ-C04: 가로 2단 추가
         └─ REQ-C06: 좌측 상단 정렬 (contain → top_left_fit)
              layout_spec.py + workbookLayout.js 동시 수정
              의존성: Phase A 완료 (스키마 확정 후 레이아웃 변경)

Phase C  문제집 생성 UI 개선
         ├─ REQ-C01: 파일명 입력 (스키마 + UI)
         └─ REQ-C05: 세로 구분선 (pdf_service + Canvas)
              의존성: Phase B 완료 (레이아웃 상수 확정)

Phase D  문항 분석 UI 재편
         ├─ REQ-D02: 담기/다운로드 제거
         ├─ REQ-D03: 재감지 버튼 이동
         ├─ REQ-D01: 문항 이미지 대형화 + 타이틀 상단
         └─ REQ-D04: 파일+페이지 패널 통합 (FilePagePanel 신규)
              의존성: Phase A 완료. Phase B·C와 병행 가능.

Phase E  WebSocket 진행률 스트리밍
         └─ REQ-E01: detect_page() 분리 → 비동기화 → WS 엔드포인트 → 프론트 훅
              의존성: Phase D 완료 (FilePagePanel에 진행률 바 삽입)
```

### Phase별 작업 파일 요약

| Phase | 수정 파일 |
|-------|---------|
| A | `browse.py`, `pdf_service.py`, `schemas.py`, `WorkbookEditorView.jsx`, `QuestionListPanel.jsx`, `client.js`, `workbook.py` |
| B | `layout_spec.py`, `workbookLayout.js`, `WorkbookPreview.jsx`, `WorkbookEditorView.jsx` |
| C | `layout_spec.py`, `pdf_service.py`, `workbookLayout.js`, `WorkbookPreview.jsx`, `WorkbookEditorView.jsx`, `schemas.py` |
| D | `QuestionAnalysisView.jsx` (신규 `FilePagePanel.jsx` 포함) |
| E | `extract.py` (WS 엔드포인트), `question_parser.py`, `FilePagePanel.jsx` |