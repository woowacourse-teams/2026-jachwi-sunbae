import { createContext, type ReactNode, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { MapCanvasProps } from '../../model/MapCanvas';
import MapCanvasSurface from './MapCanvasSurface';

type MapHost = { attach: (element: HTMLDivElement, props: MapCanvasProps) => void };
const HostContext = createContext<MapHost | null>(null);
const ActiveContext = createContext(true);

/** 지도 DOM의 부모만 바꾼다. 포털 대상과 SDK 인스턴스는 모드와 화면 폭이 바뀌어도 유지한다. */
export const SharedMapCanvasProvider = ({ children }: { children: ReactNode }) => {
  const [target] = useState(() => {
    const element = document.createElement('div');
    element.style.cssText = 'position:absolute;inset:0;';
    element.dataset.sharedMap = 'true';
    return element;
  });
  const [props, setProps] = useState<MapCanvasProps | null>(null);
  const host = useMemo<MapHost>(
    () => ({
      attach: (element, nextProps) => {
        if (target.parentElement !== element) element.appendChild(target);
        setProps(nextProps);
      },
    }),
    [target],
  );
  return (
    <HostContext.Provider value={host}>
      {children}
      {props && createPortal(<MapCanvasSurface {...props} />, target)}
    </HostContext.Provider>
  );
};

export const MapCanvasMode = ({ active, children }: { active: boolean; children: ReactNode }) => (
  <ActiveContext.Provider value={active}>{children}</ActiveContext.Provider>
);

export const SharedMapCanvasSlot = ({ host, ...props }: MapCanvasProps & { host: MapHost }) => {
  const active = useContext(ActiveContext);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (active && ref.current) host.attach(ref.current, props);
  });
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
};

export const useMapCanvasHost = () => useContext(HostContext);
