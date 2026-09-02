import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicConfig } from '../types/PublicConfig';
import MapCanvas from './MapCanvas';

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

class FakeOverlay {
  setMap = vi.fn();
}

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
    class FakeMap {
      center: FakeLatLng;
      zoom: number;
      getCenter = () => this.center;
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

    render(<MapCanvas config={config} center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />);
    await waitFor(() => expect(resizeCallbacks).toHaveLength(1));

    expect(() => resizeCallbacks[0]()).not.toThrow();
    expect(maps[0].refresh).toHaveBeenCalled();
  });

  it('앱 확대 단계를 반대 방향인 Naver zoom으로 바꿔 전달한다', async () => {
    render(<MapCanvas config={config} center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />);

    await waitFor(() => expect(maps).toHaveLength(1));
    expect(maps[0].zoom).toBe(15);
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

    const { rerender } = render(
      <MapCanvas config={config} center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />,
    );
    await waitFor(() => expect(maps).toHaveLength(1));
    const [map] = maps;

    rerender(<MapCanvas config={config} center={{ latitude: 37.567, longitude: 126.979 }} level={5} />);

    await waitFor(() => expect(map.setCenter).toHaveBeenCalledOnce());
    expect(map.setZoom).not.toHaveBeenCalled();
    expect(map.zoom).toBe(15);
    expect(resizeObserverCount).toBe(1);
    expect(disconnect).not.toHaveBeenCalled();
    expect(map.refresh).not.toHaveBeenCalled();
  });

  it('사용자가 지도에서 확대 단계를 바꾸면 같은 단계를 다시 지정하지 않는다', async () => {
    const { rerender } = render(
      <MapCanvas config={config} center={{ latitude: 37.5665, longitude: 126.978 }} level={5} />,
    );
    await waitFor(() => expect(maps).toHaveLength(1));
    const [map] = maps;
    map.zoom = 17;

    rerender(<MapCanvas config={config} center={{ latitude: 37.5665, longitude: 126.978 }} level={3} />);

    await waitFor(() => expect(map.zoom).toBe(17));
    expect(map.setZoom).not.toHaveBeenCalled();
  });
});
