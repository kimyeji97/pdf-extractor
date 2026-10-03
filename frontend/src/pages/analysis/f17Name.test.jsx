/**
 * REQ-F17 Phase 1 — 화면에서 확장자가 안 보인다 + 제목 생성 코드가 한 벌
 *
 * 검증 계약: docs/plans/PLAN-F17-source-label-format.md `## 검증 계약` (F17-15~17, F17-20~21)
 *
 * F17-15 는 **진짜 렌더**다 — 분석 목록은 무대가 있다(`pages/analysis/index.test.jsx` 관례를
 * 그대로 따른다: `ThemeProvider` + `MemoryRouter`, 계약 #25).
 *
 * F17-16·17 은 **소스 스캔**이다. `work.jsx` 는 API mock 이 5~6개 필요해 렌더 무대가 없고
 * (PLAN-B12 § 제약·함정, B12·F12 와 같은 결론), 여기서 보려는 것도 "화면이 어떻게 보이나"가
 * 아니라 **제목을 만드는 코드가 한 벌인가**라서 문자열로 충분하다 — 계획서 § 제약·함정이
 * 적어 둔 "제목을 만드는 코드가 두 벌이고 폴백이 다르다"를 닫는 케이스다.
 */
import { globSync, readFileSync } from 'node:fs';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AnalysisFilePage from 'pages/analysis';

import { getStats, getStatsDetail, listJobs } from 'api/client';
import { ThemeProvider } from 'theme/theme-provider';

vi.mock('api/client', () => ({
  getStats: vi.fn(),
  getStatsDetail: vi.fn(),
  listJobs: vi.fn(),
  requestUploadUrl: vi.fn(),
  uploadPdf: vi.fn(),
  updateJobMeta: vi.fn(),
  deleteJob: vi.fn(),
}));

vi.mock('hooks/useNotificationRefresh', () => ({ useNotificationRefresh: vi.fn() }));

vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => vi.fn(),
}));

const STATS = {
  source_count: 1, question_count: 0, workbook_count: 0, processing_count: 0,
  undetected_page_count: 0, false_positive_count: 0, manual_count: 0, detection_rate: 1,
};

/** 이름을 안 넣은 job — 제목이 파일명에서 파생되는 경우다. */
const JOB_WITHOUT_NAME = {
  job_id: 'job-1', filename: '2026 1학기.중간.pdf', workbook_name: null,
  status: 'DONE', boundaries_status: 'DONE', uploaded_at: '2026-10-01T00:00:00Z',
  total_question_count: 3, workbook_types: [],
};

beforeEach(() => {
  getStats.mockResolvedValue(STATS);
  getStatsDetail.mockResolvedValue({ field: '', items: [] });
  listJobs.mockResolvedValue({ items: [JOB_WITHOUT_NAME], total: 1 });
});

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('분석 목록 (렌더)', () => {
  it('[F17-15] 카드 제목에 확장자가 보이지 않는다', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AnalysisFilePage />
        </ThemeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(listJobs).toHaveBeenCalled());
    expect(await screen.findByText('2026 1학기.중간')).toBeInTheDocument();
  });
});

describe('현황판 아코디언 (렌더)', () => {
  it('[F17-21] 아코디언 행 이름에도 확장자가 보이지 않는다', async () => {
    // 회차 0 의 (b)#1 이 났던 자리다 — F12-32 는 "새 field 로 교체"만 보므로 전용 가드를 둔다.
    getStatsDetail.mockResolvedValue({
      field: 'manual_count',
      items: [{ job_id: 'job-m', filename: '2026 1학기.중간.pdf', workbook_name: null, count: 3, pages: [0] }],
    });

    render(
      <MemoryRouter>
        <ThemeProvider>
          <AnalysisFilePage />
        </ThemeProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(getStats).toHaveBeenCalled());
    fireEvent.click(await screen.findByTestId('stat-tile-manual_count'));

    const row = await screen.findByTestId('stat-detail-file');
    expect(row).toHaveTextContent('2026 1학기.중간');
    expect(row).not.toHaveTextContent('.pdf');
  });
});

describe('제목 생성 코드가 한 벌 (소스 스캔)', () => {
  it('[F17-16] work.jsx 헤더가 공유 헬퍼로 제목을 만든다', () => {
    const code = stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));

    expect(code).toMatch(
      /import\s*\{[^}]*resolveDocumentName[^}]*\}\s*from\s*["']utils\/documentName["']/,
    );
  });

  it('[F17-17] frontend/src 어디에도 이름 인라인 체인이 남아 있지 않다', () => {
    // 한 파일만 읽던 스캔이 StatCards·FileListPanel 을 통과시켜 (b)를 냈다(/review 회차 0).
    // 전수로 본다 — 새로 생기는 복사본도 여기서 걸린다.
    // ⚠️ node:fs globSync 의 제외 옵션은 `exclude` 다 — `ignore` 는 조용히 무시된다
    //    (실측: all 120 · ignore 120 · exclude 44). /review 회차 1 에서 잡혔다.
    const files = globSync('src/**/*.{js,jsx}', { exclude: ['**/*.test.*'] });
    expect(files.length).toBeGreaterThan(20);   // 0건 스캔이 초록으로 보이는 것을 막는다

    // 2항(`a || b`)도 잡는다 — 3항만 보던 정규식이 index.jsx 의 삭제 다이얼로그를 통과시켰다.
    // 공유 헬퍼 자신은 체인이 있어야 하는 **유일한** 곳이라 뺀다 — 여기 말고 어디에도 없어야 한다.
    const CANONICAL = 'src/utils/documentName.js';
    const offenders = files
      .filter((f) => f !== CANONICAL)
      .filter((f) => /workbook_name\s*\|\|[^\n]*?filename\b/.test(stripComments(readFileSync(f, 'utf-8'))));

    expect(offenders).toEqual([]);
  });

  it('[F17-20] 생성 화면의 camelCase 체인도 공유 헬퍼를 거친다', () => {
    // 칩·브레드크럼은 `workbookName || sourceFilename` 형태라 위 스캔(snake_case)에 안 걸린다.
    const files = globSync('src/**/*.{js,jsx}', { exclude: ['**/*.test.*'] });
    expect(files.length).toBeGreaterThan(20);

    // `a || b.sourceFilename` 과 삼항(`… ? b.sourceFilename : …`) 둘 다 본다 —
    // 회차 1 에서 SelectionOrderPanel 의 삼항 분기가 확장자째로 남아 있었다.
    const offenders = files.filter((f) => {
      const code = stripComments(readFileSync(f, 'utf-8'));
      return /workbookName\s*\|\|\s*[A-Za-z.]*sourceFilename/.test(code)
        || /\?\s*[A-Za-z.]*sourceFilename\s*:/.test(code);
    });

    expect(offenders).toEqual([]);
  });
});
