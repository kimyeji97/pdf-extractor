/**
 * REQ-27 Phase 4 — 인증 상태 컨텍스트
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-56~27-59)
 *
 * `NotificationContext.test.jsx`와 같은 방식 — `useAuth()`가 노출하는 값을 DOM으로 흘려보내는
 * `Probe` 컴포넌트로 관찰한다. `login()`이 성공해도 응답에 이메일이 없으므로(검증 계약 헤더),
 * `userEmail`은 로그인 폼에 입력한 값을 그대로 쓴다는 것이 이 파일이 고정하는 관례다.
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from 'contexts/AuthContext';
import * as client from 'api/client';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

function Probe() {
  const { isAuthenticated, userEmail, login, signup } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="email">{userEmail ?? ''}</span>
      <button onClick={() => login('a@b.com', 'pw1234')}>login</button>
      <button onClick={() => signup('a@b.com', 'pw1234')}>signup</button>
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
});

afterEach(() => {
  localStorage.clear();
});

describe('초기 인증 상태', () => {
  it('[27-56] 마운트 시 access_token이 있으면 isAuthenticated가 true다', () => {
    localStorage.setItem('access_token', 'tok');

    renderProvider();

    expect(screen.getByTestId('auth')).toHaveTextContent('true');
  });

  it('[27-57] 마운트 시 토큰이 없으면 isAuthenticated가 false다', () => {
    renderProvider();

    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });
});

describe('login()', () => {
  it('[27-58] 로그인 성공 시 isAuthenticated가 true가 되고 입력한 이메일이 노출된다', async () => {
    client.login.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref', token_type: 'bearer' });
    renderProvider();

    await act(async () => {
      screen.getByText('login').click();
    });

    expect(client.login).toHaveBeenCalledWith('a@b.com', 'pw1234');
    expect(screen.getByTestId('auth')).toHaveTextContent('true');
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.com');
  });
});

describe('signup()', () => {
  // 27-59(가입 직후 자동 로그인)는 REQ-C12에서 대체됐다 — 새 가입자는 승인 대기라 로그인이 403이다
  it('[C12-06] 가입 뒤 login()을 부르지 않고 미인증으로 남는다', async () => {
    client.signup.mockResolvedValue({ user_id: 'u1', email: 'a@b.com', role: 'user', status: 'pending' });
    renderProvider();

    await act(async () => {
      screen.getByText('signup').click();
    });

    expect([client.login.mock.calls.length, screen.getByTestId('auth').textContent]).toEqual([0, 'false']);
  });
});
