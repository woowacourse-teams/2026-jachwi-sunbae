import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { expect, it, vi } from 'vitest';

import type { MapCanvasProps } from '@/features/map/model/MapCanvas';
import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import { MapCanvasMode, SharedMapCanvasProvider } from '@/features/map/ui/map-canvas/SharedMapCanvas';

const lifetime = vi.hoisted(() => ({ mounts: 0, unmounts: 0 }));
vi.mock('@/features/map/ui/map-canvas/MapCanvasSurface', () => ({
  default: ({ center }: MapCanvasProps) => {
    useEffect(() => {
      lifetime.mounts += 1;
      return () => {
        lifetime.unmounts += 1;
      };
    }, []);
    return <output aria-label="실제 지도">{center.latitude}</output>;
  },
}));

it('모드와 반응형 지도 슬롯이 바뀌어도 실제 지도와 포털 DOM을 유지한다', () => {
  const Harness = () => {
    const [finding, setFinding] = useState(false);
    const [mobile, setMobile] = useState(false);
    return (
      <SharedMapCanvasProvider>
        <button onClick={() => setFinding(!finding)}>모드 전환</button>
        <button onClick={() => setMobile(!mobile)}>화면 폭 전환</button>
        <MapCanvasMode active={!finding}>
          <MapCanvas shared center={{ latitude: 37, longitude: 127 }} />
        </MapCanvasMode>
        <MapCanvasMode active={finding}>
          {mobile ? (
            <section>
              <MapCanvas shared center={{ latitude: 38, longitude: 128 }} />
            </section>
          ) : (
            <aside>
              <MapCanvas shared center={{ latitude: 38, longitude: 128 }} />
            </aside>
          )}
        </MapCanvasMode>
      </SharedMapCanvasProvider>
    );
  };
  const { unmount } = render(<Harness />);
  const original = screen.getByLabelText('실제 지도');
  expect(original).toHaveTextContent('37');
  fireEvent.click(screen.getByText('모드 전환'));
  expect(screen.getByLabelText('실제 지도')).toBe(original);
  expect(original).toHaveTextContent('38');
  fireEvent.click(screen.getByText('화면 폭 전환'));
  expect(screen.getByLabelText('실제 지도')).toBe(original);
  fireEvent.click(screen.getByText('모드 전환'));
  expect(original).toHaveTextContent('37');
  expect(lifetime.mounts).toBe(1);
  expect(lifetime.unmounts).toBe(0);
  unmount();
  expect(lifetime.unmounts).toBe(1);
});
