import { createContext, useCallback, useContext, useState } from 'react';

import { login as apiLogin, signup as apiSignup } from 'api/client';

/**
 * 인증 상태 (REQ-27 Phase 4)
 *
 * `NotificationProvider`와 같은 자리(App.tsx)에서 앱 셸을 감싼다.
 *
 * `access_token` 키는 `api/client.js`가 쓰는 것과 같은 문자열이다 — 토큰 자체의 읽기·쓰기는
 * `api/client.js`(HTTP 계층)가 하고, 여기는 그 존재 여부만 마운트 시 한 번 읽어 초기 상태를
 * 정한다(단일 출처는 `localStorage`, 함수 재노출은 하지 않는다).
 *
 * 로그인 응답에는 이메일이 없으므로(검증 계약 헤더 참조) `userEmail`은 로그인 폼에 입력한
 * 값을 그대로 쓴다. 새로고침 후에도 표시할 수 있도록 별도 키로 함께 보관한다 — 인증에는
 * 쓰이지 않는 표시 전용 값이다.
 *
 * `logout()`은 Phase 5 완료 기준에만 있어 이번엔 만들지 않는다(계획서 § 검증 계약 Phase 4 메모).
 */
const USER_EMAIL_KEY = 'user_email';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('access_token')));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem(USER_EMAIL_KEY));

  const login = useCallback(async (email, password) => {
    await apiLogin(email, password);
    localStorage.setItem(USER_EMAIL_KEY, email);
    setUserEmail(email);
    setIsAuthenticated(true);
  }, []);

  const signup = useCallback(
    async (email, password) => {
      await apiSignup(email, password);
      // 가입 직후 같은 자격증명으로 자동 로그인 (계획서 § 결정(Phase 4) — 회원가입 직후 동작)
      await login(email, password);
    },
    [login],
  );

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, signup }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
