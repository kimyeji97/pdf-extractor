import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { listNotifications } from 'api/client';

/**
 * 전역 완료 알림 상태 (REQ-F09 Phase 2)
 *
 * **앱 셸에 산다.** 화면(라우트)이 바뀌어도 살아 있어야 하기 때문이다 — 종전 폴링 두 개가
 * 화면 수명에 묶여 있어 "다른 일을 하는 동안 알려준다"는 알림의 존재 이유가 성립하지 않았다.
 *
 * 이 컨텍스트가 **하지 않는 것**이 하는 것만큼 중요하다:
 *
 * - **완료를 판정하지 않는다.** 서버가 완료 시점에 쓴 알림을 읽기만 한다. 프론트의 DONE
 *   분기에 영속 부수효과를 두면 화면을 떠나는 순간 유실된다(계약 #22 · REQ-B10).
 * - **서버에 쓰지 않는다.** 읽음 커서 갱신은 팝오버를 여는 행위에 붙는다(Phase 5).
 * - **자동 다운로드를 트리거하지 않는다.** 그건 편집 화면의 책임으로 남는다 — 전역이
 *   내려받으면 다른 라우트에 있는 사용자에게 다운로드가 튀어나온다(REQ-B10 불변식).
 * - **job 을 개별로 조회하지 않는다.** 폴링 대상은 알림 피드 1개다(계약 #15와 같은 계열).
 */

// 주기값은 계획서에 없어 2026-08-07에 정했다(활성 5초 / 숨김 30초).
// 숨김은 **정지가 아니라 감속**이다 — Phase 6(브라우저 알림)이 숨긴 상태에서도 알려야 한다.
// 브라우저가 비활성 탭 타이머를 추가로 조이므로 실측 간격은 이보다 더 벌어진다.
const ACTIVE_POLL_MS = 5000;
const HIDDEN_POLL_MS = 30000;

const NotificationContext = createContext(null);

/** 알림 1건의 안정적인 키. job_id 하나로는 재감지·재생성이 같은 키가 된다(계약 #16 계열). */
const keyOf = (n) => `${n.job_id}:${n.created_at}`;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // since 는 렌더에 쓰이지 않고 다음 요청에만 쓰인다 — state 로 두면 폴링 effect 가
  // 매 응답마다 재구독된다(인터벌이 리셋돼 주기가 사실상 무의미해진다).
  const sinceRef = useRef(null);
  const seenRef = useRef(new Set());
  const inFlightRef = useRef(false);

  const poll = useCallback(async () => {
    if (inFlightRef.current) return; // 느린 응답이 밀릴 때 요청이 겹치지 않게 한다
    inFlightRef.current = true;
    try {
      const data = await listNotifications({ since: sinceRef.current ?? undefined });
      const incoming = data?.notifications ?? [];

      if (typeof data?.unread_count === 'number') {
        // 미읽음 수는 서버가 읽음 커서와 함께 계산한다. 프론트가 다시 세면
        // 다른 탭에서 읽은 것이 반영되지 않는다("모두의 알림"이라 커서가 공유된다).
        setUnreadCount(data.unread_count);
      }

      if (incoming.length === 0) return; // 신규 0건이어도 폴링은 계속 돈다

      const fresh = incoming.filter((n) => !seenRef.current.has(keyOf(n)));
      fresh.forEach((n) => seenRef.current.add(keyOf(n)));

      // 증분 응답이므로 **누적**한다. 교체하면 팝오버 이력이 매 폴링마다 사라진다.
      if (fresh.length > 0) setNotifications((prev) => [...fresh, ...prev]);

      const latest = incoming.reduce(
        (acc, n) => (acc && acc >= n.created_at ? acc : n.created_at),
        sinceRef.current,
      );
      sinceRef.current = latest;
    } catch {
      // 폴링은 실패해도 멈추지 않는다. 한 번의 네트워크 오류로 영구히 죽으면
      // 알림 기능이 조용히 사라지고 사용자는 그 사실을 알 수 없다.
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let timerId = null;

    const schedule = () => {
      if (timerId !== null) clearInterval(timerId);
      const delay = document.visibilityState === 'hidden' ? HIDDEN_POLL_MS : ACTIVE_POLL_MS;
      timerId = setInterval(poll, delay);
    };

    const onVisibilityChange = () => {
      // 복귀 시 다음 주기를 기다리지 않는다 — 숨긴 동안 감속돼 있었으므로
      // 그대로 두면 최대 HIDDEN_POLL_MS 만큼 낡은 화면을 보게 된다.
      if (document.visibilityState !== 'hidden') poll();
      schedule();
    };

    poll(); // 앱 첫 진입: since 없이 최근 30일(최신 50건)을 한 번 읽는다
    schedule();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (timerId !== null) clearInterval(timerId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [poll]);

  const value = useMemo(
    () => ({ notifications, unreadCount }),
    [notifications, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications 는 NotificationProvider 안에서만 쓸 수 있다');
  }
  return ctx;
}
