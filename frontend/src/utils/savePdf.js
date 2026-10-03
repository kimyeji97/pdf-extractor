/**
 * 생성된 PDF 저장 (REQ-F16)
 *
 * 브라우저 **기본 저장 위치 선택 창**(File System Access API)으로 받는다. 우리가 모달을
 * 만들지 않는다 — 창은 브라우저 것이고, 고른 파일에 내용을 쓰기만 한다.
 *
 * ⚠️ **선택 창은 사용자 클릭 안에서 열어야 한다** — 비동기 대기(`await fetch`) 뒤에 열면
 *    브라우저가 "사용자 제스처가 없다"며 거부한다. 그래서 **창부터 띄우고 그 뒤 PDF를 받는다.**
 *    이 순서가 F16-02 로 고정돼 있다. 뒤집으면 단위 테스트는 녹색이어도 실제로 창이 안 뜬다.
 *
 * ⚠️ **인증 자격은 우리 API 오리진일 때만 붙인다.** 운영·dev 의 `download_url` 은
 *    `R2_PUBLIC_DOMAIN` 이 있으면 **R2 공개 도메인**이다(`s3_service.generate_download_presigned_url`).
 *    그 오리진의 CORS 는 버킷 설정이고 `AllowCredentials` 항목이 없어서, `credentials: "include"` 로
 *    보내면 브라우저가 응답을 통째로 막는다. `Authorization` 도 preflight 를 유발해 같은 이유로 깨진다.
 *    presigned URL 에 `Authorization` 을 붙이면 S3 호환 API 가 400("only one auth mechanism")이다.
 *    인증이 필요한 쪽은 **local 모드의 `/api/files/{key}` 뿐**이고 그건 우리 오리진이다. (`/review` 회차 1)
 *
 * ⚠️ **`<a download>` 는 크로스오리진에서 안 먹는다** — `download` 속성이 무시되고 결과 PDF 에
 *    `Content-Disposition` 도 없어서(`s3_service`) **탭에서 열린다.** 계획서가 `범위 — 제외`로
 *    못 박은 "새 탭으로 열기"가 그 경로에서 일어난다. 그래서 폴백도 **blob 으로 받아** 저장한다 —
 *    blob URL 은 same-origin 이라 `download` 가 먹고 파일명도 보존된다. (`/review` 회차 0)
 */
import { BASE_URL, _authHeaders } from "api/client";

const SIGNED_MARKERS = ["X-Amz-Signature", "X-Amz-Credential", "Signature"];

/**
 * 다운로드용 URL — 미리보기·앵커와 **edge 캐시 키를 가른다** (`previewUrl.js` 와 같은 우회).
 *
 * 결과 PDF 는 R2 공개 도메인으로 서빙되는데 버킷 CORS 응답에 `Vary: Origin` 이 없다.
 * 생성 이력의 `<a href download>`(Origin 없음)가 캐시를 먼저 채우면 그 사본엔 CORS 헤더가
 * 없고, 그 뒤 이 CORS `fetch` 가 통째로 깨진다 — 2026-08-27 dev 에서 실제로 났고 캐시 퍼지
 * 권한이 없어 만료를 기다려야 했다.
 *
 * ⚠️ presigned URL 에는 붙이지 않는다 — 쿼리가 서명 대상이라 403 이 된다.
 */
export function toDownloadUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.origin);
    if (SIGNED_MARKERS.some((p) => u.searchParams.has(p))) return url;
    u.searchParams.set("dl", "1");
    return u.toString();
  } catch {
    return url; // 파싱 못 하는 형태면 손대지 않는다
  }
}

/**
 * @param {string} url      결과 PDF URL
 * @param {string} filename 저장 창에 채울 기본 파일명
 */
export async function savePdfToPicker(url, filename) {
  if (typeof globalThis.showSaveFilePicker !== "function") {
    await downloadViaBlob(url, filename);
    return;
  }

  let handle;
  try {
    // ① 먼저 창 — 사용자 제스처가 살아 있는 동안에.
    handle = await globalThis.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
    });
  } catch (e) {
    // 사용자가 창을 닫은 것은 실패가 아니다 — 조용히 끝낸다.
    if (e?.name === "AbortError") return;
    throw e;
  }

  // ② 그 다음 내용을 받는다. **쓰기 전에** 응답을 확인한다 —
  //    안 보면 401/403/404 본문이 그대로 "PDF" 로 저장된다.
  const blob = await fetchPdf(url);

  // ③ 쓴다. createWritable() 은 고른 파일을 **이미 비우므로**, 실패하면 abort 로 되돌린다.
  const writable = await handle.createWritable();
  try {
    await writable.write(blob);
    await writable.close();
  } catch (e) {
    await writable.abort?.().catch(() => {});
    throw e;
  }
}

/** 미지원 브라우저(Safari·Firefox) 폴백 — blob 으로 받아야 `download` 가 먹는다. */
async function downloadViaBlob(url, filename) {
  const blob = await fetchPdf(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // ⚠️ 같은 틱에서 해제하면 안 된다 — 하이퍼링크 추적은 click() 중 동기적으로 끝나지 않고
  //    태스크로 큐잉된다. 폴백의 대상이 바로 Safari·Firefox 라 여기서 끊기면 저장이 깨진다.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/**
 * 결과 PDF 를 받는다. `/api/files/{key}`(로컬 모드)는 **쿠키 인증**이고 dev 는
 * 프론트와 API 가 다른 오리진이라 자격을 명시해야 한다 (계약 #31).
 */
async function fetchPdf(url) {
  const target = toDownloadUrl(url);
  const res = await fetch(target, isOwnApi(target)
    ? { credentials: "include", headers: _authHeaders() }
    : undefined);
  if (!res.ok) throw new Error(`PDF를 받지 못했습니다 (${res.status})`);
  return res.blob();
}

/** 우리 API 와 같은 오리진인가 — 그때만 자격·헤더를 붙인다(위 주석). */
function isOwnApi(url) {
  try {
    return new URL(url, window.location.origin).origin
        === new URL(BASE_URL, window.location.origin).origin;
  } catch {
    return false;
  }
}
