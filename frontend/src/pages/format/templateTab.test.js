/**
 * REQ-30 Phase 2 — 템플릿 관리 탭 + "구성 변경됨" 칩 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-30-template-entity.md `## 검증 계약`
 * 케이스: 30-39 ~ 30-40
 *
 * `format/index.jsx`는 API mock이 여러 개 필요해 렌더 무대가 없다(계획서 § 제약·함정).
 * 실제 요청 구성은 `api/client.template.test.js`가 렌더 없이 덮는다.
 *
 * 30-40은 **두 파일을 함께** 읽는다 — 칩이 한쪽에만 있으면 관리 화면에서 못 고치거나
 * (생성 화면 전용) 생성 직전에 모른다(관리 화면 전용). "양쪽"이 계약이라 한 케이스로 묶었다.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const read = (path) => stripComments(readFileSync(path, 'utf-8'));

const formatSource = () => read('src/pages/format/index.jsx');
const editorSource = () => read('src/pages/editor/index.jsx');

describe('템플릿 관리 탭 (Phase 2)', () => {
  it('[30-39] 템플릿 생성·수정 배선이 있다', () => {
    const code = formatSource();

    expect(code).toContain('createTemplate');
    expect(code).toContain('updateTemplate');
  });
});

describe('구성이 바뀐 템플릿 표시', () => {
  it('[30-40] "구성 변경됨" 칩 문구가 관리 화면과 생성 화면 양쪽에 있다', () => {
    expect(formatSource()).toContain('구성 변경됨');
    expect(editorSource()).toContain('구성 변경됨');
  });
});
