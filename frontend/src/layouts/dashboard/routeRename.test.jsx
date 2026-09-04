/**
 * REQ-D11 Phase 2 — 라우트 경로 변경 (/create · /results · /templates, 리다이렉트 없음)
 *
 * 검증 계약: docs/plans/PLAN-D11-menu-rename.md `## 검증 계약` (D11-08~13, 16~18)
 *
 * 무대는 세 종류다 — ① 모듈 값 검사(`paths`·`navData`·`routes`), ② 소스 스캔(편집 화면 브레드크럼·옛 경로
 * 리터럴 — D11 Phase 1 `menuRename.test.jsx`와 같은 방식), ③ `NavDesktop` 렌더(활성 표시).
 *
 * ⚠️ nav "활성"은 링크의 **계산된 `font-weight`**로 읽는다(활성 600 · 비활성 500 — `nav.tsx`의
 *    `fontWeightSemiBold`/`fontWeightMedium`). 색은 `var(--palette-*)` 그대로라 jsdom이 못 푼다
 *    (2026-09-04 프로브). `aria-current`는 `Link`라 안 붙는다.
 *
 * ⚠️ `routes/router`는 임포트 시점에 `createBrowserRouter`를 부른다 — jsdom에 `window.location`이 있어
 *    문제없다(프로브 확인). lazy 페이지는 렌더하지 않으므로 로드되지 않는다.
 *
 * ⚠️ 소스 스캔은 테스트 파일을 제외하고 주석을 걷어낸다 — 이 파일 자신이 옛 경로를 담고 있다.
 *    옛 경로 리터럴은 **따옴표 바로 뒤 슬래시**로만 잡는다 — `'pages/history'` 같은 모듈 경로는 옛
 *    라우트가 아니다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import paths from 'routes/paths';
import { routes } from 'routes/router';
import { NavDesktop } from 'layouts/dashboard/nav';
import { navData } from 'layouts/dashboard/nav-config';

import { ThemeProvider } from 'theme/theme-provider';

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => vi.fn(),
}));

const NEW_PATHS = ['/create', '/results', '/templates'];
const OLD_PATHS = ['/editor', '/history', '/format'];

/** frontend/src 아래 제품 소스 전부 (테스트 파일 제외). */
const productSources = (dir = 'src') => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...productSources(path));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry) && !entry.includes('.test.')) {
      out.push(path);
    }
  }
  return out;
};

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — 렌더되는 문자열만 남긴다. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

/** 라우트 트리의 `path` 전부 (인덱스 라우트는 제외 — 경로 문자열이 없다). */
const routePaths = (list, acc = []) => {
  for (const route of list) {
    if (route.path) acc.push(route.path);
    if (route.children) routePaths(route.children, acc);
  }
  return acc;
};

/** 주어진 경로에서 사이드바를 그리고, 활성(font-weight 600)인 메뉴 제목만 돌려준다. */
const activeTitlesAt = (pathname) => {
  const { container, unmount } = render(
    <MemoryRouter initialEntries={[pathname]}>
      <ThemeProvider>
        <NavDesktop layoutQuery="lg" />
      </ThemeProvider>
    </MemoryRouter>,
  );
  const titles = [...container.querySelectorAll('nav a')]
    .filter((a) => getComputedStyle(a).fontWeight === '600')
    .map((a) => a.textContent);
  unmount();
  return titles;
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('경로 상수·라우터 (Phase 2)', () => {
  it('[D11-08] paths가 /create·/results·/templates를 낸다', () => {
    const values = Object.values(paths);
    expect(NEW_PATHS.filter((p) => !values.includes(p))).toEqual([]);
  });

  it('[D11-09] paths에 옛 경로 /editor·/history·/format이 없다', () => {
    const values = Object.values(paths);
    expect(OLD_PATHS.filter((p) => values.includes(p))).toEqual([]);
  });

  it('[D11-10] 사이드바 링크 4개가 순서대로 / · /create · /results · /templates다', () => {
    expect(navData.map((item) => item.path)).toEqual(['/', ...NEW_PATHS]);
  });

  it('[D11-11] 라우터 트리에 /create·/results·/templates가 있다', () => {
    const declared = routePaths(routes);
    expect(NEW_PATHS.filter((p) => !declared.includes(p))).toEqual([]);
  });

  it('[D11-12] 라우터 트리에 옛 경로 /editor·/history·/format이 없다 (리다이렉트 포함)', () => {
    // 리다이렉트를 두려면 옛 경로를 `path`로 선언해야 하므로, 옛 경로 부재가 리다이렉트 부재까지 말한다.
    const declared = routePaths(routes);
    expect(OLD_PATHS.filter((p) => declared.includes(p))).toEqual([]);
  });
});

describe('경로 문자열을 직접 든 곳 (Phase 2)', () => {
  it('[D11-13] 생성 화면 브레드크럼의 "생성" 항목 to가 paths 참조 또는 "/create"다 (소스 스캔)', () => {
    const code = stripComments(readFileSync('src/pages/editor/index.jsx', 'utf-8'));
    expect(code).toMatch(/label: "생성",\s*to: (?:paths\.\w+|"\/create")/);
  });

  it('[D11-18] 옛 경로 리터럴 "/editor"·"/history"·"/format"이 제품 소스에 남아 있지 않다', () => {
    const offenders = [];
    for (const path of productSources()) {
      const code = stripComments(readFileSync(path, 'utf-8'));
      const hits = code.match(/['"`]\/(?:editor|history|format)\b/g);
      if (hits) offenders.push(`${path}: ${hits.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('사이드바 활성 표시 (Phase 2)', () => {
  it('[D11-16] 새 경로 4개 각각에서 그 메뉴 하나만 활성이다', () => {
    const activeByPath = Object.fromEntries(
      ['/', ...NEW_PATHS].map((pathname) => [pathname, activeTitlesAt(pathname)]),
    );
    expect(activeByPath).toEqual({
      '/': ['분석'],
      '/create': ['생성'],
      '/results': ['결과'],
      '/templates': ['템플릿 관리'],
    });
  });

  it('[D11-17] /analysis/:jobId에서 "분석" 하나만 활성이다', () => {
    // 계획서 제약 — "nav 활성 판정은 경로 접두로 한다". `/`가 모든 경로의 접두라 분석이 항상 활성이 되지
    // 않도록 둔 예외가 새 경로에서도 살아 있어야 한다(D11-16이 그 반대편을 본다).
    expect(activeTitlesAt('/analysis/job-1')).toEqual(['분석']);
  });
});
