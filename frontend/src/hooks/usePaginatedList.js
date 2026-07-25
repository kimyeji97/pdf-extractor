/**
 * 무한 스크롤 목록 공용 훅 (REQ-P03-03)
 *
 * 목록 API가 { items, total, skip, limit } 형태로 페이지를 반환하는 것을 전제로,
 * "첫 페이지 로드 → 센티널이 보이면 다음 페이지 이어붙이기"를 담당한다.
 * 분석 목록 / 편집 파일 목록 / 생성 이력 세 화면이 같은 동작을 필요로 해 훅으로 뺐다.
 *
 * 검색은 서버에서 처리하므로(P03-03 결정), 검색어가 바뀌면 목록을 처음부터 다시 받는다.
 * 호출부는 검색어를 디바운스한 값으로 넘겨야 타이핑마다 요청이 나가지 않는다.
 *
 * @param {(skip: number, limit: number) => Promise<{items: any[], total: number}>} fetchPage
 *        페이지 조회 함수. useCallback으로 감싸 참조가 안정적이어야 하며,
 *        이 함수의 참조가 바뀌면 목록을 처음부터 다시 로드한다(=검색 조건 변경 신호).
 * @param {{ pageSize?: number, rootMargin?: string }} [options]
 */
import { useState, useEffect, useRef, useCallback } from "react";

export default function usePaginatedList(fetchPage, options = {}) {
  const { pageSize = 20, rootMargin = "200px 0px" } = options;

  const [items, setItems]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);   // 첫 페이지(=목록 교체) 로딩
  const [loadingMore, setLoadingMore] = useState(false); // 다음 페이지 이어붙이기
  const [error, setError]           = useState("");

  const sentinelRef = useRef(null);
  // fetchPage가 바뀌면(검색어 변경 등) 이전 요청의 응답은 버려야 한다.
  const reqIdRef    = useRef(0);
  // 로딩 여부를 옵저버 콜백에서 즉시 읽기 위한 ref (state는 콜백 클로저에 늦게 반영됨)
  const busyRef     = useRef(false);
  const itemsLenRef = useRef(0);
  const totalRef    = useRef(0);

  const loadPage = useCallback(
    async (skip) => {
      if (busyRef.current) return;
      busyRef.current = true;

      const reqId = ++reqIdRef.current;
      const isFirst = skip === 0;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);
      setError("");

      try {
        const data = await fetchPage(skip, pageSize);
        if (reqId !== reqIdRef.current) return;   // 더 최신 요청이 있으면 폐기

        const pageItems = data?.items ?? [];
        const nextTotal = data?.total ?? 0;
        setItems((prev) => {
          const merged = isFirst ? pageItems : [...prev, ...pageItems];
          itemsLenRef.current = merged.length;
          return merged;
        });
        setTotal(nextTotal);
        totalRef.current = nextTotal;
      } catch (e) {
        if (reqId !== reqIdRef.current) return;
        setError(e.message || "목록 조회 실패");
      } finally {
        if (reqId === reqIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        busyRef.current = false;
      }
    },
    [fetchPage, pageSize],
  );

  // fetchPage 참조가 바뀌면(검색 조건 변경/수동 새로고침) 처음부터 다시 로드
  useEffect(() => {
    itemsLenRef.current = 0;
    totalRef.current = 0;
    setItems([]);
    setTotal(0);
    loadPage(0);
  }, [loadPage]);

  // 센티널이 보이면 다음 페이지 요청
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (busyRef.current) return;
        if (itemsLenRef.current === 0) return;                  // 첫 페이지 로딩 중
        if (itemsLenRef.current >= totalRef.current) return;    // 더 없음
        loadPage(itemsLenRef.current);
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadPage, rootMargin, items.length]);

  const reload = useCallback(() => loadPage(0), [loadPage]);

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore: items.length < total,
    sentinelRef,
    reload,
  };
}
