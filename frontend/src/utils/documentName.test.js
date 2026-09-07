/**
 * REQ-B12 Phase 1 — 작업 화면 문서 이름 출처를 jobInfo 하나로
 *
 * 검증 계약: docs/plans/PLAN-B12-work-entry-name.md `## 검증 계약` (B12-01~04)
 *
 * 이름 파생을 순수 함수로 뺀 이유는 PLAN §제약·함정과 같다 — `work.jsx`는 렌더 무대가
 * 없어(API mock 5~6개 필요) 화면째로 테스트하기보다, 표시 문자열을 만드는 로직만
 * 떼어 단위 테스트한다. 네 진입 경로(벨·URL 직접·새로고침·목록 클릭)는 전부 같은
 * `jobInfo`를 읽으므로 경로별 테스트가 아니라 이 함수 하나로 수렴한다.
 */
import { describe, expect, it } from 'vitest';

import { NAME_LOADING_LABEL, resolveDocumentName } from 'utils/documentName';

describe('resolveDocumentName', () => {
  it('[B12-01] workbook_name이 있으면 그것을 반환한다', () => {
    const jobInfo = { workbook_name: '중간고사 모음', filename: 'original.pdf' };
    expect(resolveDocumentName(jobInfo, 'job-a')).toBe('중간고사 모음');
  });

  it('[B12-02] workbook_name이 없고 filename이 있으면 filename을 반환한다', () => {
    const jobInfo = { workbook_name: null, filename: 'original.pdf' };
    expect(resolveDocumentName(jobInfo, 'job-a')).toBe('original.pdf');
  });

  it('[B12-03] workbook_name·filename이 둘 다 없으면 jobId를 반환한다', () => {
    const jobInfo = { workbook_name: null, filename: null };
    expect(resolveDocumentName(jobInfo, 'job-a')).toBe('job-a');
  });

  it('[B12-04] jobInfo가 null이면 로딩 문구를 반환하고 jobId를 노출하지 않는다', () => {
    const result = resolveDocumentName(null, 'job-a');
    expect(result).toBe(NAME_LOADING_LABEL);
    expect(result).not.toContain('job-a');
  });
});
