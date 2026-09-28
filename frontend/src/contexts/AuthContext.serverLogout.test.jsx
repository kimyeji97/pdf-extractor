/**
 * REQ-B15 Phase 2 — AuthContext.logout()이 서버 로그아웃(쿠키 삭제)을 부른다
 *
 * 검증 계약: docs/plans/PLAN-B15-image-auth-cookie.md `## 검증 계약` (B15-21 ~ B15-22)
 *
 * access 쿠키는 HttpOnly라 JS가 못 지운다 — 서버 `POST /api/auth/logout`이 지워야 한다.
 * 무대는 `AuthContext.logout.test.jsx`(REQ-27 Phase 5)와 같은 Probe 패턴이고, 거기서 이미
 * `api/client`의 `logout`을 mock 목록에 두고 있다. 로컬 상태 정리(27-64·65)는 그 파일이 보므로
 * 여기서는 **서버 호출**과 **서버 실패 시에도 로컬 로그아웃**(PLAN § 결정)만 본다.
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { logout as apiLogout } from 'api/client';
import { AuthProvider, useAuth } from 'contexts/AuthContext';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));

function Probe() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
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
});

afterEach(() => {
  localStorage.clear();
});

describe('logout() — 서버 로그아웃', () => {
  it('[B15-21] 호출 시 api/client의 logout()을 부른다', () => {
    apiLogout.mockResolvedValue(undefined);
    renderProvider();

    act(() => {
      screen.getByText('logout').click();
    });

    expect(apiLogout).toHaveBeenCalledTimes(1);
  });

  it('[B15-22] 서버 로그아웃이 실패해도 isAuthenticated가 false가 된다', async () => {
    apiLogout.mockRejectedValue(new Error('network down'));
    renderProvider();

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });
});
