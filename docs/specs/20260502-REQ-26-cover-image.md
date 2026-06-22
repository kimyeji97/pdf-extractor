# REQ-26 표지 이미지 관리 및 문제집 표지 삽입

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-05-02 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

> 사후 문서화(retro-spec): 기능은 2026-05-02(`5b2a78c`)에 먼저 구현되었고, 본 spec은 정규화 과정에서 작성됨.

---

## 1. 배경·목표

**배경**

문제집 PDF에 표지를 붙일 수 있어야 한다. 표지 이미지를 별도로 업로드·관리하고, 문제집 생성 시 선택해 첫 페이지로 삽입한다.

**목표 / 달성 기준**

- 표지 이미지를 업로드·목록 조회·조회·삭제할 수 있다(JPEG/PNG, 10MB 이하).
- 문제집 생성 시 `cover_id`를 지정하면 생성 PDF 첫 페이지에 표지가 삽입된다.

---

## 2. Scope

**In-scope**

- 표지 CRUD 라우터 (`cover.py`) + 스토리지(`storage.save_cover` 등)
- 표지 관리 화면 (`pages/format/`, 구 `CoverFormatView.jsx`)
- `extract-v2` `cover_id` 연동 → `pdf_service._prepend_cover_image()`

**Out-of-scope (non-goal)**

- 표지 텍스트/템플릿 자동 생성(이미지 업로드 방식만)
- 다중 표지/뒤표지

---

## 3. API·데이터 변경

### API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/covers` | 표지 이미지 업로드(`file`, `name`), `cover_id` 발급 |
| GET | `/api/covers` | 표지 목록 |
| GET | `/api/covers/{cover_id}/image` | 표지 이미지(PNG/JPEG) 반환 |
| DELETE | `/api/covers/{cover_id}` | 표지 삭제 |
| POST | `/api/extract-v2` | 요청에 `cover_id`(선택) 추가 — 첫 페이지 표지 삽입 |

### 데이터 모델·스키마

- 표지 메타: `{ cover_id(UUID), name, ext, created_at }` + 이미지 바이트(스토리지)
- `ExtractV2Request.cover_id: Optional[str] = None`

### 마이그레이션 메모

신규 표지 저장소. 기존 데이터 영향 없음. `cover_id` 미지정 시 표지 없이 생성(하위 호환).

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | JPEG/PNG 업로드 | 표지 저장, 목록·썸네일 노출 |
| 2 | 10MB 초과 / 비허용 타입 | 400 오류 |
| 3 | `cover_id` 지정 생성 | PDF 첫 페이지에 표지 삽입 |
| 4 | `cover_id` 미지정 생성 | 표지 없이 정상 생성 |
| 5 | 표지 삭제 | 목록에서 제거, 미존재 시 404 |

---

## 5. 미결 질문 (Open Questions)

- 없음 (구현 완료)
