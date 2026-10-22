/**
 * REQ-F20 Phase 1 — 튜토리얼 정의 목록
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-12)
 */
import { describe, expect, it } from 'vitest';

import { TUTORIALS } from 'utils/tutorials';

describe('튜토리얼 정의 목록', () => {
  it('[F20-12] 목록이 비지 않고 id가 겹치지 않으며 슬라이드가 1장 이상이다', () => {
    const ids = TUTORIALS.map((t) => t.id);
    const problems = [
      ...(TUTORIALS.length === 0 ? ['목록이 비었다'] : []),
      ...ids.filter((id, i) => ids.indexOf(id) !== i).map((id) => `id 중복: ${id}`),
      ...TUTORIALS.filter((t) => !(t.slides?.length > 0)).map((t) => `슬라이드 없음: ${t.id}`),
    ];

    expect(problems).toEqual([]);
  });
});
