import { useEffect, useRef } from 'react';

import { useNotifications } from 'contexts/NotificationContext';

/**
 * 전역 피드에 **새 알림이 들어왔을 때만** 목록을 다시 읽게 한다 (REQ-F09 Phase 4).
 *
 * 특정 job 을 지켜보는 `useJobCompletion` 과 달리, 목록 화면은 "누구의 것이든 뭔가 끝났다"에
 * 반응한다 — 완료된 job 이 지금 화면에 보이는 페이지에 있는지 알 수 없기 때문이다.
 *
 * ⚠️ **이 훅의 존재 이유는 "갱신"이 아니라 "안 갱신"이다.** 재조회를 폴링 틱에 걸면
 *    5초마다 목록 API(페이지네이션 + 썸네일)가 돈다 — 기능은 멀쩡해 보이는데 REQ-P03 에서
 *    겪은 병목이 되살아난다. 그래서 신규 알림이 없으면 아무것도 하지 않고, 한 응답에
 *    여러 건이 와도 **재조회는 1회**다.
 *
 * ⚠️ 기준선은 계약 #27 과 같은 이유다 — 피드가 30일치를 담고 있어서, 없으면 **페이지에
 *    진입할 때마다** 옛 알림을 보고 목록을 한 번 더 읽는다.
 *
 * @param {() => void} onFresh 새 알림이 있을 때 호출된다 (보통 usePaginatedList 의 reload)
 */
export function useNotificationRefresh(onFresh) {
  const { notifications } = useNotifications();

  const seenRef = useRef(null);
  const onFreshRef = useRef(onFresh);
  onFreshRef.current = onFresh;

  // 구독 시작 시점에 이미 있던 알림은 '본 것'으로 찍는다 (계약 #27).
  if (seenRef.current === null) {
    seenRef.current = new Set(notifications.map((n) => `${n.job_id}:${n.created_at}`));
  }

  useEffect(() => {
    const fresh = notifications.filter(
      (n) => !seenRef.current.has(`${n.job_id}:${n.created_at}`),
    );
    if (fresh.length === 0) return;

    fresh.forEach((n) => seenRef.current.add(`${n.job_id}:${n.created_at}`));
    onFreshRef.current?.(); // 건수와 무관하게 1회 — 목록은 어차피 통째로 다시 읽는다
  }, [notifications]);
}
