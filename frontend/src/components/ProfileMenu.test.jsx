/**
 * REQ-27 Phase 5 — 계정 메뉴(account-popover) — 이메일 표시 + 로그아웃
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-66~27-67)
 *
 * `ColorSchemeMenu`와 같은 IconButton+Menu 무대다. `RequireAuth`로 감싸 렌더하는 이유는
 * 27-67이 "로그아웃 버튼 자체"가 아니라 "로그아웃 후 실제로 보호 화면 접근이 막히는가"를
 * 보기 위해서다 — `RequireAuth.test.jsx`(Phase 4)와 같은 인증/미인증 분기 무대를 재사용한다.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProfileMenu from 'components/ProfileMenu';
import RequireAuth from 'components/RequireAuth';
import { AuthProvider } from 'contexts/AuthContext';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));

function renderProtectedWithMenu() {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <ProfileMenu />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>LOGIN PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </AuthProvider>,
  );
}

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: '계정 메뉴' }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('access_token', 'tok');
  localStorage.setItem('user_email', 'a@b.com');
});

afterEach(() => {
  localStorage.clear();
});

describe('ProfileMenu', () => {
  it('[27-66] 메뉴를 열면 로그인한 사용자의 이메일이 표시된다', () => {
    renderProtectedWithMenu();

    openMenu();

    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('[27-67] "로그아웃" 클릭 후 보호된 화면 접근 시 /login으로 리다이렉트된다', () => {
    renderProtectedWithMenu();

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: '로그아웃' }));

    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });
});
