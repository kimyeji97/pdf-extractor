/**
 * REQ-D09 · REQ-F10 — 생성 이력 화면 개편 + 이름 검색
 *
 * 검증 계약: docs/plans/PLAN-D09-F10-history-screen-rework.md `## 검증 계약` (D09-01~12)
 *
 * ⚠️ **폭 배분(미리보기 720px / 목록 flex:1)과 225ms 전개 애니메이션은 이 파일이 못 잡는다.**
 *    jsdom에는 레이아웃 엔진이 없어 `getComputedStyle`로 재면 어떤 구현이든 통과한다 —
 *    가짜 녹색불이 없는 것보다 나쁘므로 아예 쓰지 않는다. Phase 5 육안이 유일한 방어선이다.
 *
 * ⚠️ `BookCard`·`PdfPreviewPanel`은 mock한다. 전자는 넘겨받는 `colorKey`(계약 #17)를 보기
 *    위해서고, 후자는 react-pdf가 jsdom에서 워커를 띄우기 때문이다. **둘 다 이번 변경 대상이
 *    아니므로** 대역으로 바꿔도 측정 대상이 사라지지 않는다(계약 #26 딤 케이스를 제외한 이유와
 *    같은 기준을 반대로 적용한 것 — 대역이 가리는 것이 검증 대상인지 아닌지가 갈림길이다).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HistoryPage from 'pages/history';

import { getWorkbooks, getStatus } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

const navigate = vi.fn();

vi.mock('api/client', () => ({
  getWorkbooks: vi.fn(),
  getStatus: vi.fn(),
  deleteWorkbook: vi.fn(() => Promise.resolve()),
}));

// 알림 구독은 이 화면의 검증 대상이 아니다 — 훅을 통째로 비운다(F09/C09가 따로 덮는다).
vi.mock('hooks/useNotificationRefresh', () => ({
  useNotificationRefresh: vi.fn(),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => navigate,
}));

// PDF 뷰어 대역 — 넘겨받은 URL을 그대로 노출해 D09-06이 읽는다.
vi.mock('components/PdfPreviewPanel', () => ({
  default: ({ pdfUrl }) => <div data-testid="pdf-preview" data-pdf-url={pdfUrl || ''} />,
}));

// 책 카드 대역 — 클릭 대상 + `colorKey`(계약 #17) 노출.
vi.mock('components/BookCard', () => ({
  default: ({ title, colorKey, onClick, actions }) => (
    <div>
      <button type="button" data-testid="book-card" data-color-key={colorKey} onClick={onClick}>
        {title}
      </button>
      {actions}
    </div>
  ),
  BOOK_CARD_W: 172,
}));

const wb = (id, name, extra = {}) => ({
  workbook_id: id,
  name,
  layout: '4단',
  question_count: 12,
  result_job_id: `job-${id}`,
  created_at: '2026-08-28T09:00:00+00:00',
  ...extra,
});

const listIs = (items) => {
  getWorkbooks.mockResolvedValue({ items, total: items.length, skip: 0, limit: 20 });
};

const renderPage = () => render(
  <ThemeProvider>
    <HistoryPage />
  </ThemeProvider>,
);

/** 첫 페이지 로드가 끝난 뒤의 화면을 얻는다. */
const renderLoaded = async (items) => {
  listIs(items);
  const view = renderPage();
  if (items.length > 0) await screen.findAllByTestId('book-card');
  else await waitFor(() => expect(getWorkbooks).toHaveBeenCalled());
  return view;
};

/** 카드를 클릭해 미리보기를 연다. */
const openPreview = async (index = 0) => {
  fireEvent.click(screen.getAllByTestId('book-card')[index]);
  await screen.findByTestId('pdf-preview');
};

const typeSearch = (value) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } });
};

beforeEach(() => {
  vi.clearAllMocks();
  listIs([]);
  getStatus.mockResolvedValue({ download_url: 'https://cdn.example.com/result.pdf' });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('생성 이력 — 진입 시 전체 폭 목록 (Phase 1)', () => {
  it('[D09-01] 진입 직후 미리보기 영역이 DOM에 없다', async () => {
    await renderLoaded([wb('wb-1', '중간고사')]);

    // 빈 미리보기 패널(플레이스홀더 포함)이 자리를 차지하지 않아야 한다.
    expect(screen.queryByText(/미리보기/)).not.toBeInTheDocument();
  });

  it('[D09-02] 카드를 클릭하기 전까지 상태 조회가 나가지 않는다', async () => {
    await renderLoaded([wb('wb-1', '중간고사'), wb('wb-2', '기말고사')]);

    expect(getStatus).not.toHaveBeenCalled();
  });

  it('[D09-03] 카드 색 해시 키가 workbook_id다', async () => {
    // 이름이 같아도 출처가 다르면 달라야 한다 — 이름으로 해시하면 구분이 조용히 죽는다(계약 #17).
    await renderLoaded([wb('wb-1', '테스트03'), wb('wb-2', '테스트03')]);

    const keys = screen.getAllByTestId('book-card').map((el) => el.dataset.colorKey);
    expect(keys).toEqual(['wb-1', 'wb-2']);
  });
});

describe('생성 이력 — 아코디언 미리보기 (Phase 2)', () => {
  it('[D09-04] 카드 클릭 시 미리보기가 나타난다', async () => {
    await renderLoaded([wb('wb-1', '중간고사')]);

    await openPreview();

    expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
  });

  it('[D09-05] 같은 카드 재클릭 시 닫힌다', async () => {
    await renderLoaded([wb('wb-1', '중간고사')]);
    await openPreview();

    fireEvent.click(screen.getAllByTestId('book-card')[0]);

    await waitFor(() => expect(screen.queryByTestId('pdf-preview')).not.toBeInTheDocument());
  });

  it('[D09-06] 미리보기 URL이 toPreviewUrl을 거친다', async () => {
    // 다운로드가 먼저 채운 CORS 헤더 없는 edge 캐시 사본을 물지 않도록 키를 가른다.
    await renderLoaded([wb('wb-1', '중간고사')]);

    await openPreview();

    expect(screen.getByTestId('pdf-preview').dataset.pdfUrl).toContain('preview=1');
  });

  it('[D09-07] 다운로드 링크에는 preview 쿼리가 붙지 않는다', async () => {
    await renderLoaded([wb('wb-1', '중간고사')]);
    const anchors = [];
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node.tagName === 'A') anchors.push(node.getAttribute('href'));
      return node;
    });

    fireEvent.click(screen.getByRole('button', { name: /다운로드/ }));

    await waitFor(() => expect(anchors).toEqual(['https://cdn.example.com/result.pdf']));
  });
});

describe('생성 이력 — 이름 검색 (Phase 3)', () => {
  it('[D09-08] 검색어 입력 → 디바운스 뒤 name과 함께 1회 조회한다', async () => {
    await renderLoaded([wb('wb-1', '중간고사')]);
    vi.useFakeTimers();
    getWorkbooks.mockClear();

    typeSearch('기말');
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(getWorkbooks).toHaveBeenCalledTimes(1);
  });

  it('[D09-09] 검색 결과가 0건이면 "검색 결과가 없습니다."가 뜬다', async () => {
    await renderLoaded([wb('wb-1', '중간고사')]);
    vi.useFakeTimers();
    listIs([]);

    typeSearch('없는이름');
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(screen.getByText(/검색 결과가 없습니다/)).toBeInTheDocument();
  });

  it('[D09-10] 검색 없이 0건이면 그 문구가 뜨지 않는다', async () => {
    await renderLoaded([]);

    expect(screen.queryByText(/검색 결과가 없습니다/)).not.toBeInTheDocument();
  });

  it('[D09-11] 검색어가 바뀌면 열려 있던 미리보기가 닫힌다', async () => {
    await renderLoaded([wb('wb-1', '중간고사')]);
    await openPreview();
    vi.useFakeTimers();

    typeSearch('기말');
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(screen.queryByTestId('pdf-preview')).not.toBeInTheDocument();
  });

  it('[D09-12] 디바운스 경과 전에는 닫히지 않는다', async () => {
    // 닫는 기준은 목록이 실제로 교체되는 시점(=디바운스된 값)이다.
    await renderLoaded([wb('wb-1', '중간고사')]);
    await openPreview();
    vi.useFakeTimers();

    typeSearch('기말');
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
  });
});
