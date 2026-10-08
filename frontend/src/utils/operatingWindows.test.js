/**
 * REQ-F19 Phase 4 — 꺼짐 예고 배너 판정 (순수 함수)
 *
 * 검증 계약: docs/plans/PLAN-F19-server-down-notice.md `## 검증 계약` (F19-25~28)
 *
 * `bannerEnd(windows, now)` — 지금이 들어 있는 구간의 끝까지 1시간 이내면 그 끝(Date), 아니면 null.
 * windows 는 운영 구간 API 응답(`[{start, end}]`, ISO·시간대 포함) 그대로다.
 * 모듈이 아직 없을 때 파일 전체가 죽지 않게 케이스 안에서 import 한다.
 */
import { describe, expect, it } from 'vitest';

const WINDOWS = [
  { start: '2026-10-07T15:00:00+09:00', end: '2026-10-07T23:00:00+09:00' },
  { start: '2026-10-08T15:00:00+09:00', end: '2026-10-08T23:00:00+09:00' },
];
const at = (hhmm) => new Date(`2026-10-07T${hhmm}:00+09:00`);
const mod = () => import('utils/operatingWindows');

describe('bannerEnd (Phase 4)', () => {
  it('[F19-25] 꺼짐 30분 전(22:30)이면 그 구간의 end(23:00)를 돌려준다', async () => {
    const { bannerEnd } = await mod();
    expect(bannerEnd(WINDOWS, at('22:30'))?.getTime()).toBe(new Date('2026-10-07T23:00:00+09:00').getTime());
  });

  it('[F19-26] 꺼짐 90분 전(21:30)이면 null', async () => {
    const { bannerEnd } = await mod();
    expect(bannerEnd(WINDOWS, at('21:30'))).toBeNull();
  });

  it('[F19-27] 정확히 1시간 전(22:00)이면 보인다', async () => {
    const { bannerEnd } = await mod();
    expect(bannerEnd(WINDOWS, at('22:00'))).not.toBeNull();
  });

  it('[F19-28] 빈 목록이면 null', async () => {
    const { bannerEnd } = await mod();
    expect(bannerEnd([], at('22:30'))).toBeNull();
  });
});
