# REQ-13 수동 문항 영역 추가

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-04-26 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

자동 감지가 놓친 문항을 사용자가 직접 영역으로 지정해 추가할 수 있어야 한다.

**목표 / 달성 기준**

- 페이지 위에서 드래그로 영역을 그려 수동 문항을 추가한다(타이틀 필수).
- 서버에 영속 저장되어 새로고침 후 복원된다.
- 저장은 1초 이내 응답.

---

## 2. Scope

**In-scope**

- `POST .../questions/manual` 수동 문항 추가
- 드래그 영역 지정 UI, 수동 문항 썸네일 생성

**Out-of-scope (non-goal)**

- 수동 문항 타이틀 수정/삭제 (REQ-12/REQ-14)

---

## 3. API·데이터 변경

### API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/jobs/{id}/pages/{n}/questions/manual` | 수동 문항 추가(bbox + title), `manual_id` 발급 |

### 데이터 모델·스키마

- `manual_questions/{job_id}.json` 신규
- `thumbnails/{job_id}/manual_{page}_{manual_id}.png` 신규
- `ManualQuestion { manual_id(UUID), page_num, bbox, title }`

### 마이그레이션 메모

신규 저장소. 기존 데이터 영향 없음.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 영역 드래그 + 타이틀 입력 | 수동 문항 생성, 1초 내 응답 |
| 2 | 타이틀 미입력 | 저장 차단/검증 안내 |
| 3 | 새로고침 | 수동 문항 서버에서 복원 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
