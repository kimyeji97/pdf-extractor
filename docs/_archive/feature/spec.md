# PDF 문항 추출기 — 기능 명세 (Spec v2)

> **버전**: v2.0 | **작성일**: 2026-04-15  
> **방법론**: SDD (Spec-Driven Development)  
> **관련 문서**: [SSD.md](../../SSD.md)

---

## 목차

1. [개요](#1-개요)
2. [요구사항](#2-요구사항)
3. [기능 경계 및 plan 문서 매핑](#3-기능-경계-및-plan-문서-매핑)
4. [비기능 요구사항](#4-비기능-요구사항)
5. [신규 API 목록 (개요)](#5-신규-api-목록-개요)
6. [UI 플로우 변화 (v1 → v2)](#6-ui-플로우-변화-v1--v2)
7. [용어 정의](#7-용어-정의)

---

## 1. 개요

현재 구현된 PDF 문항 추출기(v1)는 파일 업로드 후 문항 번호를 텍스트로 직접 입력하는 방식이다.
v2에서는 **시각적 브라우징 UX**를 도입한다. 사용자가 업로드된 파일 목록 → 페이지 → 문항 순으로 탐색하며 문항을 직접 눈으로 확인하고 선택할 수 있게 한다.

---

## 2. 요구사항

### REQ-01 파일 목록 조회

스토리지에 업로드된 파일 목록을 UI에서 조회할 수 있다.

- 각 항목에는 파일명, 업로드 시각, 상태(PENDING / DONE 등)가 표시된다.
- 목록에서 파일 1개를 선택할 수 있다.

### REQ-02 페이지 목록 브라우징

파일을 선택하면 해당 PDF의 **페이지 목록이 썸네일로 나열**된다.

- 각 페이지는 미리보기 이미지(썸네일)로 표시된다.
- 페이지를 1개 클릭하면 해당 페이지가 선택된다.

### REQ-03 문항 목록 조회 및 선택

페이지를 선택하면 해당 페이지에서 **감지된 문항 목록이 미리보기로 나열**된다.

- 각 문항은 해당 영역을 크롭한 이미지로 표시된다.
- 문항은 **멀티 선택(체크박스)** 가능하다.

### REQ-04 선택 바스켓

선택된 문항들은 화면 하단 **선택 바스켓(고정 패널)**에 별도 표기된다.

- 선택 항목마다 파일명 · 페이지 번호 · 문항 번호가 표시된다.
- 개별 항목을 바스켓에서 제거할 수 있다.

### REQ-05 교차 파일·페이지 문항 누적 선택

REQ-02, REQ-03의 파일/페이지 선택을 바꿔가며 문항을 추가 선택할 수 있다.

- 이미 바스켓에 담긴 문항은 유지된 채 새 문항이 추가된다.
- 같은 문항을 중복 추가할 수 없다.

### REQ-06 선택 문항 PDF 다운로드

바스켓에 담긴 문항들만 모아 **새 PDF를 생성하고 다운로드**할 수 있다.

- 문항 순서는 바스켓 내 표기 순서를 따른다.
- 기존 `/api/extract` 방식(번호 텍스트 입력)과 **별개**로 동작한다.

### REQ-07 문항 추출 현황 비동기 조회

업로드 직후 백그라운드에서 문항 경계 감지가 자동 시작되며, 파일 목록에서 진행 상태를 확인할 수 있다.

- 조회 시점: 사용자가 명시적으로 새로고침할 때 (`GET /api/jobs` 재호출)
- 파일별로 감지 상태(대기 / 진행 중 / 완료 / 실패) 및 총 감지 문항 수가 표시된다.

### REQ-08 업로드 파일 / 생성 파일 분리 표시

파일 목록에서 사용자가 업로드한 원본 파일과 추출로 생성된 결과 파일이 별도 섹션으로 분리된다.

- 원본 파일 섹션: 업로드된 PDF 목록
- 생성 파일 섹션: `extract-v2`로 만들어진 결과 PDF 목록

### REQ-09 페이지별 문항 수 표시

페이지 목록 브라우징 화면에서 각 페이지마다 감지된 문항 수를 표시한다.

- 감지 완료 페이지: 문항 수 숫자 표시
- 감지 미완료 페이지: `—` 표시

---

## 3. 기능 경계 및 plan 문서 매핑

| 요구사항 | 신규 백엔드 API | 신규 프론트엔드 컴포넌트 | plan 문서 |
|----------|----------------|--------------------------|-----------|
| REQ-01 파일 목록 | `GET /api/jobs` | `FileListPanel` | [plan-file-list.md](file-browser/plan-file-list.md) |
| REQ-02 페이지 브라우징 | `GET /api/jobs/{id}/pages`<br>`GET /api/jobs/{id}/pages/{n}/thumbnail` | `PageBrowser` | [plan-page-preview.md](file-browser/plan-page-preview.md) |
| REQ-03~05 문항 선택 | `GET /api/jobs/{id}/pages/{n}/questions`<br>`GET /api/jobs/{id}/pages/{n}/questions/{q}/thumbnail` | `QuestionPicker`<br>`SelectionBasket` | [plan-question-select.md](question-selector/plan-question-select.md) |
| REQ-06 PDF 내보내기 | `POST /api/extract-v2` | `ExportButton` | [plan-pdf-export.md](export/plan-pdf-export.md) |
| REQ-07~09 추출 현황 추적 | `GET /api/jobs` (응답 확장)<br>`GET /api/jobs/{id}/pages` (응답 확장) | `FileListPanel` (개선)<br>`PageBrowser` (개선) | [plan-extraction-tracking.md](file-browser/plan-extraction-tracking.md) |

---

## 4. 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 썸네일 생성 지연 | 첫 요청 시 최대 3초 이내 |
| 썸네일 캐시 | 동일 `job_id` + 페이지 반복 요청 시 재생성 없이 캐시 반환 |
| 선택 상태 유지 | 브라우저 새로고침 없이 파일/페이지 전환 시 바스켓 유지 (React state) |
| 파일 목록 정렬 | 업로드 최신순 기본 정렬 |
| 미지원 파일 처리 | 문항 감지 0건인 페이지는 "감지된 문항 없음" 표시 |

---

## 5. 신규 API 목록 (개요)

| Method | Path | 설명 |
|--------|------|------|
| `GET`  | `/api/jobs` | 업로드된 파일(job) 목록 조회 |
| `GET`  | `/api/jobs/{job_id}/pages` | 페이지 수 및 썸네일 URL 목록 |
| `GET`  | `/api/jobs/{job_id}/pages/{page_num}/thumbnail` | 페이지 썸네일 이미지 반환 (PNG) |
| `GET`  | `/api/jobs/{job_id}/pages/{page_num}/questions` | 페이지 내 감지된 문항 목록 + 좌표 |
| `GET`  | `/api/jobs/{job_id}/pages/{page_num}/questions/{q_num}/thumbnail` | 문항 크롭 이미지 반환 (PNG) |
| `POST` | `/api/extract-v2` | 선택된 문항 목록으로 PDF 생성 (비동기) |

> 상세 스키마는 각 plan 문서 참고

---

## 6. UI 플로우 변화 (v1 → v2)

```
[v1]
  idle → uploading → ready(번호 입력) → processing → done

[v2]
  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐
  │  파일 목록   │───▶│  페이지 브라우징│───▶│  문항 선택     │
  │ FileList    │    │  PageBrowser  │    │  QuestionPicker│
  └─────────────┘    └──────────────┘    └───────┬────────┘
         ▲                  ▲                    │ 선택 추가
         │    (파일/페이지   │                    ▼
         └────재선택 가능)───┘           ┌────────────────┐
                                        │ 선택 바스켓     │
                                        │ SelectionBasket│
                                        └───────┬────────┘
                                                │ 다운로드
                                                ▼
                                        ┌────────────────┐
                                        │  PDF 내보내기   │
                                        │  ExportButton  │
                                        └────────────────┘
```

---

## 7. 용어 정의

| 용어 | 설명 |
|------|------|
| `job_id` | 업로드된 PDF 1건의 식별자 (UUID) |
| `page_num` | 0-based 페이지 인덱스 |
| `question_id` | `{job_id}:{page_num}:{question_number}` 형태의 복합 식별자 |
| 선택 바스켓 | 사용자가 선택한 문항 목록을 담아두는 UI 패널 |
| 썸네일 | PyMuPDF로 생성한 페이지/문항 미리보기 PNG 이미지 |
| REQ-XX | 이 spec의 요구사항 번호. plan 문서에서 추적 기준으로 사용 |
