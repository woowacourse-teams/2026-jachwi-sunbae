import { useEffect, useEffectEvent } from 'react';

/**
 * `delayMs` 뒤에 `onTimeout`을 한 번 부른다. `delayMs`가 null이면 기다리지 않는다.
 * `delayMs`나 `restartKey`가 바뀌면 처음부터 다시 재고, 언마운트하면 취소한다. `onTimeout`은 부를 때의 최신 함수다.
 */
const useTimeout = (onTimeout: () => void, delayMs: number | null, restartKey?: unknown) => {
  const fire = useEffectEvent(onTimeout);
  useEffect(() => {
    if (delayMs === null) return;
    const timer = window.setTimeout(fire, delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, restartKey]);
};

export default useTimeout;
