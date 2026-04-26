# plan-manual-region — 수동 영역 지정 문항 추출

> **요구사항**: REQ-B (수동 영역 지정 추출 — 자동 감지 실패/누락 폴백 UX)
> **작성일**: 2026-04-19
> **관련 spec**: [spec.md](../spec.md)
> **변경 범위**: 백엔드 + 프론트엔드 (API 스키마 확장 동반)

---

## 1. 목표

자동 문항 경계 감지(`detect_question_boundaries`)가 실패하거나 일부만 성공한 페이지에서, 사용자가 페이지 썸네일 위에서 **마우스 드래그로 영역을 직접 지정**하여 바스켓에 담고, 그 영역 그대로 PDF로 내보낼 수 있게 한다.

### 1.1 핵심 유스케이스

- 자동 감지가 0건인 페이지에서 수동으로 문항 한 개를 지정.
- 자동 감지가 일부만 찾은 페이지에서 누락된 문항을 보완 지정.
- 자동 감지가 아예 잘못 잡은 영역 대신 사용자가 원하는 범위만 지정.
- 동일 페이지에서 **복수 수동 영역**을 순차 지정 (문항 A, 문항 B).

### 1.2 비목표 (Out of Scope)

- 드래그 이후 영역 리사이즈/이동 편집 UI는 P1 이후 과제 (본 plan은 "그리고 / 지우고 다시 그린다" 수준).
- 수동 영역을 자동 감지 결과와 "합쳐서" 하나의 문항처럼 섞는 기능 (바스켓 내에서는 개별 엔트리로 공존).
- OCR 기반 자동 제안 박스 표시.

---

## 2. 전체 흐름

```
페이지 썸네일 화면
  │
  ├─ [기본 모드]     자동 감지 문항 카드 그리드 (REQ-03)
  │
  └─ [영역 그리기 모드] 토글
         │
         ▼
      페이지 썸네일 위에서 마우스 드래그
         │     (mousedown → mousemove → mouseup)
         │
         ├─ 드래그 중: 점선 선택 박스 오버레이 표시
         │
         ▼
      드래그 종료 → "미리보기" + "라벨 입력" + [바스켓에 추가] [다시 그리기]
         │
         ├─ 썸네일 px 좌표 → 페이지 width/height (pt) 기준으로 역변환
         │
         ▼
      POST /api/jobs/{id}/pages/{n}/manual-thumbnail   (미리보기 PNG 요청)
         │
         ▼
      바스켓에 추가 ({manual_region_id, region, label, thumbnailUrl})
         │
         ▼
POST /api/extract-v2 { selections: [...custom_region 포함...] }
         ▼
PDF 빌드 시 SourcedCropRegion 으로 직결 (자동 감지 케이스와 동일 파이프)
```

---

## 3. 백엔드 설계

### 3.1 스키마 확장

`backend/app/models/schemas.py`

```python
from pydantic import BaseModel, Field, model_validator

class RegionCoord(BaseModel):
    """PDF pt 좌표계 (좌상단 원점, PyMuPDF 호환)."""
    x0: float = Field(..., ge=0)
    y0: float = Field(..., ge=0)
    x1: float = Field(..., gt=0)
    y1: float = Field(..., gt=0)

    @model_validator(mode="after")
    def _validate_size(self):
        if self.x1 <= self.x0 or self.y1 <= self.y0:
            raise ValueError("region: x1>x0, y1>y0 required")
        if (self.x1 - self.x0) < 5 or (self.y1 - self.y0) < 5:
            raise ValueError("region: 최소 크기 5pt")
        return self


class SelectionItem(BaseModel):
    """
    자동 감지 선택과 수동 영역 선택을 한 스키마에 수용한다.
    'question_num' 과 'custom_region' 중 정확히 하나만 허용.
    """
    job_id:        str
    page_num:      int
    question_num:  int | None = None        # 자동 감지 문항일 때
    custom_region: RegionCoord | None = None  # 수동 영역일 때
    label:         str | None = None        # 선택적 표시 라벨

    @model_validator(mode="after")
    def _exactly_one(self):
        has_q = self.question_num is not None
        has_r = self.custom_region is not None
        if has_q == has_r:
            raise ValueError(
                "selection: question_num 또는 custom_region 중 하나만 지정"
            )
        return self
```

**하위 호환성**: 기존 클라이언트가 `question_num` 만 보내는 경우 그대로 동작. `custom_region` 은 옵셔널 추가 필드.

### 3.2 신규 엔드포인트 — 수동 영역 썸네일

드래그 종료 직후 바스켓에 넣기 전 사용자에게 미리보기를 보여주기 위한 용도.

```
POST /api/jobs/{job_id}/pages/{page_num}/manual-thumbnail
```

**Request Body**
```json
{ "region": { "x0": 36.0, "y0": 120.5, "x1": 297.0, "y1": 310.0 } }
```

**Response**: `image/png`

**처리**

- 원본 PDF 다운로드 (로컬/S3)
- `fitz.open(pdf)[page_num]` 에서 `clip=fitz.Rect(x0,y0,x1,y1)` 로 `get_pixmap` 수행
- PNG 바이트 반환. 캐시는 하지 않음(일회성 미리보기). 혹은 짧은 수명 캐시 (`thumbnails/{job_id}/manual_{hash}.png`).

> **설계 주석**: GET + 쿼리스트링으로도 구현 가능하지만 좌표가 소수점이라 URL 캐싱에 의존하지 않는 편이 단순하다. POST로 받아 응답에서 `Cache-Control: no-store`.

### 3.3 `/api/extract-v2` 확장

라우터가 `SelectionItem` 을 소비할 때 `custom_region` 이 있으면 경계 감지 파이프라인을 **완전히 우회**하고 `SourcedCropRegion` 으로 직결한다.

```python
# backend/app/services/pdf_service.py 내 기존 로직 근처

def _selection_to_sourced_regions(
    sel: SelectionItem,
    src_path: str,
    boundaries_cache: list[QuestionBoundary] | None,
) -> list[SourcedCropRegion]:
    if sel.custom_region is not None:
        r = sel.custom_region
        return [SourcedCropRegion(
            src_path=src_path,
            page_index=sel.page_num,
            x0=r.x0, y0=r.y0, x1=r.x1, y1=r.y1,
        )]

    # 자동 감지 경로 (기존 로직)
    boundaries = boundaries_cache or detect_question_boundaries(src_path)
    regions = map_questions_to_regions(boundaries, [sel.question_num])[sel.question_num]
    return [
        SourcedCropRegion(
            src_path=src_path,
            page_index=r.page_index,
            x0=r.x0, y0=r.y0, x1=r.x1, y1=r.y1,
        )
        for r in regions
    ]
```

- 경계 캐시 조회는 **자동 감지 경로일 때만** 수행 (수동은 감지 불필요).
- `selections` 배열 순서 유지는 `_build_pdf_from_multi_sources()` 가 담당 — 본 기능으로 인한 변경 없음.

### 3.4 페이지 메타 응답 재확인

수동 영역 UI는 페이지 크기(pt)가 필요하다. 현재 `GET /api/jobs/{id}/pages` 응답이 이미 `width`, `height` 를 제공하므로 추가 작업 없음.

### 3.5 좌표 유효성 검증

- `x1 ≤ page.width`, `y1 ≤ page.height` 여야 함. 초과 시 400.
- `_validate_size` 의 pt 최소 크기(5pt) 로 0픽셀 클릭 실수 방지.
- region 이 페이지 경계를 살짝 넘는 경우(부동소수 오차) ±1pt 허용 후 clamp.

### 3.6 변경/신규 파일

| 파일 | 변경 내용 |
| ---- | --------- |
| `backend/app/models/schemas.py` | `RegionCoord` 추가, `SelectionItem` 에 `custom_region`, `label` 필드 추가, `question_num` optional 전환, `_exactly_one` validator 추가 |
| `backend/app/routers/browse.py` | `POST /api/jobs/{id}/pages/{n}/manual-thumbnail` 추가 |
| `backend/app/routers/extract.py` | `POST /api/extract-v2` 핸들러에서 `SelectionItem` 분기 처리 |
| `backend/app/services/pdf_service.py` | `_selection_to_sourced_regions()` 추가, `extract_questions_v2()` 에서 호출 지점 정리 |
| `backend/app/services/thumbnail_service.py` | `get_manual_region_thumbnail(job_id, page_num, region)` 추가 |
| `backend/app/services/boundary_cache_service.py` | 변경 없음 — 수동은 캐시 불필요 |

---

## 4. 프론트엔드 설계

### 4.1 상태/타입 확장

`App.jsx` 의 바스켓은 두 종류의 엔트리를 수용한다.

```ts
// 바스켓 아이템 (discriminated union)
type BasketItem =
  | AutoDetectedItem
  | ManualRegionItem;

type AutoDetectedItem = {
  kind:         "auto";
  selectionId:  string;   // `${jobId}:${pageNum}:q:${questionNum}`
  jobId:        string;
  filename:     string;
  pageNum:      number;
  questionNum:  number;
  thumbnailUrl: string;
};

type ManualRegionItem = {
  kind:         "manual";
  selectionId:  string;   // `${jobId}:${pageNum}:m:${clientUuid}`
  jobId:        string;
  filename:     string;
  pageNum:      number;
  region:       { x0: number; y0: number; x1: number; y1: number }; // pt
  label:        string;   // 기본 "수동 영역 #n"
  thumbnailUrl: string;   // Blob URL (manual-thumbnail 응답)
};
```

- 기존 `questionId` 는 `selectionId` 로 일반화 (호환성 위해 내부 이름만 변경).
- 바스켓 중복 방지 키: `selectionId`.

### 4.2 신규 컴포넌트 — `PageAnnotator`

`QuestionPicker` 하단 또는 상단에 배치되어 "영역 그리기 모드" 를 제공한다.

```
src/components/PageAnnotator.jsx
```

**props**
```js
{
  jobId:         string,
  pageNum:       number,
  pageWidthPt:   number,   // pt
  pageHeightPt:  number,   // pt
  thumbnailUrl:  string,   // GET /api/.../pages/{n}/thumbnail
  manualCount:   number,   // 바스켓 내 같은 페이지 수동 영역 개수 (라벨 기본값용)
  onAdd:         (item: ManualRegionItem) => void,
}
```

**레이아웃**

```
┌─────────────────────────────────────────────────────┐
│ [영역 그리기: ON ⬤]                 [자동 감지 보기]│
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────┐                           │
│  │                      │   드래그한 영역 미리보기  │
│  │  (페이지 썸네일)      │   ┌──────────────┐       │
│  │   ┌────────┐         │   │ [preview png]│       │
│  │   │ 드래그  │         │   └──────────────┘       │
│  │   │ 사각형  │         │   라벨: [수동 #1____]    │
│  │   └────────┘         │   [바스켓에 추가] [지우기]│
│  └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

**주요 상태**
```js
const [mode, setMode] = useState("view");   // "view" | "draw"
const [drag, setDrag] = useState(null);     // { x, y, w, h } in thumbnail px
const [dragging, setDragging] = useState(false);
const [label, setLabel] = useState("");
const [previewUrl, setPreviewUrl] = useState(null);  // Blob URL
```

### 4.3 드래그 인터랙션

썸네일은 `<img>` 로 렌더되고 그 위를 절대위치 `<div>` 오버레이가 덮는다.

```jsx
<div
  className="relative inline-block"
  onMouseDown={handleDown}
  onMouseMove={handleMove}
  onMouseUp={handleUp}
  onMouseLeave={handleUp}   // 밖으로 벗어나면 드래그 종료
>
  <img ref={imgRef} src={thumbnailUrl} />
  {drag && (
    <div
      className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
      style={{ left: drag.x, top: drag.y, width: drag.w, height: drag.h }}
    />
  )}
</div>
```

핸들러 요지:

```js
function handleDown(e) {
  if (mode !== "draw") return;
  const rect = e.currentTarget.getBoundingClientRect();
  setDrag({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: 0, h: 0 });
  setDragging(true);
}

function handleMove(e) {
  if (!dragging) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const nx = e.clientX - rect.left;
  const ny = e.clientY - rect.top;
  setDrag(d => ({
    x: Math.min(d.x, nx),
    y: Math.min(d.y, ny),
    w: Math.abs(nx - d.x),
    h: Math.abs(ny - d.y),
  }));
}

function handleUp() {
  if (!dragging) return;
  setDragging(false);
  if (drag && drag.w > 4 && drag.h > 4) requestPreview();
  else setDrag(null);   // 너무 작은 영역은 무시
}
```

### 4.4 좌표 역변환 (썸네일 px → PDF pt)

```js
function pxToPt(dragPx, imgEl, pageWPt, pageHPt) {
  const scaleX = pageWPt / imgEl.clientWidth;
  const scaleY = pageHPt / imgEl.clientHeight;
  return {
    x0: dragPx.x           * scaleX,
    y0: dragPx.y           * scaleY,
    x1: (dragPx.x+dragPx.w) * scaleX,
    y1: (dragPx.y+dragPx.h) * scaleY,
  };
}
```

**주의**
- `clientWidth/Height` 를 쓰는 이유: CSS로 리사이즈된 실제 표시 크기가 좌표 기준이어야 함.
- 이미지 `object-fit: contain` 적용 시에는 실제 표시 영역 계산이 달라지므로 `contain` 적용 금지. 썸네일은 원본 비율 그대로 표시.

### 4.5 API 클라이언트 추가

`src/api/client.js`

```js
export async function fetchManualThumbnail(jobId, pageNum, region) {
  const res = await fetch(
    `${BASE_URL}/jobs/${jobId}/pages/${pageNum}/manual-thumbnail`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region }),
    }
  );
  if (!res.ok) throw new Error("수동 영역 미리보기 생성 실패");
  return URL.createObjectURL(await res.blob());
}
```

`startExtractV2()` 는 기존 함수를 확장해 두 종류의 selection 을 수용:

```js
export async function startExtractV2(basket) {
  const body = {
    selections: basket.map(item => {
      const base = { job_id: item.jobId, page_num: item.pageNum };
      if (item.kind === "manual") {
        return { ...base, custom_region: item.region, label: item.label };
      }
      return { ...base, question_num: item.questionNum };
    })
  };
  const res = await fetch(`${BASE_URL}/extract-v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "추출 요청 실패");
  }
  return res.json();
}
```

### 4.6 SelectionBasket 표시 변경

`SelectionBasket.jsx` 의 각 항목 렌더링이 분기 처리되어야 한다.

```jsx
{item.kind === "auto" && (
  <span>{item.filename} / p.{item.pageNum + 1} / 문항 {item.questionNum}</span>
)}
{item.kind === "manual" && (
  <span>{item.filename} / p.{item.pageNum + 1} / {item.label}
    <span className="badge">수동</span></span>
)}
```

### 4.7 QuestionPicker 와의 관계

- `QuestionPicker` 는 기존 그대로 자동 감지 카드만 책임.
- `PageAnnotator` 는 `QuestionPicker` 와 **형제 컴포넌트**로 나란히 렌더. 부모(`App.jsx`)에서 동일 `(jobId, pageNum)` 프롭을 전달.
- 페이지 내 문항 수가 0일 경우 `QuestionPicker` 가 빈 상태 메시지 대신 "영역 그리기 모드로 추가하기" 버튼을 직접 노출 → `PageAnnotator` 모드를 `"draw"` 로 셋.

### 4.8 변경/신규 파일

| 파일 | 변경 내용 |
| ---- | --------- |
| `frontend/src/components/PageAnnotator.jsx` | **신규** — 드래그 오버레이 + 미리보기 + 라벨 입력 + 바스켓 추가 |
| `frontend/src/components/SelectionBasket.jsx` | `kind` 기반 렌더 분기, "수동" 뱃지 |
| `frontend/src/components/QuestionPicker.jsx` | 빈 상태에서 "영역 그리기" 진입 버튼 추가 (선택적) |
| `frontend/src/api/client.js` | `fetchManualThumbnail()` 추가, `startExtractV2()` 확장 |
| `frontend/src/App.jsx` | 바스켓 타입 `BasketItem` 으로 일반화, `PageAnnotator` 연결 |

---

## 5. 식별자(ID) 스키마

### 5.1 자동 감지

```
selectionId = `${jobId}:${pageNum}:q:${questionNum}`
```

### 5.2 수동 영역

```
selectionId = `${jobId}:${pageNum}:m:${clientUuid}`
```

- `clientUuid`: 프론트에서 `crypto.randomUUID()` 로 발급 — 같은 페이지에서 동일 영역을 여러 번 드래그하면 항상 다른 `selectionId` 가 되어 중복 추가 가능(의도한 동작).
- 좌표 해시를 쓸 수도 있으나, 사용자가 **같은 영역을 의도적으로 중복 추가**하는 케이스(2부 문항 등)를 배제하지 않기 위해 UUID 채택.
- 서버는 `selectionId` 를 그대로 수용하지 않고 `custom_region` 만 사용하므로 서버 상태와 충돌 없음.

---

## 6. 에지 케이스

| 상황 | 처리 |
| ---- | ---- |
| 드래그가 이미지 밖으로 나감 | `onMouseLeave` 에서 드래그 확정. 썸네일 경계로 clamp. |
| 0px ~ 4px 초미세 드래그 | 무시 (클릭 오인 방지). |
| 역방향 드래그(오른쪽→왼쪽) | `Math.min / abs` 로 정규화. |
| 페이지 이동 후 돌아옴 | 바스켓은 유지, 이전 `previewUrl`(Blob) 은 해제하고 재요청하지 않음 (바스켓 항목에 영구 URL 로 저장). |
| Blob URL 메모리 누수 | 바스켓에서 제거 시 `URL.revokeObjectURL()` 호출. |
| 좌표가 페이지 경계를 소량 초과 | 서버에서 ±1pt 허용 + clamp 후 수용. |
| 동일 페이지 복수 수동 영역 | 모두 개별 `selectionId` 로 바스켓에 누적. |
| PDF 좌표계와 썸네일 렌더가 90° 회전된 페이지 | 썸네일 생성 시 회전이 반영되므로 `clientWidth/Height` 와 `page.width/height` (회전 반영값) 로 scale 계산 → 자동 일치. 서버에서 `page.rect` 대신 `page.rotationMatrix` 고려 여부는 `get_pixmap(clip=...)` 내부에서 해결됨. |

---

## 7. 수용 조건 (Acceptance Criteria)

### 7.1 기능

- [ ] 페이지 썸네일에서 마우스 드래그로 사각형을 그리면 점선 오버레이가 실시간 표시된다.
- [ ] 드래그 종료 시 해당 영역의 PNG 미리보기가 우측 패널에 표시된다.
- [ ] `[바스켓에 추가]` 클릭 시 바스켓에 `kind:"manual"` 항목이 추가된다.
- [ ] 바스켓 항목에 "수동" 뱃지와 라벨이 표시된다.
- [ ] 바스켓에 수동 항목만 있는 상태로 `[PDF 다운로드]` 를 누르면 해당 영역만 담긴 PDF 가 생성된다.
- [ ] 자동 감지 항목과 수동 항목을 **혼합**한 바스켓도 순서대로 PDF 로 빌드된다.

### 7.2 API

- [ ] `POST /api/extract-v2` 가 `custom_region` 이 포함된 selection 을 정상 수용한다.
- [ ] `SelectionItem` 에 `question_num` / `custom_region` 둘 다 또는 둘 다 없는 요청은 400 을 반환한다.
- [ ] `POST /api/jobs/{id}/pages/{n}/manual-thumbnail` 가 요청한 영역만 크롭된 PNG 를 반환한다.
- [ ] `region` 크기가 5pt 미만이거나 페이지 밖을 크게 벗어나면 400 을 반환한다.

### 7.3 하위 호환

- [ ] 기존 프론트엔드가 `question_num` 만 보내는 요청이 그대로 동작한다.
- [ ] 바스켓에 자동 감지 항목만 있을 때 동작이 REQ-06 이전과 동일하다.

### 7.4 UX

- [ ] 드래그 중 다른 UI 요소(버튼 등)가 영향받지 않는다.
- [ ] 동일 페이지에서 수동 영역을 2개 그리면 바스켓에 각각 독립 항목으로 누적된다.
- [ ] 바스켓 항목 제거 시 해당 Blob URL 메모리가 해제된다 (devtools 로 검증).

---

## 8. 테스트 계획

### 8.1 백엔드 단위 테스트

```python
def test_selection_item_requires_exactly_one():
    with pytest.raises(ValidationError):
        SelectionItem(job_id="x", page_num=0)                 # 둘 다 없음
    with pytest.raises(ValidationError):
        SelectionItem(job_id="x", page_num=0,
                      question_num=1,
                      custom_region=RegionCoord(x0=0,y0=0,x1=10,y1=10))  # 둘 다 있음

def test_region_coord_validates_size():
    with pytest.raises(ValidationError):
        RegionCoord(x0=0, y0=0, x1=2, y1=2)   # 5pt 미만

def test_selection_to_sourced_regions_custom_bypasses_detect(monkeypatch):
    calls = []
    monkeypatch.setattr(
        "backend.app.utils.question_parser.detect_question_boundaries",
        lambda *_: calls.append(1) or [],
    )
    sel = SelectionItem(job_id="x", page_num=2,
        custom_region=RegionCoord(x0=10, y0=10, x1=100, y1=200))
    regs = _selection_to_sourced_regions(sel, "/tmp/a.pdf", boundaries_cache=None)
    assert calls == []               # detect 호출 안 됨
    assert regs[0].x0 == 10 and regs[0].page_index == 2
```

### 8.2 통합 테스트

- 혼합 바스켓(자동 1 + 수동 1) 으로 `/api/extract-v2` 호출 → 출력 PDF 페이지 수 = 2, 첫 페이지 자동 크롭 확인, 두 번째 페이지 좌표 내용 확인.
- 동일 페이지 복수 수동 영역 (3개) → 출력 PDF 3페이지, 각 페이지 다른 크롭 확인.

### 8.3 프론트엔드 테스트

- React Testing Library: `PageAnnotator` 에 `mouseDown/Move/Up` 이벤트 주입 → `onAdd` 콜백이 유효한 `ManualRegionItem` 으로 호출됨을 단언.
- 좌표 변환 단위 함수(`pxToPt`) 스냅샷 테스트.
- 페이지 변경 시 이전 Blob URL `revoke` 호출 단언.

---

## 9. 작업 순서 (Task Breakdown)

| # | 작업 | 레이어 | 우선순위 | 의존 |
|---|------|--------|----------|------|
| 1 | `RegionCoord`, `SelectionItem` 확장 + validator | Backend | P0 | — |
| 2 | `_selection_to_sourced_regions()` 분기 로직 | Backend | P0 | 1 |
| 3 | `/api/extract-v2` 핸들러에 분기 연결 | Backend | P0 | 2 |
| 4 | `thumbnail_service.get_manual_region_thumbnail()` | Backend | P0 | — |
| 5 | `POST /api/jobs/{id}/pages/{n}/manual-thumbnail` 라우터 | Backend | P0 | 4 |
| 6 | 백엔드 단위/통합 테스트 (§8.1, §8.2) | Backend | P0 | 3, 5 |
| 7 | 클라이언트 API — `fetchManualThumbnail`, `startExtractV2` 확장 | Frontend | P1 | 5 |
| 8 | `PageAnnotator` 컴포넌트 (드래그, 미리보기, 라벨) | Frontend | P1 | 7 |
| 9 | `App.jsx` 바스켓 타입 `BasketItem` 으로 일반화 | Frontend | P1 | 8 |
| 10 | `SelectionBasket` 분기 렌더 + "수동" 뱃지 | Frontend | P1 | 9 |
| 11 | `QuestionPicker` 빈 상태에 "영역 그리기" 진입 버튼 | Frontend | P2 | 8 |
| 12 | 프론트엔드 테스트 (§8.3) | Frontend | P2 | 10 |
| 13 | Blob URL 생명주기 점검 (revokeObjectURL) | Frontend | P2 | 10 |

---

## 10. 위험 요소 및 완화

| 위험 | 영향 | 완화 |
| ---- | ---- | ---- |
| 썸네일 스케일과 PDF pt 스케일 불일치 (DPR 영향) | 크롭 영역이 실제와 어긋남 | `imgEl.clientWidth/Height` 로 계산, 서버는 클라이언트가 준 pt 를 신뢰. 회전 페이지는 `page.width/height` 가 회전 반영값이므로 일관. |
| 동일 `selectionId` 충돌 | 바스켓 중복 추가 불가 | UUID 발급으로 방지 |
| 사용자가 그린 영역이 너무 작음 | 빈 PDF 출력 | 프론트 4px + 백엔드 5pt 이중 검증 |
| Blob URL 누적으로 메모리 증가 | 브라우저 메모리 압박 | 바스켓 제거 시 `URL.revokeObjectURL` 호출, 페이지 떠날 때 `useEffect` cleanup |
| 회전 페이지(rotation=90/180/270) | 크롭 영역 회전 불일치 | PyMuPDF `get_pixmap(clip=...)` 이 회전 반영. 클라이언트는 썸네일의 렌더 크기 기준으로 계산 → 일치. 회전 샘플로 통합 테스트. |
| POST `manual-thumbnail` 남발 (드래그 중 재요청) | 서버 부하 | 드래그 **종료** 시점에만 1회 요청. 디바운스 불필요. |
| 스키마 변경이 구형 배포와 충돌 | 배포 중 요청 실패 | `custom_region`, `label` 필드는 옵셔널. 기존 `question_num` 그대로 수용. |

---

## 11. 향후 확장 여지 (비범위)

- 드래그한 영역의 **리사이즈 핸들** / 이동 편집.
- 영역 그리기 중 **자동 스냅** (가장 가까운 감지 경계로 흡착).
- 페이지 단위가 아닌 **복수 페이지에 걸친 수동 영역** (페이지 경계를 넘는 드래그).
- 수동 영역의 **바스켓 순서 재정렬** DnD (현재는 추가 순서 고정).
- 수동 영역 라이브러리화 — 자주 쓰는 크롭 템플릿 저장.

위 항목은 별도 요구사항으로 승급될 때 plan 문서를 분리해 처리한다.

---

## 12. spec.md 반영 제안

`docs/sdd/spec.md` 의 §2 요구사항 섹션에 아래 항목 추가를 권장한다. (본 plan 병합 시 같이 반영)

```
### REQ-10 수동 영역 지정 문항 선택

자동 감지가 실패한 페이지에서 사용자가 썸네일 위에서 드래그로 영역을
직접 지정해 바스켓에 담을 수 있다.

- 드래그로 지정한 영역은 크롭 미리보기로 확인 후 바스켓에 추가된다.
- 한 페이지에 복수의 수동 영역을 누적 추가할 수 있다.
- 자동 감지 항목과 수동 영역 항목을 섞어 PDF 로 내보낼 수 있다.
```

그리고 §3 매핑 표에 아래 한 행을 추가한다.

| 요구사항 | 신규 백엔드 API | 신규 프론트엔드 컴포넌트 | plan 문서 |
| --- | --- | --- | --- |
| REQ-10 수동 영역 | `POST /api/.../pages/{n}/manual-thumbnail`<br>`POST /api/extract-v2` (스키마 확장) | `PageAnnotator` | [plan-manual-region.md](manual-region/plan-manual-region.md) |
