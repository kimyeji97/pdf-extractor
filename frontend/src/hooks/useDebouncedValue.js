/**
 * 값 디바운스 훅 (REQ-P03-03)
 *
 * 검색이 서버로 넘어가면서 입력 한 글자마다 요청이 나가는 것을 막기 위해 사용한다.
 */
import { useState, useEffect } from "react";

export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
