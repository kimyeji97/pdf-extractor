import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { listNotifications } from 'api/client';

/**
 * 전역 완료 알림 상태 (REQ-F09 Phase 2 → REQ-P04 Phase 2에서 전달 경로를 SSE로 교체)
 *
 * **앱 셸에 산다.** 화면(라우트)이 바뀌어도 살아 있어야 하기 때문이다 — 종전 폴링 두 개가
 * 화면 수명에 묶여 있어 "다른 일을 하는 동안 알려준다"는 알림의 존재 이유가 성립하지 않았다.
 *
 * 전달 경로 (REQ-P04):
 * - 첫 진입 `GET /api/notifications` 1회 — 최근 30일 기준선(계약 #27). 이건 그대로다.
 * - 그 뒤는 `EventSource(/api/notifications/stream)` 가 서버 푸시로 받는다. 폴링 타이머와
 *   `visibilitychange` 감속은 없다 — 브라우저가 재연결·`Last-Event-ID` 복구를 프로토콜로 해 준다.
 * - `EventSource` 는 raw 다(계약 #26 — `apiFetch` 경유 금지, 전역 딤 없음).
 *
 * 이 컨텍스트가 **하지 않는 것**이 하는 것만큼 중요하다:
 *
 * - **완료를 판정하지 않는다.** 서버가 완료 시점에 쓴 알림을 읽기만 한다. 프론트의 DONE
 *   분기에 영속 부수효과를 두면 화면을 떠나는 순간 유실된다(계약 #22 · REQ-B10).
 * - **서버에 쓰지 않는다.** 읽음 커서 갱신은 팝오버를 여는 행위에 붙는다(Phase 5).
 * - **자동 다운로드를 트리거하지 않는다.** 그건 편집 화면의 책임으로 남는다 — 전역이
 *   내려받으면 다른 라우트에 있는 사용자에게 다운로드가 튀어나온다(REQ-B10 불변식).
 * - **job 을 개별로 조회하지 않는다.** 구독 대상은 알림 피드 1개다(계약 #15와 같은 계열).
 * - **`unread_count` 를 세지 않는다.** 서버가 이벤트마다 실어 보낸다(계약 #27).
 */

// `client.js` 의 BASE_URL 과 같은 규칙이다. 그쪽에서 export 하지 않는 이유: 테스트가
// `api/client` 를 통째로 mock 하므로 새 export 는 거기서 undefined 가 된다.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const STREAM_URL = `${BASE_URL}/notifications/stream`;

const NotificationContext = createContext(null);

/** 알림 1건의 안정적인 키. job_id 하나로는 재감지·재생성이 같은 키가 된다(계약 #16 계열). */
const keyOf = (n) => `${n.job_id}:${n.created_at}`;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 기준선 GET 과 스트림 이벤트가 같은 dedup 집합을 본다 — 재연결 복구분(Last-Event-ID)이
  // 기준선과 겹쳐 와도 한 번만 누적된다.
  const seenRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    /** 피드 GET·스트림 이벤트 공통 병합 — 데이터 처리는 F09 그대로고 도착 경로만 다르다. */
    const merge = (incoming, unread) => {
      if (cancelled) return;
      if (typeof unread === 'number') {
        // 미읽음 수는 서버가 읽음 커서와 함께 계산한다. 프론트가 다시 세면
        // 다른 탭에서 읽은 것이 반영되지 않는다("모두의 알림"이라 커서가 공유된다).
        setUnreadCount(unread);
      }
      const fresh = incoming.filter((n) => !seenRef.current.has(keyOf(n)));
      fresh.forEach((n) => seenRef.current.add(keyOf(n)));
      // **누적**한다. 교체하면 팝오버 이력이 사라진다.
      if (fresh.length > 0) setNotifications((prev) => [...fresh, ...prev]);
    };

    // 앱 첫 진입: since 없이 최근 30일(최신 50건)을 한 번 읽는다 — 기준선(계약 #27).
    listNotifications()
      .then((data) => merge(data?.notifications ?? [], data?.unread_count))
      .catch(() => {
        // 기준선 실패는 치명적이지 않다 — 스트림이 이후분을 가져오고, 재연결 복구는
        // 브라우저가 한다. 여기서 던지면 알림 기능이 조용히 통째로 죽는다.
      });

    if (typeof EventSource === 'undefined') return undefined; // SSR·구형 환경 — 기준선만 산다

    const es = new EventSource(STREAM_URL);

    const onNotification = (ev) => {
      let payload;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        return; // 깨진 청크 1건이 스트림을 죽이면 안 된다
      }
      const { unread_count: unread, ...item } = payload;
      merge([item], unread);
    };

    const onRead = (ev) => {
      try {
        const { unread_count: unread } = JSON.parse(ev.data);
        if (typeof unread === 'number') setUnreadCount(unread);
      } catch {
        // 위와 같다
      }
    };

    // 재연결(`onerror` 후 브라우저 자동 재시도)에는 손대지 않는다 — 끊긴 동안의 알림은
    // 브라우저가 붙이는 `Last-Event-ID` 로 서버가 복구한다(백엔드 Phase 1).
    es.addEventListener('notification', onNotification);
    es.addEventListener('read', onRead);

    return () => {
      cancelled = true;
      es.removeEventListener('notification', onNotification);
      es.removeEventListener('read', onRead);
      es.close();
    };
  }, []);

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
