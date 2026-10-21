/**
 * REQ-28 Phase 5 — 공유 다이얼로그
 *
 * 검증 계약: docs/plans/PLAN-28-analysis-sharing.md `## 검증 계약` (28-39)
 * 이 테스트가 고정하는 모양: `<ShareDialog job={job} open onClose />`, 입력 라벨 "이메일", 버튼 "추가".
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

beforeEach(() => {
  listShares.mockResolvedValue({ shares: [] });
  addShare.mockResolvedValue({ user_id: 'u2', email: 'b@x.com', role: 'editor' });
});

describe('ShareDialog', () => {
  it('[28-39] 이메일만 넣고 추가하면 편집자로 공유한다', async () => {
    render(
      <ThemeProvider>
        <ShareDialog job={{ job_id: 'j1', filename: 'a.pdf' }} open onClose={() => {}} />
      </ThemeProvider>,
    );
    await waitFor(() => expect(listShares).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'b@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() => expect(addShare).toHaveBeenCalledWith('j1', 'b@x.com', 'editor'));
  });
});
