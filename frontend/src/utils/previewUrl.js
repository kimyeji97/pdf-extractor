/**
 * 미리보기용 URL — 다운로드 링크와 **edge 캐시 키를 가른다**.
 *
 * 생성 결과 PDF는 R2 공개 도메인으로 서빙되고, 같은 URL을 두 가지로 쓴다:
 *   ① 다운로드 — `<a href>` 이동이라 `Origin` 헤더가 **없다**
 *   ② 미리보기 — react-pdf 가 XHR 로 읽으므로 `Origin` 이 **있다**
 *
 * 버킷 CORS 응답에 `Vary: Origin` 이 없어서 둘이 같은 캐시 키를 공유한다 —
 * ①이 먼저 캐시를 채우면 그 사본엔 CORS 헤더가 없고, 그 뒤 ②가 통째로 깨진다
 * (2026-08-27 dev 에서 실제로 발생. 버킷 CORS 를 고쳐도 이미 캐시된 사본은 남는데,
 * wrangler OAuth 토큰에는 캐시 퍼지 권한이 없어 만료를 기다리는 수밖에 없었다).
 *
 * 그래서 미리보기 쪽에만 쿼리를 붙여 캐시 키를 가른다. 서버 설정이 아니라 프론트
 * 한 줄로 재발을 막는 우회다.
 *
 * ⚠️ **presigned URL 에는 붙이지 않는다** — 쿼리가 서명 대상이라 파라미터를 더하면
 *    서명 검증이 깨져 403 이 된다. `R2_PUBLIC_DOMAIN` 이 없으면 백엔드가 presigned 를
 *    돌려주므로(`generate_download_presigned_url`) 그 경우를 반드시 걸러야 한다.
 */
const SIGNED_MARKERS = ["X-Amz-Signature", "X-Amz-Credential", "Signature"];

export function toPreviewUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.origin);
    if (SIGNED_MARKERS.some((p) => u.searchParams.has(p))) return url;
    u.searchParams.set("preview", "1");
    return u.toString();
  } catch {
    return url; // 파싱 못 하는 형태면 손대지 않는다 — 미리보기가 아예 안 뜨는 것보다 낫다
  }
}
