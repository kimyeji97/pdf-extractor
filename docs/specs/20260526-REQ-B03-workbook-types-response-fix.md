# REQ-B03 workbook_types 응답 누락 수정

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-05-26 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

`JobStatusFile`에는 `workbook_types`가 저장되지만 응답 모델 `JobSummary`에 필드가 없어 세 엔드포인트(`GET /api/jobs`, `GET /api/jobs/{id}`, `PATCH /api/jobs/{id}`) 모두 값을 반환하지 않았다. 그 결과 FE의 유형 태그·검색 필터·편집 인풋이 항상 비어 있었다.

**목표 / 달성 기준**

- 세 엔드포인트 응답에 `workbook_types`를 포함한다.
- FE는 코드 변경 없이 유형 표시·검색·편집이 자동 동작한다.

---

## 2. Scope

**In-scope**

- `browse.py` `JobSummary` 필드 + `to_summary()`/`get_job()`/`update_job_meta()` 4곳

**Out-of-scope (non-goal)**

- FE 변경 (기존 코드가 `job.workbook_types` 사용 준비됨)

---

## 3. API·데이터 변경

### API

`GET /api/jobs`, `GET /api/jobs/{id}`, `PATCH /api/jobs/{id}` 응답에 `workbook_types: Optional[list[str]]` 추가.

### 데이터 모델·스키마

`JobSummary.workbook_types` 추가(저장 모델엔 이미 존재).

### 마이그레이션 메모

없음(읽기 경로만 보정).

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | `GET /api/jobs` | 각 item에 `workbook_types` 포함 |
| 2 | `PATCH /api/jobs/{id}` | 수정된 `workbook_types` 반영 |
| 3 | FE 유형 태그·검색 | 새로고침 후 정상 표시·필터 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
