// 튜토리얼 본 기록 (REQ-F20). 다시 보지 않기·끝까지 본 묶음 = localStorage(영구),
// 자동 이동 = sessionStorage(브라우저 세션당 한 번). 둘 다 이메일별 (PLAN-F20 § 결정)
// 키 이름은 Phase 1 그대로 — 바꾸면 이미 끈 사람에게 다시 뜬다
const dismissedKey = (email) => `tutorial_dismissed:${email}`;
const redirectedKey = (email) => `tutorial_redirected:${email}`;

// 저장소가 막혀 있으면(사생활 보호 모드 등) 예외가 난다 — 읽기 실패는 "안 봄", 쓰기 실패는 삼킨다
export function seenIds(email) {
  try {
    const ids = JSON.parse(localStorage.getItem(dismissedKey(email)) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function markSeen(email, id) {
  try {
    localStorage.setItem(dismissedKey(email), JSON.stringify([...seenIds(email), id]));
  } catch {
    // 기록 실패 — 화면은 다음 묶음으로 가고, 다음 세션에 다시 보낸다
  }
}

export function wasRedirected(email) {
  try {
    return sessionStorage.getItem(redirectedKey(email)) === "1";
  } catch {
    return false;
  }
}

export function markRedirected(email) {
  try {
    sessionStorage.setItem(redirectedKey(email), "1");
  } catch {
    // 기록 실패 — 이 마운트에서는 effect가 한 번만 돈다
  }
}
