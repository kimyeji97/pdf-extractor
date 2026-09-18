import { Navigate } from "react-router";

import { useAuth } from "contexts/AuthContext";
import paths from "routes/paths";

/**
 * 인증 가드 (REQ-27 Phase 4) — 라우터 최상위에서 `DashboardLayout` 트리를 감싼다.
 * `paths.login`·`paths.signup`은 이 컴포넌트로 감싸면 안 된다 — 감싸면 미인증 사용자가
 * 로그인 화면에서 다시 `/login`으로 리다이렉트되는 루프가 생긴다(계획서 § 제약·함정).
 * `router.tsx`에 별도 형제 라우트로 둔다.
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace />;
  }

  return children;
}
