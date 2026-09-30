/**
 * REQ-F15 Phase 2 — 문제집 이름 아래 파일명 병기: 판정 함수 + 작업 화면 배선
 *
 * 검증 계약: docs/plans/PLAN-F15-workbook-name-and-filename.md `## 검증 계약` (F15-05~07 · F15-11)
 *
 * `workbook_name`은 고유하지 않아(계약 #17) 이름만으로는 어떤 파일인지 모른다 — 이름 아래 작은 글씨로 파일명을 붙인다.
 * 같은 글자를 두 번 쓰지 않는다(2026-09-30 결정): 이름이 없으면 파일명이 이미 제목이고, 이름이 파일명에서 확장자만 뺀 것과 같아도 생략.
 * 작업 화면(`work.jsx`)은 렌더 무대가 없어 배선은 소스 스캔으로 본다(B12 `workEntryName.test.js`와 같은 방식).
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { resolveFileSubtitle } from 'utils/documentName';

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — 실행되는 코드만 남긴다. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('resolveFileSubtitle', () => {
  it('[F15-05] 문제집 이름과 파일명이 다르면 파일명을 돌려준다', () => {
    expect(resolveFileSubtitle({ workbook_name: '중3 기출', filename: '2026_중3.pdf' })).toBe('2026_중3.pdf');
  });

  it('[F15-06] 문제집 이름이 없으면 null (파일명이 이미 제목이다)', () => {
    expect(resolveFileSubtitle({ workbook_name: null, filename: '2026_중3.pdf' })).toBeNull();
  });

  it('[F15-07] 이름이 파일명에서 확장자만 뺀 것과 같으면 null', () => {
    expect(resolveFileSubtitle({ workbook_name: '기출', filename: '기출.pdf' })).toBeNull();
  });
});

describe('작업 화면 헤더 배선', () => {
  it('[F15-11] work.jsx 가 resolveFileSubtitle 을 import 해서 호출한다', () => {
    const code = stripComments(readFileSync('src/pages/analysis/work.jsx', 'utf-8'));
    expect([
      /import\s*\{[^}]*\bresolveFileSubtitle\b[^}]*\}\s*from\s*['"]utils\/documentName['"]/.test(code),
      /\bresolveFileSubtitle\s*\(/.test(code),
    ]).toEqual([true, true]);
  });
});
