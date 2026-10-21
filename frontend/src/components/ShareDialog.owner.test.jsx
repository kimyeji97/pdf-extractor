/**
 * REQ-28 Phase 6 — 공유 다이얼로그: 소유자 역할 · 업로더 고정 행
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-51 · 28-52)
 * 이 테스트가 고정하는 모양: listShares 응답 `{ owner, shares }`, 해제 버튼 이름 "공유 해제".
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ShareDialog from 'components/ShareDialog';

import { listShares } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  listShares: vi.fn(),
  addShare: vi.fn(),
  updateShare: vi.fn(),
  removeShare: vi.fn(),
}));

beforeEach(() => {
  listShares.mockResolvedValue({
    owner: { user_id: 'u1', email: 'up@x.com', role: 'owner' },
    shares: [{ user_id: 'u2', email: 'b@x.com', role: 'editor' }],
  });
});

const renderDialog = () =>
  render(
    <ThemeProvider>
      <ShareDialog job={{ job_id: 'j1', filename: 'a.pdf' }} open onClose={() => {}} />
    </ThemeProvider>,
  );

describe('ShareDialog 소유자', () => {
  it('[28-51] 역할 선택지에 소유자가 있다', async () => {
    renderDialog();
    await screen.findByText('b@x.com');

    fireEvent.mouseDown(screen.getByTestId('share-new-role').querySelector('[role="combobox"]'));

    expect(within(screen.getByRole('listbox')).getByText('소유자')).toBeTruthy();
  });

  it('[28-52] 업로더 행에는 해제 버튼이 없다', async () => {
    renderDialog();
    await screen.findByText('up@x.com');

    await waitFor(() => expect(screen.getAllByRole('button', { name: '공유 해제' })).toHaveLength(1));
  });
});
