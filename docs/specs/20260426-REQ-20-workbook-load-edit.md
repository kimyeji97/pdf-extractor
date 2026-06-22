# REQ-20 기존 문제집 불러와 편집

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-26 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

이미 생성한 문제집을 다시 불러와 문항을 추가/제거하고 재생성할 수 있어야 한다.

**목표 / 달성 기준**

- 기존 문제집 메타데이터를 불러와 편집(문항 추가/제거)한다.
- 편집 결과를 다시 저장·생성할 수 있다.

---

## 2. Scope

**In-scope**

- `GET /api/workbooks/{wid}` 메타 조회
- `POST /api/workbooks` 메타 저장
- 편집 화면 복원

**Out-of-scope (non-goal)**

- 이력 목록(REQ-21), 재다운로드(REQ-22)

---

## 3. API·데이터 변경

### API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/workbooks/{wid}` | 문제집 메타데이터 |
| POST | `/api/workbooks` | 문제집 메타데이터 저장 |

### 데이터 모델·스키마

- `workbooks/{workbook_id}.json` 신규
- `WorkbookMeta { workbook_id(UUID), name, layout, selections[] }`
- `WorkbookSelectionItem`은 REQ-B02 `question_id` 사용

### 마이그레이션 메모

신규 저장소. `workbooks/` 디렉토리 자동 생성 보장(REQ-B01).

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 기존 문제집 불러오기 | 선택·레이아웃 복원 |
| 2 | 문항 추가/제거 후 저장 | 변경 반영 저장 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
