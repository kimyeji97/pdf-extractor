/**
 * REQ-F09 Phase 2 — 전역 폴링 + 알림 상태
 *
 * 검증 계약: docs/plans/PLAN-F09-completion-notification.md `## 검증 계약` (F09-18·25~28)
 *
 * F09-19~24(폴링 전제 — since·주기·감속·복귀·실패 재시도)는 REQ-P04 Phase 2(SSE 전환)에서
 * **삭제**했다 — P04-20~27이 대체한다(2026-08-26 결정, F09 표 `결과` 열).
 *
 * ⚠️ **숫자를 단언하지 않는다.** 폴링 주기·감속 배율은 계획서에 없다. 아래 `WINDOW_MS`는
 *    스펙 값이 아니라 **관측 창**이며, 케이스는 전부 "같은 창 안에서 몇 번 불렸나"의
 *    상대 비교로만 판정한다. 주기를 지어내 박으면 그 값이 구현을 막는다.
 */
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationProvider, useNotifications } from 'contexts/NotificationContext';

import * as client from 'api/client';

// 알림 피드 외의 함수까지 mock 하는 이유는 F09-25·27 때문이다 —
// "부르지 않는다"를 재려면 부를 수 있는 상태여야 한다.
vi.mock('api/client', () => ({
  listNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
  getStatus: vi.fn(),
  getJobInfo: vi.fn(),
  listJobs: vi.fn(),
}));

/** 관측 창. 스펙 값이 아니다 — 상대 비교용 상수다. */
const WINDOW_MS = 5 * 60 * 1000;

const feed = (items) => ({ notifications: items, unread_count: items.length });

const notif = (jobId, createdAt) => ({
  job_id: jobId,
  created_at: createdAt,
  severity: 'success',
});

/** 컨텍스트가 노출하는 알림 목록을 DOM으로 흘려보낸다. */
function Probe() {
  const { notifications } = useNotifications();
  return <span data-testid="count">{notifications.length}</span>;
}

function renderProvider(ui = <Probe />) {
  return render(
    <MemoryRouter initialEntries={['/analysis']}>
      <NotificationProvider>{ui}</NotificationProvider>
    </MemoryRouter>,
  );
}

/** 타이머를 창만큼 흘린다. 폴링이 async 라 각 틱의 후속 마이크로태스크까지 비운다. */
async function advance(ms = WINDOW_MS) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  client.listNotifications.mockResolvedValue(feed([]));
  setVisibility('visible');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('전역 폴링', () => {
  it('[F09-18] 앱 첫 진입은 since 없이 피드를 요청한다', async () => {
    renderProvider();
    await advance(0);

    const [firstArg] = client.listNotifications.mock.calls[0] ?? [];
    expect(firstArg?.since).toBeFalsy();
  });

  it('[F09-27] job 상태를 개별로 조회하지 않는다', async () => {
    client.listNotifications.mockResolvedValue(
      feed([notif('job-a', '2026-08-07T10:00:00+00:00')]),
    );
    renderProvider();
    await advance();

    const jobCalls =
      client.getStatus.mock.calls.length +
      client.getJobInfo.mock.calls.length +
      client.listJobs.mock.calls.length;
    expect(jobCalls).toBe(0);
  });
});

describe('알림 상태', () => {
  it('[F09-25] 전역 폴링은 서버에 쓰기 요청을 보내지 않는다', async () => {
    client.listNotifications.mockResolvedValue(
      feed([notif('job-a', '2026-08-07T10:00:00+00:00')]),
    );
    renderProvider();
    await advance();

    expect(client.markNotificationsRead).not.toHaveBeenCalled();
  });

  it('[F09-26] 전역 폴링은 자동 다운로드를 트리거하지 않는다', async () => {
    // 편집 화면의 자동 다운로드는 `document.createElement("a")` + `a.click()` 이다.
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    client.listNotifications.mockResolvedValue(
      feed([notif('export-job', '2026-08-07T10:00:00+00:00')]),
    );
    renderProvider();
    await advance();

    expect(anchorClick).not.toHaveBeenCalled();
  });

  it('[F09-28] 증분 응답이 기존 이력에 누적된다', async () => {
    client.listNotifications
      .mockResolvedValueOnce(feed([notif('job-a', '2026-08-07T10:00:00+00:00')]))
      .mockResolvedValueOnce(feed([notif('job-b', '2026-08-07T10:05:00+00:00')]))
      .mockResolvedValue(feed([]));
    renderProvider();
    await advance();

    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });
});
