/**
 * REQ-D13 Phase 2 — 테마색 (남색 primary · 빨강 secondary · 모드별 primary)
 *
 * 검증 계약: docs/plans/PLAN-D13-brand-renewal.md `## 검증 계약` (D13-09~14)
 *
 * 팔레트 `main`은 라이트/다크가 공유하던 구조라(계약 #20) 남색 primary는 다크에서 묻힌다 —
 * 다크 primary를 모드별로 나눈다. `tintBg`/`tintSx`는 `mainChannel`을 쓰므로 `main`만 바꾸면
 * 다크 색조 배경이 남색으로 남는다(D13-11 — 형식은 맞는데 조용히 틀리는 계열).
 */
import { describe, expect, it } from 'vitest';

import { palette } from 'theme/core/palette';
import { MARK_COLOR } from 'utils/badges';

const channelOf = (channel) => String(channel).match(/\d+/g)?.map(Number);

describe('REQ-D13 테마색 (Phase 2)', () => {
  it('[D13-09] 라이트 primary.main이 #1B2B4B다', () => {
    expect(palette.light.primary.main.toUpperCase()).toBe('#1B2B4B');
  });

  it('[D13-10] 다크 primary.main이 #8FA3D1다', () => {
    expect(palette.dark.primary.main.toUpperCase()).toBe('#8FA3D1');
  });

  it('[D13-11] 다크 primary.mainChannel이 #8FA3D1의 채널(143 163 209)이다', () => {
    expect(channelOf(palette.dark.primary.mainChannel)).toEqual([143, 163, 209]);
  });

  it('[D13-12] secondary.main이 라이트·다크 모두 #F0503A다', () => {
    expect([palette.light.secondary.main, palette.dark.secondary.main].map((c) => c.toUpperCase())).toEqual([
      '#F0503A',
      '#F0503A',
    ]);
  });

  it('[D13-13] "수동" 칩이 primary다', () => {
    expect(MARK_COLOR.manual).toBe('primary');
  });

  it('[D13-14] 다크 primary.contrastText가 #141A21다', () => {
    expect(palette.dark.primary.contrastText.toUpperCase()).toBe('#141A21');
  });
});
