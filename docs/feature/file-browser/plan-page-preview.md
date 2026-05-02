# plan-page-preview — 페이지 목록 브라우징

> **요구사항**: REQ-02  
> **작성일**: 2026-04-15  
> **관련 spec**: [spec.md](../spec.md)

---

## 1. 목표

선택된 PDF 파일의 페이지 목록을 썸네일로 보여주고, 페이지 1개를 선택할 수 있다.

---

## 2. 백엔드

### 2.1 신규 엔드포인트

#### (A) 페이지 목록

```
GET /api/jobs/{job_id}/pages
```

**Response**
```json
{
  "job_id":     "uuid",
  "page_count": 12,
  "pages": [
    {
      "page_num":      0,
      "thumbnail_url": "/api/jobs/{job_id}/pages/0/thumbnail",
      "width":         595.0,
      "height":        842.0
    }
  ]
}
```

- `thumbnail_url`: 로컬 모드는 서버 경로, S3 모드는 Presigned GET URL (5분 유효)
- `width` / `height`: pt 단위 (PyMuPDF `page.rect`)

#### (B) 썸네일 이미지

```
GET /api/jobs/{job_id}/pages/{page_num}/thumbnail
```

- Response: `image/png`
- DPI: 96 (기본) — URL 쿼리로 `?dpi=150` 오버라이드 가능
- 캐시: 로컬 모드는 `local_storage/thumbnails/{job_id}/page_{n}.png` 파일 캐시
- S3 모드: `thumbnails/{job_id}/page_{n}.png` 오브젝트 캐시

### 2.2 썸네일 생성 로직

```python
# backend/app/services/thumbnail_service.py (신규)

import fitz  # PyMuPDF

def get_page_thumbnail(pdf_path: str, page_num: int, dpi: int = 96) -> bytes:
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    return pix.tobytes("png")
```

### 2.3 변경/신규 파일

| 파일 | 변경 내용 |
|------|-----------|
| `backend/app/services/thumbnail_service.py` | **신규** — 썸네일 생성 로직 |
| `backend/app/routers/browse.py` | `GET /api/jobs/{id}/pages`, `GET /api/jobs/{id}/pages/{n}/thumbnail` 추가 |
| `backend/app/services/local_storage_service.py` | `get_thumbnail_cache()`, `save_thumbnail_cache()` 추가 |
| `backend/app/services/s3_service.py` | S3 썸네일 캐시 조회/저장 추가 |

### 2.4 캐시 전략

```
요청 → 캐시 존재?
  YES → 캐시 반환 (재생성 없음)
  NO  → PyMuPDF로 생성 → 캐시 저장 → 반환
```

캐시 무효화: 현재 구현하지 않음 (업로드 후 PDF는 불변).

---

## 3. 프론트엔드

### 3.1 신규 컴포넌트

```
src/components/PageBrowser.jsx
```

**props**
```js
{
  jobId: string,           // 선택된 파일의 job_id
  onPageSelect: (pageNum) => void
}
```

**레이아웃**
```
┌─────────────────────────────────────────────┐
│  ← 파일 목록으로  |  파일명.pdf (12페이지)    │
├─────────────────────────────────────────────┤
│  [썸네일]  [썸네일]  [썸네일]  [썸네일]  ... │
│  페이지 1  페이지 2  페이지 3  페이지 4       │
└─────────────────────────────────────────────┘
```

- 썸네일 그리드 (4열 기본, 반응형)
- 선택된 페이지: 파란 테두리 + 체크 마크
- 로딩 중: 스켈레톤 플레이스홀더

**인터랙션**
- 썸네일 클릭 → `onPageSelect(pageNum)` → 문항 선택 화면으로 전환
- "← 파일 목록으로" 클릭 → `FileListPanel` 복귀 (바스켓 유지)

### 3.2 API 클라이언트 추가

```js
// src/api/client.js 에 추가
export async function getPages(jobId) {
  const res = await fetch(`${BASE_URL}/jobs/${jobId}/pages`);
  if (!res.ok) throw new Error("페이지 목록 조회 실패");
  return res.json(); // { job_id, page_count, pages: [...] }
}

// 썸네일은 <img src={thumbnailUrl} /> 로 직접 사용
```

---

## 4. 작업 순서 (Task Breakdown)

| # | 작업 | 레이어 | 우선순위 |
|---|------|--------|----------|
| 1 | `thumbnail_service.get_page_thumbnail()` 구현 | Backend | P0 |
| 2 | 로컬 캐시 저장/조회 (`local_storage_service`) | Backend | P0 |
| 3 | `GET /api/jobs/{id}/pages` 엔드포인트 | Backend | P0 |
| 4 | `GET /api/jobs/{id}/pages/{n}/thumbnail` 엔드포인트 | Backend | P0 |
| 5 | S3 모드 썸네일 캐시 구현 | Backend | P1 |
| 6 | `getPages()` API 클라이언트 함수 추가 | Frontend | P1 |
| 7 | `PageBrowser` 컴포넌트 구현 | Frontend | P1 |
| 8 | App.jsx에 `PAGE_BROWSE` 단계 연결 | Frontend | P1 |

---

## 5. 수용 조건 (Acceptance Criteria)

- [ ] `GET /api/jobs/{id}/pages` 가 페이지 수와 각 페이지 썸네일 URL을 반환한다.
- [ ] 썸네일 이미지가 3초 이내에 로드된다.
- [ ] 같은 페이지 재요청 시 캐시에서 즉시 반환된다 (서버 로그로 확인).
- [ ] `PageBrowser`에서 페이지 클릭 시 문항 선택 화면으로 전환된다.
- [ ] "← 파일 목록으로" 클릭 시 바스켓 선택 항목이 유지된다.
