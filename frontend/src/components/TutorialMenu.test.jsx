/**
 * REQ-F20 Phase 4 — 헤더 ? 버튼은 튜토리얼 화면을 연다
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-44)
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import TutorialMenu from 'components/TutorialMenu';
import { ThemeProvider } from 'theme/theme-provider';

function Probe() {
  const l = useLocation();
  return <div data-testid="loc">{l.pathname + l.search}</div>;
}

describe('헤더 ? 버튼', () => {
  it('[F20-44] ? 버튼을 누르면 /tutorials 로 간다', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <TutorialMenu />
          <Probe />
        </MemoryRouter>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '튜토리얼' }));

    expect(screen.getByTestId('loc').textContent).toBe('/tutorials');
  });
});
