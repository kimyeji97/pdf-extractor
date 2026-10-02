/**
 * REQ-B23 Phase 1 — 결과 상태 조회(getStatus)가 인증 헤더를 싣는다 + raw fetch 인증 누락 방지
 *
 * 검증 계약: docs/plans/PLAN-B23-status-poll-401.md `## 검증 계약`
 * 케이스: B23-01 ~ B23-03
 *
 * `/api/status/{job_id}` 는 보호 라우트인데 `getStatus` 는 계약 #26 raw fetch 라 `apiFetch` 의 자동 헤더가 없다 →
 * PDF 생성 폴링·결과 화면이 401. 계약 #31 이 있었는데도 놓쳐서, B23-03 이 `client.js` 를 스캔해 **raw fetch 함수는
 * `_authHeaders()` 를 쓰거나 무인증 예외 목록에 있어야** 통과하게 한다(사용자 결정 2026-09-30).
 *
 * 무인증 예외 = 백엔드가 인증을 걸지 않은 엔드포인트: 알림 피드 둘(F09 "모두의 알림") · `logout`(access 쿠키만 지운다).
 * 새 raw fetch 를 더하면 헤더를 붙이거나 **여기에 이름과 이유를 적어야** 한다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getStatus, setLoadingCallback } from 'api/client';

// REQ-B27: 알림 API 도 인증이 필요해져 예외에서 뺐다 — 남은 건 무인증 엔드포인트뿐
const UNAUTHENTICATED_RAW_FETCH = new Set(['logout']);

const jsonResponse = (body, { status = 200 } = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  global.fetch = vi.fn();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  setLoadingCallback(null);
  localStorage.clear();
});

describe('getStatus 인증', () => {
  it('[B23-01] 토큰이 있으면 Authorization: Bearer 헤더를 싣는다', async () => {
    localStorage.setItem('access_token', 'tok-1');
    fetch.mockResolvedValue(jsonResponse({ job_id: 'j1', status: 'DONE' }));

    await getStatus('j1');

    const [, opts] = fetch.mock.calls[0];
    expect(opts?.headers?.Authorization).toBe('Bearer tok-1');
  });

  it('[B23-02] 호출해도 전역 로딩(GlobalDim) 콜백을 켜지 않는다 — raw fetch 유지(계약 #26)', async () => {
    const onLoading = vi.fn();
    setLoadingCallback(onLoading);
    localStorage.setItem('access_token', 'tok-1');
    fetch.mockResolvedValue(jsonResponse({ job_id: 'j1', status: 'PROCESSING' }));

    await getStatus('j1');

    expect(onLoading).not.toHaveBeenCalledWith(true);
  });
});

describe('client.js raw fetch 인증 스캔', () => {
  it('[B23-03] raw fetch 를 쓰는 export 함수는 _authHeaders() 를 부르거나 무인증 예외 목록에 있다', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, 'client.js'), 'utf8');

    const offenders = [];
    const head = /export (?:async )?function (\w+)\([^)]*\)\s*\{/g;
    let m;
    while ((m = head.exec(src))) {
      let i = head.lastIndex;
      let depth = 1;
      while (depth && i < src.length) {
        if (src[i] === '{') depth += 1;
        else if (src[i] === '}') depth -= 1;
        i += 1;
      }
      // 주석은 호출이 아니다 — `// raw fetch(계약 #26 …)` 같은 설명문이 raw fetch 로 오인됐다(/testrun B23 실측)
      const body = src
        .slice(head.lastIndex, i)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      const rawFetch = /(?<![\w.])fetch\(/.test(body);
      if (rawFetch && !body.includes('_authHeaders(') && !UNAUTHENTICATED_RAW_FETCH.has(m[1])) {
        offenders.push(m[1]);
      }
    }
    expect(offenders).toEqual([]);
  });
});
