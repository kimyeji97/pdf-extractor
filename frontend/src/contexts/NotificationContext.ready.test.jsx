/**
 * REQ-B11 — 기준선 GET 도착 신호 `useNotificationsReady()`
 *
 * 검증 계약: docs/plans/PLAN-B11-notification-baseline-before-feed.md `## 검증 계약` (B11-01~03)
 *
 * 버그의 핵심은 **순서**다 — 마운트 → (아직 빈 목록) → 기준선 GET 도착. 그래서 `listNotifications`
 * mock 을 즉시 resolve 하면 버그가 안 보인다. 아래는 resolve/reject 시점을 테스트가 쥔다(deferred).
 * jsdom 에 `EventSource` 가 없어 `NotificationContext.stream.test.jsx` 와 같은 FakeEventSource 를 둔다.
 */
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationProvider, useNotifications, useNotificationsReady } from 'contexts/NotificationContext';

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
    this.listeners = {};
    instances.push(this);
  }
  addEventListener(type, fn) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn);
  }
  close() {}
  emit(type, data) {
    const ev = new MessageEvent(type, { data: JSON.stringify(data) });
    (this.listeners[type] ?? []).forEach((fn) => fn(ev));
  }
}

const feed = (items) => ({ notifications: items, unread_count: items.length });
const notif = (jobId, createdAt) => ({ job_id: jobId, created_at: createdAt, severity: 'success' });

/** resolve/reject 를 바깥에서 쥐는 Promise. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function Probe() {
  const ready = useNotificationsReady();
  const { notifications } = useNotifications();
  return (
    <>
      <span data-testid="ready">{String(ready)}</span>
      <span data-testid="count">{notifications.length}</span>
    </>
  );
}

function renderProvider() {
  return render(
    <MemoryRouter initialEntries={['/analysis']}>
      <NotificationProvider>
        <Probe />
      </NotificationProvider>
    </MemoryRouter>,
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useNotificationsReady', () => {
  it('[B11-01] 기준선 GET이 resolve되기 전엔 false, 된 뒤 true', async () => {
    const d = deferred();
    client.listNotifications.mockReturnValue(d.promise);
    renderProvider();
    await flush();

    expect(screen.getByTestId('ready')).toHaveTextContent('false');

    await act(async () => {
      d.resolve(feed([notif('job-old', '2026-08-01T00:00:00+00:00')]));
      await d.promise;
    });
    await flush();

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
  });

  it('[B11-02] 기준선 GET이 reject돼도 true가 된다', async () => {
    const d = deferred();
    client.listNotifications.mockReturnValue(d.promise);
    renderProvider();
    await flush();
    expect(screen.getByTestId('ready')).toHaveTextContent('false');

    await act(async () => {
      d.reject(new Error('네트워크 실패'));
      await d.promise.catch(() => {});
    });
    await flush();

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
  });

  it('[B11-03] GET 실패 뒤 도착한 스트림 이벤트가 목록에 반영된다', async () => {
    client.listNotifications.mockRejectedValue(new Error('네트워크 실패'));
    renderProvider();
    await flush();
    await flush();
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await act(async () => {
      instances[0].emit('notification', { ...notif('job-new', '2026-08-27T10:00:00+00:00'), unread_count: 1 });
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
