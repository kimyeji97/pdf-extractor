/**
 * REQ-F20 Phase 1 — 튜토리얼 틀 (첫 화면 노출 · 슬라이드 · 닫기 · 다시 보지 않기)
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-01~11, F20-22)
 *
 * 무대는 `ProfileMenu.test.jsx`와 같다 — AuthProvider + ThemeProvider, 로그인 상태는 localStorage로 심는다.
 * "새로고침"은 unmount 후 다시 render, "새 브라우저 세션"은 거기에 sessionStorage.clear()를 더한 것으로 본다.
 * 저장 키 이름은 구현 몫이라 테스트는 키를 직접 보지 않는다.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TutorialGate from 'components/TutorialGate';
import { AuthProvider } from 'contexts/AuthContext';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));

const T1 = {
  id: 't1',
  title: '첫 튜토리얼',
  slides: [
    { title: '슬라이드 하나', body: '본문 하나' },
    { title: '슬라이드 둘', body: '본문 둘' },
  ],
};
const T2 = { id: 't2', title: '둘째 튜토리얼', slides: [{ title: '둘째 슬라이드', body: '둘째 본문' }] };

const loginAs = (email) => {
  localStorage.setItem('access_token', 'tok');
  localStorage.setItem('user_email', email);
};

const renderGate = (tutorials = [T1]) =>
  render(
    <AuthProvider>
      <ThemeProvider>
        <TutorialGate tutorials={tutorials} />
      </ThemeProvider>
    </AuthProvider>,
  );

const click = (name) => fireEvent.click(screen.getByRole('button', { name }));

// 인증 키는 AuthProvider 초기화에 필요하다 — 그 둘만 통과시키고 나머지 저장소 접근을 실패시킨다
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

describe('첫 화면 노출', () => {
  it('[F20-01] 로그인 상태에서 안 본 튜토리얼이 모달로 뜬다', async () => {
    renderGate();

    expect(await screen.findByText('첫 튜토리얼')).toBeInTheDocument();
  });

  it('[F20-08] 안 본 것이 2개면 첫째를 닫은 뒤 둘째가 뜬다', async () => {
    renderGate([T1, T2]);
    await screen.findByText('첫 튜토리얼');

    click('닫기');

    expect(await screen.findByText('둘째 튜토리얼')).toBeInTheDocument();
  });

  it('[F20-11] 로그인 안 한 상태(이메일 없음)에선 안 뜬다', () => {
    localStorage.clear();
    renderGate();

    expect(screen.queryByText('첫 튜토리얼')).toBeNull();
  });
});

describe('슬라이드', () => {
  it('[F20-02] [다음]을 누르면 두 번째 슬라이드로 간다', async () => {
    renderGate();
    await screen.findByText('첫 튜토리얼');

    click('다음');

    expect(screen.getByText('본문 둘')).toBeInTheDocument();
  });

  it('[F20-03] [이전]을 누르면 첫 슬라이드로 돌아간다', async () => {
    renderGate();
    await screen.findByText('첫 튜토리얼');
    click('다음');

    click('이전');

    expect(screen.getByText('본문 하나')).toBeInTheDocument();
  });
});

describe('닫기 · 다시 보지 않기', () => {
  it('[F20-04] [닫기] 뒤 다시 마운트(새로고침)하면 안 뜬다', async () => {
    const { unmount } = renderGate();
    await screen.findByText('첫 튜토리얼');
    click('닫기');
    unmount();

    renderGate();

    expect(screen.queryByText('첫 튜토리얼')).toBeNull();
  });

  it('[F20-05] [닫기] 뒤 새 세션에서 마운트하면 다시 뜬다', async () => {
    const { unmount } = renderGate();
    await screen.findByText('첫 튜토리얼');
    click('닫기');
    unmount();
    sessionStorage.clear();

    renderGate();

    expect(await screen.findByText('첫 튜토리얼')).toBeInTheDocument();
  });

  it('[F20-06] [다시 보지 않기] 뒤 새 세션에서도 안 뜬다', async () => {
    const { unmount } = renderGate();
    await screen.findByText('첫 튜토리얼');
    click('다시 보지 않기');
    unmount();
    sessionStorage.clear();

    renderGate();

    expect(screen.queryByText('첫 튜토리얼')).toBeNull();
  });

  it('[F20-07] A 계정이 끈 튜토리얼이 B 계정에는 뜬다', async () => {
    const { unmount } = renderGate();
    await screen.findByText('첫 튜토리얼');
    click('다시 보지 않기');
    unmount();
    sessionStorage.clear();
    loginAs('b@test.local');

    renderGate();

    expect(await screen.findByText('첫 튜토리얼')).toBeInTheDocument();
  });
});

describe('저장소 실패', () => {
  it('[F20-09] 저장소 읽기가 예외를 던지면 안 본 것으로 보고 띄운다', async () => {
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function getItem(key) {
      if (AUTH_KEYS.includes(key)) return original.call(this, key);
      throw new Error('storage denied');
    });

    renderGate();

    expect(await screen.findByText('첫 튜토리얼')).toBeInTheDocument();
  });

  it('[F20-10] 저장소 쓰기가 예외를 던져도 [다시 보지 않기]로 모달이 닫힌다', async () => {
    renderGate();
    await screen.findByText('첫 튜토리얼');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied');
    });

    click('다시 보지 않기');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('끝까지 본 경우 (Phase 3)', () => {
  it('[F20-22] 마지막 슬라이드 [확인] 뒤 새 세션에서도 안 뜬다', async () => {
    const { unmount } = renderGate();
    await screen.findByText('첫 튜토리얼');
    click('다음');
    click('확인');
    unmount();
    sessionStorage.clear();

    renderGate();

    expect(screen.queryByText('첫 튜토리얼')).toBeNull();
  });
});
