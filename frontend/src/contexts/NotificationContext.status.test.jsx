/**
 * REQ-F14 Phase 1 — SSE `status` 이벤트: 알림이 아니라 "다시 읽으라"는 신호
 *
 * 검증 계약: docs/plans/PLAN-F14-stats-board-and-badges.md `## 검증 계약` (F14-04·05)
 *
 * 서버는 감지 상태가 `QUEUED`·`PROCESSING`으로 바뀔 때 저장하지 않는 `status` 이벤트(data = {job_id, boundaries_status})를 보낸다.
 * 알림 목록·미읽음 수에는 들어가지 않고(벨 뱃지·스낵바가 이 둘에서 나온다), 받은 횟수만 `useStatusEvents()`로 노출된다.
 *
 * ⚠️ `useNotifications()`의 값 키는 `notifications,unreadCount` 그대로여야 한다(P04 스트림 테스트가 고정) —
 *    횟수는 **별도 컨텍스트**(`useNotificationsReady`와 같은 모양)로 낸다.
 *
 * 무대는 P04 스트림 테스트(`NotificationContext.stream.test.jsx`)의 `FakeEventSource`와 같다.
 */
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationProvider, useNotifications, useStatusEvents } from 'contexts/NotificationContext';

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
    this[`on${type}`]?.(ev);
  }
}

function Probe() {
  const { notifications, unreadCount } = useNotifications();
  const statusEvents = useStatusEvents();
  return (
    <>
      <span data-testid="count">{notifications.length}</span>
      <span data-testid="unread">{unreadCount}</span>
      <span data-testid="status">{statusEvents}</span>
    </>
  );
}

const renderProvider = () => render(
  <MemoryRouter initialEntries={['/analysis']}>
    <NotificationProvider><Probe /></NotificationProvider>
  </MemoryRouter>,
);

async function flush() {
  await act(async () => { await Promise.resolve(); });
}

async function sendStatus(jobId, status) {
  await act(async () => {
    instances[0].emit('status', { job_id: jobId, boundaries_status: status });
  });
}

beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.clearAllMocks();
  client.listNotifications.mockResolvedValue({
    notifications: [{ job_id: 'old', created_at: '2026-09-29T00:00:00Z', severity: 'success' }],
    unread_count: 1,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('status 이벤트', () => {
  it('[F14-04] status 이벤트를 받아도 알림 목록·미읽음 수가 그대로다', async () => {
    renderProvider();
    await flush();

    await sendStatus('job-a', 'QUEUED');
    await sendStatus('job-a', 'PROCESSING');

    expect([screen.getByTestId('count').textContent, screen.getByTestId('unread').textContent]).toEqual(['1', '1']);
  });

  it('[F14-05] status 이벤트마다 useStatusEvents() 값이 1씩 오른다', async () => {
    renderProvider();
    await flush();
    const before = Number(screen.getByTestId('status').textContent);

    await sendStatus('job-a', 'QUEUED');
    await sendStatus('job-a', 'PROCESSING');

    expect(Number(screen.getByTestId('status').textContent)).toBe(before + 2);
  });
});
