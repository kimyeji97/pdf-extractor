# plan-workbook-history — 생성된 문제집 메뉴

> **요구사항**: REQ-21, REQ-22  
> **작성일**: 2026-04-26  
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
│  2026-04-26 10:30  │  15문항  │  2단  │  [다운로드]  [편집으로 불러오기] │
│  2026-04-25 14:20  │   8문항  │  4단  │  [다운로드]  [편집으로 불러오기] │
│  2026-04-24 09:00  │   3문항  │  6단  │  [다운로드]  [편집으로 불러오기] │
└──────────────────────────────────────────────────────────────────┘
```

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
- **문항 수**: `question_count`
- **레이아웃**: `layout` (2단 / 4단 / 6단)
- **다운로드 버튼**: 클릭 시 `GET /api/status/{result_job_id}` → `download_url` → 파일 다운로드
- **편집으로 불러오기 버튼**: 클릭 시 `activeMenu = 'editor'`로 전환 + `initialWorkbookId` 전달

빈 목록 시: "생성된 문제집이 없습니다. 문제집 생성 탭에서 만들어보세요." 표시 (인라인, 모달 없음).

---

## 5. 구현 작업 목록

1. `WorkbookHistoryView.jsx` 신규 작성
2. 목록 행 컴포넌트 (생성일시 / 문항수 / 레이아웃 / 버튼)
3. 다운로드 버튼 → `GET /api/status` → `download_url` 클릭 트리거
4. 편집으로 불러오기 → 부모(`App.jsx`) 콜백으로 `activeMenu` + `initialWorkbookId` 전달
