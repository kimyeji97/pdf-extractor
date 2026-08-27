import { useEffect, useRef } from 'react';

import { useNotifications } from 'contexts/NotificationContext';

/**
 * 특정 job 의 완료를 전역 알림 피드에서 지켜본다 (REQ-F09 Phase 3).
 *
 * 화면마다 타이머로 상태를 캐묻던 것을 대체한다. **피드 구독은 앱 셸이 하나만 유지하고**
 * (REQ-P04 이후 SSE 스트림), 화면은 그 결과를 구독하기만 한다.
 *
 * ⚠️ **기준선이 이 훅의 핵심이다.** 피드는 최근 30일치를 담고 있어서(첫 진입 시 최신 50건),
 *    "내 job 의 알림이 피드에 있나"로 짜면 재감지를 시작하자마자 **지난주 알림을 보고 즉시
 *    완료로 튄다.** 그래서 감시를 시작하는 순간 이미 있던 알림을 전부 '처리됨'으로 찍는다.
 *
 * ⚠️ **콜백은 화면이 살아 있는 동안만 불린다** — 그게 B10 불변식(자동 다운로드는 이 화면에
 *    머문 경우에만)이 지켜지는 방식이다. 떠난 사용자에게 다운로드를 강제할 수단이 없으므로
 *    이탈했으면 생성 이력에서 받아 간다.
 *
 * @param {string|null} jobId 감시 대상. null 이면 비활성 — 다시 값이 들어올 때 기준선을 새로 잡는다
 * @param {{ onDone?: (notification: object) => void, onError?: (notification: object) => void }} handlers
 */
export function useJobCompletion(jobId, handlers = {}) {
  const { notifications } = useNotifications();

  const watchingRef = useRef(undefined);
  const handledRef = useRef(null);

  // 콜백은 매 렌더 새 함수로 오는 게 보통이라 ref 로 받는다.
  // deps 에 넣으면 알림이 오지도 않았는데 effect 가 재실행된다.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // 기준선은 effect 가 아니라 렌더 중에 잡는다 — effect 로 미루면 그 사이 한 번의
  // 커밋이 지나가고, 그 커밋에서 옛 알림이 이미 처리돼 버린다.
  if (watchingRef.current !== jobId) {
    watchingRef.current = jobId;
    handledRef.current = new Set(notifications.map((n) => `${n.job_id}:${n.created_at}`));
  }

  useEffect(() => {
    if (!jobId) return;

    notifications.forEach((n) => {
      if (n.job_id !== jobId) return; // "모두의 알림"이라 남의 완료도 같은 피드에 들어온다

      const key = `${n.job_id}:${n.created_at}`;
      if (handledRef.current.has(key)) return;
      handledRef.current.add(key);

      if (n.severity === 'error') handlersRef.current.onError?.(n);
      else handlersRef.current.onDone?.(n);
    });
  }, [jobId, notifications]);
}
