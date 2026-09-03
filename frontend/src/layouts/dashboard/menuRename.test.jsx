/**
 * REQ-D11 Phase 1 — 메뉴 이름 변경 (분석 / 생성 / 결과 / 템플릿 관리)
 *
 * 검증 계약: docs/plans/PLAN-D11-menu-rename.md `## 검증 계약` (D11-01~03, 06~07)
 *
 * 무대는 D09 Phase 4(`headerSearchRemoval.test.jsx`)와 같다 — 분석 목록 화면 렌더 + 제품 소스 스캔.
 *
 * ⚠️ 소스 스캔은 **테스트 파일을 제외**하고 **주석을 걷어낸 뒤** 찾는다. 옛 이름이 주석·훅 설명에
 *    10곳 넘게 남아 있고 그건 화면에 안 보인다(계획서 범위 — 제외). "0건"의 기준은 렌더되는
 *    문자열이다. 테스트 파일을 빼는 이유는 이 파일 자신이 옛 이름을 담고 있어서다.
 *
 * ⚠️ D11-06·07은 렌더가 아니라 **소스 문자열 검사**다 — 편집·표지 화면은 렌더 무대(API mock)가 없어
 *    이번 범위에 비해 커서 스캔으로 대체했다(2026-09-03 승인). 화면에 뜬다는 것까지는 보증하지 않는다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';
import { navData } from 'layouts/dashboard/nav-config';

import { listJobs } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

const navigate = vi.fn();

vi.mock('api/client', () => ({
  listJobs: vi.fn(() => Promise.resolve({ items: [], total: 0, skip: 0, limit: 20 })),
  requestUploadUrl: vi.fn(),
  uploadPdf: vi.fn(),
  updateJobMeta: vi.fn(),
  deleteJob: vi.fn(),
}));

vi.mock('hooks/useNotificationRefresh', () => ({
  useNotificationRefresh: vi.fn(),
}));

vi.mock('components/StatCards', () => ({ default: () => <div data-testid="stat-cards" /> }));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => navigate,
}));

const NEW_TITLES = ['분석', '생성', '결과', '템플릿 관리'];
const OLD_TITLES = ['문항 분석', '문제집 편집', '생성 이력', '표지 관리'];

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

/** `PageHeader`의 제목과 브레드크럼 마지막 항목. */
const headerOf = (container) => ({
  title: screen.getByRole('heading', { level: 6 }).textContent,
  lastCrumb: container.querySelector('nav[aria-label="breadcrumb"] li:last-child')?.textContent ?? null,
});

const renderAnalysis = () =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AnalysisFilePage />
      </ThemeProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  listJobs.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('사이드바 메뉴 이름 (Phase 1)', () => {
  it('[D11-01] 사이드바 제목이 순서대로 분석·생성·결과·템플릿 관리다', () => {
    expect(navData.map((item) => item.title)).toEqual(NEW_TITLES);
  });

  it('[D11-02] 옛 이름 4개가 주석을 걷어낸 제품 소스에 남아 있지 않다', () => {
    const offenders = [];
    for (const path of productSources()) {
      const code = stripComments(readFileSync(path, 'utf-8'));
      for (const old of OLD_TITLES) {
        if (code.includes(old)) offenders.push(`${path}: ${old}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('화면 헤더가 사이드바 제목과 같다 (Phase 1)', () => {
  it('[D11-03] 분석 목록 화면의 헤더 제목과 브레드크럼 마지막이 "분석"이다', async () => {
    const { container } = renderAnalysis();
    await screen.findByRole('heading', { level: 6 });
    expect(headerOf(container)).toEqual({ title: '분석', lastCrumb: '분석' });
  });

  it('[D11-06] 분석 삭제 확인 문구가 결정 문장 그대로 소스에 있다', () => {
    const sentence = '이 문제집의 문항으로 만든 결과는 남지만, 생성 화면에서 해당 문항 이미지가 보이지 않습니다.';
    expect(readFileSync('src/pages/analysis/index.jsx', 'utf-8')).toContain(sentence);
  });

  it('[D11-07] 생성·템플릿 관리·작업 화면의 헤더 제목·브레드크럼이 사이드바 제목과 같다 (소스 스캔)', () => {
    const missing = [
      ['src/pages/editor/index.jsx', 'title="생성"'],
      ['src/pages/format/index.jsx', 'title="템플릿 관리"'],
      ['src/pages/analysis/work.jsx', 'label: "분석"'],
    ]
      .filter(([path, needle]) => !stripComments(readFileSync(path, 'utf-8')).includes(needle))
      .map(([path, needle]) => `${path}: ${needle}`);
    expect(missing).toEqual([]);
  });
});
