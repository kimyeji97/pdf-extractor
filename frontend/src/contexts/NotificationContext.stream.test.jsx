/**
 * REQ-P04 Phase 2 — 전역 알림의 전달 경로: 폴링 → SSE 스트림
 *
 * 검증 계약: docs/plans/PLAN-P04-websocket-push.md `## 검증 계약` (P04-20~27)
 *
 * F09 의 폴링 전제 케이스(F09-19·20·21·22·23·24)를 **대체**한다 — 2026-08-26 결정.
 * 데이터 처리(누적·dedup·unread_count 반영)는 F09 그대로고 **도착 경로만** 바뀐다.
 *
 * jsdom 에는 `EventSource` 가 없다. 아래 `FakeEventSource` 가 계획서가 고정한 표면을 흉내 낸다:
 *   - URL `…/notifications/stream`
 *   - 이벤트 `notification` (data = 알림 본문 + unread_count) · 이벤트 `read` (data = {unread_count: 0})
 *   - `addEventListener(type, fn)` 와 `on<type>` 둘 다 받는다 (구현이 어느 쪽을 써도 된다)
 *
 * ⚠️ 타이머를 단언하는 케이스(P04-21)에 `waitFor` 를 쓰지 않는다 — 내부가 setInterval 이다(계약 #25).
 */
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationProvider, useNotifications } from 'contexts/NotificationContext';

import * as client from 'api/client';

vi.mock('api/client', () => ({
  listNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
  getStatus: vi.fn(),
  getJobInfo: vi.fn(),
  listJobs: vi.fn(),
}));

const instances = [];

class FakeEventSource {
  constructor(url) {
    this.url = url;
    this.closed = false;
    this.listeners = {};
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
  }
  /** 서버가 이벤트를 보낸 것처럼 흘린다. */
  emit(type, data, lastEventId = '') {
    const ev = new MessageEvent(type, { data: JSON.stringify(data), lastEventId });
    (this.listeners[type] ?? []).forEach((fn) => fn(ev));
    this[`on${type}`]?.(ev);
  }
}

const feed = (items) => ({ notifications: items, unread_count: items.length });
const notif = (jobId, createdAt) => ({ job_id: jobId, created_at: createdAt, severity: 'success' });

function Probe() {
  const value = useNotifications();
  return (
    <>
      <span data-testid="count">{value.notifications.length}</span>
      <span data-testid="unread">{value.unreadCount}</span>
      <span data-testid="keys">{Object.keys(value).sort().join(',')}</span>
    </>
  );
}

function renderProvider(ui = <Probe />) {
  return render(
    <MemoryRouter initialEntries={['/analysis']}>
      <NotificationProvider>{ui}</NotificationProvider>
    </MemoryRouter>,
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function send(type, data) {
  await act(async () => {
    instances[0].emit(type, data);
  });
}

beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.clearAllMocks();
  client.listNotifications.mockResolvedValue(feed([]));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('스트림 구독', () => {
  it('[P04-20] EventSource가 /notifications/stream으로 1회 생성된다', async () => {
    renderProvider();
    await flush();

    expect(instances).toHaveLength(1);
    expect(instances[0].url).toMatch(/\/notifications\/stream$/);
  });

  it('[P04-21] setInterval을 만들지 않는다', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval');
    renderProvider();
    await flush();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('[P04-22] 첫 진입은 since 없이 피드를 1회 요청한다', async () => {
    renderProvider();
    await flush();

    expect(client.listNotifications).toHaveBeenCalledTimes(1);
    const [firstArg] = client.listNotifications.mock.calls[0] ?? [];
    expect(firstArg?.since).toBeFalsy();
  });

  it('[P04-27] 라우트가 바뀌어도 스트림이 닫히지 않는다', async () => {
    let navigate;
    function RouteProbe() {
      navigate = useNavigate();
      return null;
    }
    render(
      <MemoryRouter initialEntries={['/analysis']}>
        <NotificationProvider>
          <Routes>
            <Route path="/analysis" element={<RouteProbe />} />
            <Route path="/editor" element={<RouteProbe />} />
          </Routes>
        </NotificationProvider>
      </MemoryRouter>,
    );
    await flush();

    await act(async () => {
      navigate('/editor');
    });
    await flush();

    expect(instances).toHaveLength(1);
    expect(instances[0].closed).toBe(false);
  });
});

describe('이벤트 → 상태', () => {
  it('[P04-23] notification 이벤트가 목록에 누적되고 unreadCount가 반영된다', async () => {
    client.listNotifications.mockResolvedValueOnce(feed([notif('job-old', '2026-08-01T00:00:00+00:00')]));
    renderProvider();
    await flush();
    expect(screen.getByTestId('count')).toHaveTextContent('1');

    await send('notification', { ...notif('job-new', '2026-08-26T10:00:00+00:00'), unread_count: 2 });

    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('unread')).toHaveTextContent('2');
  });

  it('[P04-24] read 이벤트로 unreadCount가 0이 된다', async () => {
    renderProvider();
    await flush();
    await send('notification', { ...notif('job-a', '2026-08-26T10:00:00+00:00'), unread_count: 1 });
    expect(screen.getByTestId('unread')).toHaveTextContent('1');

    await send('read', { unread_count: 0 });

    expect(screen.getByTestId('unread')).toHaveTextContent('0');
  });

  it('[P04-25] 같은 job_id:created_at 이벤트는 한 번만 누적된다', async () => {
    renderProvider();
    await flush();
    const same = { ...notif('job-dup', '2026-08-26T10:00:00+00:00'), unread_count: 1 };

    await send('notification', same);
    await send('notification', same);

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('[P04-26] useNotifications 반환 형태는 {notifications, unreadCount}', async () => {
    renderProvider();
    await flush();

    expect(screen.getByTestId('keys')).toHaveTextContent('notifications,unreadCount');
  });
});
