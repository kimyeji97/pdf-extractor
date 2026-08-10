/**
 * 감지 상태 판정 (REQ-F11)
 *
 * **목록과 상세가 같은 함수를 쓴다.** 각자 조건을 들고 있으면 한쪽만 고쳐도 아무도 모른 채
 * 규칙이 갈라지는데, 이 REQ가 메우는 구멍이 바로 그렇게 생겼다 — 목록은 클릭을 막았지만
 * 상세는 아무 판정도 하지 않아 URL 직접 진입·뒤로가기가 그대로 열려 있었다.
 */

/**
 * 상세(작업) 화면 진입을 막아야 하는가.
 *
 * `PROCESSING`만 막는다. **대기(`PENDING`)는 아직 시작되지 않은 상태라 기존 문항이 그대로
 * 유효하므로** 볼 수 있는 화면을 막을 이유가 없다 (2026-08-10 결정).
 */
export function isEntryBlocked(job) {
  return job?.boundaries_status === "PROCESSING";
}

/**
 * '재감지'를 막아야 하는가.
 *
 * 이미 감지가 걸려 있는 동안(대기·진행) 다시 거는 것을 막는다. `PROCESSING`은 애초에
 * 진입이 차단되지만, 화면에 머문 채 상태가 바뀌는 경로가 있으므로 함께 막는다.
 */
export function isRefreshBlocked(job) {
  const status = job?.boundaries_status;
  return status === "PENDING" || status === "PROCESSING";
}
