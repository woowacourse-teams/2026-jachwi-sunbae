import { useEffect } from 'react';

import type { LogParams } from './LogParamsContext';
import useLogger from './useLogger';

/** 이벤트마다 이번 방문에서 이미 노출을 남긴 항목. 페이지를 새로 열면 다시 센다. */
const impressedKeys = new Map<string, Set<string | number>>();

type LogImpressionProps<T> = {
  event: string;
  /** 지금 화면에 보이는 항목. 바뀔 때마다 처음 보인 항목만 남긴다. */
  items: readonly T[];
  getKey: (item: T) => string | number;
  getParams: (item: T) => LogParams;
};

/**
 * 화면에 보인 항목마다 노출 이벤트를 이번 방문에 한 번만 보낸다. 아무것도 그리지 않는다.
 * 지도 마커처럼 React 컴포넌트로 감쌀 수 없는 대상도, 보이는 항목 목록만 넘기면 UI 코드와 떨어진 채로 노출을 셀 수 있다.
 */
const LogImpression = <T,>({ event, items, getKey, getParams }: LogImpressionProps<T>) => {
  const { log } = useLogger();

  useEffect(() => {
    const seen = impressedKeys.get(event) ?? new Set<string | number>();
    impressedKeys.set(event, seen);
    for (const item of items) {
      const key = getKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      log(event, getParams(item));
    }
  }, [event, items, getKey, getParams, log]);

  return null;
};

export default LogImpression;
