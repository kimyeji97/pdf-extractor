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

#### P03-01. 전체 PDF 재read·재파싱 제거 + PDF bytes 재사용  *(신규 — 썸네일 6~10초 병목 핵심 / ✅ 프리워밍 적용 완료)*

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

**프로파일링 결과 (2026-07-22, STORAGE_BACKEND=s3/R2, 로컬→R2 실측)**

썸네일 엔드포인트 단계를 계량한 결과, **R2 전체 PDF 다운로드가 콜드 응답의 ~99%** 를 차지한다. PyMuPDF 파싱·렌더는 무시할 수준이다.

| 단계 | 시간 | 비중 |
|------|------|------|
| `storage.read_file` (R2 전체 PDF 다운로드) | **~2,000 ms** (8.25MB/206p 기준) | **~99%** |
| `get_page_info` (전체 문서 파싱) | ~14 ms | <1% |
| `get_page_thumbnail` (페이지 1장 렌더, dpi 96) | ~31 ms | ~1% |
| 캐시 히트(`get_thumbnail_cache`, R2에서 PNG read) | ~90 ms | — |

전체 job 실측(모두 동일 경향): R2 read 1.4~2.7초 / 파싱 ~10ms / 렌더 ~30ms.

| job | 크기 | R2 read | parse | render |
|-----|------|---------|-------|--------|
| 111abb47 | 8.25MB(206p) | 2,456ms | 9ms | 51ms |
| c719a97a | 7.47MB(180p) | 2,422ms | 14ms | 30ms |
| 4eb5a57a | 4.63MB(132p) | 2,709ms | 9ms | 28ms |
| 19bdc399 | 3.34MB(198p) | 1,995ms | 12ms | 23ms |
| 47533256 | 4.63MB(132p) | 1,381ms | 11ms | 31ms |

**결론**:
- 단일 썸네일 캐시 미스 ≈ **PDF 다운로드(~2초) + 렌더(~30ms)**. **DPI·파싱·adaptive는 병목이 아니다** → 지연 관점에서 P03-06·P03-07 우선순위 낮춤(리소스 관점 유지).
- **6~10초의 정체 = N회 전체 다운로드**: 분석 목록(카드 5개 × `list_pages` = 5회 × ~2초 ≈ 10초), 작업 페이지(`list_pages` + 캐시 미스 썸네일 각각 재다운로드). 각 요청이 독립적으로 8MB를 다시 받는 구조.
- **핵심 처방**: 렌더가 싸므로(30ms) **PDF 다운로드를 job당 1회로 줄이는 것**이 답 → 프리워밍(업로드 시 1회 다운로드 후 전 페이지 렌더·캐시) + page_info 캐시(P03-02) + 목록 카드 `getPages` 제거(P02-02). 이후 모든 UI 썸네일 요청은 ~90ms 캐시 히트.

**개선 방안 (단계적)**

1. **PDF bytes 재사용**: 한 요청 내에서 이미 읽은 `pdf_bytes`를 재읽지 않는다(→ P03-05가 문항 썸네일 단일 요청 내 중복 read를 다룸).
2. **페이지 메타 캐시**(P03-02)로 `list_pages`의 전체 PDF read를 제거.
3. **썸네일 프리워밍(pre-warming)**: 업로드/감지 직후 백그라운드로 페이지 썸네일을 미리 생성·캐시 → 첫 조회부터 캐시 히트.
4. (검토) **부분 스트리밍/바이트 레인지**: 스토리지가 지원하면 전체 다운로드 대신 필요한 범위만. R2 가능 여부 확인 필요.

**기대 효과**: 캐시 미스 경로 6~10초 → 1초 이하(프리워밍 적용 시 즉시). 목록·미리보기 로딩 근본 개선.

> **클라 연계**: REQ-P02-02(목록 카드 `getPages` 제거)와 **함께 적용해야** 목록 진입 시 전체 PDF 재다운로드 N회가 실제로 사라진다.

**적용 내용 (전 페이지 프리워밍, 2026-07-22)**

- 신설: `backend/app/services/prewarm_service.py::prewarm_all_thumbnails(job_id, pdf_bytes, boundaries, page_count)`. 이미 로드된 `pdf_bytes`로 **전 페이지 썸네일**(`get_page_thumbnail`, dpi 96) + **감지된 전체 문항 크롭 썸네일**(`get_question_thumbnail`)을 렌더링해 각각 `storage.save_thumbnail_cache` / `save_question_thumbnail_cache`로 캐시 저장. 개별 항목 실패는 로그만 남기고 계속 진행(프리워밍은 최적화일 뿐 실패해도 온디맨드 경로로 폴백).
- 호출 지점: `upload.py::_trigger_boundary_detection`(최초 업로드 감지), `browse.py::_run_refresh_detection`(재감지) 둘 다 boundaries 감지 완료 → **`boundaries_status=DONE` 저장 후** 이어서 실행. DONE을 먼저 저장해 프론트 폴링이 프리워밍을 기다리지 않고 즉시 결과를 받는다.
- **동시성 결정**: R2 PUT 1건이 실측 ~270ms라 순차 처리 시 job당(132p/573문항 기준 705장) **3~4분** 소요 — 프로파일링 당시 가정한 "렌더만 30ms×N≈6초"는 R2 업로드 왕복을 빠뜨린 과소 추정이었다. I/O bound 작업이므로 `ThreadPoolExecutor(max_workers=12)`로 병렬화(페이지 전체 제출 후 대기 → 문항 전체 제출 후 대기, 2단계).

**측정 결과 (2026-07-22, R2, job 47533256/132p/573문항, refresh 경로)**

| 단계 | 시간 |
|------|------|
| 문항 재감지 + DONE 저장 | ~16s |
| 프리워밍(705장, 12 workers) | ~12~20s |
| 프리워밍 후 개별 페이지 썸네일 GET | 0.2~0.45s (R2 캐시 히트 1건 GET) |

R2 `head_object`의 `LastModified`로 프리워밍이 실제 실행돼 신선한 캐시를 남겼음을 확인(요청 시각과 일치). 프리워밍 이전에는 캐시 미스 시 전체 PDF 재다운로드(~2초)가 썸네일마다 반복됐다.

---

#### P03-02. 페이지 메타데이터 캐시  *(구 P02-02 / ✅ 적용 완료)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py`(`list_pages`, `_get_or_build_page_info`), `backend/app/routers/upload.py`(감지 프리워밍), `backend/app/services/{local_storage_service,s3_service,storage}.py` |
| 분류 | Backend · I/O |

**현재 문제**

`list_pages()` 호출 시마다 전체 PDF를 읽어 `get_page_info()`로 페이지 수·크기를 추출한다. `boundaries` 캐시 패턴은 있으나 페이지 메타에는 미적용.

**적용 내용**

- storage 3함수 신설(local/s3/facade): `get_page_info_cache` · `save_page_info_cache` · `clear_page_info_cache`. 캐시 키 `page_info/{job_id}.json`, 내용 `[{page_num,width,height}, ...]`.
- `list_pages` → `_get_or_build_page_info(job_id)`: **캐시 우선, 미스 시에만** 전체 PDF read + 파싱 후 저장.
- **프리워밍**: 업로드 후 boundary 감지 백그라운드 태스크(`upload.py`)와 refresh 재감지(`browse.py`)에서 이미 로드한 `pdf_bytes`로 page_info를 저장 → 신규 업로드는 **첫 `list_pages`부터 캐시 히트**.
- page_info는 job당 PDF가 불변이라 무효화 불필요(같은 UUID=같은 파일). refresh 시엔 안전하게 재저장.

**측정 결과 (2026-07-22, R2)**

| 호출 | 시간 |
|------|------|
| 1회차(캐시 미스, PDF 다운로드+저장) | 2.75s |
| 2회차(캐시 히트) | 0.22s |
| 3회차(캐시 히트) | 0.17s |

→ **list_pages 2.75s → 0.17s (~16배).** 캐시 히트 잔여 ~170ms는 status·page_info 두 R2 JSON read(각 ~90ms). 신규 업로드는 프리워밍으로 첫 호출부터 캐시 히트.

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

#### P03-04. 백그라운드 작업 비동기 전환  *(구 P02-04 / ✅ 적용 완료)*

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

**적용 내용 (2026-07-22)**

- `extract.py`에 모듈 레벨 `_extract_pool = ProcessPoolExecutor(max_workers=2)` 신설(ECS 0.5 vCPU 고려해 워커 2개로 제한).
- `_process_extraction`: 다운로드(I/O)는 그대로 두고, CPU-bound인 `pdf_service.extract_questions(...)` 호출만 `_extract_pool.submit(...).result()`로 별도 프로세스에서 실행.
- `_process_extraction_v2`: `pdf_service.extract_questions_v2(...)` 전체(내부에서 다운로드·경계감지·그리드빌드·업로드까지 수행)를 프로세스 풀로 위임. `selections`(pydantic `SelectionItem` 리스트)는 pickle 가능함을 확인 후 그대로 전달.
- 두 함수 모두 `BackgroundTasks`가 이미 threadpool에서 실행하므로, 풀에 넘긴 뒤 `.result()`로 동기 대기해도 이벤트 루프는 막히지 않는다. 목적은 CPU 작업이 **메인 프로세스의 GIL**을 점유해 다른 요청 처리를 지연시키는 것을 막는 것(프로세스 분리로 GIL 자체를 분리).

**검증 (2026-07-22, R2, 실제 job)**

- 프로세스 풀 경유 vs 동일 프로세스 직접 호출 비교(132p/573문항 PDF, 문항 3개 추출): **12.76s vs 12.66s** — 풀 오버헤드(프로세스 생성) 체감 지연 거의 없음(대부분 시간은 `detect_question_boundaries` 자체 비용).
- 자식 프로세스에서 발생한 예외(`ValueError`)가 부모로 정상 전파되는지 확인(존재하지 않는 문항 번호 요청 → 동일한 에러 메시지로 catch).
- 실제 `POST /api/extract-v2` HTTP 호출로 종단 검증: 2문항 선택 → 7초 내 `DONE` + 유효한 1페이지 A4 PDF 생성 확인(테스트용 export job은 검증 후 R2에서 삭제).

---

#### P03-05. 문항 썸네일 중복 PDF 읽기 제거  *(구 P02-08 / ⏭️ 검토 결과 — 이미 해결됨, 조치 불필요)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/routers/browse.py`(`get_question_thumbnail_endpoint`) |
| 분류 | Backend · I/O |

**현재 문제 (스펙 작성 시 진단)**

캐시 미스 시 boundary 감지용으로 PDF를 읽고(약 795행), 이후 썸네일 생성용으로 **동일 PDF를 재읽기**한다.

**개선 방안**

첫 read의 `pdf_bytes`를 썸네일 생성에 재사용(P03-01의 "PDF bytes 재사용"과 동일 맥락).

**기대 효과**: 캐시 미스 시 응답 ~20% 단축

**재검토 결과 (2026-07-22)**: 실제 코드를 다시 확인한 결과 이미 재사용 로직이 들어가 있었다. `cached_boundaries is None`(경계 캐시 미스) 분기에서 읽은 `pdf_bytes`를 그대로 유지하고, 이후 `if pdf_bytes is None: pdf_bytes = storage.read_file(...)`로 캐시 히트 분기에서만 새로 읽는다. `git blame`으로 확인한 결과 이 엔드포인트가 **최초 작성된 커밋(`d4367ce`)부터 이미 이 형태**였다 — 중복 read는 존재하지 않는다. 스펙 작성 당시의 진단이 실제 코드와 맞지 않았던 것으로 보인다. **추가 조치 없이 완료 처리.**

---

#### P03-06. adaptive 감지 조건부 실행  *(구 P02-09 / ❌ 시도 후 기각 — 정확도 회귀)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/utils/question_parser.py` |
| 분류 | Backend · 알고리즘 |

**현재 문제**

문항 감지 시 regex 패턴 매칭 후 **항상** adaptive 감지도 실행한다. regex 커버리지가 충분해도 전체 페이지를 다시 스캔하는 낭비.

**개선 방안 (스펙 원안)**

regex 커버리지(예: 전체 페이지의 80% 이상 감지)가 충분하면 adaptive 스킵.

```python
regex_coverage = len(pages_with_questions) / len(pages_data)
if regex_coverage < 0.8:
    adaptive_raw = _run_adaptive_detection(pages_data)  # 보완 실행
```

**기대 효과**: 대형 PDF 감지 시간 ~30% 단축

**시도·기각 결과 (2026-07-22)**

실제로 구현해 실제 job(`19bdc399`, 198p/388문항)으로 검증한 결과, **정확도 회귀가 발견되어 되돌렸다**.

- `regex_coverage`는 **페이지 단위**(그 페이지에 정규식 매칭이 1개라도 있는지)만 본다. 한 페이지 안에서 일부 문항만 정규식에 걸리고 나머지는 못 걸린 경우도 "커버됨"으로 카운트되어, adaptive가 보완했어야 할 나머지 문항이 스킵으로 인해 누락된다.
- 실측: adaptive 강제 항상 실행 → **393문항** 감지 / 0.8 임계값으로 조건부 스킵 → **378문항** 감지. **15문항 누락.**
- P03-01 프로파일링에서 이미 adaptive 자체가 병목이 아님(파싱 전체 ~14ms 수준)을 확인했으므로, 이 정도 정확도 손실을 감수할 성능상 이득이 없다. 문항 감지는 이 프로젝트의 핵심 비즈니스 로직이라 손실 위험이 더 크다.
- **결론: 구현하지 않고 원복.** 코드 변경 없음(`question_parser.py`는 기존 그대로 유지).
- 향후 이 방향을 다시 시도한다면 페이지 단위가 아니라 **문항(번호) 단위 커버리지**(예: 감지된 번호들의 최대-최소 범위 대비 실제 연속성 갭)로 판단 기준을 바꿔야 한다.

---

#### P03-07. 문항 썸네일 기본 DPI 최적화  *(구 P02-14 / ✅ 적용 완료)*

| 항목 | 내용 |
|------|------|
| 파일 | `backend/app/services/thumbnail_service.py`(`get_question_thumbnail` dpi=144) |
| 분류 | Backend · 리소스 |

**현재 문제**

문항 썸네일 기본 DPI가 144로 UI 미리보기 용도에는 과도하며, 페이지 썸네일(96 DPI)과 불일치.

**개선 방안**

기본값을 96으로 낮추고, 고품질 필요 시에만 `dpi=144` 파라미터로 요청.

**기대 효과**: 썸네일 생성 속도 향상, 메모리 절약

**적용 내용 (2026-07-22)**: `get_question_thumbnail`의 기본 `dpi`를 144→96으로 변경. 호출부(`browse.py`의 자동/수동 문항 썸네일 엔드포인트, `prewarm_service.py`) 전부 dpi 인자를 명시하지 않고 기본값에 의존하므로 자동 반영된다. 최종 추출 PDF는 이 함수와 무관하게(`pdf_service.py`가 원본 PDF에서 직접 벡터 크롭) 별도 경로라 품질에 영향 없음 — 순수 UI 미리보기 해상도만 낮아짐. 클라에서 별도로 고품질(144) 요청하는 기능은 없어 파라미터 확장 없이 기본값만 변경.

---

### LOW — 코드 품질·방어적 개선

#### P03-08. 무거운 엔드포인트 타임아웃  *(구 P02-12 / ✅ 적용 완료)*

| 항목 | 내용 |
|------|------|
| 파일 | 전체 라우터 (`browse.py`, `extract.py` 등) |
| 분류 | Backend · 안정성 |

**현재 문제**

PDF 처리 엔드포인트에 타임아웃이 없다. 비정상적으로 큰 PDF 요청 시 워커가 무한 대기할 수 있다.

**개선 방안**

PDF 처리 엔드포인트에 30초 타임아웃(`asyncio.wait_for()` 또는 미들웨어).

**기대 효과**: 리소스 고갈 방지

**적용 내용 (2026-07-22)**

엔드포인트 개별 수정(sync→async 전환 + `run_in_executor` 등) 대신 **미들웨어 방식**을 선택 — 라우터 전체를 건드리지 않고 한 곳에서 일괄 적용 가능하고, 위험도가 낮다(엔드포인트 실행 모델 변경 없음).

- `backend/app/main.py`에 `TimeoutMiddleware`(`BaseHTTPMiddleware`) 신설. `asyncio.wait_for(call_next(request), timeout=30)`으로 감싸고, 타임아웃 시 504 + 한국어 메시지 JSON 반환.
- **등록 순서 주의**: `add_middleware`는 나중에 등록한 것이 바깥쪽(outermost)이 된다. `TimeoutMiddleware`를 `CORSMiddleware`보다 먼저 등록해 CORS가 바깥을 감싸도록 했다 — 그래야 타임아웃으로 반환되는 504 응답에도 CORS 헤더가 정상적으로 붙어 프론트에서 (CORS 에러가 아니라) 실제 504로 인식된다.
- 한계: `asyncio.wait_for`가 취소하는 것은 **클라이언트가 기다리는 것**이지, sync 엔드포인트가 threadpool에서 실행 중인 실제 작업 자체가 아니다(Python 스레드는 강제 종료 불가). 즉 오래 걸리는 백그라운드 스레드 작업은 응답 반환 후에도 계속 실행되다가 자연 종료된다 — 완전한 리소스 회수는 아니지만, **클라이언트 무한 대기는 확실히 방지**된다.

**검증 (2026-07-22)**: 격리된 테스트 앱(짧은 타임아웃 0.3s + 1초 슬립 엔드포인트)으로 504 발생 확인, 정상 요청은 영향 없음 확인. 실제 앱에서 `/health`, CORS 프리플라이트 헤더, `/api/jobs`(정상 2초대 응답) 모두 기존과 동일하게 동작함을 확인.

---

## 4. 추천 실행 순서

| 단계 | 항목 | 비고 |
|------|------|------|
| ✅ **프로파일링** | P03-01 원인 확정 → **R2 다운로드가 ~99%**(렌더·파싱 무시 수준) | 완료(§P03-01) |
| ✅ **High impact** | P03-02(페이지 메타 캐시), P03-01(프리워밍 — job당 PDF 다운로드 1회화) | 완료·병목 직격 |
| ✅ **Quick win** | P03-05(단일 요청 중복 read 제거) | 재검토 결과 이미 해결돼 있어 조치 불필요 |
| ✅ **동시성** | P03-04(추출 작업 ProcessPoolExecutor 분리) | 완료(§P03-04) |
| **Scalability** | P03-03(페이지네이션) | 구조 변경 — 미착수, API 응답 형태 변경 필요 |
| ✅ **Scalability** | P03-08(타임아웃 미들웨어) | 완료 |
| ✅ **낮음(지연 무관)** | P03-07(DPI 96 적용) | 완료 |
| ❌ **기각** | P03-06(adaptive 조건부) | 실제 검증 결과 문항 15개 누락 회귀 발견 → 미적용, 원복 |

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

- ~~P03-01: 6~10초 병목이 스토리지 왕복 vs 전체 파싱 중 비중~~ → **프로파일링 완료: R2 전체 PDF 다운로드가 ~99%(~2초/8MB)**. 렌더 ~30ms·파싱 ~14ms로 무시 수준. 6~10초는 N회 전체 다운로드(카드/썸네일별) 누적.
- P03-01: R2가 바이트 레인지/부분 다운로드를 지원하는지 → 전체 재다운로드 회피 가능 여부 (프리워밍으로 대부분 해소되므로 후순위)
- ~~P03-01: 썸네일 프리워밍을 어느 시점에 어느 범위로 할지~~ → **결정·적용 완료: 업로드/재감지 직후(boundaries DONE 저장 후), 전 페이지 + 전체 감지 문항 범위로 프리워밍**. R2 PUT 건당 ~270ms라 순차 시 job당 3~4분 소요돼 `ThreadPoolExecutor(12)`로 병렬화.
- P03-03: 프론트 UI를 무한 스크롤 vs 페이지 번호 중 선택(P02 연계)
- ~~P03-04: ECS 0.5 vCPU에서 ProcessPoolExecutor 실효성~~ → **적용 완료(max_workers=2)**. 실측상 풀 경유 오버헤드는 미미(12.76s vs 직접호출 12.66s). vCPU 총량은 그대로지만 CPU 작업이 별도 프로세스로 빠져 메인 프로세스 GIL이 다른 요청 처리에 즉시 사용 가능해지는 효과는 유지.
- 목표 SLA: "모든 통신 1초 이하" 대비 현실적 SLA 합의(콜드 스타트·대형 PDF 예외 허용치)
