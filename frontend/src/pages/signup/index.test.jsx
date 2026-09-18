/**
 * REQ-27 Phase 4 — 회원가입 화면
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-63)
 *
 * `login/index.test.jsx`와 같은 이유로 렌더 무대가 선다. 이 케이스는 signup() 호출까지만
 * 본다 — 그 직후 자동 로그인(27-59)은 `AuthContext.test.jsx`가 컨텍스트 레벨에서 이미 본다.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SignupPage from 'pages/signup';
import { AuthProvider } from 'contexts/AuthContext';
import { ThemeProvider } from 'theme/theme-provider';
import * as client from 'api/client';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <ThemeProvider>
          <SignupPage />
        </ThemeProvider>
      </MemoryRouter>
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

describe('회원가입 화면', () => {
  it('[27-63] 이메일·비밀번호를 입력하고 제출하면 그 값 그대로 signup()이 호출된다', async () => {
    client.signup.mockResolvedValue({ user_id: 'u1', email: 'a@b.com', role: 'user' });
    client.login.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref', token_type: 'bearer' });
    renderPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw1234' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    });

    expect(client.signup).toHaveBeenCalledWith('a@b.com', 'pw1234');
  });
});
