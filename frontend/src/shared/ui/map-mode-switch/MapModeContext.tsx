import { css } from '@emotion/css';
import { createContext, useContext } from 'react';

import Icon from '../icon/Icon';
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

/**
 * 동네 찾기 머리 왼쪽의 뒤로가기. 아래 `내 기록으로` 버튼과 같은 방법(마지막 내 기록 주소, 지도 위치와 줌 유지)으로 내 기록에 돌아간다.
 * 통합 지도 밖이거나 내 기록 화면이면 그리지 않는다.
 */
export const MapModeBackButton = () => {
  const mode = useContext(MapModeContext);
  if (mode?.target !== 'records') return null;
  return (
    <button type="button" className={backStyle} aria-label="내 기록으로 돌아가기" onClick={mode.onSwitch}>
      <Icon name="arrow-left" size={22} />
    </button>
  );
};

const backStyle = css`
  label: MapModeBackButton-root;
  display: grid;
  flex: none;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: var(--shadow-floating);
  color: var(--color-ink);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 3px;
  }
`;
