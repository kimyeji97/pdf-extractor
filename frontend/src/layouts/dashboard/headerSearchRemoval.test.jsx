/**
 * REQ-D09 Phase 4 — 앱 헤더 전역 검색 제거
 *
 * 검증 계약: docs/plans/PLAN-D09-F10-history-screen-rework.md `## 검증 계약` (D09-13~14)
 *
 * 화면마다 검색이 생기면(F10) 헤더 전역 검색은 "분석 화면 전용"이 되어 오히려 헷갈린다.
 * 입력란과 함께 **분석 화면의 `?q=` 흡수 로직도** 사라지므로 두 케이스가 짝이다.
 *
 * ⚠️ 소스 스캔은 **테스트 파일을 제외**한다 — 이 파일 자신이 찾는 문자열을 담고 있어서
 *    제외하지 않으면 영원히 자기 자신에 걸린다. 제품 코드에만 없으면 되는 규칙이다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';

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

beforeEach(() => {
  vi.clearAllMocks();
  listJobs.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('헤더 전역 검색 제거 (Phase 4)', () => {
  it('[D09-13] 헤더 검색 입력란 문구가 제품 소스에 남아 있지 않다', () => {
    const needle = ['문제집', '검색'].join(' ');

    const offenders = productSources().filter((path) => readFileSync(path, 'utf-8').includes(needle));

    expect(offenders).toEqual([]);
  });

  it('[D09-14] /?q=… 로 진입해도 분석 화면 검색란이 비어 있다', async () => {
    // 흡수 로직이 사라졌으므로 파라미터를 무시한다. **주소창은 정리하지 않는다** —
    // URL을 지우던 주체가 바로 그 흡수 로직이라 둘을 동시에 만족하는 구현이 없다.
    render(
      <MemoryRouter initialEntries={['/?q=테스트']}>
        <ThemeProvider>
          <AnalysisFilePage />
        </ThemeProvider>
      </MemoryRouter>,
    );

    const nameField = (await screen.findAllByRole('textbox'))[0];
    expect(nameField).toHaveValue('');
  });
});
