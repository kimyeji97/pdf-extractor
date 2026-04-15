# plan-pdf-export — 선택 문항 PDF 내보내기

> **요구사항**: REQ-06  
> **작성일**: 2026-04-15  
> **관련 spec**: [spec.md](../spec.md)

---

## 1. 목표

바스켓에 누적된 문항들(복수 파일/페이지 출처 가능)을 하나의 PDF로 합쳐 다운로드한다.
기존 `/api/extract` (번호 텍스트 입력)와 별개로 동작하는 신규 엔드포인트를 제공한다.

---

## 2. 백엔드

### 2.1 신규 엔드포인트

```
POST /api/extract-v2
```

**Request Body**
```json
{
  "selections": [
    {
      "job_id":       "uuid-A",
      "page_num":     0,
      "question_num": 1
    },
    {
      "job_id":       "uuid-A",
      "page_num":     2,
      "question_num": 7
    },
    {
      "job_id":       "uuid-B",
      "page_num":     1,
      "question_num": 3
    }
  ]
}
```

- `selections` 순서가 출력 PDF의 문항 순서가 된다.
- 서로 다른 `job_id`(다른 파일)의 문항을 혼합 가능.

**Response** (즉시 반환, 비동기)
```json
{
  "job_id":  "new-export-uuid",
  "message": "추출 작업이 시작되었습니다."
}
```

상태 조회는 기존 `GET /api/status/{job_id}` 동일하게 사용한다.

### 2.2 처리 흐름

```
POST /api/extract-v2
  │
  ├─ 새 export_job_id 생성
  ├─ JobStatusFile 생성 (status=PROCESSING)
  └─ BackgroundTask: _process_v2_extraction(export_job_id, selections)
        │
        ├─ selections를 job_id 별로 그룹핑
        │    { uuid-A: [sel1, sel2], uuid-B: [sel3] }
        │
        ├─ job_id별로 원본 PDF 다운로드 (임시 디렉토리)
        │
        ├─ job_id별로 경계 캐시 조회 or detect_question_boundaries() 실행
        │
        ├─ 각 selection → CropRegion 변환
        │    map_questions_to_regions() 재사용
        │
        ├─ selections 순서 유지하며 CropRegion 목록 생성
        │    [sel1_regions, sel2_regions, sel3_regions, ...]
        │
        ├─ 복수 PDF 소스에서 단일 output.pdf 빌드
        │    (기존 _build_pdf_from_regions는 단일 src 가정 → 확장 필요)
        │
        ├─ output.pdf → 스토리지 저장
        └─ JobStatusFile 업데이트 (status=DONE, result_key=...)
```

### 2.3 `_build_pdf_from_multi_sources()` (신규)

기존 `_build_pdf_from_regions(src_path, regions, dst_path)`는 단일 PDF 소스를 가정한다.
복수 소스를 지원하기 위해 아래 구조로 확장한다.

```python
@dataclass
class SourcedCropRegion:
    src_path: str        # 원본 PDF 로컬 경로
    page_index: int
    x0: float
    y0: float
    x1: float
    y1: float

def _build_pdf_from_multi_sources(
    regions: list[SourcedCropRegion],
    dst_path: str,
) -> None:
    """
    여러 PDF 소스에서 CropRegion을 순서대로 합쳐 단일 PDF 생성.
    소스별로 fitz.open() 캐싱하여 중복 파일 열기 최소화.
    """
    src_cache: dict[str, fitz.Document] = {}
    dst = fitz.open()

    for region in regions:
        src = src_cache.setdefault(region.src_path, fitz.open(region.src_path))
        # 기존 _insert_cropped_page / insert_pdf 로직 재사용
        ...

    dst.save(dst_path, garbage=4, deflate=True)
    for doc in src_cache.values():
        doc.close()
    dst.close()
```

### 2.4 스키마 추가

```python
# backend/app/models/schemas.py

class SelectionItem(BaseModel):
    job_id:       str
    page_num:     int
    question_num: int

class ExtractV2Request(BaseModel):
    selections: list[SelectionItem] = Field(..., min_items=1)
```

### 2.5 변경/신규 파일

| 파일 | 변경 내용 |
|------|-----------|
| `backend/app/models/schemas.py` | `SelectionItem`, `ExtractV2Request` 추가 |
| `backend/app/routers/extract.py` | `POST /api/extract-v2` 라우터 추가 |
| `backend/app/services/pdf_service.py` | `SourcedCropRegion`, `_build_pdf_from_multi_sources()` 추가 |
| `backend/app/services/pdf_service.py` | `extract_questions_v2()` 엔트리포인트 추가 |

---

## 3. 프론트엔드

### 3.1 ExportButton (`src/components/SelectionBasket.jsx` 내 포함)

`SelectionBasket`의 `[PDF 다운로드]` 버튼에 연결한다.

**흐름**
```
[PDF 다운로드] 클릭
  → POST /api/extract-v2 { selections: basket }
  → { job_id: export_id }
  → 폴링 시작: GET /api/status/{export_id}
  → DONE → download_url로 자동 다운로드 트리거
  → FAILED → 에러 토스트 표시
```

**UI 상태**
- 버튼 클릭 후: "생성 중..." 스피너 표시 (바스켓은 유지)
- DONE 후: "다운로드 완료 ✓" 표시, 버튼 재활성화
- 바스켓 비어있을 때: 버튼 비활성화

### 3.2 API 클라이언트 추가

```js
// src/api/client.js 에 추가
export async function startExtractV2(selections) {
  // selections: [{ jobId, pageNum, questionNum }, ...]
  const body = {
    selections: selections.map(s => ({
      job_id:       s.jobId,
      page_num:     s.pageNum,
      question_num: s.questionNum,
    }))
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
  return res.json(); // { job_id }
}
```

### 3.3 다운로드 트리거

```js
// DONE 상태 감지 후
const link = document.createElement("a");
link.href = downloadUrl;
link.download = "extracted_questions.pdf";
link.click();
```

---

## 4. 작업 순서 (Task Breakdown)

| # | 작업 | 레이어 | 우선순위 |
|---|------|--------|----------|
| 1 | `SelectionItem`, `ExtractV2Request` 스키마 추가 | Backend | P0 |
| 2 | `SourcedCropRegion`, `_build_pdf_from_multi_sources()` 구현 | Backend | P0 |
| 3 | `extract_questions_v2()` 엔트리포인트 구현 | Backend | P0 |
| 4 | `POST /api/extract-v2` 라우터 구현 | Backend | P0 |
| 5 | `startExtractV2()` API 클라이언트 함수 추가 | Frontend | P1 |
| 6 | `SelectionBasket`에 내보내기 버튼 + 폴링 로직 추가 | Frontend | P1 |
| 7 | 다운로드 트리거 구현 | Frontend | P1 |
| 8 | 복수 파일 출처 혼합 시나리오 통합 테스트 | Test | P1 |

---

## 5. 수용 조건 (Acceptance Criteria)

- [ ] `POST /api/extract-v2`가 단일 파일 출처 선택으로 PDF를 정상 생성한다.
- [ ] `POST /api/extract-v2`가 복수 파일 출처 선택(혼합)으로 PDF를 정상 생성한다.
- [ ] 출력 PDF의 문항 순서가 `selections` 배열 순서와 일치한다.
- [ ] 빈 `selections` 요청 시 400 에러를 반환한다.
- [ ] DONE 상태 감지 후 브라우저 자동 다운로드가 실행된다.
- [ ] 다운로드 중 바스켓 항목이 초기화되지 않는다 (사용자가 명시적으로 지워야 함).
