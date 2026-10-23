/**
 * REQ-F20 Phase 6 — 튜토리얼 화면 셸 (사이드바 숨김, 헤더 로고)
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-51~54)
 *
 * 무대는 ThemeProvider + MemoryRouter 안의 DashboardLayout. 헤더 오른쪽 버튼들은 컨텍스트가 필요해 스텁으로 막는다.
 * "숨김"은 DOM에서 빼는 것으로 본다 — 사이드바는 CSS 미디어 쿼리로 보이고 숨는데 jsdom은 그걸 판정하지 못한다.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import DashboardLayout from 'layouts/dashboard/layout';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('components/NotificationBell', () => ({ default: () => null }));
vi.mock('components/ProfileMenu', () => ({ default: () => null }));
vi.mock('components/ColorSchemeMenu', () => ({ default: () => null }));
vi.mock('components/TutorialGate', () => ({ default: () => null }));
vi.mock('components/TutorialMenu', () => ({ default: () => null }));

const renderAt = (path) =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <DashboardLayout>
          <div>본문</div>
        </DashboardLayout>
      </MemoryRouter>
    </ThemeProvider>,
  );

const MENU = ['분석', '생성', '결과', '템플릿 관리'];

describe('튜토리얼 화면 셸 (Phase 6)', () => {
  it('[F20-51] /tutorials 에서 사이드바 메뉴가 DOM에 없다', () => {
    renderAt('/tutorials');

    expect(MENU.filter((name) => screen.queryByRole('link', { name }))).toEqual([]);
  });

  it('[F20-52] /tutorials 에서 작업공간 선택도 없다', () => {
    renderAt('/tutorials');

    expect(screen.queryByText('내 작업공간')).toBeNull();
  });

  it('[F20-53] /tutorials 에서 로고가 / 로 가는 링크 안에 있다', () => {
    renderAt('/tutorials');

    const logo = screen.getAllByRole('img', { name: '오답 클립북' })[0];

    expect(logo.closest('a')?.getAttribute('href')).toBe('/');
  });

  it('[F20-54] 다른 화면에서는 사이드바 메뉴가 그대로 있다', () => {
    renderAt('/');

    expect(MENU.filter((name) => !screen.queryByRole('link', { name }))).toEqual([]);
  });
});
