# REQ-F06 생성 이력 미리보기를 PDF 뷰어로 변경

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-29 |
| 작성자 | kimyeji97 |
| 상태 | open |
| 관련 | REQ-21 문제집 이력 조회, REQ-22 이력 미리보기 |

---

## 1. 배경·목표

**배경**

현재 생성 이력(WorkbookHistoryView)의 미리보기는 `WorkbookPreview` 컴포넌트를 사용하여 개별 문항 썸네일을 그리드 레이아웃으로 재구성하여 보여주고 있다. 이는 실제 생성된 PDF 결과물과 다를 수 있으며, 사용자가 최종 결과물을 정확히 확인하기 어렵다.

**목표**

- 생성 이력 미리보기를 **실제 생성된 PDF**를 렌더링하는 PDF 뷰어로 변경
- 확대/축소, 페이지 입력 이동, 스크롤 기반 페이지 탐색 기능 제공

---

## 2. Scope

**In-scope**

- `react-pdf` 라이브러리 도입
- PDF 뷰어 컴포넌트 신규 생성 (`PdfPreviewPanel`)
- WorkbookHistoryView 미리보기 패널을 PDF 뷰어로 교체
- PDF 뷰어 기능: 확대/축소, 페이지 번호 입력 이동, 스크롤 페이지 탐색

**Out-of-scope (non-goal)**

- 문제집 편집(WorkbookEditorView)의 미리보기 변경 (편집 중에는 실시간 레이아웃 미리보기가 필요)
- 백엔드 API 변경
- PDF 다운로드/편집 기능 변경

---

## 3. 기술 선택

### react-pdf

| 항목 | 내용 |
|------|------|
| 라이브러리 | `react-pdf` (pdfjs-dist 래퍼) |
| 선택 이유 | React 컴포넌트 기반, 줌/페이지 제어 API 제공, 표준 솔루션 |
| 대안 비교 | `<iframe>` (브라우저 내장 뷰어 — 커스텀 컨트롤 불가), pdfjs-dist 직접 사용 (보일러플레이트 과다) |

---

## 4. UI 변경

### PDF 뷰어 구조

```
┌──────────────────────────────────────┐
│ 툴바                                 │
│ [−] [100%] [+]  │  [◀] [3/12] [▶]  │
├──────────────────────────────────────┤
│                                      │
│        PDF 페이지 (스크롤)           │
│                                      │
│        ┌──────────────┐              │
│        │   Page 1     │              │
│        └──────────────┘              │
│        ┌──────────────┐              │
│        │   Page 2     │              │
│        └──────────────┘              │
│        ...                           │
│                                      │
└──────────────────────────────────────┘
```

### 툴바 기능

| 기능 | 조작 | 동작 |
|------|------|------|
| 축소 | `−` 버튼 | 25% 단위 축소 (최소 50%) |
| 확대 | `+` 버튼 | 25% 단위 확대 (최대 300%) |
| 배율 표시 | 중앙 텍스트 | 현재 배율 퍼센트 표시 |
| 이전 페이지 | `◀` 버튼 | 해당 페이지로 스크롤 이동 |
| 페이지 입력 | 숫자 입력 필드 | 입력한 페이지로 스크롤 이동 |
| 다음 페이지 | `▶` 버튼 | 해당 페이지로 스크롤 이동 |

### 스크롤 동작

- 모든 페이지를 세로로 나열하여 스크롤로 탐색
- IntersectionObserver로 현재 보이는 페이지 번호를 자동 추적하여 툴바에 반영
- 페이지 번호 입력 또는 이전/다음 버튼 클릭 시 해당 페이지로 `scrollIntoView`

---

## 5. 수정 내용

### 5-1. 의존성 추가

```bash
npm install react-pdf
```

### 5-2. PdfPreviewPanel 컴포넌트 신규 생성

**파일**: `frontend/src/components/PdfPreviewPanel.jsx`

**Props:**
- `pdfUrl` (string) — PDF 파일 URL (download_url)

**내부 상태:**
- `numPages` — 총 페이지 수
- `currentPage` — 현재 표시 중인 페이지 번호
- `scale` — 줌 배율 (기본 1.0)
- `loading` — PDF 로딩 상태
- `error` — 로딩 에러

**핵심 로직:**
1. `react-pdf`의 `Document` + `Page` 컴포넌트로 PDF 렌더링
2. 모든 페이지를 세로로 나열 (스크롤 탐색)
3. `IntersectionObserver`로 현재 페이지 추적
4. 페이지 입력/버튼 → `scrollIntoView` 이동
5. 줌 버튼 → `scale` 상태 변경

### 5-3. WorkbookHistoryView 수정

**파일**: `frontend/src/views/WorkbookHistoryView.jsx`

**변경 사항:**
1. `WorkbookPreview` import → `PdfPreviewPanel` import로 변경
2. `toPreviewItems()` 함수 제거
3. 문제집 선택 시 `getStatus(wb.result_job_id)`로 `download_url` 조회
4. 미리보기 패널에 `PdfPreviewPanel`을 `download_url`과 함께 렌더링
5. 2패널 구조를 `.panel` + `.panel-header` + `.panel-body` 패턴으로 통일

### 5-4. CSS 추가

**파일**: `frontend/src/App.css`

PDF 뷰어 관련 스타일:
- `.pdf-toolbar` — 툴바 (flex, 중앙 정렬, 구분선)
- `.pdf-toolbar-btn` — 줌/페이지 버튼
- `.pdf-page-input` — 페이지 번호 입력
- `.pdf-scroll-container` — 스크롤 컨테이너
- `.pdf-page-wrapper` — 페이지 래퍼 (간격, 그림자)

---

## 6. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 이력 목록에서 문제집 클릭 | PDF가 로딩되어 미리보기 표시 |
| 2 | 확대 버튼 클릭 | 25% 단위 확대, 최대 300% |
| 3 | 축소 버튼 클릭 | 25% 단위 축소, 최소 50% |
| 4 | 페이지 번호 입력 후 Enter | 해당 페이지로 스크롤 이동 |
| 5 | 이전/다음 버튼 | 페이지 이동 + 스크롤 |
| 6 | 스크롤로 페이지 탐색 | 현재 페이지 번호 자동 갱신 |
| 7 | PDF 없는 항목 선택 | 에러/안내 메시지 표시 |
| 8 | 다른 문제집 클릭 | 이전 PDF 해제, 새 PDF 로드 |

---

## 7. 미결 질문 (Open Questions)

- 없음
