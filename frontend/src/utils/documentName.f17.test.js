/**
 * REQ-F17 Phase 1 — 이름 표시 규칙 (확장자 제거 · 제목 · 부제)
 *
 * 검증 계약: docs/plans/PLAN-F17-source-label-format.md `## 검증 계약` (F17-01~09)
 *
 * 제목·부제를 만드는 코드가 지금 **두 벌**이다 — 작업 화면은 `resolveDocumentName`을 쓰는데
 * 분석 목록 카드는 인라인(`job.workbook_name || job.filename || "unknown.pdf"`)이라 폴백까지
 * 다르다(계획서 § 제약·함정). 이 파일은 **한 벌로 합쳐진 공유 헬퍼**를 검증하고,
 * 각 화면이 실제로 그걸 쓰는지는 `pages/analysis/f17Name.test.js`(소스 스캔)가 본다.
 *
 * ⚠️ 부제는 `BookCard`의 `caption`이다 — 같은 카드의 `subtitle` prop은 업로드 상대 시각
 *    ("3일 전")이라 다른 줄이다. 이름이 겹치니 헷갈리지 말 것.
 */
import { describe, expect, it } from 'vitest';

import { resolveDocumentName, resolveFileSubtitle, stripExtension } from 'utils/documentName';

describe('stripExtension — 마지막 점 뒤를 뺀다', () => {
  it('[F17-01] 점이 여럿이면 마지막 점 뒤만 뺀다', () => {
    expect(stripExtension('2026 1학기.중간.pdf')).toBe('2026 1학기.중간');
  });

  it('[F17-02] 점이 없으면 그대로 둔다', () => {
    expect(stripExtension('기출')).toBe('기출');
  });

  it('[F17-03] 대문자 확장자도 뺀다', () => {
    expect(stripExtension('심화대비.PDF')).toBe('심화대비');
  });
});

describe('제목 — resolveDocumentName', () => {
  it('[F17-04] workbook_name이 있으면 그대로 쓴다', () => {
    expect(resolveDocumentName({ workbook_name: '심화대비', filename: '2026.중간.pdf' })).toBe('심화대비');
  });

  it('[F17-05] 이름이 없으면 확장자 뺀 파일명', () => {
    expect(resolveDocumentName({ filename: '2026 1학기.중간.pdf' })).toBe('2026 1학기.중간');
  });

  it('[F17-06] 이름도 파일명도 없으면 unknown.pdf (jobId를 노출하지 않는다)', () => {
    // jobId 노출은 REQ-B12가 없애려던 증상이다 — 두 번째 인자로 줘도 쓰이면 안 된다.
    expect(resolveDocumentName({}, 'job-1234')).toBe('unknown.pdf');
  });
});

describe('부제(caption) — resolveFileSubtitle', () => {
  it('[F17-07] 이름이 확장자만 뺀 파일명과 같으면 숨긴다', () => {
    expect(resolveFileSubtitle({ workbook_name: '2026.중간', filename: '2026.중간.pdf' })).toBeNull();
  });

  it('[F17-08] 이름이 없을 때도 숨긴다 — 제목이 확장자 뺀 파일명이라 같아진다', () => {
    expect(resolveFileSubtitle({ filename: '2026 1학기.중간.pdf' })).toBeNull();
  });

  it('[F17-09] 이름이 파일명과 다르면 파일명을 부제로 준다', () => {
    expect(resolveFileSubtitle({ workbook_name: '심화대비', filename: '2026.중간.pdf' })).toBe('2026.중간.pdf');
  });
});
