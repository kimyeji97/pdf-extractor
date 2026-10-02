/**
 * REQ-B27 Phase 2 — 스트림 쿠키 동반 · read 이벤트의 미확인 수
 *
 * 검증 계약: docs/plans/PLAN-B27-notification-per-user.md `## 검증 계약` (B27-18·25)
 *
 * 프론트(dailystudy-workbook-dev…)와 API(dailystudy-workbook-api-dev…)는 다른 오리진이라
 * `EventSource` 는 `withCredentials: true` 가 없으면 쿠키를 안 싣는다 — 스트림이 B27 Phase 1 로 인증을 요구한다.
 * `read` 이벤트는 이제 사용자별이고 남은 미확인 수를 싣는다(0 고정이 아니다).
 * `FakeEventSource` 무대는 `NotificationContext.stream.test.jsx` 와 같다(옵션만 함께 기록).
 */
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
  constructor(url, options) {
    this.url = url;
    this.options = options;
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

function Probe() {
  const { unreadCount } = useNotifications();
  return <span data-testid="unread">{unreadCount}</span>;
}

const renderProvider = () =>
  render(
    <MemoryRouter initialEntries={['/analysis']}>
      <NotificationProvider><Probe /></NotificationProvider>
    </MemoryRouter>,
  );

const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.clearAllMocks();
  client.listNotifications.mockResolvedValue({ notifications: [], unread_count: 5 });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NotificationContext — B27', () => {
  it('[B27-18] 스트림을 withCredentials: true 로 연다', async () => {
    renderProvider();
    await flush();

    expect(instances[0].options?.withCredentials).toBe(true);
  });

  it('[B27-25] read 이벤트의 unread_count 를 그대로 쓴다', async () => {
    renderProvider();
    await flush();

    await act(async () => { instances[0].emit('read', { unread_count: 2 }); });

    expect(screen.getByTestId('unread').textContent).toBe('2');
  });
});
