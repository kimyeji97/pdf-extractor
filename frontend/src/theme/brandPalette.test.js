/**
 * REQ-D13 Phase 2 — 테마색 (사용자 최종 테마 셋 · 2026-10-08)
 *
 * 검증 계약: docs/plans/PLAN-D13-brand-renewal.md `## 검증 계약` (D13-09~18)
 *
 * 팔레트 `main`은 라이트/다크가 공유하던 구조라(계약 #20) 남색 primary는 다크에서 묻힌다 —
 * 다크 primary를 모드별로 나눈다. `tintBg`/`tintSx`는 `mainChannel`을 쓰므로 `main`만 바꾸면
 * 다크 색조 배경이 남색으로 남는다(D13-11 — 형식은 맞는데 조용히 틀리는 계열).
 * index.html 사전 페인트 배경은 grey[100]/grey[900]과 짝이다(계약 #21, D13-18).
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { grey, palette } from 'theme/core/palette';
import { MARK_COLOR } from 'utils/badges';

const channelOf = (channel) => String(channel).match(/\d+/g)?.map(Number);
const up = (c) => String(c).toUpperCase();

const GREY = {
  50: '#FCFCFD', 100: '#F6F8FB', 200: '#EDF0F5', 300: '#DDE2EB', 400: '#B8C0CF',
  500: '#8792A8', 600: '#5B6680', 700: '#3E4A63', 800: '#26324B', 900: '#151D2E',
};

describe('REQ-D13 테마색 (Phase 2)', () => {
  it('[D13-09] 라이트 primary.main이 #1B2B4B다', () => {
    expect(up(palette.light.primary.main)).toBe('#1B2B4B');
  });

  it('[D13-10] 다크 primary.main이 #8EA4D6다', () => {
    expect(up(palette.dark.primary.main)).toBe('#8EA4D6');
  });

  it('[D13-11] 다크 primary.mainChannel이 #8EA4D6의 채널(142 164 214)이다', () => {
    expect(channelOf(palette.dark.primary.mainChannel)).toEqual([142, 164, 214]);
  });

  it('[D13-12] secondary.main이 라이트·다크 모두 #CC4A12다', () => {
    expect([palette.light.secondary.main, palette.dark.secondary.main].map(up)).toEqual(['#CC4A12', '#CC4A12']);
  });

  it('[D13-13] "수동" 칩이 primary다', () => {
    expect(MARK_COLOR.manual).toBe('primary');
  });

  it('[D13-14] 다크 primary.contrastText가 #151D2E다', () => {
    expect(up(palette.dark.primary.contrastText)).toBe('#151D2E');
  });

  it('[D13-15] info·success·warning·error main이 최종 테마 셋 값이다', () => {
    const p = palette.light;
    expect([p.info.main, p.success.main, p.warning.main, p.error.main].map(up)).toEqual([
      '#0B7F99', '#15803D', '#F5A524', '#BE123C',
    ]);
  });

  it('[D13-16] grey 50~900이 최종 테마 셋 10값이다', () => {
    const actual = Object.fromEntries(Object.keys(GREY).map((k) => [k, up(grey[k])]));
    expect(actual).toEqual(GREY);
  });

  it('[D13-17] 다크 background.neutral이 #2E3A55다', () => {
    expect(up(palette.dark.background.neutral)).toBe('#2E3A55');
  });

  it('[D13-18] index.html 사전 페인트 배경이 grey[100]·grey[900](#F6F8FB·#151D2E)이다', () => {
    const html = readFileSync('index.html', 'utf-8');
    const paint = html.match(/backgroundColor\s*=\s*dark\s*\?\s*'([^']+)'\s*:\s*'([^']+)'/);
    // 값은 D13-16이 grey로 고정한다 — 여기선 사전 페인트가 그 grey와 짝인지(계약 #21)를 본다
    expect([paint?.[1], paint?.[2]].map(up)).toEqual([up(grey[900]), up(grey[100])]);
  });
});
