import { createContext, useContext } from 'react';

import MapModeButton from './MapModeButton';

/** 통합 지도에서 이 화면이 넘어갈 다른 지도 모드와, 넘어가는 방법. 통합 지도 밖(공개 동네 찾기 등)에서는 없다. */
export type MapModeSwitch = { target: 'records' | 'neighborhoods'; onSwitch: () => void };

const MapModeContext = createContext<MapModeSwitch | null>(null);

export const MapModeProvider = MapModeContext.Provider;

/**
 * 지도 아래 가운데의 모드 전환 버튼. 내 기록에서는 `출퇴근 시간으로 동네 찾기`, 동네 찾기에서는 `내 기록으로` 넘어간다.
 * 통합 지도 밖(공개 동네 찾기 등)에서는 아무것도 그리지 않는다.
 */
export const MapModeSwitchButton = ({ className }: { className?: string }) => {
  const mode = useContext(MapModeContext);
  return mode ? <MapModeButton mode={mode.target} onClick={mode.onSwitch} className={className} /> : null;
};
