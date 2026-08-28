/**
 * 미리보기 URL의 캐시 키 분리 (R2 CORS 재발 방지)
 *
 * ⚠️ 이 건은 계획서 없이 진행했다(2026-08-28 사용자 결정, TODO 2단계 마지막 항목).
 *    그래서 케이스 ID 접두사가 없다 — 계약 #25의 ID 규약은 계획서 `## 검증 계약` 표와
 *    코드를 잇는 끈이고, 여기서는 이을 표가 없다.
 */
import { describe, expect, it } from 'vitest';

import { toPreviewUrl } from 'utils/previewUrl';

describe('toPreviewUrl', () => {
  it('퍼블릭 URL에는 캐시 키를 가르는 쿼리를 붙인다', () => {
    const out = toPreviewUrl('https://dailystudy-dev.example.com/results/abc/result.pdf');
    expect(new URL(out).searchParams.get('preview')).toBe('1');
  });

  it('기존 쿼리를 지우지 않는다', () => {
    const out = toPreviewUrl('https://cdn.example.com/a.pdf?v=3');
    expect(new URL(out).searchParams.get('v')).toBe('3');
  });

  it('presigned URL은 그대로 둔다 — 쿼리를 더하면 서명이 깨진다', () => {
    const signed =
      'https://r2.example.com/results/abc/result.pdf?X-Amz-Signature=deadbeef&X-Amz-Credential=key';
    expect(toPreviewUrl(signed)).toBe(signed);
  });

  it('null/빈 값은 그대로 돌려준다', () => {
    expect(toPreviewUrl(null)).toBeNull();
  });
});
