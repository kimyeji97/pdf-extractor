/**
 * REQ-D13 Phase 3 — 글꼴 (Outfit + Gothic A1)
 *
 * 검증 계약: docs/plans/PLAN-D13-brand-renewal.md `## 검증 계약` (D13-25~30)
 * 생성 PDF 지면의 글꼴(`fitz.Font("korea")`, 계약 #39)은 범위 밖이다 — 앱 UI만 본다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { typography } from 'theme/core/typography';

const sourceFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return sourceFiles(path);
  return /\.(jsx?|tsx?|css)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
});

const stack = (family) => String(family).split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''));
const mainTsx = () => readFileSync('src/main.tsx', 'utf-8');
const deps = () => JSON.parse(readFileSync('package.json', 'utf-8')).dependencies ?? {};

describe('REQ-D13 글꼴 (Phase 3)', () => {
  it('[D13-25] 본문 글꼴 스택이 Outfit → Gothic A1 순서다', () => {
    const [first, second] = stack(typography.fontFamily);
    expect([/^Outfit/.test(first), second]).toEqual([true, 'Gothic A1']);
  });

  it('[D13-26] 제목 글꼴 스택이 Outfit → Gothic A1 순서다', () => {
    const [first, second] = stack(typography.fontSecondaryFamily);
    expect([/^Outfit/.test(first), second]).toEqual([true, 'Gothic A1']);
  });

  it('[D13-27] Gothic A1은 굵기 400·500·600·700만 불러온다', () => {
    const weights = [...mainTsx().matchAll(/@fontsource\/gothic-a1\/(\d+)\.css/g)].map((m) => m[1]).sort();
    expect(weights).toEqual(['400', '500', '600', '700']);
  });

  it('[D13-28] main.tsx가 @fontsource-variable/outfit을 불러온다', () => {
    expect(mainTsx()).toMatch(/import\s+['"]@fontsource-variable\/outfit['"]/);
  });

  it('[D13-29] 의존성에 Outfit·Gothic A1 패키지가 있다', () => {
    expect(['@fontsource-variable/outfit', '@fontsource/gothic-a1'].filter((p) => !deps()[p])).toEqual([]);
  });

  it('[D13-30] DM Sans·Barlow 의존성과 import가 없다', () => {
    const leftovers = [
      ...Object.keys(deps()).filter((p) => /dm-sans|barlow/i.test(p)),
      ...sourceFiles('src').filter((f) => /dm-sans|barlow/i.test(readFileSync(f, 'utf-8'))),
    ];
    expect(leftovers).toEqual([]);
  });
});
