/**
 * REQ-28 Phase 5 — 역할로 컨트롤을 가르는 판정
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-32~33)
 * 입력은 백엔드 `my_role`(owner | editor | viewer)이다.
 */
import { describe, expect, it } from 'vitest';

import { canEdit, isOwner } from 'utils/jobRole';

describe('역할 판정', () => {
  it('[28-32] canEdit — 소유자·편집자는 참, 뷰어는 거짓', () => {
    expect(['owner', 'editor', 'viewer'].map((r) => canEdit({ my_role: r }))).toEqual([true, true, false]);
  });

  it('[28-33] isOwner — 소유자만 참', () => {
    expect(['owner', 'editor', 'viewer'].map((r) => isOwner({ my_role: r }))).toEqual([true, false, false]);
  });
});
