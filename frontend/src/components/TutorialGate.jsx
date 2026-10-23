import { useEffect } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "contexts/AuthContext";
import paths from "routes/paths";
import { TUTORIALS } from "utils/tutorials";
import { markRedirected, seenIds, wasRedirected } from "utils/tutorialSeen";

/**
 * 안 본 묶음이 있으면 첫 진입 때 튜토리얼 화면(자동 모드)으로 보낸다 (REQ-F20 Phase 4).
 * 브라우저 세션당 한 번이다. 화면을 떠나는 것이 그냥 닫기다 (PLAN-F20 § 결정 "자동 이동").
 * 로그인 레이아웃(`DashboardLayout`) 안에 두어 로그인 화면에서는 돌지 않는다.
 */
export default function TutorialGate({ tutorials = TUTORIALS }) {
  const userEmail = useAuth()?.userEmail;
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail || wasRedirected(userEmail)) return;
    const seen = new Set(seenIds(userEmail));
    if (!tutorials.some((t) => !seen.has(t.id))) return;
    markRedirected(userEmail);
    navigate(`${paths.tutorials}?auto=1`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 로그인한 계정이 바뀔 때만. navigate는 이동마다 바뀌어 저장 실패 시 반복 이동한다
  }, [userEmail]);

  return null;
}
