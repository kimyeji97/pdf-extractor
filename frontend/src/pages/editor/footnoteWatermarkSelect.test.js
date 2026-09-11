/**
 * REQ-29 Phase 2 — 생성 화면의 각주·워터마크 선택 배선 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-29-footnote-watermark-registration.md `## 검증 계약`
 * 케이스: 29-26 ~ 29-28
 *
 * `editor/index.jsx`는 API mock이 여러 개 필요해 렌더 무대가 없다 — `docs/PROGRESS.md`
 * D11 로그와 동일 결론("편집·표지 화면은 렌더 무대(API mock)가 없어"). 실제 요청 구성
 * 자체는 `client.footnoteWatermark.test.js`가 렌더 없이 완전히 덮는다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const editorSource = () => stripComments(readFileSync('src/pages/editor/index.jsx', 'utf-8'));

describe('생성 화면에 각주·워터마크 선택 배선이 있다 (Phase 2)', () => {
  it('[29-26] listFootnotes를 불러 각주 선택 상태를 갖는다', () => {
    const code = editorSource();

    expect(code).toContain('listFootnotes');
    expect(code).toMatch(/selectedFootnoteId/);
  });

  it('[29-27] listWatermarks를 불러 워터마크 선택 상태를 갖는다', () => {
    const code = editorSource();

    expect(code).toContain('listWatermarks');
    expect(code).toMatch(/selectedWatermarkId/);
  });

  it('[29-28] startExtractV2 호출에 선택한 각주·워터마크 id가 인자로 전달된다', () => {
    const code = editorSource();

    const idx = code.indexOf('startExtractV2(');
    expect(idx).toBeGreaterThan(-1);
    const call = code.slice(idx, idx + 400);
    expect(call).toMatch(/selectedFootnoteId/);
    expect(call).toMatch(/selectedWatermarkId/);
  });
});
