/**
 * REQ-F17 Phase 1 — 출처 문구 "n번) 문제집. p쪽. 문항이름."
 *
 * 검증 계약: docs/plans/PLAN-F17-source-label-format.md `## 검증 계약` (F17-10~13)
 *
 * 지금 라벨 조립은 `WorkbookPreview` JSX 안에 인라인이라 이음매가 없다 — 순수 함수로 빼고
 * 그걸 검증한다(D10 `columnsForWidth`, B12 `resolveDocumentName`, F12 `resolveTargetPage`와 같은 패턴).
 *
 * ⚠️ **계약 #12 — 같은 문자열을 백엔드 `pdf_service`도 그린다.** 이 파일과 짝이 되는
 *    `backend/tests/test_f17_source_label.py`(F17-14)가 같은 입력·같은 기대값을 쓴다.
 *    한쪽만 고치면 미리보기와 생성 PDF가 갈린다 — 기대 문자열을 바꿀 땐 **반드시 둘 다** 고친다.
 */
import { describe, expect, it } from 'vitest';

import { buildSourceLabel } from 'utils/sourceLabel';

describe('buildSourceLabel', () => {
  it('[F17-10] 전부 갖춰지면 "n번) 문제집. p쪽. 문항이름."', () => {
    expect(
      buildSourceLabel({ index: 1, workbookName: '심화대비', pageNum: 2, questionName: '문항 유형 01' })
    ).toBe('1번) 심화대비. p3. 문항 유형 01.');
  });

  it('[F17-11] 문항 이름이 없으면 끝의 마침표가 하나뿐이다', () => {
    // 요소가 조건부로 빠지므로 이미 "." 로 끝난다 — 하나 더 붙여 "p3.." 가 되면 안 된다.
    expect(
      buildSourceLabel({ index: 1, workbookName: '심화대비', pageNum: 2, questionName: '' })
    ).toBe('1번) 심화대비. p3.');
  });

  it('[F17-12] 문제집 이름이 없으면 확장자 뺀 파일명이 들어간다', () => {
    expect(
      buildSourceLabel({ index: 1, workbookName: '', filename: '2026 1학기.중간.pdf', pageNum: 2, questionName: '문항 1' })
    ).toBe('1번) 2026 1학기.중간. p3. 문항 1.');
  });

  it('[F17-13] 쪽 번호는 1-based로 그린다', () => {
    expect(
      buildSourceLabel({ index: 1, workbookName: '심화대비', pageNum: 0, questionName: '문항 1' })
    ).toBe('1번) 심화대비. p1. 문항 1.');
  });
});
