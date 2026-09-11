/**
 * REQ-29 Phase 2 — 각주·워터마크 클라이언트 함수 검증 계약
 *
 * 검증 계약: docs/plans/PLAN-29-footnote-watermark-registration.md `## 검증 계약`
 * 케이스: 29-16 ~ 29-23
 *
 * `api/client.js`는 `fetch`를 감싼 순수 함수라 페이지를 렌더하지 않고도 `global.fetch`를
 * 모킹해 요청 URL·body를 직접 검증할 수 있다 — `editor/index.jsx`·`format/index.jsx`는
 * 렌더 무대가 없어(D11 로그 "편집·표지 화면은 렌더 무대(API mock)가 없어") 이 레이어가
 * 이번 Phase의 가장 신뢰도 높은 검증이다.
 *
 * `apiFetch`의 GET 경로는 응답에 `.clone()`을 호출한다(요청 중복 제거) — 그래서 GET을
 * 쓰는 함수(`listFootnotes`·`listWatermarks`)는 진짜 `Response` 객체로 모킹해야 한다.
 * POST/DELETE는 원본 fetch 결과를 그대로 반환해 clone이 필요 없다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createFootnote, listFootnotes, deleteFootnote,
  uploadWatermark, listWatermarks, deleteWatermark,
  startExtractV2,
} from 'api/client';

const jsonResponse = (body, { status = 200 } = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('각주 클라이언트 함수', () => {
  it('[29-16] createFootnote가 POST /footnotes에 이름·텍스트를 JSON body로 보낸다', async () => {
    fetch.mockResolvedValue(jsonResponse({ footnote_id: 'f1', name: 'n', text: 't', created_at: '' }));

    await createFootnote('n', 't');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/footnotes');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ name: 'n', text: 't' });
  });

  it('[29-17] listFootnotes가 GET /footnotes를 호출한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ footnotes: [] }));

    await listFootnotes();

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/footnotes');
    expect(opts?.method ?? 'GET').toBe('GET');
  });

  it('[29-18] deleteFootnote가 DELETE /footnotes/{id}를 호출한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: 'ok' }));

    await deleteFootnote('f1');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/footnotes/f1');
    expect(opts.method).toBe('DELETE');
  });
});

describe('워터마크 클라이언트 함수', () => {
  it('[29-19] uploadWatermark가 POST /watermarks에 파일을 FormData로 보낸다', async () => {
    fetch.mockResolvedValue(jsonResponse({ watermark_id: 'w1', name: 'n', thumbnail_url: '', created_at: '' }));
    const file = new File(['x'], 'wm.png', { type: 'image/png' });

    await uploadWatermark(file, '로고');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/watermarks');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBeInstanceOf(FormData);
    expect(opts.body.get('name')).toBe('로고');
  });

  it('[29-20] listWatermarks가 GET /watermarks를 호출한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ watermarks: [] }));

    await listWatermarks();

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/watermarks');
    expect(opts?.method ?? 'GET').toBe('GET');
  });

  it('[29-21] deleteWatermark가 DELETE /watermarks/{id}를 호출한다', async () => {
    fetch.mockResolvedValue(jsonResponse({ message: 'ok' }));

    await deleteWatermark('w1');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/watermarks/w1');
    expect(opts.method).toBe('DELETE');
  });
});

describe('startExtractV2 — footnote_id·watermark_id 전달', () => {
  it('[29-22] footnoteId·watermarkId를 주면 body에 footnote_id·watermark_id로 실린다', async () => {
    fetch.mockResolvedValue(jsonResponse({ job_id: 'e1', message: '' }));

    await startExtractV2(
      [{ jobId: 'j', pageNum: 0, questionNum: 1 }],
      '2단', null, null, 'fn-1', 'wm-1',
    );

    const [, opts] = fetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.footnote_id).toBe('fn-1');
    expect(body.watermark_id).toBe('wm-1');
  });

  it('[29-23] 둘 다 안 주면 body에 그 키 자체가 없다', async () => {
    fetch.mockResolvedValue(jsonResponse({ job_id: 'e1', message: '' }));

    await startExtractV2([{ jobId: 'j', pageNum: 0, questionNum: 1 }], '2단');

    const [, opts] = fetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body).not.toHaveProperty('footnote_id');
    expect(body).not.toHaveProperty('watermark_id');
  });
});
