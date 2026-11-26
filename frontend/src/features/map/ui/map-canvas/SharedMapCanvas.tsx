import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import type { MapCanvasProps } from '../../model/MapCanvas';
import InfrastructureMap from '../infrastructure-panel/InfrastructureMap';
import MapCanvasSurface from './MapCanvasSurface';

type MapHost = {
  attach: (element: HTMLDivElement, props: MapCanvasProps, modeKey: string) => void;
  /** 모드를 바꿀 때 붙잡아 둔 이전 모드의 가운데와 확대 단계를 놓는다. 새 모드가 일부러 시점을 옮길 때만 부른다. */
  releaseHeldView: () => void;
  /** 이 지도에 이미 보던 시점이 있는지. 있으면 새로 붙는 모드는 처음 자리로 옮기지 않고 그 시점을 이어 쓴다. */
  hasView: () => boolean;
};

type MapView = { center: MapCanvasProps['center']; level: number | undefined };
/** 지도 화면이 잠깐 사라졌다 다시 그려질 때(휴대폰 체크리스트 등) 보던 시점을 넘겨받는 곳. */
export type MapViewMemory = { view: MapView | null };
const HostContext = createContext<MapHost | null>(null);
const ActiveContext = createContext({ active: true, modeKey: 'default' });

/** 지도 DOM의 부모만 바꾼다. 포털 대상과 SDK 인스턴스는 모드와 화면 폭이 바뀌어도 유지한다. */
export const SharedMapCanvasProvider = ({
  children,
  infrastructure,
  preserveZoomOnModeChange = false,
  viewMemory,
}: {
  children: ReactNode;
  preserveZoomOnModeChange?: boolean;
  infrastructure?: { open: boolean; onClose: () => void };
  /** 넘기면 이 지도가 사라질 때 보던 시점을 남기고, 다시 그릴 때 다른 모드에서 넘어온 것처럼 그 시점으로 시작한다. */
  viewMemory?: MapViewMemory;
}) => {
  const [target] = useState(() => {
    const element = document.createElement('div');
    element.style.cssText = 'position:absolute;inset:0;';
    element.dataset.sharedMap = 'true';
    return element;
  });
  // 남겨 둔 시점은 어느 모드의 것도 아니어서(빈 modeKey) 처음 붙는 모드가 모드 전환처럼 이어받는다.
  const current = useRef<(MapView & { modeKey: string }) | null>(
    viewMemory?.view ? { ...viewMemory.view, modeKey: '' } : null,
  );
  useEffect(
    () => () => {
      if (viewMemory && current.current)
        viewMemory.view = { center: current.current.center, level: current.current.level };
    },
    [viewMemory],
  );
  // 모드를 바꾸면 새 모드가 처음 요청한 가운데와 확대 단계 대신 보던 시점을 붙잡아 둔다.
  // 새 모드가 요청을 바꿀 때(사용자가 고른 이동, 넘겨받은 시점을 상태에 반영) 놓는다. 가운데와 확대 단계는 따로 놓는다.
  const heldCenter = useRef<{ requested: MapCanvasProps['center']; actual: MapCanvasProps['center'] } | null>(null);
  const heldLevel = useRef<{ requested: number | undefined; actual: number | undefined } | null>(null);
  const [props, setProps] = useState<MapCanvasProps | null>(null);
  const host = useMemo<MapHost>(
    () => ({
      attach: (element, nextProps, modeKey) => {
        if (target.parentElement !== element) element.appendChild(target);
        const previous = current.current;
        const switching = preserveZoomOnModeChange && previous !== null && previous.modeKey !== modeKey;
        if (switching) {
          heldCenter.current = { requested: nextProps.center, actual: previous.center };
          heldLevel.current = { requested: nextProps.level, actual: previous.level };
          nextProps.onCenterChange?.(previous.center.latitude, previous.center.longitude);
          if (previous.level !== undefined) nextProps.onLevelChange?.(previous.level);
        }
        // 넘겨받은 확대 단계를 상태에 반영하기 전의 렌더가 옛 요청으로 다시 붙어도 지도를 되돌리지 않는다.
        // (되돌리면 지도가 알린 단계와 옛 요청이 번갈아 들어와 끝없이 다시 그린다.)
        if (heldLevel.current && heldLevel.current.requested !== nextProps.level) heldLevel.current = null;
        const level = heldLevel.current ? heldLevel.current.actual : nextProps.level;
        const held = heldCenter.current;
        if (
          held &&
          (held.requested.latitude !== nextProps.center.latitude ||
            held.requested.longitude !== nextProps.center.longitude)
        )
          heldCenter.current = null;
        const center = heldCenter.current?.actual ?? nextProps.center;
        current.current = { modeKey, center, level };
        setProps({
          ...nextProps,
          center,
          level,
          onCenterChange: (latitude, longitude) => {
            const point = { latitude, longitude };
            if (current.current) current.current.center = point;
            if (heldCenter.current) heldCenter.current.actual = point;
            nextProps.onCenterChange?.(latitude, longitude);
          },
          onLevelChange: (value) => {
            if (current.current) current.current.level = value;
            if (heldLevel.current) heldLevel.current.actual = value;
            nextProps.onLevelChange?.(value);
          },
        });
      },
      releaseHeldView: () => {
        heldCenter.current = null;
        heldLevel.current = null;
      },
      hasView: () => current.current !== null,
    }),
    [target, preserveZoomOnModeChange],
  );
  return (
    <HostContext.Provider value={host}>
      {children}
      {props &&
        createPortal(
          infrastructure ? (
            <InfrastructureMap mapProps={props} open={infrastructure.open} onClose={infrastructure.onClose} />
          ) : (
            <MapCanvasSurface {...props} />
          ),
          target,
        )}
    </HostContext.Provider>
  );
};

export const MapCanvasMode = ({ active, children }: { active: boolean; children: ReactNode }) => {
  const modeKey = useId();
  const value = useMemo(() => ({ active, modeKey }), [active, modeKey]);
  return <ActiveContext.Provider value={value}>{children}</ActiveContext.Provider>;
};

export const SharedMapCanvasSlot = ({ host, ...props }: MapCanvasProps & { host: MapHost }) => {
  const { active, modeKey } = useContext(ActiveContext);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (active && ref.current) host.attach(ref.current, props, modeKey);
  });
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
};

export const useMapCanvasHost = () => useContext(HostContext);
