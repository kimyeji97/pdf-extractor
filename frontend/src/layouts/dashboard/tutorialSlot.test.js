/**
 * REQ-F20 Phase 1 — 튜토리얼 배선 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-13)
 *
 * 로그인 화면에 뜨지 않게 로그인한 레이아웃 안에 둔다. 컴포넌트 동작은 `TutorialGate.test.jsx`가 본다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('튜토리얼 배선 (Phase 1)', () => {
  it('[F20-13] 로그인 레이아웃이 TutorialGate를 렌더한다', () => {
    const code = stripComments(readFileSync('src/layouts/dashboard/layout.tsx', 'utf-8'));

    expect(code).toMatch(/<TutorialGate\s*\/>/);
  });
});
