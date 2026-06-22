# 0002. 문항 식별자를 복합 키 체계로 통일

## Status

<!-- proposed · accepted · deprecated · superseded -->
accepted

---

## Context and Problem Statement

문제집 생성 시 Canvas 미리보기에 보이던 문항과 실제 다운로드된 PDF의 문항이 달라지는 버그(REQ-B02)가 발생했다. 원인은 프론트엔드 선택 상태와 백엔드 PDF 빌드가 문항을 서로 다른 기준(배열 인덱스 vs 문항 번호)으로 식별했기 때문이다.

자동 문항·수동 문항·여러 파일/페이지를 교차 선택하는 흐름에서, 미리보기·선택·생성 전 구간이 동일한 문항을 가리키도록 보장하는 식별자 체계가 필요했다.

---

## Decision Drivers

- 미리보기 ↔ 선택 바스켓 ↔ PDF 생성 전 구간의 문항 식별 일관성
- 자동/수동 문항, 다중 파일·페이지 교차 선택 지원
- 추가 저장소(DB) 없이 기존 캐시(`boundaries/*.json`)와 호환

---

## Considered Options

- Option A: `{job_id}_{page_num}_{title}` 형태의 복합 문자열 식별자
- Option B: 페이지 내 배열 인덱스 기반 식별
- Option C: 문항마다 UUID를 발급하고 캐시에 영속화

---

## Decision Outcome

**Chosen option:** Option A — `{job_id}_{page_num}_{title}` 복합 식별자

**Rationale:**

- 파일·페이지·문항을 한 문자열로 전역 유일하게 지목할 수 있어 교차 선택에 안전하다.
- 기존 캐시 데이터에서 결정적으로 파생 가능하여 별도 저장소나 마이그레이션이 불필요하다.
- 인덱스 방식(Option B)은 재감지·정렬 변경 시 식별자가 흔들린다. UUID 영속화(Option C)는 캐시 포맷 변경과 발급/동기화 비용이 크다.

> 참고: spec v2의 `question_id`(`{job_id}:{page_num}:{question_number}`) 개념을 v3.1에서 타이틀 기반으로 재정의했다.

---

## Consequences

**Good:**

- 미리보기와 생성 결과가 항상 일치(REQ-B02 해소)
- 추가 저장소 없이 도입, 캐시 하위 호환 유지

**Bad:**

- 타이틀이 식별자의 일부이므로, 같은 페이지 내 동일 타이틀 충돌 방지가 필요
- 타이틀 수정 시 식별자가 변하므로 선택 상태 갱신을 함께 처리해야 함

> 관련 spec: REQ-B02 (`docs/specs/20260427-REQ-B02-question-id-scheme.md`)
