/**
 * REQ-F20 Phase 4 — 전용 튜토리얼 화면 (`/tutorials`)
 *
 * 검증 계약: docs/plans/PLAN-F20-tutorial.md `## 검증 계약` (F20-33~43, F20-47~50)
 *
 * `?auto=1`이면 자동 모드(안 본 묶음을 차례로, 본 기록을 남긴다), 없으면 다시 보기(기록을 안 바꾼다).
 * 왼쪽 목차의 묶음 항목은 묶음 제목을, 슬라이드 항목은 슬라이드 제목을 이름으로 가진 버튼이다.
 * F20-47·48은 페이지를 라우터 없이 직접 렌더한다 — `?auto`가 바뀔 때 다시 마운트하는 일은 페이지 모듈이 맡는다(리뷰 회차 2 결정 A).
 * 기록이 남았는지는 새 세션에서 `TutorialGate`가 보내는지로 본다 — 저장 키 이름은 구현 몫이다.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TutorialGate from 'components/TutorialGate';
import TutorialMenu from 'components/TutorialMenu';
import { AuthProvider } from 'contexts/AuthContext';
import TutorialsPage from 'pages/tutorials';
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
    { title: '슬라이드 하나', body: '본문 하나', image: '/tutorials/sample.png' },
    { title: '슬라이드 둘', body: '본문 둘' },
  ],
};
const T2 = { id: 't2', title: '둘째 튜토리얼', slides: [{ title: '둘째 슬라이드', body: '둘째 본문' }] };

function Probe() {
  const l = useLocation();
  return <div data-testid="loc">{l.pathname + l.search}</div>;
}

/** 테스트에서 `?auto=1`로 옮겨 가는 버튼 */
function GoAuto() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate('/tutorials?auto=1')}>자동으로</button>;
}

const stage = (children, entry) =>
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

const renderAuto = (tutorials = [T1, T2]) => stage(<TutorialsPage tutorials={tutorials} />, '/tutorials?auto=1');
const renderReplay = (tutorials = [T1, T2]) => stage(<TutorialsPage tutorials={tutorials} />, '/tutorials');
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const settle = () => act(async () => {});

/** 새 세션에서 Gate가 보내면 true — 그 묶음이 아직 기록되지 않았다는 뜻 */
async function gateRedirectsInNewSession(unmount, tutorials) {
  unmount();
  sessionStorage.clear();
  stage(<TutorialGate tutorials={tutorials} />, '/');
  await settle();
  return screen.getByTestId('loc').textContent === '/tutorials?auto=1';
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('access_token', 'tok');
  localStorage.setItem('user_email', 'a@test.local');
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('자동 모드', () => {
  it('[F20-33] 첫 번째 안 본 묶음의 첫 슬라이드부터 보인다', async () => {
    renderAuto();

    expect(await screen.findByText('본문 하나')).toBeInTheDocument();
  });

  it('[F20-36] 묶음 마지막 슬라이드에서 [다음]을 누르면 다음 안 본 묶음 첫 슬라이드로 간다', async () => {
    renderAuto();
    await screen.findByText('본문 하나');
    click('다음');

    click('다음');

    expect(await screen.findByText('둘째 본문')).toBeInTheDocument();
  });

  it('[F20-37] 끝까지 본 묶음은 새 세션에서 보내지 않는다', async () => {
    const { unmount } = renderAuto();
    await screen.findByText('본문 하나');
    click('다음');
    click('다음');
    await screen.findByText('둘째 본문');

    expect(await gateRedirectsInNewSession(unmount, [T1])).toBe(false);
  });

  it('[F20-38] [다시 보지 않기]를 누르면 다음 묶음으로 가고 그 묶음은 새 세션에서 보내지 않는다', async () => {
    const { unmount } = renderAuto();
    await screen.findByText('본문 하나');
    click('다시 보지 않기');
    await screen.findByText('둘째 본문');

    expect(await gateRedirectsInNewSession(unmount, [T1])).toBe(false);
  });

  it('[F20-39] 저장소 쓰기가 예외여도 [다시 보지 않기]로 다음 묶음에 간다', async () => {
    renderAuto();
    await screen.findByText('본문 하나');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied');
    });

    click('다시 보지 않기');

    expect(await screen.findByText('둘째 본문')).toBeInTheDocument();
  });
});

describe('슬라이드', () => {
  it('[F20-34] [다음]으로 다음 슬라이드가 보인다', async () => {
    renderReplay();
    await screen.findByText('본문 하나');

    click('다음');

    expect(screen.getByText('본문 둘')).toBeInTheDocument();
  });

  it('[F20-35] [이전]으로 이전 슬라이드가 보인다', async () => {
    renderReplay();
    await screen.findByText('본문 하나');
    click('다음');

    click('이전');

    expect(screen.getByText('본문 하나')).toBeInTheDocument();
  });

  it('[F20-43] 스크린샷을 alt가 슬라이드 제목인 이미지로 그린다', async () => {
    renderReplay();
    await screen.findByText('본문 하나');

    expect(screen.getByRole('img', { name: '슬라이드 하나' })).toHaveAttribute('src', '/tutorials/sample.png');
  });
});

describe('다시 보기', () => {
  it('[F20-40] 목차에서 묶음을 고르면 그 첫 슬라이드가 보인다', async () => {
    renderReplay();
    await screen.findByText('본문 하나');

    click('둘째 튜토리얼');

    expect(await screen.findByText('둘째 본문')).toBeInTheDocument();
  });

  it('[F20-41] 다시 보기에서 끝까지 넘겨도 본 기록이 바뀌지 않는다', async () => {
    const { unmount } = renderReplay([T1]);
    await screen.findByText('본문 하나');
    click('다음');
    const more = screen.queryByRole('button', { name: '다음' });
    if (more && !more.disabled) fireEvent.click(more);
    await settle();

    expect(await gateRedirectsInNewSession(unmount, [T1])).toBe(true);
  });

  it('[F20-42] [다시 보지 않기] 버튼이 없다', async () => {
    renderReplay();
    await screen.findByText('본문 하나');

    expect(screen.queryByRole('button', { name: '다시 보지 않기' })).toBeNull();
  });
});

describe('모드 전환 (리뷰 회차 2)', () => {
  /** 마지막 장의 진행 버튼이 있으면 누른다 — 자동 모드면 [확인]·[다음], 다시 보기면 비활성 [다음] */
  const finishIfPossible = async () => {
    const btn = screen.queryByRole('button', { name: '확인' }) ?? screen.queryByRole('button', { name: '다음' });
    if (btn && !btn.disabled) fireEvent.click(btn);
    await settle();
  };

  it('[F20-47] 자동 모드를 다 본 뒤 ? 버튼을 누르면 다시 보기 첫 묶음 첫 슬라이드가 보인다', async () => {
    stage(<><TutorialMenu /><TutorialsPage tutorials={[T1]} /></>, '/tutorials?auto=1');
    await screen.findByText('본문 하나');
    click('다음');
    click('확인');
    await settle();

    click('튜토리얼');

    expect(await screen.findByText('본문 하나')).toBeInTheDocument();
  });

  it('[F20-48] 다시 보기에서 2장째를 보다가 ?auto=1로 이동하면 안 본 묶음 첫 슬라이드부터 보인다', async () => {
    stage(<><GoAuto /><TutorialsPage tutorials={[T1, T2]} /></>, '/tutorials');
    await screen.findByText('본문 하나');
    click('다음');
    await screen.findByText('본문 둘');

    click('자동으로');

    expect(await screen.findByText('본문 하나')).toBeInTheDocument();
  });

  it('[F20-49] 자동 모드에서 목차의 슬라이드를 누른 뒤 끝까지 넘겨도 본 기록이 바뀌지 않는다', async () => {
    const { unmount } = renderAuto([T1]);
    await screen.findByText('본문 하나');

    click('슬라이드 둘');
    await screen.findByText('본문 둘');
    await finishIfPossible();

    expect(await gateRedirectsInNewSession(unmount, [T1])).toBe(true);
  });

  it('[F20-50] 자동 모드에서 목차의 묶음을 누른 뒤 끝까지 넘겨도 본 기록이 바뀌지 않는다', async () => {
    const { unmount } = renderAuto([T1]);
    await screen.findByText('본문 하나');

    click('첫 튜토리얼');
    click('다음');
    await screen.findByText('본문 둘');
    await finishIfPossible();

    expect(await gateRedirectsInNewSession(unmount, [T1])).toBe(true);
  });
});
