# 0003. 배경색 오탐지 필터를 문항 후처리 방식으로 채택

## Status

<!-- proposed · accepted · deprecated · superseded -->
accepted

---

## Context and Problem Statement

컬러 배경 영역(지문/설명 박스, 단원 소개 페이지 등)이 문항으로 오탐지되는 사례가 있었다. 배경색을 근거로 오탐지를 걸러내되, 정상 문항까지 잘못 제거하지 않아야 한다.

필터를 **언제 적용할지**(추출 전 페이지 단위 vs 추출 후 문항 단위) 결정이 필요했다. (원 계획서: `docs/_archive/feature/2026-05-26/plan.md` §2 "방식 선택")

---

## Decision Drivers

- 컬러 박스 오탐지는 줄이되 정상 문항 누락은 피해야 함
- 페이지 일부만 색지인 경우에도 정상 문항을 보존해야 함
- 기존 오탐지 흐름(`is_false_positive` 필드·UI)과 자연스러운 통합
- 캐시 포맷 하위 호환 및 허용 가능한 성능

---

## Considered Options

- Option A: 문항 후처리(bbox 픽셀 분석) — 경계 감지 후 각 bbox의 흰색 비율 검사
- Option B: 페이지 전처리(페이지 흰색 임계값) — 색지 페이지를 추출 단계에서 제외

---

## Decision Outcome

**Chosen option:** Option A — 문항 단위 후처리(bbox 픽셀 분석)

**Rationale:**

- 문항 단위로 정밀하게 판정하므로, 페이지 일부만 색지인 경우에도 정상 문항을 보존한다.
- 이미 존재하는 `is_false_positive` 필드에 마킹만 추가하면 되어, 기존 오탐지 UI(배지·체크박스 비활성화·전체 선택 제외)가 그대로 동작한다.
- 삭제가 아닌 마킹이라 사용자가 최종 확인 후 처리하는 흐름을 유지한다.
- `get_pixmap(clip=bbox)`로 bbox 영역만 렌더링하여 성능 영향이 작다(100문항 기준 +1초 미만 예상).

판정 임계값: `_BG_WHITE_MIN_RGB = 230`, `_BG_WHITE_THRESHOLD = 0.60` (실제 문서로 튜닝).

---

## Consequences

**Good:**

- 페이지 일부 색지에도 정상 문항 보존, 컬러 박스 오탐지 마킹
- 캐시 포맷 변경 없음(하위 호환), 기존 UI 자동 연동

**Bad:**

- 경계 감지는 모든 영역에 대해 수행되므로 약간의 추가 렌더링 비용 발생
- 임계값이 문서 스타일에 민감 → 신규 문서군 도입 시 재튜닝 필요

> 관련 spec: REQ-25 (`docs/specs/20260526-REQ-25-bg-color-filter.md`), REQ-15(전체 페이지 크기 오탐지)
