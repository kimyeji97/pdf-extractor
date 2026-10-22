/**
 * REQ-F20 Phase 1·2·4 — 튜토리얼 배선 (소스 스캔 · 라우트 모듈 값)
 *
 * F20-45는 `routes/router`를 임포트한다 — routeRename.test.jsx와 같이 useNavigate만 막는다
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-13, F20-16, F20-45)
 *
 * 로그인 화면에 뜨지 않게 로그인한 레이아웃 안에 둔다. 컴포넌트 동작은 `TutorialGate.test.jsx`가 본다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { routes } from 'routes/router';

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => vi.fn(),
}));

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('튜토리얼 배선 (Phase 1)', () => {
  it('[F20-13] 로그인 레이아웃이 TutorialGate를 렌더한다', () => {
    const code = stripComments(readFileSync('src/layouts/dashboard/layout.tsx', 'utf-8'));

    expect(code).toMatch(/<TutorialGate\s*\/>/);
  });
});

describe('튜토리얼 배선 (Phase 2)', () => {
  it('[F20-16] 헤더에 TutorialMenu가 연결돼 있다', () => {
    const code = stripComments(readFileSync('src/layouts/dashboard/layout.tsx', 'utf-8'));

    expect(code).toMatch(/<TutorialMenu\s*\/>/);
  });
});

describe('튜토리얼 라우트 (Phase 4)', () => {
  it('[F20-45] /tutorials 라우트가 로그인 레이아웃 안에 있다', () => {
    const shell = routes[0].children.find((r) => r.path === '/');

    expect(shell.children.map((c) => c.path)).toContain('/tutorials');
  });
});
