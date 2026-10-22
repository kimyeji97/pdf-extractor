/**
 * REQ-28 Phase 8 — 재감지할 수 없는 사람(편집자·뷰어)용 감지 안내
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-64 · 28-65)
 * 이 테스트가 고정하는 모양: `detectionNotice(job, autoCount, canRefresh)` — 셋째 인자 false 면 재감지할 수 없는 사람.
 */
import { describe, expect, it } from 'vitest';

import { detectionNotice } from 'utils/detectionNotice';

describe('detectionNotice 역할별', () => {
  it('[28-64] 재감지할 수 없는 사람에게 감지 실패는 소유자에게 요청하라고 안내한다', () => {
    expect(detectionNotice({ boundaries_status: 'FAILED' }, 0, false).message).toContain('소유자에게 재감지를 요청하세요');
  });

  it('[28-65] 재감지할 수 없는 사람에게 0문항도 소유자에게 요청하라고 안내한다', () => {
    expect(detectionNotice({ boundaries_status: 'DONE' }, 0, false).message).toContain('소유자에게 재감지를 요청하세요');
  });
});
