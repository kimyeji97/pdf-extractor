/**
 * 뱃지·칩 색과 이름의 단일 정의 (REQ-F14 Phase 2)
 *
 * 같은 "분석 중"이 현황판 info · 목록 뱃지 warning · 편집 화면 "감지 중…"으로 제각각이었고, "수동"은 세 색이었다.
 * 화면마다 표를 들고 있으면 한쪽만 고쳐도 아무도 모른다 — 여기 하나만 둔다(2026-09-30 사용자 결정).
 *
 * - 감지 상태: 대기(PENDING·QUEUED) default "대기 중" · 분석 중 info · 실패 error "분석 실패" · 완료 success("N문항")
 * - 표식: 오탐 warning · 수동 secondary — warning(주황)은 "주의가 필요한 것"에만 쓴다
 * - 분석 결과 정보 칩(완료 "N문항"·작업 화면 페이지별 "N문항") = 분석 상태 색(success)
 * - 그 외 정보성 칩(선택 개수·파일 수·레이아웃·페이지 번호·태그 등) = primary 테두리형
 *
 * 제외: 업로드 상태 칩(`job.status`)과 버튼 문구 "재감지 대기 중"은 감지 상태 뱃지가 아니다.
 */

const WAITING = { label: "대기 중", color: "default" };

const DETECTION = {
  PENDING: WAITING,
  QUEUED: WAITING,
  PROCESSING: { label: "분석 중", color: "secondary" },
  FAILED: { label: "분석 실패", color: "error" },
};

/** 분석 결과(완료) 색 — 완료 뱃지와 작업 화면 페이지별 문항 수 칩이 같이 쓴다 */
export const RESULT_COLOR = "primary";

/**
 * 감지 상태 뱃지.
 * @param {string} status boundaries_status
 * @param {number} [questionCount] 완료일 때 표시할 문항 수
 * @returns {{ label: string, color: string }|null}
 */
export function detectionBadge(status, questionCount) {
  if (status === "DONE")
    return { label: `${questionCount ?? 0}문항`, color: RESULT_COLOR };
  return DETECTION[status] ?? null;
}

// 수동은 primary(남색) — secondary 가 브랜드 빨강이 되며 "분석 실패"(error) 칩과 헷갈리지 않게 (REQ-D13)
export const MARK_COLOR = {
  missPage: "warning",
  falsePositive: "error",
  manual: "info",
};

/** 상태를 말하지 않는 정보성 칩 — 채움형 상태 뱃지와 모양으로도 갈린다 */
export const INFO_CHIP = { color: "secondary", variant: "outlined" };
export const HIGH_INFO_CHIP = { color: "secondary", variant: "filled" };
