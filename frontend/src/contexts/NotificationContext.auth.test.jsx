/**
 * REQ-B27 Phase 2 재작업 — 알림 연결 수명을 로그인 상태에 묶는다
 *
 * 검증 계약: docs/plans/PLAN-B27-notification-per-user.md `## 검증 계약` (B27-26~29·31·34·35)
 *
 * `/review B27`(2026-10-02) (b) 2건: Provider 가 마운트 1회만 연결해 ① 로그인 화면에서 시작하면 알림이 죽고
 * ② 같은 탭의 계정 전환에서 앞 사용자의 알림이 남았다 · 토큰 만료로 스트림이 401 CLOSED 되면 다시 열지 않았다.
 * 실제 `AuthProvider` 를 바깥에 둔다(App.tsx 와 같은 무대). `FakeEventSource` 는 `NotificationContext.b27.test.jsx` 와 같다.
 */
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from 'contexts/AuthContext';
import { NotificationProvider, useNotifications } from 'contexts/NotificationContext';

import * as client from 'api/client';

vi.mock('api/client', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  listNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
  refreshAccessToken: vi.fn(),
  getStatus: vi.fn(),
  getJobInfo: vi.fn(),
  listJobs: vi.fn(),
}));

const instances = [];

class FakeEventSource {
  static CLOSED = 2;
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = {};
    this.readyState = 0;
    this.closed = false;
    instances.push(this);
  }
  addEventListener(type, fn) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn);
  }
  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }
  /** 401 등 HTTP 오류 — 브라우저는 재시도하지 않고 CLOSED 로 끝낸다 */
  fail() {
    this.readyState = FakeEventSource.CLOSED;
    const ev = new Event('error');
    this.onerror?.(ev);
    (this.listeners.error ?? []).forEach((fn) => fn(ev));
  }
}

const notif = (jobId, at) => ({ job_id: jobId, created_at: at, severity: 'success', title: jobId, read: false });

function Probe() {
  const { login, logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  return (
    <div>
      <span data-testid="jobs">{notifications.map((n) => n.job_id).join(',')}</span>
      <span data-testid="unread">{unreadCount}</span>
      <button onClick={() => login('b@b.com', 'pw')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const renderApp = () =>
  render(
    <MemoryRouter initialEntries={['/analysis']}>
      <AuthProvider>
        <NotificationProvider>
          <Probe />
        </NotificationProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const click = (label) => act(async () => { screen.getByText(label).click(); });

const loggedInAs = (email) => {
  localStorage.setItem('access_token', 'tok');
  localStorage.setItem('refresh_token', 'ref');
  localStorage.setItem('user_email', email);
};

beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.clearAllMocks();
  localStorage.clear();
  client.login.mockResolvedValue({});
  client.logout.mockResolvedValue(undefined);
  client.refreshAccessToken.mockResolvedValue(true);
  client.listNotifications.mockResolvedValue({ notifications: [], unread_count: 0 });
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('NotificationContext — 로그인 상태와 연결 수명 (B27)', () => {
  it('[B27-26] 로그아웃 상태로 마운트하면 목록 GET·스트림 연결을 하지 않는다', async () => {
    renderApp();
    await flush();

    expect({ gets: client.listNotifications.mock.calls.length, streams: instances.length })
      .toEqual({ gets: 0, streams: 0 });
  });

  it('[B27-27] 로그아웃 → 로그인하면 목록 GET 1회 + 스트림 연결', async () => {
    renderApp();
    await flush();

    await click('login');
    await flush();

    expect({ gets: client.listNotifications.mock.calls.length, streams: instances.length })
      .toEqual({ gets: 1, streams: 1 });
  });

  it('[B27-28] 로그아웃하면 스트림을 닫고 알림 목록·미확인 수를 비운다', async () => {
    loggedInAs('a@a.com');
    client.listNotifications.mockResolvedValue({
      notifications: [notif('job-a', '2026-10-02T01:00:00+00:00')],
      unread_count: 1,
    });
    renderApp();
    await flush();

    await click('logout');
    await flush();

    expect({
      closed: instances[0].closed,
      jobs: screen.getByTestId('jobs').textContent,
      unread: screen.getByTestId('unread').textContent,
    }).toEqual({ closed: true, jobs: '', unread: '0' });
  });

  it('[B27-29] A 로그아웃 → B 로그인: 새 스트림이 열리고 A의 알림이 남지 않는다', async () => {
    loggedInAs('a@a.com');
    client.listNotifications.mockResolvedValueOnce({
      notifications: [notif('job-a', '2026-10-02T01:00:00+00:00')],
      unread_count: 1,
    });
    renderApp();
    await flush();

    await click('logout');
    await flush();
    client.listNotifications.mockResolvedValueOnce({
      notifications: [notif('job-b', '2026-10-02T02:00:00+00:00')],
      unread_count: 1,
    });
    await click('login');
    await flush();

    expect({
      streams: instances.length,
      liveIsNew: !instances.at(-1).closed && instances.at(-1) !== instances[0],
      jobs: screen.getByTestId('jobs').textContent,
    }).toEqual({ streams: 2, liveIsNew: true, jobs: 'job-b' });
  });

  it('[B27-31] 스트림이 CLOSED 로 끝나면 토큰을 갱신하고 새 스트림을 연다', async () => {
    loggedInAs('a@a.com');
    renderApp();
    await flush();

    await act(async () => { instances[0].fail(); });
    await flush();

    expect({ refreshed: client.refreshAccessToken.mock.calls.length, streams: instances.length })
      .toEqual({ refreshed: 1, streams: 2 });
  });

  it('[B27-34] 수동 재연결 시 since(마지막 본 알림 시각)로 끊긴 동안의 알림을 읽어 합친다', async () => {
    loggedInAs('a@a.com');
    client.listNotifications.mockResolvedValueOnce({
      notifications: [notif('job-old', '2026-10-02T01:00:00+00:00')],
      unread_count: 1,
    });
    renderApp();
    await flush();
    client.listNotifications.mockResolvedValueOnce({
      notifications: [notif('job-missed', '2026-10-02T02:00:00+00:00')],
      unread_count: 2,
    });

    await act(async () => { instances[0].fail(); });
    await flush();

    expect({
      since: client.listNotifications.mock.calls.at(-1)?.[0]?.since,
      jobs: screen.getByTestId('jobs').textContent,
    }).toEqual({ since: '2026-10-02T01:00:00+00:00', jobs: 'job-missed,job-old' });
  });

  it('[B27-35] 기준선 GET 실패 뒤 수동 재연결해도 연결 전부터 있던 알림을 넣지 않는다', async () => {
    loggedInAs('a@a.com');
    // 서버처럼 응답한다 — since 가 없으면 최근 30일치 전부, 있으면 그 이후분만
    const old = [notif('job-old', '2020-01-01T00:00:00+00:00')];
    client.listNotifications
      .mockRejectedValueOnce(new Error('503'))
      .mockImplementation((opts) =>
        Promise.resolve({
          notifications: old.filter((n) => !opts?.since || n.created_at > opts.since),
          unread_count: 0,
        }),
      );
    renderApp();
    await flush();

    await act(async () => { instances[0].fail(); });
    await flush();

    expect(screen.getByTestId('jobs').textContent).toBe('');
  });
});
