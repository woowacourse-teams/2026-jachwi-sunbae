import { render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';
import type { PublicConfig } from '@/shared/config/publicConfigTypes';

const config: PublicConfig = {
  apiBaseUrl: 'http://localhost:8080',
  mapProviderMode: 'naver',
  naverMapClientId: 'test-key',
};

class FakeLatLng {
  constructor(
    private readonly latitude: number,
    private readonly longitude: number,
  ) {}

  lat = () => this.latitude;
  lng = () => this.longitude;
}

class FakeLatLngBounds {
  constructor(
    readonly sw: FakeLatLng,
    readonly ne: FakeLatLng,
  ) {}

  getSW = () => this.sw;
  getNE = () => this.ne;
}

const overlayInstances: FakeOverlay[] = [];

class FakeOverlay {
  readonly pane = document.createElement('div');
  onAdd?: () => void;
  draw?: () => void;
  onRemove?: () => void;
  setPosition = vi.fn();
  getPanes = () => ({ overlayLayer: this.pane });
  getProjection = () => ({ fromCoordToOffset: () => ({ x: 120, y: 80 }) });
  setMap = vi.fn((map: unknown) => {
    if (map === null) this.onRemove?.();
    else {
      this.onAdd?.();
      this.draw?.();
    }
  });

  constructor() {
    overlayInstances.push(this);
  }
}

const renderWithConfig = (ui: ReactElement) =>
  render(ui, { wrapper: ({ children }) => <PublicConfigProvider config={config}>{children}</PublicConfigProvider> });

describe('Naver 지도 상태 동기화', () => {
  type FakeMapInstance = {
    center: FakeLatLng;
    zoom: number;
    getCenter: () => FakeLatLng;
    getZoom: () => number;
    setCenter: ReturnType<typeof vi.fn>;
    setZoom: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let maps: FakeMapInstance[];

  beforeEach(() => {
    maps = [];
    overlayInstances.length = 0;
    class FakeMap {
      center: FakeLatLng;
      zoom: number;
      getCenter = () => this.center;
      getBounds = () => new FakeLatLngBounds(new FakeLatLng(37, 126), new FakeLatLng(38, 128));
      getZoom = () => this.zoom;
      setCenter = vi.fn((center: FakeLatLng) => {
        this.center = center;
      });
      setZoom = vi.fn((zoom: number) => {
        this.zoom = zoom;
      });
      refresh = vi.fn();

      constructor(_: HTMLElement, options: { center: FakeLatLng; zoom: number }) {
        this.center = options.center;
        this.zoom = options.zoom;
        maps.push(this);
      }
    }

    Object.defineProperty(window, 'naver', {
      configurable: true,
      value: {
        maps: {
          LatLng: FakeLatLng,
          LatLngBounds: FakeLatLngBounds,
          Map: FakeMap,
          OverlayView: FakeOverlay,
          Circle: FakeOverlay,
          Event: { addListener: vi.fn(), removeListener: vi.fn() },
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'naver', { configurable: true, value: undefined });
    vi.unstubAllGlobals();
  });

  it('컨테이너 크기가 바뀌면 Naver 지도의 refresh를 부른다', async () => {
    const resizeCallbacks: (() => void)[] = [];
    class FakeResizeObserver {
      constructor(private readonly callback: () => void) {}
      observe = () => {
        resizeCallbacks.push(this.callback);
      };
      disconnect = vi.fn();
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    renderWithConfig(<MapCanvas center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />);
    await waitFor(() => expect(resizeCallbacks).toHaveLength(1));

    expect(() => resizeCallbacks[0]()).not.toThrow();
    await waitFor(() => expect(maps[0].refresh).toHaveBeenCalled());
  });

  it('앱 확대 단계를 반대 방향인 Naver zoom으로 바꿔 전달한다', async () => {
    renderWithConfig(<MapCanvas center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />);

    await waitFor(() => expect(maps).toHaveLength(1));
    expect(maps[0].zoom).toBe(15);
  });

  it('지도 생성 및 이동 완료 때 SDK의 실제 표시 경계를 전달한다', async () => {
    const onBoundsChange = vi.fn();
    renderWithConfig(<MapCanvas center={{ latitude: 37.5, longitude: 127 }} onBoundsChange={onBoundsChange} />);
    await waitFor(() => expect(onBoundsChange).toHaveBeenCalledWith({ south: 37, west: 126, north: 38, east: 128 }));
    const listener = vi.mocked(window.naver!.maps.Event.addListener).mock.calls.find((call) => call[1] === 'idle');
    expect(listener).toBeDefined();
    onBoundsChange.mockClear();
    listener![2]();
    expect(onBoundsChange).toHaveBeenCalledWith({ south: 37, west: 126, north: 38, east: 128 });
  });

  it('중심 좌표만 갱신될 때 사용자가 바꾼 확대 단계를 되돌리지 않는다', async () => {
    const disconnect = vi.fn();
    let resizeObserverCount = 0;
    class FakeResizeObserver {
      constructor(_: () => void) {
        resizeObserverCount += 1;
      }
      observe = vi.fn();
      disconnect = disconnect;
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    const { rerender } = renderWithConfig(<MapCanvas center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />);
    await waitFor(() => expect(maps).toHaveLength(1));
    const [map] = maps;

    rerender(<MapCanvas center={{ latitude: 37.567, longitude: 126.979 }} level={5} />);

    await waitFor(() => expect(map.setCenter).toHaveBeenCalledOnce());
    expect(map.setZoom).not.toHaveBeenCalled();
    expect(map.zoom).toBe(15);
    expect(resizeObserverCount).toBe(1);
    expect(disconnect).not.toHaveBeenCalled();
    expect(map.refresh).not.toHaveBeenCalled();
  });

  it('사용자가 지도에서 확대 단계를 바꾸면 같은 단계를 다시 지정하지 않는다', async () => {
    const { rerender } = renderWithConfig(<MapCanvas center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />);
    await waitFor(() => expect(maps).toHaveLength(1));
    const [map] = maps;
    map.zoom = 17;

    rerender(<MapCanvas center={{ latitude: 37.5665, longitude: 126.978 }} level={3} />);

    await waitFor(() => expect(map.zoom).toBe(17));
    expect(map.setZoom).not.toHaveBeenCalled();
  });

  it('라이브 마커는 확대 중 레이아웃 대신 transform으로 위치를 갱신한다', async () => {
    const { rerender } = renderWithConfig(
      <MapCanvas
        center={{ latitude: 37.5665, longitude: 126.978 }}
        level={5}
        markers={[
          {
            id: 'property-10',
            latitude: 37.5665,
            longitude: 126.978,
            label: '테스트 매물',
            tone: 'property',
          },
        ]}
      />,
    );

    await waitFor(() => expect(overlayInstances).toHaveLength(1));
    const marker = overlayInstances[0].pane.firstElementChild;
    expect(marker).toBeInstanceOf(HTMLElement);
    expect(marker).toHaveStyle({
      left: '0px',
      top: '0px',
      transform: 'translate3d(120px, 80px, 0)',
      willChange: 'transform',
    });
    expect(marker?.firstElementChild).toHaveStyle({ transform: 'translate(-50%, -120.710678%)' });
    const content = marker?.firstElementChild as HTMLElement;
    expect(content.style.getPropertyValue('--map-marker-scale')).toBe('0.88');
    rerender(
      <MapCanvas
        center={{ latitude: 37.5665, longitude: 126.978 }}
        level={1}
        markers={[
          {
            id: 'property-10',
            latitude: 37.5665,
            longitude: 126.978,
            label: '테스트 매물',
            tone: 'property',
          },
        ]}
      />,
    );
    await waitFor(() => expect(content.style.getPropertyValue('--map-marker-scale')).toBe('1.36'));
    expect(overlayInstances).toHaveLength(1);
    expect(marker?.firstElementChild).toBe(content);
  });
});
