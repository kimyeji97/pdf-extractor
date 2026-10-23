/**
 * REQ-F20 Phase 4 — 첫 진입 때 튜토리얼 화면으로 보내기
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-26~32)
 *
 * 무대는 AuthProvider + ThemeProvider + MemoryRouter. 이동은 `Probe`가 찍는 현재 경로로 본다.
 * "새 브라우저 세션"은 unmount 뒤 sessionStorage.clear(), 다시 보지 않기 기록은 튜토리얼 화면의 실제 흐름으로 만든다 —
 * 저장 키 이름은 구현 몫이라 테스트는 키를 직접 보지 않는다.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TutorialGate from 'components/TutorialGate';
import { AuthProvider } from 'contexts/AuthContext';
import TutorialsPage from 'pages/tutorials';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));

const T1 = { id: 't1', title: '첫 튜토리얼', slides: [{ title: '슬라이드 하나', body: ['본문 하나'] }] };

function Probe() {
  const l = useLocation();
  return <div data-testid="loc">{l.pathname + l.search}</div>;
}

const stage = (children, entry = '/') =>
  render(
    <AuthProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={[entry]}>
          {children}
          <Probe />
        </MemoryRouter>
      </ThemeProvider>
    </AuthProvider>,
  );

const renderGate = (tutorials = [T1]) => stage(<TutorialGate tutorials={tutorials} />);
const loc = () => screen.getByTestId('loc').textContent;
const settle = () => act(async () => {});

const loginAs = (email) => {
  localStorage.setItem('access_token', 'tok');
  localStorage.setItem('user_email', email);
};

/** 자동 모드 튜토리얼 화면에서 [다시 보지 않기]로 T1을 끈다 */
async function dismissT1() {
  const { unmount } = stage(<TutorialsPage tutorials={[T1]} />, '/tutorials?auto=1');
  await screen.findByText('본문 하나');
  fireEvent.click(screen.getByRole('button', { name: '다시 보지 않기' }));
  await settle();
  unmount();
  sessionStorage.clear();
}

const AUTH_KEYS = ['access_token', 'user_email'];

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  loginAs('a@test.local');
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('첫 진입 이동', () => {
  it('[F20-26] 안 본 묶음이 있으면 첫 진입 때 /tutorials?auto=1 로 보낸다', async () => {
    renderGate();

    await waitFor(() => expect(loc()).toBe('/tutorials?auto=1'));
  });

  it('[F20-27] 같은 세션에서 다시 마운트해도 다시 보내지 않는다', async () => {
    const first = renderGate();
    await waitFor(() => expect(loc()).toBe('/tutorials?auto=1'));
    first.unmount();

    renderGate();
    await settle();

    expect(loc()).toBe('/');
  });

  it('[F20-28] 새 세션이면 다시 보낸다', async () => {
    const first = renderGate();
    await waitFor(() => expect(loc()).toBe('/tutorials?auto=1'));
    first.unmount();
    sessionStorage.clear();

    renderGate();

    await waitFor(() => expect(loc()).toBe('/tutorials?auto=1'));
  });

  it('[F20-29] 모든 묶음이 기록돼 있으면 보내지 않는다', async () => {
    await dismissT1();

    renderGate();
    await settle();

    expect(loc()).toBe('/');
  });

  it('[F20-30] 다른 이메일은 그 계정 기준으로 판단한다', async () => {
    await dismissT1();
    loginAs('b@test.local');

    renderGate();

    await waitFor(() => expect(loc()).toBe('/tutorials?auto=1'));
  });

  it('[F20-31] 로그인 안 했으면 보내지 않는다', async () => {
    localStorage.clear();

    renderGate();
    await settle();

    expect(loc()).toBe('/');
  });

  it('[F20-32] 저장소 읽기가 예외여도 안 죽고 보낸다', async () => {
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function getItem(key) {
      if (AUTH_KEYS.includes(key)) return original.call(this, key);
      throw new Error('storage denied');
    });

    renderGate();

    await waitFor(() => expect(loc()).toBe('/tutorials?auto=1'));
  });
});
