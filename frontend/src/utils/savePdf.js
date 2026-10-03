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
 * ⚠️ `showSaveFilePicker` 는 Chromium 계열에만 있다 — Safari·Firefox 는 `<a download>` 폴백으로
 *    간다(브라우저 설정의 "저장 위치 묻기"를 따른다).
 */

/**
 * @param {string} url      결과 PDF URL
 * @param {string} filename 저장 창에 채울 기본 파일명
 */
export async function savePdfToPicker(url, filename) {
  if (typeof globalThis.showSaveFilePicker !== "function") {
    downloadViaAnchor(url, filename);
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

  // ② 그 다음 내용을 받아 쓴다.
  const res = await fetch(url);
  const blob = await res.blob();

  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/** 미지원 브라우저 폴백. */
function downloadViaAnchor(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
