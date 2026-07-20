# REQ-B09 다운로드 PDF에서 문항 라벨 `...` 축약 방지

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-07-16 |
| 작성자 | kimyeji97 |
| 상태 | done |
| 관련 | REQ-C07 라벨 포맷 변경, REQ-06 PDF 추출 |

---

## 1. 배경·목표

**배경**

생성된 PDF를 다운로드하면 문항 라벨이 `...`로 축약된다. 축약하지 않고 전체 라벨을 표기해야 한다.

**목표**

- 다운로드 PDF에서 문항 라벨이 축약 없이 전체 표기된다.

---

## 2. Scope

**In-scope**

- PDF 생성 시 라벨 축약(truncate) 로직 수정 (`pdf_service`)

**Out-of-scope (non-goal)**

- 라벨 포맷 자체 변경은 REQ-C07에서 다룸

---

## 3. 원인 (실제)

사용자가 본 "…로 축약"은 텍스트 잘림이 아니라 **한글 글리프가 렌더되지 않아 점(·)으로 표시**된 것이었다. (예: `테스트03` → `···03`, `문항 7` → `·· 7`)

근본 원인: `_get_korean_font`가 `dst.add_font("KOR", fontbuffer=...)`를 호출하는데, **설치된 PyMuPDF 1.25.5에는 `Document.add_font` 메서드가 없다**(AttributeError). 이 예외가 `except`에 잡혀 **"helv"(Helvetica)로 폴백**되고, insert_text가 helv로 한글을 그리면서 글리프가 없어 점으로 렌더됐다.

> 부수적으로, `insert_text` 고정 `fontsize=14`는 셀 폭 초과 시 오버플로 문제도 있었다(축약 로직 자체는 없음). REQ-C07으로 라벨이 길어지면 심화되므로 함께 처리한다.

## 4. 수정 내용

### 백엔드 — `services/pdf_service.py`

**(1) 한글 렌더 방식 교체 — 점(·) 현상 해결 (핵심)**

`insert_text` + `add_font` 조합 대신 **`TextWriter` + `fitz.Font("korea")`** 로 라벨을 그린다. TextWriter는 유니코드 한글을 정상 렌더하고 write_text 시 폰트(Droid Sans Fallback)를 PDF에 임베드한다.

- `_get_korean_font` → `_get_label_font`: 등록 없이 `fitz.Font("korea")` 객체만 반환(폴백 helv).
- 라벨 렌더: `TextWriter.append(pos, text, font=label_font, fontsize=fs)` → `write_text(page, color=...)`.

**(2) 폰트 자동 축소 — 셀 폭 초과 방지 (C07 대비)**

`label_font.text_length(label, 14)`로 폭을 재고 셀 폭(`cell_w - 2*pad`) 초과 시 `fontsize = max(6.0, 14 * max_w / text_w)`로 축소. 문항 이름이 추가되어 길어진 라벨도 셀 안에 전체 표기.

---

## 5. 테스트 시나리오

| # | 시나리오 | 기대 결과 | 검증 |
|---|----------|-----------|------|
| 1 | 한글 라벨 PDF 생성 | 한글이 점(·) 아닌 **정상 글자**로 렌더 | ✅ 생성 PDF 렌더 이미지에서 `1번. 테스트03. p4. 삼각함수 극한 킬러문항` 정상 표시 확인 |
| 2 | 긴 라벨 문항 | 축약 없이 전체 표기 | ✅ 텍스트 추출 = 전체 한글 문자열, 폭 초과 시 폰트 자동 축소 |
| 3 | 여러 단 레이아웃 (2/4/6단) | 각 셀에서 라벨 정상 표기 | 폭 기준 자동 축소이므로 레이아웃 무관 |

---

## 6. 미결 질문 (Open Questions)

- ~~`...` 축약 발생 위치~~ → truncate 아님. **`Document.add_font` 부재(PyMuPDF 1.25.5) → helv 폴백 → 한글 미렌더(점 표시)** 가 실제 원인. TextWriter로 해결.
- ~~라벨 처리 정책: 줄바꿈 / 폰트 축소 / 셀 확대~~ → **폰트 자동 축소** 채택(라벨 높이 20pt 고정이라 줄바꿈 부적합, 셀 확대는 레이아웃 영향 큼).
- ~~REQ-C07과 동시 진행~~ → 함께 구현·검증 완료.
