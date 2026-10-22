import { useState } from "react";

import TutorialDialog from "components/TutorialDialog";
import { useAuth } from "contexts/AuthContext";
import { TUTORIALS } from "utils/tutorials";

// 다시 보지 않기 = localStorage(영구), 그냥 닫기 = sessionStorage(이 브라우저 세션만). 둘 다 이메일별 (PLAN-F20 § 결정)
const dismissedKey = (email) => `tutorial_dismissed:${email}`;
const closedKey = (email) => `tutorial_closed:${email}`;

// 저장소가 막혀 있으면(사생활 보호 모드 등) 예외가 난다 — 읽기 실패는 "안 봄", 쓰기 실패는 삼킨다
function readIds(storage, key) {
  try {
    const ids = JSON.parse(storage.getItem(key) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function addId(storage, key, id) {
  try {
    storage.setItem(key, JSON.stringify([...readIds(storage, key), id]));
  } catch {
    // 기록 실패 — 이 화면에서는 handled 로 닫히고, 다음 세션에 다시 뜬다
  }
}

/**
 * 로그인한 사용자에게 안 본 튜토리얼을 하나씩 띄운다 (REQ-F20 Phase 1).
 * 로그인 레이아웃(`DashboardLayout`) 안에 두어 로그인 화면에는 뜨지 않는다.
 */
export default function TutorialGate({ tutorials = TUTORIALS }) {
  const userEmail = useAuth()?.userEmail;
  const [handled, setHandled] = useState([]); // 이번 마운트에서 닫은 것 — 저장 실패해도 다시 안 뜨게

  if (!userEmail) return null;

  const seen = new Set([
    ...readIds(localStorage, dismissedKey(userEmail)),
    ...readIds(sessionStorage, closedKey(userEmail)),
    ...handled,
  ]);
  const current = tutorials.find((t) => !seen.has(t.id));
  if (!current) return null;

  const finish = (storage, key) => {
    addId(storage, key, current.id);
    setHandled((prev) => [...prev, current.id]);
  };

  return (
    <TutorialDialog
      key={current.id}
      tutorial={current}
      onClose={() => finish(sessionStorage, closedKey(userEmail))}
      onDismiss={() => finish(localStorage, dismissedKey(userEmail))}
    />
  );
}
