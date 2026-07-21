# REQ-P03 서버(Backend) 성능 개선 — 썸네일 응답 시간 단축 포함

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-07-16 (2026-07-22 서버 성능 통합으로 확장) |
| 작성자 | kimyeji97 |
| 상태 | open |
| 관련 | REQ-P02 클라(Frontend) 성능 개선, REQ-P01 벌크 문항 API |

---

## 1. 배경·목표

**배경**

thumbnail request 응답 시간이 평균 6~10초로 지나치게 느리다. 원인 분석 결과 병목이 **스토리지 왕복(전체 PDF 재다운로드) + 전체 문서 파싱**에 있으며, 이는 썸네일뿐 아니라 페이지 목록·문항 감지 등 백엔드 I/O 전반의 공통 문제다.

> **재구성 이력 (2026-07-22)**: 본 스펙은 원래 "썸네일 응답 시간"만 다뤘으나, **P02=클라 / P03=서버** 분리에 따라 **서버(Backend) 성능 개선의 통합 스펙**으로 확장한다. 구 P02의 백엔드 항목 7개(구 P02-02·03·04·08·09·12·14)를 이관하고, 썸네일 병목 신규 분석을 P03-01로 둔다.

**목표**

- 썸네일 요청 응답 시간을 1초 이하로 단축한다.
- 백엔드 API 응답 속도 개선 (캐싱, 중복 I/O 제거, 페이지네이션).
- 확장성 기반 마련 (비동기 처리, 타임아웃).

---

## 2. Scope

**In-scope**

- 썸네일·페이지 목록 응답 지연 원인 제거 (전체 PDF 재read, 전체 파싱)
- 백엔드 캐시·페이지네이션·비동기·타임아웃

**Out-of-scope (non-goal)**

- REQ-P02의 프론트엔드 항목(뷰어 가상화, 리스트 메모, 번들 등)

---

## 3. 개선 항목

### 우선순위 기준

- **HIGH**: 사용자 체감 효과가 크거나 데이터 누적 시 장애 가능성
- **MEDIUM**: 명확한 개선 효과가 있으나 현재 규모에서는 허용 가능
- **LOW**: 코드 품질·방어적 개선

---

### HIGH — 체감 효과 큰 개선

#### P03-01. 전체 PDF 재read·재파싱 제거 + PDF bytes 재사용  *(신규 — 썸네일 6~10초 병목 핵심)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py`(`list_pages`, `get_thumbnail`, `get_question_thumbnail_endpoint`), `backend/app/services/thumbnail_service.py` |
| 분류 | Backend · I/O |

**현재 문제 (원인 규명 완료)**

썸네일/페이지 관련 엔드포인트가 캐시 미스 시마다 **전체 PDF를 스토리지에서 통째로 다운로드**하고 PyMuPDF로 **문서 전체를 파싱**한다. 1페이지만 필요해도 마찬가지다.

```python
# get_thumbnail — 캐시 미스 시
pdf_bytes = storage.read_file(storage.original_key(job_id))   # 전체 PDF 다운로드 (R2 왕복)
png = thumbnail_service.get_page_thumbnail(pdf_bytes, page_num, dpi)  # fitz.open(전체 파싱)

# list_pages — 캐시 자체가 없음 → 매 호출마다 전체 PDF read + get_page_info(전체 파싱)
pdf_bytes = storage.read_file(storage.original_key(job_id))
page_infos = thumbnail_service.get_page_info(pdf_bytes)
```

프로덕션 R2 환경에서 대형 PDF(수십 MB, 200+ 페이지)를 **썸네일 1장당 1회씩 재다운로드** → 6~10초 병목. 캐시 히트 시엔 PNG만 읽어 빠르므로, 문제는 **콜드/캐시 미스 경로**와 **PDF bytes 미재사용**이다.

**개선 방안 (단계적)**

1. **PDF bytes 재사용**: 한 요청 내에서 이미 읽은 `pdf_bytes`를 재읽지 않는다(→ P03-05가 문항 썸네일 단일 요청 내 중복 read를 다룸).
2. **페이지 메타 캐시**(P03-02)로 `list_pages`의 전체 PDF read를 제거.
3. **썸네일 프리워밍(pre-warming)**: 업로드/감지 직후 백그라운드로 페이지 썸네일을 미리 생성·캐시 → 첫 조회부터 캐시 히트.
4. (검토) **부분 스트리밍/바이트 레인지**: 스토리지가 지원하면 전체 다운로드 대신 필요한 범위만. R2 가능 여부 확인 필요.

**기대 효과**: 캐시 미스 경로 6~10초 → 1초 이하(프리워밍 적용 시 즉시). 목록·미리보기 로딩 근본 개선.

> **클라 연계**: REQ-P02-02(목록 카드 `getPages` 제거)와 **함께 적용해야** 목록 진입 시 전체 PDF 재다운로드 N회가 실제로 사라진다.

---

#### P03-02. 페이지 메타데이터 캐시  *(구 P02-02)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py`(`list_pages`), `backend/app/services/thumbnail_service.py`(`get_page_info`) |
| 분류 | Backend · I/O |

**현재 문제**

`list_pages()` 호출 시마다 전체 PDF를 읽어 `get_page_info()`로 페이지 수·크기를 추출한다. `boundaries` 캐시 패턴은 있으나 페이지 메타에는 미적용.

**개선 방안**

최초 업로드/감지 시 `page_info/{job_id}.json` 캐시 저장. 이후 `list_pages()`는 캐시만 읽는다.

```
저장 시점: 업로드 완료 후 boundary 감지 직후
캐시 키:   page_info/{job_id}.json
내용:      [{ page_num, width, height }, ...]
무효화:    refresh(재감지) 시 함께 갱신
```

**기대 효과**: 페이지 목록 API ~40% 단축, PDF 재읽기 제거. P03-01의 핵심 수단.

---

#### P03-03. 목록 API 페이지네이션  *(구 P02-03)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py`(`list_jobs`), `backend/app/routers/workbook.py` |
| 분류 | Backend · API 설계 |

**현재 문제**

`GET /api/jobs`, `GET /api/workbooks` 모두 전체 목록을 한 번에 반환한다. 누적 시 응답 크기·메모리가 선형 증가.

**개선 방안**

`skip`/`limit` 쿼리 파라미터 추가(기본 skip=0, limit=20).

```
GET /api/jobs?skip=0&limit=20&type=source
응답: { "items": [...], "total": 150, "skip": 0, "limit": 20 }
```

프론트도 무한 스크롤 or 페이지네이션 UI 대응 필요(→ P02 연계).

**기대 효과**: 1,000+ 건 누적 시 메모리 80% 감소, 응답 속도 일정 유지

---

### MEDIUM — 명확한 개선 효과

#### P03-04. 백그라운드 작업 비동기 전환  *(구 P02-04)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/extract.py`(`_process_extraction`, `_process_extraction_v2`) |
| 분류 | Backend · 동시성 |

**현재 문제**

추출 작업이 동기 함수로 실행된다. `tempfile`, `write_bytes`, `storage.upload_file`, `pdf_service.extract_questions` 등 블로킹 I/O + CPU-bound이며, `BackgroundTasks`는 threadpool 실행이라 동시 요청 증가 시 스레드 고갈 위험.

**개선 방안 (단계적)**

1. CPU-bound 작업을 `concurrent.futures.ProcessPoolExecutor`로 분리
2. (장기) 작업 큐(Celery/RQ)로 워커 분리

현재 ECS Fargate 0.5 vCPU 환경에서는 1단계만으로 충분할 수 있음.

**기대 효과**: 동시 추출 처리 능력 향상, 이벤트 루프 블로킹 방지

---

#### P03-05. 문항 썸네일 중복 PDF 읽기 제거  *(구 P02-08)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py`(`get_question_thumbnail_endpoint`) |
| 분류 | Backend · I/O |

**현재 문제**

캐시 미스 시 boundary 감지용으로 PDF를 읽고(약 795행), 이후 썸네일 생성용으로 **동일 PDF를 재읽기**한다.

**개선 방안**

첫 read의 `pdf_bytes`를 썸네일 생성에 재사용(P03-01의 "PDF bytes 재사용"과 동일 맥락).

**기대 효과**: 캐시 미스 시 응답 ~20% 단축

---

#### P03-06. adaptive 감지 조건부 실행  *(구 P02-09)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/utils/question_parser.py` |
| 분류 | Backend · 알고리즘 |

**현재 문제**

문항 감지 시 regex 패턴 매칭 후 **항상** adaptive 감지도 실행한다. regex 커버리지가 충분해도 전체 페이지를 다시 스캔하는 낭비.

**개선 방안**

regex 커버리지(예: 전체 페이지의 80% 이상 감지)가 충분하면 adaptive 스킵.

```python
regex_coverage = len(pages_with_questions) / len(pages_data)
if regex_coverage < 0.8:
    adaptive_raw = _run_adaptive_detection(pages_data)  # 보완 실행
```

**기대 효과**: 대형 PDF 감지 시간 ~30% 단축

---

#### P03-07. 문항 썸네일 기본 DPI 최적화  *(구 P02-14)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/services/thumbnail_service.py`(`get_question_thumbnail` dpi=144) |
| 분류 | Backend · 리소스 |

**현재 문제**

문항 썸네일 기본 DPI가 144로 UI 미리보기 용도에는 과도하며, 페이지 썸네일(96 DPI)과 불일치.

**개선 방안**

기본값을 96으로 낮추고, 고품질 필요 시에만 `dpi=144` 파라미터로 요청.

**기대 효과**: 썸네일 생성 속도 향상, 메모리 절약

---

### LOW — 코드 품질·방어적 개선

#### P03-08. 무거운 엔드포인트 타임아웃  *(구 P02-12)*

| 항목 | 내용 |
|------|------|
| 파일 | 전체 라우터 (`browse.py`, `extract.py` 등) |
| 분류 | Backend · 안정성 |

**현재 문제**

PDF 처리 엔드포인트에 타임아웃이 없다. 비정상적으로 큰 PDF 요청 시 워커가 무한 대기할 수 있다.

**개선 방안**

PDF 처리 엔드포인트에 30초 타임아웃(`asyncio.wait_for()` 또는 미들웨어).

**기대 효과**: 리소스 고갈 방지

---

## 4. 추천 실행 순서

| 단계 | 항목 | 비고 |
|------|------|------|
| **프로파일링** | P03-01 원인 확정(스토리지 왕복 vs 파싱 비중 실측) | 대책 전 계량 |
| **Quick win** | P03-05(중복 read 제거), P03-07(DPI), P03-02(페이지 메타 캐시) | 간단·즉효 |
| **High impact** | P03-01(재read 제거 + 프리워밍), P03-03(페이지네이션) | 체감 효과 최대 |
| **Scalability** | P03-04(비동기), P03-06(adaptive 조건부), P03-08(타임아웃) | 구조 변경 수반 |

---

## 5. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 페이지 썸네일 요청(캐시 미스) | 응답 1초 이하 |
| 2 | 문항 크롭 썸네일 요청(캐시 미스) | 응답 1초 이하 |
| 3 | 캐시 히트 시 | 즉시 응답 |
| 4 | 목록 진입(카드 N개) | 전체 PDF 재다운로드 0회(P02-02 연계) |
| 5 | `list_pages` 반복 호출 | 2회차부터 page_info 캐시 히트 |

---

## 6. 미결 질문 (Open Questions)

- P03-01: 6~10초 병목이 스토리지 왕복(전체 PDF 재다운로드) vs 전체 파싱 중 비중 — 프로파일링으로 계량 후 우선순위 확정
- P03-01: R2가 바이트 레인지/부분 다운로드를 지원하는지 → 전체 재다운로드 회피 가능 여부
- P03-01: 썸네일 프리워밍을 어느 시점(업로드 직후 vs 최초 조회 시 lazy)에 어느 범위(전 페이지 vs 첫 N페이지)로 할지
- P03-03: 프론트 UI를 무한 스크롤 vs 페이지 번호 중 선택(P02 연계)
- P03-04: ECS 0.5 vCPU에서 ProcessPoolExecutor 실효성 — vCPU 부족 시 I/O 분리만 적용
- 목표 SLA: "모든 통신 1초 이하" 대비 현실적 SLA 합의(콜드 스타트·대형 PDF 예외 허용치)
