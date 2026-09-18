/**
 * REQ-27 Phase 5 — 헤더 계정 슬롯 배선 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-68)
 *
 * `layout.tsx:67`의 "// 추가 예정 기능 자리 — 계정(REQ-27)" 주석 자리에 `ProfileMenu`가
 * 실제로 배선됐는지만 본다 — 컴포넌트 자체 동작은 `ProfileMenu.test.jsx`가 본다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('헤더 계정 슬롯 배선 (Phase 5)', () => {
  it('[27-68] layout.tsx 헤더 우측 영역에 ProfileMenu가 배선되어 있다', () => {
    const code = stripComments(readFileSync('src/layouts/dashboard/layout.tsx', 'utf-8'));

    expect(code).toMatch(/<ProfileMenu\s*\/>/);
  });
});
