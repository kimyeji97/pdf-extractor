/**
 * REQ-30 Phase 2 — 생성 화면의 템플릿 선택 배선 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-30-template-entity.md `## 검증 계약`
 * 케이스: 30-36 ~ 30-38, 30-41
 *
 * `editor/index.jsx`는 API mock이 여러 개 필요해 렌더 무대가 없다(계획서 § 제약·함정,
 * D11·REQ-29 로그와 동일 결론). 실제 요청 구성 자체는 `api/client.template.test.js`가
 * 렌더 없이 완전히 덮는다.
 *
 * ⚠️ 이 파일은 REQ-29의 `footnoteWatermarkSelect.test.js`(29-26~28)를 **대체한다** —
 * 그 케이스들은 `selectedFootnoteId`·`selectedWatermarkId`라는 소스 문자열에 묶여 있는데,
 * REQ-30이 칩 3줄을 템플릿 1줄로 접으면서 그 변수들이 사라지기 때문이다. 설계상 의도된
 * 은퇴이지 구현 결함이 아니다(계획서 § 결정 "REQ-29 케이스 29-26~28"). 같은 보장
 * (선택 상태 → `startExtractV2` 인자 전달)은 30-36·30-37이 승계한다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const editorSource = () => stripComments(readFileSync('src/pages/editor/index.jsx', 'utf-8'));

describe('생성 화면에 템플릿 선택 배선이 있다 (Phase 2)', () => {
  it('[30-36] listTemplates를 불러 템플릿 선택 상태를 갖는다', () => {
    const code = editorSource();

    expect(code).toContain('listTemplates');
    expect(code).toMatch(/selectedTemplateId/);
  });

  it('[30-37] startExtractV2 호출에 선택한 템플릿 id가 인자로 전달된다', () => {
    const code = editorSource();

    const idx = code.indexOf('startExtractV2(');
    expect(idx).toBeGreaterThan(-1);
    const call = code.slice(idx, idx + 400);
    expect(call).toMatch(/selectedTemplateId/);
  });

  it('[30-38] 표지·각주·워터마크 개별 선택 상태가 남아 있지 않다', () => {
    const code = editorSource();

    expect(code).not.toMatch(/selectedCoverId/);
    expect(code).not.toMatch(/selectedFootnoteId/);
    expect(code).not.toMatch(/selectedWatermarkId/);
  });

  it('[30-41] 복원한 템플릿이 목록에 없을 때 "삭제된 템플릿" 표시가 있다', () => {
    const code = editorSource();

    expect(code).toContain('삭제된 템플릿');
  });
});
