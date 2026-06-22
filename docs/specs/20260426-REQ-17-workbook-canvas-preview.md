# REQ-17 선택 문항 Canvas 미리보기

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-26 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

생성될 PDF의 레이아웃을 미리 확인할 수 있어야 한다. 미리보기와 실제 PDF가 일치해야 신뢰할 수 있다.

**목표 / 달성 기준**

- 선택 문항을 Canvas로 미리보기하며, 실제 PDF 레이아웃과 일치한다.
- 선택 변경 후 200ms 이내 갱신.

---

## 2. Scope

**In-scope**

- `WorkbookPreview` Canvas 렌더링
- 레이아웃 상수 공유(`workbookLayout.js` ↔ `layout_spec.py`)

**Out-of-scope (non-goal)**

- PDF 실제 생성 (REQ-06/REQ-18)

---

## 3. API·데이터 변경

### API

문항 썸네일 재사용.

### 데이터 모델·스키마

프론트 `workbookLayout.js`가 백엔드 `layout_spec.py`와 동일 수식(`containFit`/`calcCellRect`) 유지.

### 마이그레이션 메모

없음

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 문항 선택 | Canvas에 셀 배치 미리보기 |
| 2 | 선택 변경 | 200ms 내 갱신 |
| 3 | 미리보기 vs 생성 PDF | 레이아웃 일치 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
