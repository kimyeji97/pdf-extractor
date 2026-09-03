/**
 * REQ-D10 Phase 1 — 문항 목록 열 수 산식
 *
 * 검증 계약: docs/plans/PLAN-D10-question-grid-columns.md `## 검증 계약` (D10-01~04)
 *
 * 열 수를 순수 함수로 둔 이유는 **패널 너비 상태값(`panelWidths.section3`)에서 정확히
 * 갈리게 하기 위해서**다. CSS auto-fill에 맡기면 브라우저가 세는 폭이 패딩·스크롤바에
 * 따라 달라져 같은 421px에서 OS마다 열 수가 다르다(계획서 결정 "열 수 계산 주체").
 *
 * 임계 420은 상한 읽기다 — 이미지 폭이 420을 넘지 않게 `ceil(W / 420)`. 하한 읽기
 * (`floor`)면 799까지 1열이라 원문이 불평한 상황 그대로가 되어 기각됐다.
 */
import { describe, expect, it } from 'vitest';

import { columnsForWidth } from 'utils/questionGrid';

describe('columnsForWidth', () => {
  it('[D10-01] 200(최소 너비) → 1열', () => {
    expect(columnsForWidth(200)).toBe(1);
  });

  it('[D10-02] 420(임계) → 1열 — 진입 직후 기본 너비에서는 현행 그대로', () => {
    // 임계 값을 기본 너비와 같은 420으로 잡은 이유가 이 케이스다(계획서 결정 "임계 값 T").
    expect(columnsForWidth(420)).toBe(1);
  });

  it('[D10-03] 421(임계+1) → 2열', () => {
    expect(columnsForWidth(421)).toBe(2);
  });

  it('[D10-04] 800(리사이즈 상한) → 2열 — 이 작업에서 3열은 나오지 않는다', () => {
    expect(columnsForWidth(800)).toBe(2);
  });
});
