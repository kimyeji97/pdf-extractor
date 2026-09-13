/**
 * REQ-30 Phase 2 — 템플릿 클라이언트 함수 검증 계약
 *
 * 검증 계약: docs/plans/PLAN-30-template-entity.md `## 검증 계약`
 * 케이스: 30-29 ~ 30-35
 *
 * `api/client.js`는 `fetch`를 감싼 순수 함수라 페이지를 렌더하지 않고도 `global.fetch`를
 * 모킹해 요청 URL·method·body를 직접 검증할 수 있다 — `editor/index.jsx`·`format/index.jsx`는
 * 렌더 무대가 없어(계획서 § 제약·함정) 이 레이어가 이번 Phase의 가장 신뢰도 높은 검증이다.
 * REQ-29 Phase 2가 도입한 방식을 그대로 따른다.
 *
 * `apiFetch`의 GET 경로는 응답에 `.clone()`을 호출한다(요청 중복 제거) — 그래서 GET을 쓰는
 * `listTemplates`는 진짜 `Response` 객체로 모킹해야 한다. POST/PATCH/DELETE는 불필요.
 *
 * ⚠️ 계획서가 클라이언트 함수 시그니처까지 정하지는 않았다. 아래 넷은 **이 테스트가 검증
 * 계약으로 고정한다**(`/implement`는 이를 따른다) — 기존 `client.js` 관례에 맞춘 최소 형태다:
 *   createTemplate(name, coverId, footnoteId, watermarkId)
 *   updateTemplate(templateId, patch)          // 부분 갱신이라 객체를 받는다
 *   deleteCover(coverId, { force })            // 기존 1인자 호출과 호환되는 선택적 옵션
 *   startExtractV2(..., watermarkId, templateId)  // 기존 6인자 뒤에 7번째로 붙인다
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createTemplate, listTemplates, updateTemplate, deleteTemplate,
  deleteCover, startExtractV2,
} from 'api/client';

const jsonResponse = (body, { status = 200 } = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const templateBody = {
  template_id: 't1', name: '기본형',
  cover_id: 'c1', footnote_id: 'f1', watermark_id: 'w1',
  needs_review: false, created_at: '',
};

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('템플릿 클라이언트 함수', () => {
  it('[30-29] createTemplate가 POST /templates에 이름·id 3개를 JSON body로 보낸다', async () => {
    fetch.mockResolvedValue(jsonResponse(templateBody));

    await createTemplate('기본형', 'c1', 'f1', 'w1');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/templates');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({
      name: '기본형', cover_id: 'c1', footnote_id: 'f1', watermark_id: 'w1',
    });
  });

  it('[30-30] listTemplates가 GET /templates를 호출한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ templates: [] }));

    await listTemplates();

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/templates');
    expect(opts?.method ?? 'GET').toBe('GET');
  });

  it('[30-31] updateTemplate가 PATCH /templates/{id}를 호출한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ ...templateBody, cover_id: 'c2' }));

    await updateTemplate('t1', { cover_id: 'c2' });

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/templates/t1');
    expect(opts.method).toBe('PATCH');
  });

  it('[30-32] deleteTemplate가 DELETE /templates/{id}를 호출한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: '삭제되었습니다.' }));

    await deleteTemplate('t1');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/templates/t1');
    expect(opts.method).toBe('DELETE');
  });
});

describe('강제 삭제 (A′)', () => {
  it('[30-33] deleteCover가 강제 삭제 의사를 요청에 싣는다', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: '삭제되었습니다.' }));

    await deleteCover('c1', { force: true });

    const [url] = fetch.mock.calls[0];
    expect(url).toContain('force=true');
  });
});

describe('생성 요청의 template_id', () => {
  it('[30-34] startExtractV2가 templateId를 body에 template_id로 싣는다', async () => {
    fetch.mockResolvedValue(jsonResponse({ job_id: 'e1' }));

    await startExtractV2([{ jobId: 'j1', pageNum: 0 }], '2단', null, null, null, null, 't1');

    const [, opts] = fetch.mock.calls[0];
    expect(JSON.parse(opts.body).template_id).toBe('t1');
  });

  it('[30-35] templateId를 안 주면 body에 template_id 키 자체가 없다', async () => {
    fetch.mockResolvedValue(jsonResponse({ job_id: 'e1' }));

    await startExtractV2([{ jobId: 'j1', pageNum: 0 }], '2단');

    const [, opts] = fetch.mock.calls[0];
    expect('template_id' in JSON.parse(opts.body)).toBe(false);
  });
});
