# REQ-B01 문제집 이력 미노출 버그 수정

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-27 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

생성된 문제집 메뉴에서 이력 목록이 표시되지 않았다. PDF 생성 후 `POST /api/workbooks` 저장이 연결되지 않았고, `workbooks/` 디렉토리가 없을 때 조회가 실패했다.

**목표 / 달성 기준**

- PDF 생성(DONE) 후 문제집 메타를 `POST /api/workbooks`로 저장한다.
- `workbooks/` 디렉토리 자동 생성을 보장해 조회가 빈 목록이라도 정상 동작한다.

---

## 2. Scope

**In-scope**

- `workbook.py` 디렉토리 자동 생성 보장
- `WorkbookEditorView` PDF DONE 후 저장 연결

**Out-of-scope (non-goal)**

- 식별자 체계 (REQ-B02)

---

## 3. API·데이터 변경

### API

`POST /api/workbooks` 저장 흐름 연결(신규 엔드포인트 아님).

### 데이터 모델·스키마

`WorkbookSelectionItem` 스키마는 REQ-B02 확정 후 사용.

### 마이그레이션 메모

`workbooks/` 디렉토리 없을 시 생성.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | PDF 생성 완료 | 메타 저장, 이력에 노출 |
| 2 | `workbooks/` 없음 상태 조회 | 오류 없이 빈 목록 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
