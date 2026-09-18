/**
 * REQ-27 Phase 4 — 로그인 화면
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-62)
 *
 * `editor/index.jsx`·`format/index.jsx`와 달리 이 화면은 API mock이 `login` 하나뿐이라
 * 렌더 무대가 선다(계획서 § 제약·함정의 "가능성이 높다"는 우려와 달리, 착수 시 확인 결과
 * 이 화면·회원가입 화면은 렌더 가능하다고 판단했다). `AuthContext`는 모킹하지 않고 실제
 * `AuthProvider`를 써서 화면 → 컨텍스트 → `api/client`까지 통짜로 본다.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from 'pages/login';
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
          <LoginPage />
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

describe('로그인 화면', () => {
  it('[27-62] 이메일·비밀번호를 입력하고 제출하면 그 값 그대로 login()이 호출된다', async () => {
    client.login.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref', token_type: 'bearer' });
    renderPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw1234' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    });

    expect(client.login).toHaveBeenCalledWith('a@b.com', 'pw1234');
  });
});
