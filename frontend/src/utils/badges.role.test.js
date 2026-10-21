/**
 * REQ-28 Phase 7 — 목록 카드 역할 칩
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-59)
 */
import { describe, expect, it } from 'vitest';

import { ROLE_CHIP } from 'utils/badges';

describe('ROLE_CHIP', () => {
  it('[28-59] ROLE_CHIP 이 소유자·편집자·뷰어 이름을 준다', () => {
    expect(['owner', 'editor', 'viewer'].map((r) => ROLE_CHIP[r]?.label)).toEqual(['소유자', '편집자', '뷰어']);
  });
});
