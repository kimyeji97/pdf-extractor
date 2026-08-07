/**
 * REQ-F09 Phase 3 — 화면 지역 폴링 이관
 *
 * 검증 계약: docs/plans/PLAN-F09-completion-notification.md `## 검증 계약` (F09-29~35)
 *
 * **페이지 컴포넌트를 렌더하지 않는다.** work.jsx·editor 는 react-pdf·dnd-kit 까지 끌고 오는
 * 큰 화면이라 jsdom 렌더가 비싸고 깨지기 쉽다. 이관의 핵심 판정("내 job 의 완료 알림이
 * 왔는가")만 훅으로 떼어 여기서 잰다.
 *
 * 전역 피드는 mock 으로 주입한다 — NotificationProvider 를 통째로 태우면 이 파일이
 * Phase 2 의 폴링까지 재검증하게 되고, 실패했을 때 원인이 두 계층으로 흩어진다.
 */
import { render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useJobCompletion } from 'hooks/useJobCompletion';

import { useNotifications } from 'contexts/NotificationContext';

vi.mock('contexts/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

const notif = (jobId, createdAt, severity = 'success') => ({
  job_id: jobId,
  created_at: createdAt,
  severity,
});

/** 전역 피드가 지금 들고 있는 알림 목록을 갈아끼운다. */
const feedIs = (items) => {
  useNotifications.mockReturnValue({ notifications: items, unreadCount: items.length });
};

beforeEach(() => {
  vi.clearAllMocks();
  feedIs([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useJobCompletion', () => {
  it('[F09-29] 대상 job의 완료 알림이 오면 onDone이 불린다', () => {
    const onDone = vi.fn();
    const { rerender } = renderHook(() => useJobCompletion('job-a', { onDone }));

    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')]);
    rerender();

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('[F09-30] 다른 job의 알림에는 반응하지 않는다', () => {
    const onDone = vi.fn();
    const { rerender } = renderHook(() => useJobCompletion('job-a', { onDone }));

    // "모두의 알림"이라 피드에는 남이 시작한 작업의 완료도 들어온다.
    feedIs([notif('job-b', '2026-08-07T10:00:00+00:00')]);
    rerender();

    expect(onDone).not.toHaveBeenCalled();
  });

  it('[F09-31] severity=error 알림이면 onError가 불린다', () => {
    const onError = vi.fn();
    const { rerender } = renderHook(() => useJobCompletion('job-a', { onDone: vi.fn(), onError }));

    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00', 'error')]);
    rerender();

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('[F09-32] 구독 이전에 이미 피드에 있던 알림에는 반응하지 않는다', () => {
    // 피드는 최근 30일치를 담고 있다. 기준선 없이 "내 job 의 알림이 있나"로 짜면
    // 재감지를 시작하자마자 지난주 알림을 보고 즉시 완료로 튄다.
    feedIs([notif('job-a', '2026-07-20T10:00:00+00:00')]);

    const onDone = vi.fn();
    renderHook(() => useJobCompletion('job-a', { onDone }));

    expect(onDone).not.toHaveBeenCalled();
  });

  it('[F09-35] 훅이 자체 인터벌을 만들지 않는다', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    const { rerender } = renderHook(() => useJobCompletion('job-a', { onDone: vi.fn() }));
    feedIs([notif('job-a', '2026-08-07T10:00:00+00:00')]);
    rerender();

    // 이관의 실행 가능한 증거다 — 지역 폴링이 남아 있으면 여기서 걸린다.
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});

describe('다운로드 불변식 (REQ-B10)', () => {
  it('[F09-33] 화면이 살아 있을 때 완료 알림이 오면 다운로드가 일어난다', () => {
    const download = vi.fn();
    const { rerender } = renderHook(() => useJobCompletion('export-job', { onDone: download }));

    feedIs([notif('export-job', '2026-08-07T10:00:00+00:00')]);
    rerender();

    expect(download).toHaveBeenCalledTimes(1);
  });

  it('[F09-34] 언마운트 뒤 완료 알림이 와도 다운로드가 일어나지 않는다', () => {
    // ⚠️ `renderHook().unmount()` 뒤에 `rerender()` 를 부르면 React 가
    //    "Cannot update an unmounted root" 로 터진다 — **단언에 닿지도 못한다.**
    //    그래서 루트는 살려 둔 채 **훅을 쓰는 화면만** 언마운트한다. 실제 상황(사용자가
    //    편집 화면을 떠나도 앱 셸과 전역 폴링은 살아 있다)에도 이쪽이 더 가깝다.
    const download = vi.fn();

    function Screen() {
      useJobCompletion('export-job', { onDone: download });
      return null;
    }
    const App = ({ mounted }) => (mounted ? <Screen /> : null);

    const { rerender } = render(<App mounted />);
    rerender(<App mounted={false} />); // 화면 이탈

    feedIs([notif('export-job', '2026-08-07T10:00:00+00:00')]);
    rerender(<App mounted={false} />);

    // 화면을 떠난 사용자에게 브라우저 다운로드를 강제할 수단이 없다 — 생성 이력에서 받아 간다.
    expect(download).not.toHaveBeenCalled();
  });
});
