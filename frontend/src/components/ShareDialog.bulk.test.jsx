/**
 * REQ-28 Phase 7 — 공유 패널: 일괄 공유 · 실패 표시 · 내 행 고정
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-55 ~ 28-58)
 * 이 테스트가 고정하는 모양: `<ShareDialog jobs open onClose myEmail />`, 공유 버튼 "공유",
 * 결과 문구 "N개 중 M개 공유됨", 해제 버튼 이름 "공유 해제".
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ShareDialog from 'components/ShareDialog';

import { addShare, listShares } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  listShares: vi.fn(),
  addShare: vi.fn(),
  updateShare: vi.fn(),
  removeShare: vi.fn(),
}));

const TWO = [
  { job_id: 'j1', workbook_name: '수능 2024', filename: 'a.pdf' },
  { job_id: 'j2', workbook_name: '모의 6월', filename: 'b.pdf' },
];

const renderPanel = (jobs, myEmail) =>
  render(
    <ThemeProvider>
      <ShareDialog jobs={jobs} open onClose={() => {}} myEmail={myEmail} />
    </ThemeProvider>,
  );

const shareTo = (email) => {
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: '공유' }));
};

beforeEach(() => {
  listShares.mockResolvedValue({ owner: null, shares: [] });
  addShare.mockReset();
});

describe('공유 패널 일괄', () => {
  it('[28-55] 분석 2개를 고른 채 공유하면 각 분석에 같은 이메일·역할로 공유한다', async () => {
    addShare.mockResolvedValue({ user_id: 'u2', email: 'b@x.com', role: 'editor' });
    renderPanel(TWO);

    shareTo('b@x.com');

    await waitFor(() => expect(addShare.mock.calls).toEqual([
      ['j1', 'b@x.com', 'editor'],
      ['j2', 'b@x.com', 'editor'],
    ]));
  });

  it('[28-56] 일부가 실패하면 "2개 중 1개 공유됨"이 보인다', async () => {
    addShare
      .mockResolvedValueOnce({ user_id: 'u2', email: 'b@x.com', role: 'editor' })
      .mockRejectedValueOnce(new Error('job을 찾을 수 없습니다.'));
    renderPanel(TWO);

    shareTo('b@x.com');

    expect(await screen.findByText(/2개 중 1개 공유됨/)).toBeInTheDocument();
  });

  it('[28-57] 실패한 분석 이름과 이유가 보인다', async () => {
    addShare
      .mockResolvedValueOnce({ user_id: 'u2', email: 'b@x.com', role: 'editor' })
      .mockRejectedValueOnce(new Error('job을 찾을 수 없습니다.'));
    renderPanel(TWO);

    shareTo('b@x.com');

    expect(await screen.findByText(/모의 6월.*job을 찾을 수 없습니다\./)).toBeInTheDocument();
  });

  it('[28-58] 내 행에는 해제 버튼이 없다', async () => {
    listShares.mockResolvedValue({
      owner: { user_id: 'u1', email: 'up@x.com', role: 'owner' },
      shares: [
        { user_id: 'u2', email: 'me@x.com', role: 'owner' },
        { user_id: 'u3', email: 'c@x.com', role: 'viewer' },
      ],
    });
    renderPanel([TWO[0]], 'me@x.com');
    await screen.findByText('c@x.com');

    expect(screen.getAllByRole('button', { name: '공유 해제' })).toHaveLength(1);
  });
});
