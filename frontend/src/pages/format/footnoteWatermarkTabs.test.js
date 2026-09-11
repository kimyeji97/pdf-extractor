/**
 * REQ-29 Phase 2 — 템플릿 관리 화면의 각주·워터마크 등록 배선 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-29-footnote-watermark-registration.md `## 검증 계약`
 * 케이스: 29-24 ~ 29-25
 *
 * `format/index.jsx`는 API mock이 여러 개 필요해 렌더 무대가 없다 — `docs/PROGRESS.md`
 * D11 로그: "편집·표지 화면은 렌더 무대(API mock)가 없어 이번 범위에 비해 커서 스캔으로
 * 대체했다". B12·D11과 같은 기법으로 소스 문자열만 확인한다. 실제 요청 구성 자체는
 * `client.footnoteWatermark.test.js`가 렌더 없이 완전히 덮는다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const formatSource = () => stripComments(readFileSync('src/pages/format/index.jsx', 'utf-8'));

describe('템플릿 관리 화면에 각주·워터마크 등록 배선이 있다 (Phase 2)', () => {
  it('[29-24] 각주 등록 배선(createFootnote 또는 listFootnotes)이 있다', () => {
    const code = formatSource();

    expect(code).toMatch(/createFootnote|listFootnotes/);
  });

  it('[29-25] 워터마크 등록 배선(uploadWatermark 또는 listWatermarks)이 있다', () => {
    const code = formatSource();

    expect(code).toMatch(/uploadWatermark|listWatermarks/);
  });
});
