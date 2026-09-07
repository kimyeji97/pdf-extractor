/**
 * 작업 화면 문서 이름 파생 (REQ-B12)
 *
 * 이름 출처를 `jobInfo`(F11 가드가 마운트 시 부르는 `GET /api/jobs/{id}` 응답) 하나로 모은다 —
 * 벨 알림 클릭·URL 직접 입력·새로고침·목록 카드 클릭 어느 경로로 들어와도 같은 이름이 뜬다.
 * `jobInfo` 도착 전(또는 가드 조회 실패로 `null`)에는 job-id를 노출하지 않고 로딩 문구를 보인다.
 */

export const NAME_LOADING_LABEL = "불러오는 중…";

/** `workbook_name` → `filename` → `jobId` 순. `jobInfo`가 없으면 로딩 문구. */
export function resolveDocumentName(jobInfo, jobId) {
  if (!jobInfo) return NAME_LOADING_LABEL;
  return jobInfo.workbook_name || jobInfo.filename || jobId;
}
