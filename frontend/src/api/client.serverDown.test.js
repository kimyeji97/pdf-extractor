/**
 * REQ-F19 Phase 1 — 서버 다운 감지 (client)
 *
 * 검증 계약: docs/plans/PLAN-F19-server-down-notice.md `## 검증 계약` (F19-01~05)
 *
 * 꺼진 백엔드는 상태 코드가 아니라 fetch reject 로 온다(계약 #8 — 터널 5xx 에 CORS 헤더가 없다).
 * `apiFetch` 가 지나는 `_rawFetch` 에서 잡아 `setServerDownCallback` 구독자에게 알린다(`setLoadingCallback` 짝).
 * 배경 경로(계약 #26)는 감지하지 않는다 — 일시 단절마다 화면이 튄다.
 *
 * 모듈 상태(진행 중 GET 공유·감지 래치 등)가 케이스 사이에 새지 않게 매번 새로 import 한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let client;
let onDown;

const networkError = () => Promise.reject(new TypeError('Failed to fetch'));

beforeEach(async () => {
  vi.resetModules();
  client = await import('api/client');
  global.fetch = vi.fn().mockImplementation(networkError);
  onDown = vi.fn();
  client.setServerDownCallback(onDown);
});

afterEach(() => {
  client.setServerDownCallback(null);
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('서버 다운 감지', () => {
  it('[F19-01] GET apiFetch 의 fetch 가 reject 하면 서버 다운 콜백을 부른다', async () => {
    await client.getStats().catch(() => {});
    expect(onDown).toHaveBeenCalled();
  });

  it('[F19-02] 비GET(login POST) 이 reject 해도 콜백을 부른다', async () => {
    await client.login('a@b.c', 'pw').catch(() => {});
    expect(onDown).toHaveBeenCalled();
  });

  it('[F19-03] { background: true } 조회가 reject 하면 콜백을 부르지 않는다', async () => {
    await client.getStats({ background: true }).catch(() => {});
    expect(onDown).not.toHaveBeenCalled();
  });

  it('[F19-04] 503 응답(reject 아님)이면 콜백을 부르지 않는다', async () => {
    global.fetch.mockImplementation(() => Promise.resolve(new Response('', { status: 503 })));
    await client.getStats().catch(() => {});
    expect(onDown).not.toHaveBeenCalled();
  });

  it('[F19-05] 같은 URL GET 2건이 동시에 reject 해도 콜백은 1회', async () => {
    await Promise.all([client.getStats().catch(() => {}), client.getStats().catch(() => {})]);
    expect(onDown).toHaveBeenCalledTimes(1);
  });
});
