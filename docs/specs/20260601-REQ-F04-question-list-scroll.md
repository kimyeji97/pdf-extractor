# REQ-F04 3섹션 문항 카드 스크롤

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-01 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

문항 수가 많으면 카드가 화면 밖으로 넘쳐 스크롤이 불가능했다.

**목표 / 달성 기준**

- 3섹션 문항 카드 영역(`qap-list`)에 상하 스크롤을 추가한다(컨테이너 height 고정 + `overflow-y:auto`).
- 툴바는 상단 고정, `qap-list`만 스크롤한다.

---

## 2. Scope

**In-scope**

- `QuestionAnalysisView` 3섹션 flex column 구성
- `QuestionAnalysisPanel` `.qap-container`/`.qap-list` 스크롤 스타일(`min-height:0`)

**Out-of-scope (non-goal)**

- 섹션 비율 (REQ-F03)

---

## 3. API·데이터 변경 (UI/UX)

### 동작·상태

`.qap-list { flex:1; overflow-y:auto; min-height:0 }`.

### 컴포넌트

`QuestionAnalysisView`, `QuestionAnalysisPanel`.

### 마이그레이션 메모

없음

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 문항 다수 | 3섹션 내부 스크롤 |
| 2 | 스크롤 시 | 툴바 상단 고정 |
| 3 | 스크롤 범위 | 화면 전체가 아닌 `qap-list`만 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
