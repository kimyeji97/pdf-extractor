# plan-workbook-editor — 문제집 생성 메뉴

> **요구사항**: REQ-16, REQ-17, REQ-18, REQ-19, REQ-20  
> **작성일**: 2026-04-26  
> **관련 spec**: [plan-v3.md](../plan-v3.md)  
> **변경 범위**: 백엔드 (`extract.py`, `pdf_service.py`, `workbook.py` 신규) + 프론트엔드 (`WorkbookEditorView`)  
> **전제**: [plan-question-analysis.md](../question-analysis/plan-question-analysis.md) 완료 (수동 문항 API)

---

## 1. 목표

파일 → 페이지 → 문항을 탐색하며 선택하고, 레이아웃을 지정해 문제집 PDF를 생성한다.  
Canvas 기반 미리보기가 실제 PDF 출력과 레이아웃이 일치한다.

---

## 2. 레이아웃

```
┌──────────┬─────────────┬──────────────────┬────────────────────────┐
│ 파일 목록 │  페이지 목록  │  문항 목록 (텍스트)│  미리보기 + 레이아웃 선택 │
│ (기존)   │  (기존)      │  □ 문항 1         │  레이아웃: [2단][4단][6단]│
│          │              │  □ 문항 3         │  ┌────────────────────┐ │
│          │              │  □ 수동 문항 1     │  │   Canvas (A4 비율)  │ │
│          │              │                   │  └────────────────────┘ │
│          │              │  ─── 선택 순서 ─── │  [PDF 생성]             │
│          │              │  ══ DnD 카드 열 ══ │                         │
└──────────┴─────────────┴──────────────────┴────────────────────────┘
```

---

## 3. 레이아웃 상수 (Canvas ↔ PDF 일치의 핵심)

양쪽에서 동일한 값을 사용해야 한다. 값 변경 시 JS/Python 동시 수정.

| 상수 | 값 | 설명 |
|------|----|------|
| `A4_WIDTH_PT` | 595 | A4 너비 (pt) |
| `A4_HEIGHT_PT` | 842 | A4 높이 (pt) |
| `MARGIN_PT` | 20 | 상하좌우 마진 (pt) |
| `GAP_PT` | 5 | 셀 간격 (pt) |

레이아웃별 그리드:

| 레이아웃 | rows | cols | 페이지당 문항 |
|---------|------|------|-------------|
| 2단 | 1 | 2 | 2 |
| 4단 | 2 | 2 | 4 |
| 6단 | 3 | 3 | 9 |

셀 좌표 공식:
```
cell_w = (A4_WIDTH  - 2×MARGIN - (cols-1)×GAP) / cols
cell_h = (A4_HEIGHT - 2×MARGIN - (rows-1)×GAP) / rows

cell_x(col) = MARGIN + col × (cell_w + GAP)
cell_y(row) = MARGIN + row × (cell_h + GAP)
```

---

## 4. Canvas ↔ PDF 일치 보장 전략

### 4.1 Contain(letterbox) 피팅

문항마다 종횡비가 달라 셀을 채울 때 왜곡이 생길 수 있다.  
Canvas와 PDF 양쪽 모두 동일한 "Contain" 수식을 적용한다.

```
# 공통 contain_fit 계산 (JS와 Python 동일 수식)

src_w = bbox.x1 - bbox.x0
src_h = bbox.y1 - bbox.y0
src_ratio = src_w / src_h
cell_ratio = cell_w / cell_h

if src_ratio > cell_ratio:
    # 가로 기준 맞춤
    scale = cell_w / src_w
    dst_w = cell_w
    dst_h = src_h × scale
    dst_x = cell_x
    dst_y = cell_y + (cell_h - dst_h) / 2
else:
    # 세로 기준 맞춤
    scale = cell_h / src_h
    dst_w = src_w × scale
    dst_h = cell_h
    dst_x = cell_x + (cell_w - dst_w) / 2
    dst_y = cell_y
```

### 4.2 Canvas 적용 (WorkbookPreview.jsx)

```js
// workbookLayout.js (JS 상수 파일)
export const LAYOUT_SPEC = {
  A4_WIDTH_PT: 595, A4_HEIGHT_PT: 842,
  MARGIN_PT: 20, GAP_PT: 5,
  layouts: {
    "2단": { rows: 1, cols: 2 },
    "4단": { rows: 2, cols: 2 },
    "6단": { rows: 3, cols: 3 },
  },
};

export function containFit(srcW, srcH, cellX, cellY, cellW, cellH) { ... }
export function calcCellRect(layout, row, col) { ... }

// Canvas 렌더링
const s = canvasWidth / A4_WIDTH_PT;   // pt → px 스케일
const { dstX, dstY, dstW, dstH } = containFit(srcW, srcH, cellX, cellY, cellW, cellH);
ctx.drawImage(thumbnailImg, dstX*s, dstY*s, dstW*s, dstH*s);
```

### 4.3 PDF 생성 적용 (pdf_service.py)

```python
# layout_spec.py (Python 상수 파일)
A4_WIDTH_PT  = 595
A4_HEIGHT_PT = 842
MARGIN_PT    = 20
GAP_PT       = 5
LAYOUTS = {
    "2단": {"rows": 1, "cols": 2},
    "4단": {"rows": 2, "cols": 2},
    "6단": {"rows": 3, "cols": 3},
}

def contain_fit(src_w, src_h, cell_x, cell_y, cell_w, cell_h): ...
def calc_cell_rect(layout_key, row, col): ...

# PDF 빌드
dst_x, dst_y, dst_w, dst_h = contain_fit(src_w, src_h, cell_x, cell_y, cell_w, cell_h)
dst_rect = fitz.Rect(dst_x, dst_y, dst_x + dst_w, dst_y + dst_h)
out_page.show_pdf_page(dst_rect, src_doc, src_page_num, clip=fitz.Rect(*bbox))
```

### 4.4 일치 보장 체크리스트

| 요소 | Canvas | PDF 생성 | 일치 여부 |
|------|--------|---------|---------|
| 셀 좌표 공식 | `workbookLayout.js` | `layout_spec.py` (동일 값) | ✓ |
| 피팅 방식 | Contain | Contain | ✓ |
| 문항 bbox | `QuestionBoundary` 좌표 | 동일 | ✓ |
| 문항 순서 | `selections` 배열 순서 | 동일 배열 | ✓ |
| 품질 | PNG 썸네일 96DPI | 벡터 PDF | 레이아웃 동일, 해상도만 차이 |

---

## 5. 백엔드 설계

### 5.1 schemas.py 변경

```python
class LayoutType(str, Enum):
    TWO_COL  = "2단"
    FOUR_COL = "4단"
    SIX_COL  = "6단"

class ExtractV2Request(BaseModel):
    selections: list[SelectionItem] = Field(..., min_length=1)
    layout: LayoutType = LayoutType.TWO_COL    # 신규

class WorkbookSelectionItem(BaseModel):
    job_id: str
    page_num: int
    question_num: Optional[int] = None
    manual_id: Optional[str] = None
    title: Optional[str] = None

class WorkbookMeta(BaseModel):
    workbook_id: str
    created_at: datetime
    layout: LayoutType
    selections: list[WorkbookSelectionItem]
    result_job_id: str
    question_count: int
```

### 5.2 layout_spec.py 신규 (backend/app/utils/)

공유 레이아웃 상수와 `contain_fit`, `calc_cell_rect` 함수 정의.

### 5.3 pdf_service.py 변경 — extract_questions_v2()

`layout` 파라미터를 받아 그리드 배치로 PDF를 빌드.

흐름:
```
selections 순서 → 페이지 번호 부여 (layout의 페이지당 문항 수 기준)
  └─ 각 문항에 대해:
       1. 원본 PDF 다운로드 (job별 캐싱)
       2. QuestionBoundary.bbox 조회 (자동) 또는 manual_region 조회 (수동)
       3. contain_fit() 으로 dst_rect 계산
       4. out_page.show_pdf_page(dst_rect, src_doc, page_num, clip=bbox)
```

### 5.4 workbook.py 신규 라우터

```
GET  /api/workbooks               — WorkbookMeta 목록 (created_at 내림차순)
GET  /api/workbooks/{id}          — WorkbookMeta 단건 (selections 포함)
POST /api/workbooks               — 문제집 메타데이터 저장
```

저장 경로: `local_storage/workbooks/{workbook_id}.json`

**저장 트리거**: `extract-v2` DONE 확인 후 프론트엔드가 `POST /api/workbooks`를 호출한다.  
(백그라운드 태스크에서 자동 저장이 아닌, 프론트 주도로 저장 — 추후 서버 자동 저장으로 전환 가능)

---

## 6. 프론트엔드 설계

### 6.1 WorkbookEditorView.jsx

4패널 레이아웃:
- 패널 1: `FileListPanel` (기존)
- 패널 2: `PageBrowser` (기존)
- 패널 3: `QuestionListPanel` (신규)
- 패널 4: 미리보기 + 레이아웃 선택 + DnD 순서 편집 + PDF 생성 버튼

### 6.2 QuestionListPanel.jsx (신규)

썸네일 없이 타이틀 텍스트 목록. 체크박스로 선택.

```
□ 문항 1
□ 문항 3
□ [수동] 수동 문항 1
□ 문항 5
```

- 선택 상태는 `selectedIds: Set<string>` 으로 관리.
- 선택 변경 시 미리보기 즉시 갱신.

### 6.3 workbookLayout.js (신규 유틸)

```
frontend/src/utils/workbookLayout.js
```

레이아웃 상수 + `containFit()` + `calcCellRect()` 내보내기.

### 6.4 WorkbookPreview.jsx (신규)

- A4 비율 Canvas (고정 너비 320px, 높이 453px).
- 선택 목록 변경 / 레이아웃 변경 시 `useEffect`로 재렌더링.
- 썸네일 이미지 로딩: `new Image()` → `onload` 후 `drawImage`.
- 페이지 복수 시 세로 스크롤.

### 6.5 레이아웃 선택 버튼

```
레이아웃:  [2단]  [4단]  [6단]
```

선택 시 `layout` state 업데이트 → Canvas 즉시 재렌더링.

### 6.6 DnD 순서 편집

**라이브러리**: `@dnd-kit/core` + `@dnd-kit/sortable`

선택된 문항들을 수평 카드 목록으로 표시. 드래그로 순서 변경.

```
┌────┐ ┌────┐ ┌────┐
│ 1  │ │ 3  │ │ 5  │  ← 드래그로 순서 변경
└────┘ └────┘ └────┘
```

순서 변경 → `selections` 배열 재정렬 → 미리보기 즉시 반영.

### 6.7 PDF 생성 버튼

```
[PDF 생성]  ← exporting 중 비활성화
```

클릭:
1. `POST /api/extract-v2 { selections, layout }` 호출
2. 상태 폴링 (2초마다 `GET /api/status/{export_job_id}`)
3. DONE → `POST /api/workbooks` (메타데이터 저장) → 파일 다운로드
4. FAILED → 툴바에 오류 텍스트 인라인 표시 (알럿 없음)

### 6.8 기존 문제집 불러오기 (REQ-20)

- 생성된 문제집 탭(WorkbookHistoryView)의 [편집] 버튼 클릭
- → `activeMenu = 'editor'` 전환
- → `WorkbookEditorView`에 `initialWorkbookId` prop 전달
- → `GET /api/workbooks/{id}` 로 `selections`, `layout` 복원

---

## 7. 구현 작업 목록

### 백엔드

1. `layout_spec.py` 신규 작성 (상수 + contain_fit + calc_cell_rect)
2. `schemas.py`: `LayoutType`, `ExtractV2Request.layout`, `WorkbookMeta` 추가
3. `pdf_service.py`: `extract_questions_v2()` 레이아웃 그리드 빌드 로직 추가
4. `local_storage_service.py`: 문제집 메타데이터 저장/조회 메서드 추가
5. `workbook.py` 신규 라우터 작성
6. `main.py`: `workbook` 라우터 등록

### 프론트엔드

7. `workbookLayout.js` 신규 작성 (레이아웃 상수 + 유틸 함수)
8. `client.js`: `createWorkbookMeta()`, `getWorkbooks()`, `getWorkbook(id)` 추가
9. `QuestionListPanel.jsx` 신규 작성
10. `WorkbookPreview.jsx` 신규 작성 (Canvas 렌더링)
11. `WorkbookEditorView.jsx` 신규 작성 (4패널 + 레이아웃 선택 + DnD + PDF 생성)
12. `@dnd-kit/core`, `@dnd-kit/sortable` 패키지 설치
13. PDF 생성 완료 후 `POST /api/workbooks` 저장 연동
