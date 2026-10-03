/**
 * REQ-B25 Phase 1 — 문서 로딩 전에 온 페이지 이동 요청을 보관했다가 로딩 후 적용 (렌더 테스트)
 *
 * 검증 계약: docs/plans/PLAN-B25-stats-page-jump.md `## 검증 계약` (B25-01~06)
 *
 * **`PdfPreviewPanel`의 첫 렌더 테스트다.** 지금까지 무대가 없던 이유는 `react-pdf`가
 * pdf.worker를 물고 들어오기 때문인데, `vi.mock('react-pdf')`로 `Document`·`Page`·`pdfjs`를
 * 스텁하면 그 의존이 사라진다. 컴포넌트는 MUI를 쓰지 않으므로(순수 `pdf-*` 클래스, 계약 #4)
 * ThemeProvider도 필요 없다 — 계약 #25가 말하는 무대 요건에 해당하지 않는다.
 *
 * 무대의 핵심은 **"로딩 전/후"를 테스트가 직접 만든다**는 것이다. 실제 react-pdf는 파일을
 * 읽고 비동기로 `onLoadSuccess`를 부르지만, 여기서는 스텁 `Document`가 그 콜백을 넘겨받아
 * 보관하고 테스트가 원하는 순간에 발화한다. 발화 전 = `numPages === null` = 버그가 나던 구간.
 *
 * ⚠️ **스텁 `Page`가 이 파일의 관찰 장치다.** `data-testid="page-{n}"`으로 렌더하므로
 *    `renderedPages`(가상화 렌더 큐)가 DOM으로 그대로 드러난다 — B25-03이 계약 #7
 *    ("대상의 '이전' 페이지를 강제 렌더하지 않는다")을 보는 방법이 이것이다. 렌더되지 않은
 *    쪽은 크기만 가진 placeholder `div`라 `page-{n}`이 없다.
 *
 * ⚠️ **실제 스크롤 좌표는 검증하지 않는다 — 할 수 없다.** jsdom에는 레이아웃이 없어
 *    `getBoundingClientRect()`가 전부 0을 돌려주고, `scrollToPage`의 좌표 계산은 그 값에
 *    의존한다. 그래서 이 파일이 보는 것은 "현재 쪽이 바뀌었나 · 대상이 렌더 큐에 들었나"이고,
 *    완료 기준의 "212쪽 PDF에서 그 쪽이 **보이는** 상태로 열림"은 **dev 육안** 몫이다.
 *    (계획서 § 검증 계약에 같은 내용을 적어 뒀다 — 녹색이어도 육안 확인을 건너뛰지 말 것)
 *
 * ⚠️ 보이는 쪽은 툴바 입력란 `.pdf-page-input`의 값으로 읽는다. `ref.scrollToPage`가
 *    `currentPage`와 함께 갱신하는 값이고, 툴바는 `numPages`가 잡힌 뒤에만 렌더된다.
 *    `onPageChange` prop은 로딩 직후 1쪽으로 한 번 불린 뒤 적용분으로 다시 불리므로
 *    "몇 번 불렸나"로 단언하지 않는다(구현 자유도를 과하게 묶는다).
 */
import { createRef } from 'react';

import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PdfPreviewPanel from 'components/PdfPreviewPanel';

// vi.mock 팩토리는 끌어올려지므로 보관함도 hoisted 여야 한다.
const stage = vi.hoisted(() => ({ fireLoad: null }));

vi.mock('react-pdf', () => ({
  // 컴포넌트가 import 시점에 workerSrc 를 대입한다 — 받아 줄 객체만 있으면 된다.
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({ onLoadSuccess, children }) => {
    stage.fireLoad = onLoadSuccess;
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }) => <div data-testid={`page-${pageNumber}`} />,
}));

/** 문서 로딩 완료를 테스트가 발화한다 (실제로는 react-pdf 가 비동기로 부른다). */
const loadDocument = (numPages) => act(() => stage.fireLoad({ numPages }));

const renderPanel = () => {
  const ref = createRef();
  const utils = render(<PdfPreviewPanel ref={ref} pdfUrl="blob:test.pdf" />);
  return { ref, ...utils };
};

/** 툴바에 보이는 현재 쪽. 툴바는 로딩 후에만 있으므로 로딩 전에는 부르지 않는다. */
const visiblePage = (container) => container.querySelector('.pdf-page-input').value;

beforeEach(() => {
  stage.fireLoad = null;
});

describe('로딩 전에 온 이동 요청 (Phase 1)', () => {
  it('[B25-01] 로딩 전 요청한 쪽이 로딩 후 현재 쪽이 된다', () => {
    const { ref, container } = renderPanel();

    act(() => ref.current.scrollToPage(3));
    loadDocument(5);

    expect(visiblePage(container)).toBe('3');
  });

  it('[B25-02] 로딩 후 대상 쪽이 실제로 렌더된다', () => {
    const { ref, getByTestId } = renderPanel();

    act(() => ref.current.scrollToPage(3));
    loadDocument(5);

    expect(getByTestId('page-3')).toBeInTheDocument();
  });

  it('[B25-03] 대상의 이전 쪽은 렌더 큐에 넣지 않는다 (계약 #7)', () => {
    const { ref, getByTestId, queryByTestId } = renderPanel();

    act(() => ref.current.scrollToPage(3));
    loadDocument(5);

    // 이전 쪽(2)을 함께 렌더하면 0px 상태로 누적 높이가 계산돼 한 쪽 짧게 안착한다.
    // 1쪽은 초기 렌더 큐에 원래 들어 있으므로 판정 대상이 아니다.
    expect(queryByTestId('page-2')).toBeNull();
    expect(getByTestId('page-3')).toBeInTheDocument();
    expect(getByTestId('page-4')).toBeInTheDocument();
  });

  it('[B25-06] 로딩 전 요청이 범위 밖이면 로딩 후에도 무시한다', () => {
    const { ref, container } = renderPanel();

    act(() => ref.current.scrollToPage(999));
    loadDocument(5);

    expect(visiblePage(container)).toBe('1');
  });
});

describe('로딩 후 이동은 지금과 같다 (회귀)', () => {
  it('[B25-04] 로딩 후 요청은 즉시 그 쪽으로 간다', () => {
    const { ref, container } = renderPanel();

    loadDocument(5);
    act(() => ref.current.scrollToPage(4));

    expect(visiblePage(container)).toBe('4');
  });

  it('[B25-05] 로딩 후 범위 밖 요청은 무시한다', () => {
    const { ref, container } = renderPanel();

    loadDocument(5);
    act(() => {
      ref.current.scrollToPage(0);
      ref.current.scrollToPage(6);
    });

    expect(visiblePage(container)).toBe('1');
  });
});
