declare const __API_BASE_URL__: string;
declare const __MAP_PROVIDER_MODE__: string;
declare const __NAVER_MAP_CLIENT_ID__: string;
declare const __META_PIXEL_ID__: string;
declare const __POSTHOG_PROJECT_TOKEN__: string;
declare const __POSTHOG_HOST__: string;
declare const __ENABLE_MSW__: boolean;

interface Window {
  naver?: { maps: NaverMapsNamespace };
}

type NaverLatLng = { lat: () => number; lng: () => number };
type NaverMap = {
  getCenter: () => NaverLatLng;
  getZoom: () => number;
  setCenter: (center: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  refresh: () => void;
};
type NaverOverlay = {
  setMap: (map: NaverMap | null) => void;
  setPosition?: (position: NaverLatLng) => void;
  getProjection?: () => { fromCoordToOffset: (position: NaverLatLng) => { x: number; y: number } };
  getPanes?: () => { overlayLayer: HTMLElement };
  onAdd?: () => void;
  draw?: () => void;
  onRemove?: () => void;
};
type NaverMapsNamespace = {
  LatLng: new (latitude: number, longitude: number) => NaverLatLng;
  Map: new (container: HTMLElement, options: { center: NaverLatLng; zoom: number }) => NaverMap;
  OverlayView: new (...args: never[]) => NaverOverlay;
  Circle: new (options: {
    map: NaverMap;
    center: NaverLatLng;
    radius: number;
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    fillColor: string;
    fillOpacity: number;
  }) => NaverOverlay;
  Event: {
    addListener: (target: object, eventName: string, callback: (event: { coord: NaverLatLng }) => void) => void;
    removeListener: (target: object, eventName: string, callback: (event: { coord: NaverLatLng }) => void) => void;
  };
};

declare module '*.svg' {
  const source: string;
  export default source;
}

declare module '*.png' {
  const source: string;
  export default source;
}

declare module '*.jpg' {
  const source: string;
  export default source;
}

declare module '*.mp4' {
  const source: string;
  export default source;
}

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module '*.css';
