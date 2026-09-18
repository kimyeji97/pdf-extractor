/**
 * REQ-27 Phase 5 — AuthContext.logout()
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-64~27-65)
 *
 * `AuthContext.test.jsx`(Phase 4)와 같은 Probe 패턴이다. Phase 4는 `login`·`signup`만
 * 봤으니 `logout`은 새 파일로 뺀다 — `client.template.test.js` 계열의 기존 관례(기능별
 * 파일 분리)를 따른다.
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from 'contexts/AuthContext';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));

function Probe() {
  const { isAuthenticated, userEmail, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="email">{userEmail ?? ''}</span>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('access_token', 'tok');
  localStorage.setItem('refresh_token', 'ref');
  localStorage.setItem('user_email', 'a@b.com');
});

afterEach(() => {
  localStorage.clear();
});

describe('logout()', () => {
  it('[27-64] 호출 시 isAuthenticated가 false가 되고 userEmail이 사라진다', () => {
    renderProvider();
    expect(screen.getByTestId('auth')).toHaveTextContent('true');

    act(() => {
      screen.getByText('logout').click();
    });

    expect(screen.getByTestId('auth')).toHaveTextContent('false');
    expect(screen.getByTestId('email')).toHaveTextContent('');
  });

  it('[27-65] 호출 시 access_token·refresh_token이 localStorage에서 지워진다', () => {
    renderProvider();

    act(() => {
      screen.getByText('logout').click();
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
