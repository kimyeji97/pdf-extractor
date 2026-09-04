/**
 * REQ-D11 Phase 1 — 결과 화면(구 생성 이력)의 헤더·안내 문구
 *
 * 검증 계약: docs/plans/PLAN-D11-menu-rename.md `## 검증 계약` (D11-04~05)
 *
 * 무대는 D09(`index.test.jsx`)와 같다 — `MemoryRouter` + `ThemeProvider`, API·뷰어·카드 대역.
 * 여기서는 목록이 빈 상태만 필요하다(빈 상태 문구가 검증 대상).
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HistoryPage from 'pages/history';

import { getWorkbooks } from 'api/client';
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

/** 빈 목록으로 첫 로드가 끝난 화면. */
const renderEmpty = async () => {
  getWorkbooks.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });
  const view = render(
    <MemoryRouter>
      <ThemeProvider>
        <HistoryPage />
      </ThemeProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(getWorkbooks).toHaveBeenCalled());
  return view;
};

const squash = (text) => text.replace(/\s+/g, '');

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('결과 화면 헤더·안내 문구 (Phase 1)', () => {
  it('[D11-04] 결과 화면의 헤더 제목과 브레드크럼 마지막이 "결과"다', async () => {
    const { container } = await renderEmpty();
    // ⚠️ 이 화면은 h6가 둘이다 — MUI가 `subtitle2`(패널 제목 "생성된 문제집")를 h6 태그로 매핑한다.
    //    role 단일 조회는 던지므로 `PageHeader`의 h6 변형(`MuiTypography-h6`)을 집는다.
    //    브레드크럼은 MUI `Breadcrumbs`가 `aria-label`을 기본으로 안 붙여 `ol` 클래스로 찾는다.
    //    (D11-04 (a) 수정, 2026-09-04)
    const header = {
      title: container.querySelector('h6.MuiTypography-h6')?.textContent ?? null,
      lastCrumb: container.querySelector('.MuiBreadcrumbs-ol li:last-child')?.textContent ?? null,
    };
    expect(header).toEqual({ title: '결과', lastCrumb: '결과' });
  });

  it('[D11-05] 빈 상태 문구가 "생성 메뉴에서 PDF를 만들면 여기에 기록됩니다."다 (줄바꿈 허용)', async () => {
    await renderEmpty();
    const sentence = '생성 메뉴에서 PDF를 만들면 여기에 기록됩니다.';
    // 원문은 <br />로 두 줄에 걸쳐 있어 textContent에 공백이 없을 수 있다 — 공백을 걷어내고 비교한다.
    const matches = await screen.findAllByText(
      (_, el) => el?.childElementCount === 1 || el?.childElementCount === 0
        ? squash(el?.textContent ?? '') === squash(sentence)
        : false,
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
