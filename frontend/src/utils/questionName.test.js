/**
 * REQ-C10 Phase 2 — 문항 표시 이름 단일 정의 + 화면 배선 (소스 스캔)
 *
 * 검증 계약: docs/plans/PLAN-C10-question-source-title.md `## 검증 계약` (C10-16~24 · C10-28)
 *
 * 표시 이름 = "문항 " + (사용자 이름 || 원문 || 번호). "문항"은 사용자가 바꿀 수 없는 고정 접두어다(2026-10-01 결정).
 * 수동 문항도 접두어, 이름 없는 옛 수동은 `문항 (수동)`. 옛 이름이 "문항 3 심화"여도 걷어내지 않는다(데이터 그대로).
 * 입력 모양은 문항 조회 API 응답(`title`·`source_text`·`question_num`·`is_manual`)이다.
 * 편집 화면·작업 화면은 렌더 무대가 없어 배선은 소스 스캔으로 본다(F14 `badgesUsage.test.js`와 같은 방식).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { questionDisplayName } from 'utils/questionName';

const auto = (over) => ({ title: null, source_text: null, question_num: 3, is_manual: false, ...over });
const manual = (over) => ({ title: null, source_text: null, question_num: null, is_manual: true, ...over });

describe('questionDisplayName', () => {
  it('[C10-16] 사용자 이름이 있으면 원문보다 우선한다', () => {
    expect(questionDisplayName(auto({ title: '심화', source_text: '유형 01' }))).toBe('문항 심화');
  });

  it('[C10-17] 이름이 없으면 원문', () => {
    expect(questionDisplayName(auto({ source_text: '유형 01' }))).toBe('문항 유형 01');
  });

  it('[C10-18] 이름·원문이 없으면(옛 캐시) 번호', () => {
    expect(questionDisplayName(auto())).toBe('문항 3');
  });

  it('[C10-19] 수동 문항에도 접두어가 붙는다', () => {
    expect(questionDisplayName(manual({ title: '심화 2' }))).toBe('문항 심화 2');
  });

  it('[C10-20] 이름 없는 옛 수동 문항은 "문항 (수동)"', () => {
    expect(questionDisplayName(manual())).toBe('문항 (수동)');
  });

  it('[C10-21] 옛 이름의 "문항"을 걷어내지 않는다', () => {
    expect(questionDisplayName(auto({ title: '문항 3 심화' }))).toBe('문항 문항 3 심화');
  });

  it('[C10-22] 빈 문자열 이름은 없는 것으로 보고 원문으로 돌아간다', () => {
    expect(questionDisplayName(auto({ title: '', source_text: '유형 01' }))).toBe('문항 유형 01');
  });
});

/** 블록 주석과 줄 끝 `//` 주석을 걷어낸다 — 실행되는 코드만 남긴다. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const read = (path) => stripComments(readFileSync(join('src', path), 'utf-8'));

/** 따옴표·백틱으로 감싼 문자열 리터럴만. */
const stringLiterals = (code) => code.match(/(["'`])(?:(?!\1)[^\\\n]|\\.)*\1/g) ?? [];

const sourceFiles = (dir) => readdirSync(join('src', dir)).flatMap((name) => {
  const rel = `${dir}/${name}`;
  if (statSync(join('src', rel)).isDirectory()) return sourceFiles(rel);
  return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [rel] : [];
});

const USERS = [
  'components/QuestionAnalysisPanel.jsx',
  'components/QuestionListPanel.jsx',
  'components/SelectionOrderPanel.jsx',
  'components/WorkbookPreview.jsx',
  'pages/editor/index.jsx',
];

describe('표시 이름 사용처', () => {
  it.each(USERS)('[C10-23] %s 가 utils/questionName 을 import 한다', (path) => {
    expect(read(path)).toMatch(/from\s+['"]utils\/questionName['"]/);
  });

  it('[C10-24] components·pages 에 옛 폴백 리터럴(`문항 ${…}` · "(수동 문항)")이 없다', () => {
    const offenders = ['components', 'pages'].flatMap(sourceFiles).flatMap((path) =>
      stringLiterals(read(path))
        .filter((lit) => lit.includes('(수동 문항)') || /^`문항 \$\{/.test(lit))
        .map((lit) => `${path}: ${lit}`));
    expect(offenders).toEqual([]);
  });

  it('[C10-28] work.jsx 수동 추가 입력란에 "문항" 고정 접두어(InputAdornment)가 붙는다', () => {
    expect(read('pages/analysis/work.jsx')).toMatch(/<InputAdornment[^>]*>\s*문항\s*<\/InputAdornment>/);
  });
});
