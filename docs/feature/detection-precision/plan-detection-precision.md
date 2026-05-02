# plan-detection-precision — 문항 경계 감지 정밀도 개선

> **요구사항**: REQ-15, REQ-23, REQ-24  
> **작성일**: 2026-04-26  
> **수정일**: 2026-04-27 (Action Item 반영 — WebSocket 진행률 스트리밍 추가)  
> **관련 spec**: [plan-v3.md](../spec-v3.md)  
> **변경 범위**: 백엔드 전용 (`question_parser.py`, `schemas.py`, `extract.py`)

---

## 1. 목표

자동 문항 경계 감지 결과의 세 가지 정밀도 문제를 해소한다.  
추가로, 감지 진행 상황을 WebSocket으로 실시간 스트리밍하여 프로그래스 바를 제공한다.

| 문제 | 현재 동작 | 목표 |
|------|-----------|------|
| y_bottom 과도 포함 | 다음 문항 y_top까지 전부 포함 → 하단 여백 과다 | 마지막 텍스트 bottom + 50pt 이내로 제한 |
| x 좌표 부정확 | 컬럼 분할점 기준 고정 | 문항 번호 텍스트 x0 − 10pt / 텍스트 최대 x1 |
| 오탐지 미감지 | 페이지 전체 크기 영역도 문항으로 등록 | 페이지 크기와 일치하는 경계를 오탐지로 표시 |
| 진행률 미제공 | 감지 완료 전까지 응답 없음 | 페이지별 감지 완료 시 WebSocket으로 진행률 전송 |

---

## 2. 데이터 모델 변경

### `QuestionBoundary` (question_parser.py)

```python
@dataclass
class QuestionBoundary:
    number: int
    page_index: int
    col: int
    y_top: float
    y_bottom: float
    col_x0: float
    col_x1: float
    # ── v3 신규 ──
    title: Optional[str] = None          # 사용자 수정 타이틀
    is_false_positive: bool = False      # 오탐지 여부 (REQ-15)
    is_manual: bool = False              # 수동 추가 문항 여부
    manual_id: Optional[str] = None     # 수동 추가 시 UUID
```

> **하위 호환**: 기존 `boundaries/*.json` 역직렬화 시 신규 필드 누락은 기본값으로 처리.  
> `QuestionBoundary(**b)` 에 `field(default=...)` 가 있으므로 별도 마이그레이션 불필요.

---

## 3. REQ-23: y_bottom 정밀화

**구현 위치**: `question_parser.py` → 경계 계산 완료 직후

```python
def _calc_tight_y_bottom(
    words: list[dict],        # 이 문항에 속하는 pdfplumber 단어 목록
    fallback_y_bottom: float  # 다음 문항 y_top 또는 컬럼 하단
) -> float:
    if not words:
        return fallback_y_bottom
    last_text_bottom = max(w["bottom"] for w in words)
    return min(fallback_y_bottom, last_text_bottom + 50)
```

**적용 시점**: 각 `QuestionBoundary`의 `y_bottom`을 확정하는 루프 내에서 호출.

**영향**:
- 문항 하단 여백 과다 포함 문제 해소.
- 추출 PDF가 더 촘촘하게 배치됨.
- 썸네일 크롭 영역도 동일하게 축소됨.

---

## 4. REQ-24: x 좌표 정밀화

**구현 위치**: `question_parser.py` → `QuestionBoundary` 생성 시점

```python
# 문항 번호 텍스트의 x0 찾기
num_word = next(
    (w for w in page_words if is_question_number_word(w, boundary.number)),
    None
)

if num_word:
    col_x0 = max(0, num_word["x0"] - 10)
else:
    col_x0 = boundary.col_x0  # fallback: 기존 컬럼 분할점

# 해당 문항 내 모든 단어의 최대 x1
col_x1 = max(
    (w["x1"] for w in question_words),
    default=boundary.col_x1
)
```

**영향**:
- 컬럼 경계를 넘지 않는 더 정밀한 크롭.
- 좌우 여백 제거로 문항 내용 집중도 향상.
- 문항 번호 감지 실패 시 기존 로직으로 fallback.

---

## 5. REQ-15: 오탐지 감지

**오탐지 기준**: 감지된 문항 경계(x0, y_top, x1, y_bottom)가 해당 페이지의 전체 크기와 일치.

**구현 위치**: `detect_question_boundaries()` 내부, `QuestionBoundary` 생성 직후

```python
TOLERANCE = 2.0  # pt 단위 허용 오차

def _is_false_positive(
    boundary: QuestionBoundary,
    page_width: float,
    page_height: float,
) -> bool:
    return (
        abs(boundary.col_x0 - 0) < TOLERANCE
        and abs(boundary.y_top - 0) < TOLERANCE
        and abs(boundary.col_x1 - page_width) < TOLERANCE
        and abs(boundary.y_bottom - page_height) < TOLERANCE
    )
```

**오탐지 처리**:
- `is_false_positive = True` 로 마킹. 목록에서 제거하지 않음 (UI에서 하이라이트 표시).
- API 응답에 `is_false_positive` 필드 포함.

---

## 6. API 응답 변경

`GET /api/jobs/{job_id}/pages/{page_num}/questions` 응답의 `QuestionInfo` 모델에 필드 추가:

```python
class QuestionInfo(BaseModel):
    question_num: Optional[int] = None
    manual_id: Optional[str] = None
    question_id: str              # "{job_id}_{page_num}_{title}" 또는 manual_id
    thumbnail_url: str
    bbox: BBox
    col: int
    title: Optional[str] = None          # 신규
    is_false_positive: bool = False      # 신규
    is_manual: bool = False              # 신규
```

---

## 7. WebSocket 진행률 스트리밍 (신규)

### 7.1 목표

문항 감지가 n페이지를 순차 처리하는 동안, 페이지별 완료 시점을 클라이언트에 실시간 전달한다.

```
총 10페이지 중 3페이지 감지 완료 ████░░░░░░ 30%
```

### 7.2 백엔드 — WebSocket 엔드포인트

**구현 위치**: `extract.py` (또는 별도 `ws.py` 라우터)

```python
@router.websocket("/api/ws/jobs/{job_id}/progress")
async def detection_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()
    try:
        async for message in detection_progress_stream(job_id):
            await websocket.send_json(message)
            if message["status"] in ("done", "failed"):
                break
    except WebSocketDisconnect:
        pass
```

메시지 형식:
```json
{
  "status": "in_progress",
  "current_page": 3,
  "total_pages": 10,
  "percent": 30
}
```

완료 시:
```json
{
  "status": "done",
  "current_page": 10,
  "total_pages": 10,
  "percent": 100
}
```

### 7.3 백엔드 — 감지 로직 비동기화

**문제**: `question_parser.py`의 감지 루프는 동기(CPU-bound). WebSocket으로 중간 결과를 emit하려면 이벤트 루프 블로킹을 피해야 한다.

**해결**: `asyncio.get_event_loop().run_in_executor()` 로 페이지별 감지를 스레드에서 실행하고 완료 시 asyncio Queue에 결과 push.

```python
async def detection_progress_stream(job_id: str):
    queue = asyncio.Queue()
    total_pages = get_total_pages(job_id)

    async def run_detection():
        loop = asyncio.get_event_loop()
        for page_num in range(total_pages):
            await loop.run_in_executor(None, detect_page, job_id, page_num)
            await queue.put({
                "status": "in_progress",
                "current_page": page_num + 1,
                "total_pages": total_pages,
                "percent": round((page_num + 1) / total_pages * 100),
            })
        await queue.put({"status": "done", "current_page": total_pages,
                         "total_pages": total_pages, "percent": 100})

    asyncio.create_task(run_detection())

    while True:
        msg = await queue.get()
        yield msg
        if msg["status"] in ("done", "failed"):
            break
```

**사이드 이펙트 주의**:
- 기존 동기 감지 흐름(`POST /api/jobs/{job_id}/refresh`)은 유지. WebSocket은 **추가** 엔드포인트.
- 재감지 요청 → WebSocket 연결 순서로 프론트가 연결해야 진행률 수신 가능.
- 페이지별 감지 함수(`detect_page`)가 스레드 세이프해야 함. 파일 I/O에 lock 필요 여부 검토.

### 7.4 프론트엔드 — 진행률 바

**구현 위치**: `FilePagePanel.jsx` (섹션 A) 또는 `QuestionAnalysisView.jsx`

```js
function useDetectionProgress(jobId, enabled) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!enabled || !jobId) return;
    const ws = new WebSocket(`ws://localhost:8000/api/ws/jobs/${jobId}/progress`);
    ws.onmessage = (e) => setProgress(JSON.parse(e.data));
    ws.onclose = () => setProgress(null);
    return () => ws.close();
  }, [jobId, enabled]);

  return progress;
}
```

UI:
```
감지 중: 총 10페이지 중 3페이지 완료
[████░░░░░░] 30%
```

- 재감지 버튼 클릭 시 WebSocket 연결 시작.
- `status: "done"` 수신 시 문항 목록 리로드.
- 컴포넌트 unmount 시 `ws.close()` 필수.

---

## 8. 구현 작업 목록

1. `QuestionBoundary` dataclass에 `title`, `is_false_positive`, `is_manual`, `manual_id` 필드 추가
2. `_calc_tight_y_bottom()` 함수 작성
3. 경계 계산 루프에 `_calc_tight_y_bottom()` 적용 (REQ-23)
4. 문항 번호 텍스트 기반 `col_x0 / col_x1` 계산 로직 적용 (REQ-24)
5. `_is_false_positive()` 함수 작성 + `detect_question_boundaries()` 내 적용 (REQ-15)
6. `browse.py`의 `QuestionInfo` 응답 스키마에 신규 필드 추가 (`question_id` 포함)
7. 기존 경계 캐시 역직렬화 하위 호환 확인 (unit test)
8. **[신규]** `detect_page()` 함수 분리 — 페이지 단위 감지 로직을 독립 함수로 추출
9. **[신규]** `detection_progress_stream()` 비동기 제너레이터 작성
10. **[신규]** `/api/ws/jobs/{job_id}/progress` WebSocket 엔드포인트 작성
11. **[신규]** 프론트 `useDetectionProgress` 훅 작성
12. **[신규]** 재감지 버튼 클릭 시 WebSocket 연결 + 진행률 바 UI 구현
