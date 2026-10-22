/**
 * REQ-F20 Phase 2 — 헤더 도움말 버튼과 다시 보기 목록
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-14~15, F20-23)
 *
 * 무대는 `TutorialGate.test.jsx`와 같다. F20-15는 Gate의 [다시 보지 않기]로 먼저 끄고 메뉴에서 다시 연다 —
 * 실제 흐름을 밟으므로 저장 키 이름을 몰라도 된다.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TutorialGate from 'components/TutorialGate';
import TutorialMenu from 'components/TutorialMenu';
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

const renderWith = (children) =>
  render(
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>,
  );

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: '튜토리얼' }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('access_token', 'tok');
  localStorage.setItem('user_email', 'a@test.local');
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('다시 보기 목록', () => {
  it('[F20-14] 도움말 버튼을 누르면 튜토리얼 제목 목록이 뜬다', () => {
    renderWith(<TutorialMenu tutorials={[T1, T2]} />);

    openMenu();

    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual(['첫 튜토리얼', '둘째 튜토리얼']);
  });

  it('[F20-15] 다시 보지 않기로 끈 튜토리얼도 목록에서 고르면 모달이 첫 슬라이드로 열린다', async () => {
    renderWith(
      <>
        <TutorialGate tutorials={[T1]} />
        <TutorialMenu tutorials={[T1]} />
      </>,
    );
    await screen.findByText('본문 하나');
    fireEvent.click(screen.getByRole('button', { name: '다시 보지 않기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: '첫 튜토리얼' }));

    expect(within(await screen.findByRole('dialog')).getByText('본문 하나')).toBeInTheDocument();
  });
});

describe('다시 보기는 본 기록을 바꾸지 않는다 (Phase 3)', () => {
  it('[F20-23] 다시 연 튜토리얼을 [확인]으로 닫아도 본 기록이 안 바뀌어 새 세션에 그대로 뜬다', async () => {
    const { unmount } = renderWith(<TutorialMenu tutorials={[T2]} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: '둘째 튜토리얼' }));
    await screen.findByText('둘째 본문');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    unmount();
    sessionStorage.clear();

    renderWith(<TutorialGate tutorials={[T2]} />);

    expect(await screen.findByText('둘째 본문')).toBeInTheDocument();
  });
});
