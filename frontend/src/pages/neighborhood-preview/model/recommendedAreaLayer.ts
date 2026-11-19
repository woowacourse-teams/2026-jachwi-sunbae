import { useSyncExternalStore } from 'react';

const RECOMMENDED_AREA_LAYER_KEY = 'jachwi:recommended-area-layer';

/** 동네 찾기 결과로 칠한 추천 동네를 지도에 그릴지. 고른 적이 없으면 켠다. */
export const readRecommendedAreaLayerOn = (): boolean => {
  try {
    return localStorage.getItem(RECOMMENDED_AREA_LAYER_KEY) !== 'off';
  } catch {
    return true;
  }
};

const listeners = new Set<() => void>();
let current: boolean | null = null;
const snapshot = () => (current ??= readRecommendedAreaLayerOn());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** 켜고 끈 값을 기기에 남겨 새로고침해도 따르고, 같은 값을 보는 화면(휴대폰, 데스크탑, 내 기록과 동네 찾기 모드)에 함께 알린다. */
export const writeRecommendedAreaLayerOn = (isOn: boolean) => {
  current = isOn;
  try {
    localStorage.setItem(RECOMMENDED_AREA_LAYER_KEY, isOn ? 'on' : 'off');
  } catch {
    // 저장소를 쓸 수 없으면 이번 화면에서만 켜고 끈다.
  }
  listeners.forEach((listener) => listener());
};

const useRecommendedAreaLayer = () => {
  const isOn = useSyncExternalStore(subscribe, snapshot, () => true);
  return { isOn, toggle: () => writeRecommendedAreaLayerOn(!isOn) };
};

export default useRecommendedAreaLayer;
