# REQ-25 배경색 기반 문항 오탐지 필터

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-05-26 |
| 작성자 | kimyeji97 |
| 상태 | confirmed |

---

## 1. 배경·목표

**배경**

컬러 배경 영역(지문/설명 박스, 단원 소개 페이지 등)이 문항으로 오탐지되는 사례가 있다. 페이지 단위 전처리로 거르면 정상 문항도 누락될 수 있다.

> 방식 결정: [ADR 0003](../adr/0003-bg-color-false-positive-postfilter.md) — 문항 단위 후처리(bbox 픽셀 분석) 채택.

**목표 / 달성 기준**

- 경계 감지 후 각 bbox의 흰색 픽셀 비율을 검사해 비백색 배경 문항을 `is_false_positive=True`로 마킹한다.
- 마킹만 하고 삭제하지 않는다(기존 오탐지 흐름 재사용).

---

## 2. Scope

**In-scope**

- `question_parser.py` `_is_white_background()`, `_apply_bg_color_filter()`, 상수 `_BG_WHITE_MIN_RGB/_BG_WHITE_THRESHOLD`
- `detect_question_boundaries()` Step 5-c 호출
- 프론트 오탐지 설명 메시지 일반화(`QuestionAnalysisPanel.jsx`)

**Out-of-scope (non-goal)**

- 전체 페이지 크기 오탐지 (REQ-15)
- `false_positive_reason` 사유 구분 필드(추후 확장 여지)

---

## 3. API·데이터 변경

### API

문항 응답 `is_false_positive`가 배경색 사유로도 `True`가 될 수 있음(계약 변경 없음).

### 데이터 모델·스키마

`QuestionBoundary.is_false_positive` 재사용. 캐시 포맷 변경 없음.

### 마이그레이션 메모

`boundaries/{job_id}.json` 하위 호환. 재감지 시 반영.

---

## 4. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 흰 배경 문항 | `is_false_positive=False` 유지 |
| 2 | 컬러 배경(지문/설명 박스) | `is_false_positive=True` 마킹 |
| 3 | 빈 bbox(width/height 0) | True 반환(통과, 마킹 안 함) |
| 4 | 100문항 이상 PDF | 추가 처리 시간 측정(<1초 목표) |

---

## 5. 미결 질문 (Open Questions)

- [ ] 컬러 문제집 3종 이상으로 `_BG_WHITE_THRESHOLD`(기본 0.60) 튜닝 후 근거 주석화
