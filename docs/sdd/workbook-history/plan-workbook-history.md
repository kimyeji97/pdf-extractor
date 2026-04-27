# plan-workbook-history — 생성된 문제집 메뉴

> **요구사항**: REQ-21, REQ-22  
> **작성일**: 2026-04-26  
> **수정일**: 2026-04-27 (Action Item 반영)  
> **관련 spec**: [plan-v3.md](../spec-v3.md)  
> **변경 범위**: 프론트엔드 전용 (`WorkbookHistoryView`)  
> **전제**: [plan-workbook-editor.md](../workbook-editor/plan-workbook-editor.md) 완료 (workbook API)

---

## 1. 목표

생성된 문제집의 이력을 목록으로 확인하고, 재다운로드하거나 편집 상태로 불러올 수 있다.

---

## 2. 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
│  생성된 문제집                                                      │
│  ─────────────────────────────────────────────────────────────── │
│  2026-04-26 10:30  │  파일명  │  15문항  │  세로 2단  │  [다운로드]  [편집으로 불러오기] │
│  2026-04-25 14:20  │  파일명  │   8문항  │  4단       │  [다운로드]  [편집으로 불러오기] │
│  2026-04-24 09:00  │  파일명  │   3문항  │  6단       │  [다운로드]  [편집으로 불러오기] │
└──────────────────────────────────────────────────────────────────┘
```

빈 목록 시: "생성된 문제집이 없습니다. 문제집 생성 탭에서 만들어보세요." 표시 (인라인, 모달 없음).

---

## 3. API 사용

| API | 용도 |
|-----|------|
| `GET /api/workbooks` | 문제집 이력 목록 조회 |
| `GET /api/status/{result_job_id}` | 재다운로드용 `download_url` 조회 |

---

## 4. 컴포넌트 설계

### WorkbookHistoryView.jsx

마운트 시 `GET /api/workbooks` 호출 → `WorkbookMeta[]` 목록 렌더링.

각 행 표시 항목:
- **생성 일시**: `created_at` 로컬 시간 포맷
- **파일명**: `filename` (입력받은 이름. `null`이면 "문제집 {created_at}" 형식)
- **문항 수**: `question_count`
- **레이아웃**: `layout` (세로 2단 / 가로 2단 / 4단 / 6단)
- **다운로드 버튼**: 클릭 시 `GET /api/status/{result_job_id}` → `download_url` → 파일 다운로드
- **편집으로 불러오기 버튼**: 클릭 시 `activeMenu = 'editor'`로 전환 + `initialWorkbookId` 전달

---

## 5. 버그 수정: 목록이 보이지 않는 문제

**현상**: 생성된 문제집 메뉴에서 이력 목록이 빈 상태로 표시됨.  
**원인 추정**: `WorkbookEditorView`에서 PDF 생성 완료 후 `POST /api/workbooks` 호출이 누락됐을 가능성.

**점검 순서**:
1. `WorkbookEditorView.jsx` — PDF 생성 DONE 확인 후 `POST /api/workbooks` 호출 여부 점검
2. `local_storage/workbooks/` 디렉토리 존재 여부 확인 (백엔드 초기화 시 생성 로직 필요)
3. `GET /api/workbooks` 라우터가 올바른 경로에서 파일을 읽는지 확인
4. `WorkbookHistoryView` 마운트 시점에 API 호출이 실행되는지 확인 (탭 전환 시 재호출 여부 포함)

**수정 방향**:
- `workbook.py` 라우터의 `GET /api/workbooks` 는 `local_storage/workbooks/*.json` 전체를 읽어 `created_at` 내림차순 정렬 후 반환.
- `WorkbookEditorView.jsx` 6.7절 PDF 생성 흐름에 `POST /api/workbooks` 호출이 반드시 포함되어야 함.
- `WorkbookHistoryView` 마운트 시 + 탭 포커스 시 목록 재조회.

---

## 6. 구현 작업 목록

1. `WorkbookHistoryView.jsx` 신규 작성
2. 목록 행 컴포넌트 (생성일시 / 파일명 / 문항수 / 레이아웃 / 버튼)
3. 다운로드 버튼 → `GET /api/status` → `download_url` 클릭 트리거
4. 편집으로 불러오기 → 부모(`App.jsx`) 콜백으로 `activeMenu` + `initialWorkbookId` 전달
5. **[버그]** `WorkbookEditorView`에서 PDF DONE 후 `POST /api/workbooks` 호출 연결 확인 및 수정
6. **[버그]** 백엔드 `local_storage/workbooks/` 디렉토리 자동 생성 보장
7. 탭 전환 시 목록 재조회 로직 추가
