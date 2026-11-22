import { useCallback, useRef } from 'react';

import type { MapViewport } from '../model/resultMapView';
import type { NeighborhoodPreviewContext } from './useNeighborhoodPreview';

/**
 * 결과 지도 칸(돌려주는 ref 콜백을 붙인 요소)의 크기와 가리는 여백을 동네 찾기 상태에 알린다.
 * 동네나 출발 정류장을 고를 때 이 칸에 맞춰 시점을 정한다. 크기는 고르는 순간에 읽는다.
 * 요소가 붙을 때 읽기 함수를 등록하고 떨어질 때 지운다.
 */
const useResultMapViewport = <T extends HTMLElement>(
  preview: Pick<NeighborhoodPreviewContext, 'setMapViewportReader'>,
  read: (element: T) => MapViewport | null,
) => {
  const readRef = useRef(read);
  readRef.current = read;
  const { setMapViewportReader } = preview;
  return useCallback(
    (element: T | null) => {
      if (element === null) return;
      setMapViewportReader(() => readRef.current(element));
      return () => setMapViewportReader(null);
    },
    [setMapViewportReader],
  );
};

export default useResultMapViewport;
