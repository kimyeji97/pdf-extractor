/**
 * 작업 화면 감지 안내 (REQ-B22)
 *
 * 조회는 경계 캐시가 없으면 빈 결과를 준다(계약 #34) — FAILED 파일도, 캐시가 없는 DONE 파일도 "문항 0개"로만 보였다.
 * 진입은 막지 않는다: 재감지 버튼이 이 화면 안에만 있다.
 *
 * ⚠️ 조회 응답만으로는 "캐시 없음"과 "감지했는데 0개"를 구분할 수 없다 — DONE 0문항은 "실패"라고 단정하지 않는다.
 *
 * @param {{ boundaries_status?: string, error?: string|null }|null} job 진입 가드가 읽은 jobInfo
 * @param {number|null} autoCount 자동 감지 문항 수(수동 제외). 아직 모르면 null
 * @returns {{ message: string, detail: string|null }|null}
 */
export function detectionNotice(job, autoCount) {
  const status = job?.boundaries_status;
  if (status === "FAILED") {
    // 서버 error 는 대부분 예외 원문이라 본문으로 쓰지 않고 아래 작은 글씨로만 (2026-09-30 결정)
    return { message: "문항 감지에 실패했습니다. 재감지해 주세요.", detail: job.error || null };
  }
  if (status === "DONE" && autoCount === 0) {
    return { message: "감지된 문항이 없습니다. 필요하면 재감지해 주세요.", detail: null };
  }
  return null;
}
