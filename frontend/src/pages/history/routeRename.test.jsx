/**
 * REQ-D11 Phase 2 — 결과 화면 "편집으로 불러오기"가 새 경로(`/create`)로 간다
 *
 * 검증 계약: docs/plans/PLAN-D11-menu-rename.md `## 검증 계약` (D11-15)
 *
 * 무대는 D09(`index.test.jsx`)와 같다 — `MemoryRouter` + `ThemeProvider`, API·뷰어·카드 대역.
 * `BookCard` 대역이 `actions`를 그대로 그려 주므로 카드 액션 버튼을 누를 수 있다.
 *
 * ⚠️ 이 접점은 계획서가 센 "네 곳"(paths·벨·편집 브레드크럼·F11 가드)에 **없던 다섯 번째**다 —
 *    `history/index.jsx`가 `navigate("/editor", { state })`를 직접 든다. 옛 경로가 라우터에서
 *    사라지면(D11-12) 이 버튼이 빈 화면으로 가므로 범위 포함 "직접 든 곳도 함께"에 걸린다.
 *    `state`(`initialWorkbookId`)는 계획서가 정한 바 없어 단언하지 않는다 — 경로만 본다.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HistoryPage from 'pages/history';

import { getStatus, getWorkbooks } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

const navigate = vi.fn();

vi.mock('api/client', () => ({
  getWorkbooks: vi.fn(),
  getStatus: vi.fn(),
  deleteWorkbook: vi.fn(() => Promise.resolve()),
}));

vi.mock('hooks/useNotificationRefresh', () => ({
  useNotificationRefresh: vi.fn(),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => navigate,
}));

vi.mock('components/PdfPreviewPanel', () => ({
  default: ({ pdfUrl }) => <div data-testid="pdf-preview" data-pdf-url={pdfUrl || ''} />,
}));

vi.mock('components/BookCard', () => ({
  default: ({ title, onClick, actions }) => (
    <div>
      <button type="button" data-testid="book-card" onClick={onClick}>{title}</button>
      {actions}
    </div>
  ),
  BOOK_CARD_W: 172,
}));

const wb = (id, name) => ({
  workbook_id: id,
  name,
  layout: '4단',
  question_count: 12,
  result_job_id: `job-${id}`,
  created_at: '2026-09-04T09:00:00+00:00',
});

/** 문제집 1건이 실린 채 첫 로드가 끝난 화면. */
const renderWithOne = async () => {
  getWorkbooks.mockResolvedValue({ items: [wb('w1', '테스트')], total: 1, skip: 0, limit: 20 });
  const view = render(
    <MemoryRouter>
      <ThemeProvider>
        <HistoryPage />
      </ThemeProvider>
    </MemoryRouter>,
  );
  await screen.findAllByTestId('book-card');
  await waitFor(() => expect(getWorkbooks).toHaveBeenCalled());
  return view;
};

beforeEach(() => {
  vi.clearAllMocks();
  getStatus.mockResolvedValue({ download_url: 'https://cdn.example.com/result.pdf' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('결과 화면 편집 이동 (Phase 2)', () => {
  it('[D11-15] "편집으로 불러오기"를 누르면 /create로 이동한다', async () => {
    await renderWithOne();

    fireEvent.click(screen.getByRole('button', { name: '편집으로 불러오기' }));

    expect(navigate.mock.calls[0]?.[0]).toBe('/create');
  });
});
