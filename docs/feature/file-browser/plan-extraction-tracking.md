# plan-extraction-tracking — 문항 추출 현황 추적 및 파일 목록 개선

> **요구사항**: REQ-07, REQ-08, REQ-09  
> **작성일**: 2026-04-16  
> **관련 spec**: [spec.md](../spec.md)

---

## 1. 목표

| # | 요구사항 | 연결 REQ |
|---|----------|----------|
| 1 | 업로드 후 비동기로 진행되는 문항 경계 감지 상태를 조회할 수 있다 (새로고침 시점) | REQ-07 |
| 2 | 업로드된 원본 파일과 추출로 생성된 결과 파일을 분리하여 표시한다 | REQ-08 |
| 3 | 페이지 목록에서 각 페이지별 추출 문항 수를 표시한다 | REQ-09 |
| 4 | 파일 목록에서 파일별 문항 추출 완료 여부를 뱃지로 표시한다 | REQ-07 |

---

## 2. 배경 / 현재 문제점

```
현재 흐름:
  POST /api/upload/direct  →  파일 저장만 완료
  GET /api/jobs/{id}/pages/{n}/questions  →  최초 요청 시 detect_question_boundaries() 실행 (동기, 수십 초)

문제:
  ① 첫 문항 목록 요청 시 UI가 수십 초 블로킹됨
  ② GET /api/jobs 결과에 원본 파일과 extract-v2 결과 파일이 혼재됨
  ③ 페이지 목록(GET /api/jobs/{id}/pages)에 문항 수 정보가 없음
```

---

## 3. 백엔드

### 3.1 스키마 변경 (`backend/app/models/schemas.py`)

#### 3.1.1 신규 Enum — `JobType`

```python
class JobType(str, Enum):
    SOURCE = "SOURCE"   # 사용자가 업로드한 원본 PDF
    EXPORT = "EXPORT"   # extract-v2로 생성된 결과 PDF
```

#### 3.1.2 신규 Enum — `BoundariesStatus`

```python
class BoundariesStatus(str, Enum):
    PENDING    = "PENDING"     # 감지 대기 중
    PROCESSING = "PROCESSING"  # 감지 진행 중
    DONE       = "DONE"        # 감지 완료
    FAILED     = "FAILED"      # 감지 실패
```

#### 3.1.3 `JobStatusFile` 필드 추가

```python
class JobStatusFile(BaseModel):
    # ── 기존 필드 유지 ──────────────────────────
    job_id: str
    status: JobStatus
    filename: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    original_key: Optional[str] = None
    result_key: Optional[str] = None
    question_numbers: Optional[str] = None
    extracted_count: Optional[int] = None
    error: Optional[str] = None

    # ── 신규 필드 ───────────────────────────────
    job_type: JobType = JobType.SOURCE            # 파일 유형 구분
    boundaries_status: Optional[BoundariesStatus] = None  # 문항 감지 상태
    total_question_count: Optional[int] = None   # 전체 감지 문항 수
    questions_per_page: Optional[dict] = None    # { "0": 5, "1": 3, ... }
```

> `questions_per_page`의 키는 JSON 직렬화를 위해 문자열로 저장한다. 조회 시 `int(k)` 변환.

---

### 3.2 업로드 후 자동 경계 감지 트리거

**변경 파일**: `backend/app/routers/upload.py`

```python
from fastapi import BackgroundTasks

@router.post("/upload/direct")
async def direct_upload(key: str, file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    ...
    storage.save_upload(content, key)

    # job_id 는 key 에서 파싱: "uploads/{job_id}/original.pdf"
    job_id = key.split("/")[1]
    background_tasks.add_task(_trigger_boundary_detection, job_id)

    return {"message": "업로드 완료", "key": key}
```

> **S3 모드**: S3 업로드는 클라이언트가 Presigned URL로 직접 PUT하므로 서버가 완료 시점을 알 수 없다. S3 모드에서는 `GET /api/jobs/{job_id}/pages` 최초 호출 시 아직 `PENDING`이면 감지를 트리거한다 (기존 on-demand 방식 유지, 상태만 추가 기록).

---

### 3.3 백그라운드 경계 감지 태스크 (`backend/app/routers/upload.py`)

```python
import dataclasses, tempfile
from pathlib import Path
from app.utils.question_parser import detect_question_boundaries

def _trigger_boundary_detection(job_id: str) -> None:
    """업로드 완료 직후 비동기 실행 — 문항 경계 감지 후 상태 업데이트"""
    status_file = storage.get_status(job_id)
    if status_file is None:
        return

    # 상태 → PROCESSING
    status_file.boundaries_status = BoundariesStatus.PROCESSING
    storage.put_status(status_file)

    try:
        pdf_bytes = storage.read_file(storage.original_key(job_id))

        with tempfile.TemporaryDirectory() as tmpdir:
            pdf_path = str(Path(tmpdir) / "original.pdf")
            Path(pdf_path).write_bytes(pdf_bytes)
            boundaries = detect_question_boundaries(pdf_path)

        # 캐시 저장
        storage.save_boundaries_cache(
            job_id, [dataclasses.asdict(b) for b in boundaries]
        )

        # 페이지별 문항 수 집계
        questions_per_page: dict[str, int] = {}
        for b in boundaries:
            key = str(b.page_index)
            questions_per_page[key] = questions_per_page.get(key, 0) + 1

        status_file.boundaries_status = BoundariesStatus.DONE
        status_file.total_question_count = len(boundaries)
        status_file.questions_per_page = questions_per_page

    except Exception as e:
        status_file.boundaries_status = BoundariesStatus.FAILED
        status_file.error_boundaries = str(e)

    finally:
        storage.put_status(status_file)
```

---

### 3.4 `GET /api/jobs` 응답 분리 (`backend/app/routers/browse.py`)

#### 변경된 Response 스키마

```python
class JobSummary(BaseModel):
    job_id: str
    filename: Optional[str] = None
    status: JobStatus
    uploaded_at: Optional[datetime] = None
    page_count: Optional[int] = None
    # ── 신규 ──
    job_type: JobType
    boundaries_status: Optional[BoundariesStatus] = None
    total_question_count: Optional[int] = None


class JobListResponse(BaseModel):
    source_jobs: List[JobSummary]   # 업로드된 원본 파일 목록
    export_jobs: List[JobSummary]   # extract-v2로 생성된 결과 파일 목록
```

#### 변경된 엔드포인트 로직

```python
@router.get("/jobs", response_model=JobListResponse)
def list_jobs():
    all_jobs = storage.list_jobs()

    source = [j for j in all_jobs if j.job_type == JobType.SOURCE]
    export = [j for j in all_jobs if j.job_type == JobType.EXPORT]

    def to_summary(j: JobStatusFile) -> JobSummary:
        return JobSummary(
            job_id=j.job_id,
            filename=j.filename,
            status=j.status,
            uploaded_at=j.uploaded_at,
            page_count=None,
            job_type=j.job_type,
            boundaries_status=j.boundaries_status,
            total_question_count=j.total_question_count,
        )

    return JobListResponse(
        source_jobs=[to_summary(j) for j in source],
        export_jobs=[to_summary(j) for j in export],
    )
```

---

### 3.5 `GET /api/jobs/{id}/pages` — 페이지별 문항 수 추가 (`backend/app/routers/browse.py`)

#### 변경된 `PageInfo` 스키마

```python
class PageInfo(BaseModel):
    page_num: int
    thumbnail_url: str
    width: float
    height: float
    question_count: Optional[int] = None   # ← 신규: 감지된 문항 수 (미완료면 null)
```

#### 변경된 엔드포인트 로직

```python
@router.get("/jobs/{job_id}/pages", response_model=PageListResponse)
def list_pages(job_id: str):
    job = storage.get_status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job을 찾을 수 없습니다.")

    pdf_bytes = storage.read_file(storage.original_key(job_id))
    page_infos = thumbnail_service.get_page_info(pdf_bytes)

    # 페이지별 문항 수: questions_per_page 캐시에서 조회
    qpp = job.questions_per_page or {}   # { "0": 5, "1": 3, ... }

    pages = [
        PageInfo(
            page_num=p["page_num"],
            thumbnail_url=f"/api/jobs/{job_id}/pages/{p['page_num']}/thumbnail",
            width=p["width"],
            height=p["height"],
            question_count=qpp.get(str(p["page_num"])),   # 없으면 None
        )
        for p in page_infos
    ]
    return PageListResponse(job_id=job_id, page_count=len(pages), pages=pages)
```

---

### 3.6 `POST /api/extract-v2` — job_type 설정 (`backend/app/routers/extract.py`)

```python
export_status = JobStatusFile(
    job_id=export_job_id,
    status=JobStatus.PENDING,
    job_type=JobType.EXPORT,   # ← 신규
)
```

---

### 3.7 변경 파일 요약

| 파일 | 변경 내용 |
|------|-----------|
| `backend/app/models/schemas.py` | `JobType`, `BoundariesStatus` Enum 추가; `JobStatusFile`에 4개 필드 추가 |
| `backend/app/routers/upload.py` | `direct_upload`에 `BackgroundTasks` 주입, `_trigger_boundary_detection()` 추가 |
| `backend/app/routers/browse.py` | `JobSummary`에 신규 필드 추가; `JobListResponse` 분리; `PageInfo`에 `question_count` 추가 |
| `backend/app/routers/extract.py` | `start_extract_v2`에서 `job_type=JobType.EXPORT` 설정 |

---

## 4. 프론트엔드

### 4.1 `GET /api/jobs` API 클라이언트 수정 (`src/api/client.js`)

```js
export async function listJobs() {
  const res = await fetch(`${BASE_URL}/jobs`);
  if (!res.ok) throw new Error("파일 목록 조회 실패");
  return res.json();
  // 반환 형태: { source_jobs: [...], export_jobs: [...] }
}
```

---

### 4.2 `FileListPanel.jsx` 변경

**레이아웃 변경**

```
┌────────────────────────────────────────────┐
│  📂 업로드된 파일          [새로고침 ↺]     │
├────────────────────────────────────────────┤
│  [파일명.pdf]  DONE  ✅ 23문항 감지 완료    │
│  [파일명2.pdf] DONE  ⏳ 문항 감지 중...     │
│  [파일명3.pdf] DONE  ❌ 문항 감지 실패      │
├────────────────────────────────────────────┤
│  📄 생성된 파일                             │
├────────────────────────────────────────────┤
│  [result_uuid.pdf]  DONE  5문항             │
│  [result_uuid2.pdf] PROCESSING ...         │
└────────────────────────────────────────────┘
```

**상태 뱃지 매핑**

| `boundaries_status` | 표시 |
|---------------------|------|
| `PENDING` | `⏳ 문항 감지 대기 중` |
| `PROCESSING` | `⏳ 문항 감지 중...` (spinner) |
| `DONE` | `✅ {total_question_count}문항 감지 완료` |
| `FAILED` | `❌ 문항 감지 실패` |
| `null` (구 데이터) | 표시 없음 |

**새로고침 동작**
- "새로고침 ↺" 버튼 클릭 → `listJobs()` 재호출 후 state 업데이트
- 자동 폴링 없음 (사용자가 명시적으로 새로고침할 때만 갱신)

---

### 4.3 `PageBrowser.jsx` 변경

**레이아웃 변경**

```
┌──────────────────────────────────────────────┐
│  ← 파일 목록으로  |  파일명.pdf (12페이지)    │
├──────────────────────────────────────────────┤
│  [썸네일]   [썸네일]   [썸네일]   [썸네일]   │
│  페이지 1   페이지 2   페이지 3   페이지 4    │
│  5문항      3문항      —          8문항       │  ← 신규
└──────────────────────────────────────────────┘
```

- `question_count`가 `null`이면 `—` 표시 (감지 미완료)
- `question_count`가 `0`이면 `0문항` 표시

**API 클라이언트 변경 없음** — `getPages()` 응답에 `question_count`가 자동 포함됨

---

## 5. 데이터 마이그레이션 고려사항

기존 status JSON 파일에는 `job_type`, `boundaries_status` 필드가 없다.
`JobStatusFile` 모델에 `Optional` 기본값을 설정했으므로 기존 파일 로드는 오류 없이 동작한다.

| 기존 파일 필드 누락 | 처리 방식 |
|---------------------|-----------|
| `job_type` 없음 | 기본값 `SOURCE`로 처리 |
| `boundaries_status` 없음 | `null`로 처리 → UI에서 뱃지 미표시 |
| `questions_per_page` 없음 | `null`로 처리 → 페이지별 `—` 표시 |

---

## 6. 작업 순서 (Task Breakdown)

| # | 작업 | 레이어 | 우선순위 |
|---|------|--------|----------|
| 1 | `schemas.py`에 `JobType`, `BoundariesStatus` Enum 및 `JobStatusFile` 필드 추가 | Backend | P0 |
| 2 | `upload.py`에 `_trigger_boundary_detection()` 백그라운드 태스크 구현 | Backend | P0 |
| 3 | `browse.py`의 `GET /api/jobs` 응답을 `source_jobs` / `export_jobs` 분리 | Backend | P0 |
| 4 | `browse.py`의 `PageInfo`에 `question_count` 추가 | Backend | P0 |
| 5 | `extract.py`의 `start_extract_v2`에 `job_type=JobType.EXPORT` 설정 | Backend | P0 |
| 6 | `client.js`의 `listJobs()` 반환 타입 확인 (구조 변경 대응) | Frontend | P1 |
| 7 | `FileListPanel` — 섹션 분리 (업로드 파일 / 생성 파일) | Frontend | P1 |
| 8 | `FileListPanel` — 추출 상태 뱃지 및 새로고침 버튼 구현 | Frontend | P1 |
| 9 | `PageBrowser` — 각 페이지 카드에 `question_count` 표시 | Frontend | P1 |

---

## 7. 수용 조건 (Acceptance Criteria)

- [ ] 파일 업로드 완료 직후 백그라운드에서 문항 감지가 자동 시작된다.
- [ ] `GET /api/jobs` 응답의 `source_jobs[*].boundaries_status` 가 감지 진행 상태를 정확히 반영한다.
- [ ] UI에서 새로고침 버튼 클릭 시 `GET /api/jobs`를 재호출하여 최신 상태가 반영된다.
- [ ] `GET /api/jobs` 응답이 `source_jobs`와 `export_jobs`로 분리되어 반환된다.
- [ ] `FileListPanel`에서 업로드 파일과 생성 파일이 별도 섹션으로 표시된다.
- [ ] `GET /api/jobs/{id}/pages` 응답의 각 페이지에 `question_count`가 포함된다.
- [ ] `PageBrowser`에서 감지 완료된 페이지에는 문항 수가 표시되고, 미완료 페이지에는 `—`가 표시된다.
- [ ] 기존 status JSON 파일(신규 필드 없음)도 오류 없이 로드된다.
