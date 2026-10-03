/**
 * 문서 이름 표시 규칙 (REQ-B12 · REQ-F15 · REQ-F17)
 *
 * 이름 출처를 `jobInfo`(F11 가드가 마운트 시 부르는 `GET /api/jobs/{id}` 응답) 하나로 모은다 —
 * 벨 알림 클릭·URL 직접 입력·새로고침·목록 카드 클릭 어느 경로로 들어와도 같은 이름이 뜬다.
 * `jobInfo` 도착 전(또는 가드 조회 실패로 `null`)에는 job-id를 노출하지 않고 로딩 문구를 보인다.
 *
 * F17에서 **제목·부제를 만드는 코드를 이 한 벌로 합쳤다** — 그 전엔 작업 화면만 이 모듈을
 * 쓰고 분석 목록 카드는 인라인이라 폴백까지 달랐다(`"unknown.pdf"` vs `jobId`).
 */

export const NAME_LOADING_LABEL = "불러오는 중…";

/** 이름도 파일명도 없을 때 (REQ-F17 — `jobId` 폴백은 버렸다. jobId 노출은 B12가 없앤 증상이다) */
export const UNKNOWN_NAME = "unknown.pdf";

/** 마지막 점 뒤를 뺀다. 점이 없으면 그대로 (REQ-F17). */
export function stripExtension(filename) {
  if (!filename) return filename;
  return filename.replace(/\.[^.]*$/, "");
}

/**
 * 화면에 보일 문서 제목. `workbook_name` → 확장자 뺀 `filename` → `UNKNOWN_NAME` 순.
 * `jobInfo`가 없으면 로딩 문구.
 */
export function resolveDocumentName(jobInfo) {
  if (!jobInfo) return NAME_LOADING_LABEL;
  return jobInfo.workbook_name || stripExtension(jobInfo.filename) || UNKNOWN_NAME;
}

/**
 * 제목 아래 작은 글씨로 붙일 파일명 (REQ-F15). 같은 글자를 두 번 쓰지 않는다 —
 * **제목과 파일명을 둘 다 확장자 뺀 상태로 비교**해 같으면 생략(null, REQ-F17).
 * 이름이 없으면 제목이 곧 확장자 뺀 파일명이라 이 비교에서 자동으로 걸린다.
 * 이름은 고유하지 않아(계약 #17) 파일명이 구분 단서가 된다 — 표시용일 뿐 키로 쓰지 않는다.
 */
export function resolveFileSubtitle(jobInfo) {
  const filename = jobInfo?.filename;
  if (!filename) return null;

  // 제목에 직접 stripExtension을 걸면 안 된다 — 확장자가 아닌 점을 가진 이름
  // ("2026.중간")에서 마지막 토막까지 잘려 비교가 어긋난다. 확장자를 떼는 쪽은 파일명이고,
  // 제목은 원문 그대로 양쪽(확장자 포함/제외)과 맞춰 본다.
  const title = resolveDocumentName(jobInfo);
  if (title === filename || title === stripExtension(filename)) return null;
  return filename;
}
