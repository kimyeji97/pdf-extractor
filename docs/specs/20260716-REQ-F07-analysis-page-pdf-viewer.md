# REQ-F07 문항 분석 페이지 미리보기를 PDF 뷰어로 전환

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-07-16 |
| 작성자 | kimyeji97 |
| 상태 | done |
| 관련 | REQ-F06 생성 이력 PDF 뷰어, REQ-B05 뷰어 툴바 버그, REQ-P02 성능 개선(뷰어 가상화) |

---

## 1. 배경·목표

**배경**

문항 분석 화면의 페이지 미리보기는 기존에 페이지 썸네일 방식(`FilePagePanel`/`PageBrowser`, 단일 PNG)을 사용했다. 생성 이력(REQ-F06)에서 도입한 PDF 뷰어처럼 실제 PDF를 렌더링하는 방식으로 통일한다.

**목표**

- 문항 분석 페이지 미리보기를 PDF 뷰어(`PdfPreviewPanel` 재사용)로 전환
- 확대/축소, 페이지 이동, 스크롤 탐색 제공

---

## 2. Scope

**In-scope**

- 문항 분석 페이지 미리보기 패널을 PDF 뷰어로 교체
- 문항 선택·드래그 오버레이를 PDF 렌더 좌표계 위에서 동작하도록 조정

**Out-of-scope (non-goal)**

- 문항 감지 알고리즘 변경
- 백엔드 문항 경계 데이터 구조 변경
- 페이지 가상화(뷰포트 근처만 렌더) → **REQ-P02로 이월** (사용자 결정)

---

## 3. 수정 내용

### (1) 백엔드 — 원본 PDF 뷰어 URL 제공 (`routers/browse.py`)

`GET /api/jobs/{job_id}` 단건 조회 응답(`JobSummary`)에 `original_pdf_url` 필드를 추가한다.

- 소스 job(`JobType.SOURCE`)에 대해서만 `storage.generate_download_presigned_url(storage.original_key(job_id))` 로 URL 생성.
- 스토리지 팩토리 덕분에 **local → `/api/files/uploads/{job_id}/original.pdf`**, **s3 → R2 퍼블릭/presigned URL**로 자동 분기.
- 목록 조회(`GET /api/jobs`)에는 넣지 않음(불필요한 presigned 대량 생성 방지) — 단건 조회에서만 채운다.

### (2) `PdfPreviewPanel` 확장 (`components/PdfPreviewPanel.jsx`)

기존 소비처(생성 이력)를 깨지 않도록 **모든 신규 prop을 optional**로 추가하고 `forwardRef`로 감쌌다.

- `onPageChange(pageNum)`: 스크롤로 추적된 현재 페이지(1-based)를 부모에 통지. 최신 콜백을 `ref`로 잡아 effect 의존성 루프를 피함.
- `renderPageOverlay(pageNum, { scale, pageSize })`: 각 페이지 래퍼(`.pdf-page-wrapper`) 안에 렌더할 오버레이 노드 반환. `pageSize`는 PDF pt 기준 원본 크기(`Page.originalWidth/Height`).
- `useImperativeHandle`로 `ref.scrollToPage(pageNum)` 노출 → 외부(① 페이지 목록)에서 뷰어 이동.
- 각 `Page`에 `onLoadSuccess`를 달아 페이지별 원본 pt 크기를 `pageSizes` state에 수집.
- `.pdf-page-wrapper`는 이미 `position: relative`가 아니었으나, 오버레이가 `sx={{ position:absolute, inset:0 }}`로 래퍼를 기준면 삼도록 하기 위해 **CSS 변경 없이** 오버레이를 래퍼 자식으로 렌더(래퍼가 `line-height:0`인 인라인 블록이라 자식 absolute의 기준이 됨). → 실측상 좌표 오차 <1px로 확인되어 별도 CSS 불필요.

### (3) 문항 분석 작업 페이지 (`pages/analysis/work.jsx`)

- ② 미리보기의 썸네일 `<img>` + 오버레이를 **`PdfPreviewPanel`로 교체**. 원본 PDF URL은 `getJobInfo(jobId).original_pdf_url`로 조회.
- **소비처 계약 준수(REQ-B05)**: 뷰어를 `display:flex; flexDirection:column; minHeight:0` 부모 `Box`로 감쌈.
- **①↔뷰어 양방향 동기화**:
  - ① 페이지 클릭 → `viewerRef.current.scrollToPage(n)` + ③ 문항 목록 갱신.
  - 뷰어 스크롤 → `onPageChange` → 250ms 디바운스 후 `selectedPage`/`selectedPageInfo` 갱신 → ③ 자동 전환.
- **수동 문항 드래그 이식**: `renderPageOverlay`가 반환하는 오버레이에서 mousedown/move/up을 캡처. 드래그 종료 시 CSS px 영역을 **`pt = px / scale`** 로 변환해 `pendingRegion.pt`에 저장 → 기존 `addManualQuestion(jobId, pageIdx, { region: pt })` 그대로 사용. 타이틀 입력 카드는 ② 패널 하단에 플로팅.
- 좌표계가 페이지 썸네일(`img.clientWidth` 역산) → PDF 렌더(pt×scale)로 바뀌면서 오히려 단순해짐. 줌 배율 변경 시에도 `scale`만 반영하면 정합 유지.

### (4) 데드 코드 제거 (별도 커밋 `52e4b7d`)

F07 전환으로 완전히 미사용이 된 코드를 정리했다(어디서도 import되지 않음 확인).

- 삭제: `components/FilePagePanel.jsx`, `components/PageBrowser.jsx`
- 삭제: `views/` 전체(`QuestionAnalysisView`, `CoverFormatView`, `WorkbookEditorView`, `WorkbookHistoryView`)
- `App.css` 데드 섹션 제거(`fpp-*`, `qav-*`, `wbh-*`, `cfv-*`, `wbe-*` — 약 1,200줄)
- `QuestionAnalysisPanel` 헤더 주석의 삭제된 View 참조 정리

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 | 검증 |
|---|----------|-----------|------|
| 1 | 파일 선택 → 페이지 미리보기 | PDF 뷰어로 렌더 | ✅ 206페이지 실제 PDF 정상 렌더, 콘솔 에러 없음 |
| 2 | 이전/다음·페이지 입력 이동 | 해당 페이지로 스크롤 | ✅ 1→2→3→2, scrollTop 정확 이동 |
| 3 | ① 목록 클릭 → 뷰어·③ 동기화 | 뷰어 스크롤 + ③ 칩 갱신 | ✅ "5페이지" 클릭 시 scrollTop 이동 + `5페이지` 칩 |
| 4 | 뷰어 스크롤 → ①·③ 자동 전환 | 250ms 후 선택 페이지 갱신 | ✅ 8페이지 스크롤 시 pageInput·칩 `8페이지` |
| 5 | 문항 선택/드래그 좌표 정합 | 오버레이가 PDF 위 정확 위치 | ✅ 드래그 (50,100)-(300,400) → 박스 50/99.2/300/399.2 (오차<1px) |
| 6 | 확대/축소 후 좌표 정합 | 배율과 무관하게 정합 | ✅ 100%↔125% 배율 반영(`pt=px/scale`) |
| 7 | UI 통합 테스트 | 전체 흐름 정상 | ✅ 사용자 확인 완료 |

---

## 5. 미결 질문 (Open Questions)

- ~~소스 `original.pdf`를 뷰어에 넘길 서빙 경로~~ → `GET /api/jobs/{id}.original_pdf_url` 신설. 스토리지 팩토리로 local/s3 자동 분기.
- ~~문항 선택·드래그 오버레이 좌표계 변환 (⚠️ 최대 난제)~~ → react-pdf가 `pt × scale`로 렌더하므로 **`pt = cssPx / scale`** 단일 공식으로 해결. 썸네일 방식보다 단순. 실측 오차 <1px.
- ~~기존 `FilePagePanel`/`PageBrowser` 대체 범위~~ → 완전 대체·삭제(데드 코드 정리 커밋 `52e4b7d`).
- ~~REQ-P02 뷰어 가상화와 겹침~~ → F07은 뷰어 전환까지만, **가상화는 P02로 이월**(사용자 결정). 206페이지 전체 렌더는 현재 성능상 문제 없었으나, 대형 PDF 대비 P02에서 뷰포트 근처만 렌더하도록 고도화 예정.
- ~~REQ-B05(뷰어 툴바)와 컴포넌트 공유 범위~~ → `PdfPreviewPanel` 무수정 재사용(신규 prop은 전부 optional). 소비처가 flex 컬럼 부모 계약만 지키면 됨.
