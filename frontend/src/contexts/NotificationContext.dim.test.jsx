/**
 * REQ-C09 Phase 1 — 계약 #26 회귀 케이스: 배경 경로(기준선 GET·스트림)는 전역 딤을 켜지 않는다
 *
 * 검증 계약: docs/plans/PLAN-C09-notification-followups.md `## 검증 계약` (C09-10·11)
 *
 * P04 `/testgen` 에서 "로딩 카운터가 노출돼 있지 않아 측정 방법이 없다"로 미결이었던 것을
 * 2026-08-28 결정대로 **사용자가 보는 그것(GlobalDim)** 으로 잰다 — 카운터를 노출하지 않는다.
 *
 * ⚠️ 그래서 이 파일은 다른 알림 테스트와 달리 `api/client` 를 **mock 하지 않는다.** 딤은 client.js 의
 *    `_setLoading` 이 켜므로 client 를 통째로 mock 하면 측정 대상이 사라져 어떤 구현도 통과한다.
 *    대신 전역 `fetch` 만 스텁한다. `EventSource` 는 jsdom 에 없으므로 스텁한다(P04 와 같은 무대).
 *
 * ⚠️ C09-11 은 양성 대조다 — 같은 무대에서 `apiFetch` 경유 GET 이 딤을 **켜는** 것을 보여
 *    C09-10 의 "안 켜짐"이 측정 도구의 고장이 아님을 증명한다. 둘은 짝이다.
 */
import { act, render } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GlobalDim from 'components/GlobalDim';
import { NotificationProvider } from 'contexts/NotificationContext';

import { listJobs, setLoadingCallback } from 'api/client';

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
  emit(type, data, lastEventId = '') {
    const ev = new MessageEvent(type, { data: JSON.stringify(data), lastEventId });
    (this.listeners[type] ?? []).forEach((fn) => fn(ev));
    this[`on${type}`]?.(ev);
  }
}

const json = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const feed = (items) => ({ notifications: items, unread_count: items.length });
const notif = (jobId, createdAt) => ({
  job_id: jobId,
  created_at: createdAt,
  severity: 'success',
  kind: 'detection',
  message: '문항 감지가 완료되었습니다.',
});

/** App.tsx 와 같은 배선 — setLoadingCallback → GlobalDim. 페이지·스낵바는 싣지 않는다. */
function Harness() {
  const [apiLoading, setApiLoading] = useState(false);
  useEffect(() => {
    setLoadingCallback(setApiLoading);
    return () => setLoadingCallback(null);
  }, []);
  return (
    <MemoryRouter initialEntries={['/analysis']}>
      <NotificationProvider>
        <GlobalDim visible={apiLoading} />
      </NotificationProvider>
    </MemoryRouter>
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

const dimIn = (container) => container.querySelector('.global-dim');

let pendingJobs; // /jobs 응답을 테스트가 쥔다 (딤이 켜진 순간을 관찰하려면 미결 상태가 필요하다)

beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.stubGlobal(
    'fetch',
    vi.fn((url) => {
      if (String(url).includes('/notifications')) return Promise.resolve(json(feed([])));
      if (String(url).includes('/jobs')) return new Promise((resolve) => (pendingJobs = resolve));
      return Promise.resolve(json({}));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('전역 딤 — 계약 #26', () => {
  it('[C09-10] 기준선 GET 과 스트림 이벤트는 GlobalDim 을 켜지 않는다', async () => {
    const { container } = render(<Harness />);
    await flush(); // 기준선 GET 왕복
    expect(dimIn(container)).toBeNull();

    await act(async () => {
      instances[0].emit('notification', { ...notif('job-a', '2026-08-28T10:00:00+00:00'), unread_count: 1 });
    });
    await flush();

    expect(dimIn(container)).toBeNull();
  });

  it('[C09-11] (양성 대조) apiFetch 경유 GET 은 같은 무대에서 GlobalDim 을 켠다', async () => {
    const { container } = render(<Harness />);
    await flush();
    expect(dimIn(container)).toBeNull();

    let done;
    await act(async () => {
      done = listJobs();
      await Promise.resolve();
    });
    expect(dimIn(container)).not.toBeNull();

    await act(async () => {
      pendingJobs(json({ items: [], total: 0 }));
      await done;
    });
    expect(dimIn(container)).toBeNull();
  });
});
