/**
 * REQ-F13 Phase 2 — 미리보기가 표지·각주·워터마크를 그린다 (렌더 테스트)
 *
 * 검증 계약: docs/plans/PLAN-F13-preview-template-rendering.md `## 검증 계약`
 * 케이스: F13-09 ~ F13-20
 *
 * `WorkbookPreview`는 이 레포에서 **처음으로 진짜 렌더 테스트가 가능한 화면 요소다** —
 * `api/client`를 import하지 않고 MUI도 쓰지 않아 mock도 ThemeProvider도 필요 없다
 * (`editor`·`format`은 API mock이 5~6개 필요해 소스 스캔까지만 가능했다).
 *
 * ⚠️ **무대 함정 — `setupTests.js`의 전역 `IntersectionObserver` 스텁은 콜백을 절대
 *    호출하지 않는다.** `usePageVisible`이 그걸 쓰므로 `visible`이 영원히 `false`가 되고
 *    페이지가 **껍데기만** 렌더된다. 덮지 않으면 아래 단언이 전부 "없음"으로 떨어져
 *    **구현 결함처럼 보인다** — 계약 #25가 말하는 "단언이 아니라 무대가 틀린 경우"다.
 *    그래서 이 파일은 즉시 발화하는 관찰자로 덮는다.
 *
 * ⚠️ **선택자는 계획서가 정하지 않아 이 파일이 검증 계약으로 고정한다** — 살아 있는 접두사
 *    `wbp-*`를 따른다(계약 #4): 표지 페이지 `.wbp-page[data-cover="true"]` ·
 *    표지 이미지 `.wbp-cover-img` · 각주 `.wbp-footnote` · 워터마크 `.wbp-watermark`.
 *
 * ⚠️ **F13-17·18은 현재 값(8pt·15%)이 아니라 일부러 다른 값을 넘긴다.** 현재 값으로
 *    테스트하면 **하드코딩해도 통과해서** 계획서 § 제약("렌더 상수를 프론트에 하드코딩하지
 *    않는다")을 못 지킨다. `previewWidth = A4_WIDTH_PT`로 두어 scale = 1이 되게 하면
 *    pt 값이 그대로 px로 나와 부동소수 비교를 피할 수 있다.
 */
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import WorkbookPreview from 'components/WorkbookPreview';
import { A4_WIDTH_PT } from 'utils/workbookLayout';

beforeEach(() => {
  // 관찰 즉시 "보인다"고 알린다 — 전역 스텁은 콜백을 부르지 않는다(위 주석).
  global.IntersectionObserver = class {
    constructor(cb) { this._cb = cb; }
    observe() { this._cb([{ isIntersecting: true }]); }
    disconnect() {}
  };
});

const RENDER = {
  footnote_font_size: 8,
  footnote_margin: 12,
  footnote_color: '#666666',
  watermark_size_ratio: 0.6,
  watermark_opacity: 0.15,
};

const selection = (n) => ({
  questionId: `job-a:0:${n}`,
  jobId: 'job-a',
  pageNum: 0,
  questionNum: n,
  thumbnailUrl: `/api/jobs/job-a/pages/0/questions/${n}/thumbnail`,
  displayTitle: `문항 ${n}`,
  scale: 1,
});

const template = (over = {}) => ({
  template_id: 't1',
  name: '기본형',
  cover: { name: '표지A', image_url: '/api/covers/c1/image' },
  footnote: { name: '각주A', text: '무단 배포를 금합니다.' },
  watermark: { name: '워터마크A', image_url: '/api/watermarks/w1/image' },
  render: RENDER,
  ...over,
});

const draw = (props) =>
  render(
    <WorkbookPreview
      selections={[selection(1), selection(2)]}
      layout="세로 2단"
      previewWidth={A4_WIDTH_PT}
      {...props}
    />,
  );

const pages = (container) => [...container.querySelectorAll('.wbp-page')];
const coverPage = (container) => container.querySelector('.wbp-page[data-cover="true"]');
const contentPages = (container) =>
  pages(container).filter((p) => p.dataset.cover !== 'true');

describe('표지 페이지', () => {
  it('[F13-09] 표지가 있으면 페이지가 1개 늘어난다', () => {
    const { container: without } = draw({ template: null });
    const base = pages(without).length;

    const { container: withCover } = draw({ template: template() });

    expect(pages(withCover).length).toBe(base + 1);
  });

  it('[F13-10] 표지 페이지에 표지 이미지가 그려진다', () => {
    const { container } = draw({ template: template() });

    expect(coverPage(container).querySelector('.wbp-cover-img'))
      .toHaveAttribute('src', expect.stringContaining('/api/covers/c1/image'));
  });

  it('[F13-16] 각주만 있는 템플릿은 페이지가 안 늘어난다', () => {
    const { container: without } = draw({ template: null });
    const base = pages(without).length;

    const { container } = draw({ template: template({ cover: null, watermark: null }) });

    expect(pages(container).length).toBe(base);
  });

  it('[F13-19] 페이지 카운터의 분모가 표지를 포함한다', () => {
    const { container: without } = draw({ template: null });
    const base = pages(without).length;

    const { container } = draw({ template: template() });

    // 표지 페이지가 자기 카운터를 그리는지는 계획서가 정하지 않았다 — 여기서 고정하는 것은
    // **분모**뿐이다("카운터가 `1/4`로 바뀌는 것은 실제 PDF가 4페이지가 되므로 오히려 정확하다").
    expect(container.textContent).toContain(`/ ${base + 1}`);
  });
});

describe('각주·워터마크', () => {
  it('[F13-11] 각주 텍스트가 문항 페이지에 그려진다', () => {
    const { container } = draw({ template: template() });

    expect(contentPages(container)[0].querySelector('.wbp-footnote'))
      .toHaveTextContent('무단 배포를 금합니다.');
  });

  it('[F13-12] 워터마크 이미지가 문항 페이지에 그려진다', () => {
    const { container } = draw({ template: template() });

    expect(contentPages(container)[0].querySelector('.wbp-watermark'))
      .toHaveAttribute('src', expect.stringContaining('/api/watermarks/w1/image'));
  });

  it('[F13-13] 표지 페이지에는 각주가 없다', () => {
    const { container } = draw({ template: template() });

    expect(coverPage(container).querySelector('.wbp-footnote')).toBeNull();
  });

  it('[F13-14] 표지 페이지에는 워터마크가 없다', () => {
    const { container } = draw({ template: template() });

    expect(coverPage(container).querySelector('.wbp-watermark')).toBeNull();
  });

  it('[F13-15] 템플릿이 없으면 표지·각주·워터마크가 모두 안 그려진다', () => {
    const { container } = draw({ template: null });

    expect(container.querySelectorAll('.wbp-cover-img, .wbp-footnote, .wbp-watermark'))
      .toHaveLength(0);
  });
});

describe('렌더 상수는 서버가 준 값을 따른다', () => {
  it('[F13-17] 각주 글자 크기가 서버가 준 값을 따른다', () => {
    const { container } = draw({
      template: template({ render: { ...RENDER, footnote_font_size: 20 } }),
    });

    // previewWidth = A4_WIDTH_PT 라 scale = 1 → pt 값이 그대로 px 로 나온다.
    expect(contentPages(container)[0].querySelector('.wbp-footnote'))
      .toHaveStyle({ fontSize: '20px' });
  });

  it('[F13-18] 워터마크 투명도가 서버가 준 값을 따른다', () => {
    const { container } = draw({
      template: template({ render: { ...RENDER, watermark_opacity: 0.42 } }),
    });

    expect(contentPages(container)[0].querySelector('.wbp-watermark'))
      .toHaveStyle({ opacity: '0.42' });
  });
});

describe('가상화·인덱스 회귀', () => {
  it('[F13-20] 표지가 있어도 각 문항 페이지의 내용이 표지 없을 때와 같다', () => {
    const selections = [selection(1), selection(2), selection(3)];

    // ⚠️ 페이지 **전체 텍스트**로 비교하면 안 된다 — 카운터 분모가 표지 때문에 달라지는데
    //    (F13-19) 그건 정상이다. "어떤 문항이 어느 페이지에 들어갔나"만 본다.
    const cellSrcs = (container) =>
      contentPages(container).map((p) =>
        [...p.querySelectorAll('.wbp-cell-img')].map((img) => img.getAttribute('src')),
      );

    const { container: without } = render(
      <WorkbookPreview selections={selections} layout="세로 2단" previewWidth={A4_WIDTH_PT} />,
    );
    const expected = cellSrcs(without);

    const { container: withCover } = render(
      <WorkbookPreview
        selections={selections}
        layout="세로 2단"
        previewWidth={A4_WIDTH_PT}
        template={template()}
      />,
    );

    expect(cellSrcs(withCover)).toEqual(expected);
  });
});
