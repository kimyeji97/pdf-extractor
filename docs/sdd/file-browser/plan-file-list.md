# plan-file-list — 파일 목록 조회

> **요구사항**: REQ-01  
> **작성일**: 2026-04-15  
> **관련 spec**: [spec.md](../spec.md)

---

## 1. 목표

스토리지에 업로드된 PDF 파일 목록을 API로 제공하고, 프론트엔드에서 카드 형태로 표시한다.

---

## 2. 백엔드

### 2.1 신규 엔드포인트

```
GET /api/jobs
```

**Response**
```json
{
  "jobs": [
    {
      "job_id":     "uuid",
      "filename":   "2024_csat_math.pdf",
      "status":     "PENDING | PROCESSING | DONE | FAILED",
      "uploaded_at": "2026-04-15T10:00:00Z",
      "page_count": null
    }
  ]
}
```

- `filename`: 업로드 시 저장된 원본 파일명 (현재 `JobStatusFile`에 없으므로 필드 추가 필요)
- `uploaded_at`: 상태 파일 최초 생성 시각 (파일 mtime 또는 별도 필드)
- `page_count`: 이미 조회한 경우 캐시 값, 없으면 `null`
- 정렬: `uploaded_at` 내림차순 (최신 업로드 우선)

### 2.2 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `backend/app/models/schemas.py` | `JobStatusFile`에 `filename`, `uploaded_at` 필드 추가 |
| `backend/app/routers/upload.py` | `POST /api/upload` 에서 `filename` 저장 처리 추가 |
| `backend/app/routers/browse.py` | **신규** — `GET /api/jobs` 라우터 |
| `backend/app/services/storage.py` | `list_jobs()` 함수 추가 |
| `backend/app/services/local_storage_service.py` | `list_jobs()` 구현 |
| `backend/app/services/s3_service.py` | `list_jobs()` 구현 |
| `backend/app/main.py` | `browse` 라우터 등록 |

### 2.3 `list_jobs()` 구현 방향

**로컬 모드**
```python
# local_storage/status/ 디렉토리의 *.json 파일을 읽어 목록 반환
# mtime 내림차순 정렬
```

**S3 모드**
```python
# s3.list_objects_v2(Prefix="status/") 로 상태 JSON 목록 조회
# 각 파일을 GetObject 하지 않고 LastModified + key 파싱으로 최소화
# 필요 시 병렬 조회 (asyncio / ThreadPoolExecutor)
```

### 2.4 `POST /api/upload` 변경

업로드 요청 바디에 `filename` 파라미터를 추가한다.

```
POST /api/upload
Request Body (JSON):
{
  "filename": "2024_csat_math.pdf"   // optional, 없으면 "unknown.pdf"
}
```

> 기존 클라이언트 호환을 위해 `filename`은 optional로 처리.

---

## 3. 프론트엔드

### 3.1 신규 컴포넌트

```
src/components/FileListPanel.jsx
```

**props**
```js
// 없음 — 마운트 시 자동으로 GET /api/jobs 호출
```

**표시 항목**
- 파일명
- 업로드 시각 (상대 시간, 예: "3분 전")
- 상태 뱃지 (PENDING / DONE / FAILED 색상 구분)
- 선택 시 활성화 스타일 (border highlight)

**인터랙션**
- 카드 클릭 → `onSelect(job_id)` 콜백 호출
- 새로고침 버튼 → `GET /api/jobs` 재호출

### 3.2 API 클라이언트 추가

```js
// src/api/client.js 에 추가
export async function listJobs() {
  const res = await fetch(`${BASE_URL}/jobs`);
  if (!res.ok) throw new Error("파일 목록 조회 실패");
  return res.json(); // { jobs: [...] }
}
```

### 3.3 App.jsx 상태 변경

```js
// 기존 step 상태에 file-list 단계 추가
const STEPS = {
  FILE_LIST:  "file-list",   // ← 신규 (앱 진입 기본 화면)
  UPLOADING:  "uploading",
  PAGE_BROWSE:"page-browse", // ← 신규 (REQ-02)
  // ...기존 유지
};
```

---

## 4. 작업 순서 (Task Breakdown)

| # | 작업 | 레이어 | 우선순위 |
|---|------|--------|----------|
| 1 | `JobStatusFile`에 `filename`, `uploaded_at` 필드 추가 | Backend | P0 |
| 2 | `POST /api/upload` 에서 `filename` 수신 & 저장 | Backend | P0 |
| 3 | `local_storage_service.list_jobs()` 구현 | Backend | P0 |
| 4 | `s3_service.list_jobs()` 구현 | Backend | P0 |
| 5 | `GET /api/jobs` 라우터 (`browse.py`) 작성 | Backend | P0 |
| 6 | `main.py`에 browse 라우터 등록 | Backend | P0 |
| 7 | `listJobs()` API 클라이언트 함수 추가 | Frontend | P1 |
| 8 | `FileListPanel` 컴포넌트 구현 | Frontend | P1 |
| 9 | `App.jsx` 초기 화면을 `FileListPanel`로 변경 | Frontend | P1 |

---

## 5. 수용 조건 (Acceptance Criteria)

- [ ] `GET /api/jobs` 호출 시 업로드된 파일 목록이 최신 순으로 반환된다.
- [ ] 각 항목에 `filename`, `status`, `uploaded_at`이 포함된다.
- [ ] 로컬 모드 / S3 모드 모두 동작한다.
- [ ] 파일이 없을 때 빈 배열(`[]`)을 반환하며 UI에서 "업로드된 파일 없음" 메시지를 표시한다.
- [ ] `FileListPanel`에서 파일 클릭 시 페이지 브라우징 화면으로 전환된다.
