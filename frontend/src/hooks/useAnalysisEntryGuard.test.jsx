/**
 * REQ-F11 Phase 1 — 재감지 중 상세 진입 차단
 *
 * 검증 계약: docs/plans/PLAN-F11-analysis-detail-entry-guard.md `## 검증 계약` (F11-01~07)
 *
 * 페이지(`work.jsx`)를 렌더하지 않는다 — react-pdf·dnd-kit 까지 따라와 무겁고 깨지기 쉽다
 * (F09 Phase 3~5 와 같은 판단). 가드의 판정·이동만 훅 단위로 잰다.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalysisEntryGuard } from 'hooks/useAnalysisEntryGuard';

import * as client from 'api/client';

const navigate = vi.fn();

vi.mock('api/client', () => ({
  getJobInfo: vi.fn(),
  getPages: vi.fn(),
  getAllQuestions: vi.fn(),
  listJobs: vi.fn(),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => navigate,
}));

const jobInfo = (boundariesStatus) => ({
  job_id: 'job-a',
  boundaries_status: boundariesStatus,
  original_pdf_url: 'http://localhost:8000/files/job-a/original.pdf',
});

beforeEach(() => {
  vi.clearAllMocks();
  client.getJobInfo.mockResolvedValue(jobInfo('DONE'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAnalysisEntryGuard', () => {
  it('[F11-01] PROCESSING이면 차단 상태가 된다', async () => {
    client.getJobInfo.mockResolvedValue(jobInfo('PROCESSING'));

    const { result } = renderHook(() => useAnalysisEntryGuard('job-a'));

    await waitFor(() => expect(result.current.blocked).toBe(true));
  });

  it.each(['DONE', 'FAILED', 'PENDING'])('[F11-02] %s는 차단하지 않는다', async (status) => {
    client.getJobInfo.mockResolvedValue(jobInfo(status));

    const { result } = renderHook(() => useAnalysisEntryGuard('job-a'));

    await waitFor(() => expect(client.getJobInfo).toHaveBeenCalled());
    expect(result.current.blocked).toBe(false);
  });

  it('[F11-03] 상태 조회가 실패하면 차단한다', async () => {
    // 열어 두면 네트워크가 흔들릴 때마다 감지 중 화면이 열리고 아무도 모른다.
    client.getJobInfo.mockRejectedValue(new Error('네트워크 실패'));

    const { result } = renderHook(() => useAnalysisEntryGuard('job-a'));

    await waitFor(() => expect(result.current.blocked).toBe(true));
  });

  it('[F11-04] 확인 시 문항 분석 목록으로 이동한다', async () => {
    client.getJobInfo.mockResolvedValue(jobInfo('PROCESSING'));
    const { result } = renderHook(() => useAnalysisEntryGuard('job-a'));
    await waitFor(() => expect(result.current.blocked).toBe(true));

    result.current.confirm();

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('[F11-05] 차단 사유가 감지 중과 조회 실패로 구분된다', async () => {
    // 실패에 "재감지 중입니다"라고 쓰면 없는 사실을 알리는 것이고,
    // 사용자는 기다리면 끝난다고 믿는다. 문구는 컴포넌트 소관이라 사유만 잰다.
    client.getJobInfo.mockRejectedValue(new Error('네트워크 실패'));
    const { result } = renderHook(() => useAnalysisEntryGuard('job-a'));

    await waitFor(() => expect(result.current.blocked).toBe(true));

    expect(result.current.reason).not.toBe('processing');
  });

  it('[F11-06] 자체 인터벌을 만들지 않는다', async () => {
    // ⚠️ 여기서는 `waitFor` 를 쓰지 않는다 — **그 함수가 내부적으로 setInterval 을 쓴다**
    //    (@testing-library/dom `wait-for.js`). 스파이를 걸고 waitFor 로 기다리면
    //    **측정 도구가 측정 대상에 섞여** 훅이 결백해도 1회로 잡힌다(2026-08-10 실측).
    //    타이머를 쓰지 않는 act 플러시로 이펙트만 흘려보낸다.
    //    (이펙트가 실제로 도는지는 F11-01 이 증명한다 — 여기서 빈 통과가 되지 않는다.)
    client.getJobInfo.mockResolvedValue(jobInfo('PROCESSING'));
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    renderHook(() => useAnalysisEntryGuard('job-a'));
    await act(async () => {});

    // 완료를 기다리려고 폴링을 되살리면 F09 Phase 3이 걷어낸 것이 그대로 돌아온다.
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('[F11-07] 상태 조회는 getJobInfo 하나뿐이다', async () => {
    renderHook(() => useAnalysisEntryGuard('job-a'));
    await waitFor(() => expect(client.getJobInfo).toHaveBeenCalled());

    const otherCalls =
      client.listJobs.mock.calls.length +
      client.getPages.mock.calls.length +
      client.getAllQuestions.mock.calls.length;
    expect(otherCalls).toBe(0);
  });
});
