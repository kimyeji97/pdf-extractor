/**
 * REQ-27 Phase 4 — 인증 가드 (격리 단위 테스트)
 *
 * 검증 계약: docs/plans/PLAN-27-login-registration.md `## 검증 계약` (27-60~27-61)
 *
 * `RequireAuth`가 실제 라우터에 물려 있는지는 `routes/authRouting.test.jsx`(27-47)가 본다.
 * 여기는 인증/미인증 두 분기의 렌더 결과만 격리해서 본다 — `AuthProvider`가 마운트 시
 * `access_token` 유무로 `isAuthenticated`를 정하므로, `RequireAuth`도 그 값을 그대로 쓴다
 * (컨텍스트 밖에서 localStorage를 다시 읽지 않는다 — 단일 출처).
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RequireAuth from 'components/RequireAuth';
import { AuthProvider } from 'contexts/AuthContext';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

function renderGuarded() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <div>PROTECTED CONTENT</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('RequireAuth', () => {
  it('[27-60] 인증된 상태에서는 children을 그대로 렌더한다', () => {
    localStorage.setItem('access_token', 'tok');

    renderGuarded();

    expect(screen.getByText('PROTECTED CONTENT')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument();
  });

  it('[27-61] 미인증 상태에서는 children을 렌더하지 않고 /login으로 리다이렉트한다', () => {
    renderGuarded();

    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED CONTENT')).not.toBeInTheDocument();
  });
});
