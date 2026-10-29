import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MapZoomControl, { MAX_MAP_LEVEL, MIN_MAP_LEVEL } from '@/features/map/ui/map-zoom-control/MapZoomControl';

describe('지도 확대·축소 버튼', () => {
  it('확대는 한 단계 가까이, 축소는 한 단계 멀리 바꾼다', async () => {
    const onChange = vi.fn();
    render(<MapZoomControl level={7} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: '지도 확대' }));
    await userEvent.click(screen.getByRole('button', { name: '지도 축소' }));

    expect(onChange.mock.calls).toEqual([[6], [8]]);
  });

  it('가장 가까운 단계에서는 확대를, 가장 먼 단계에서는 축소를 막는다', () => {
    const { rerender } = render(<MapZoomControl level={MIN_MAP_LEVEL} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '지도 확대' })).toBeDisabled();

    rerender(<MapZoomControl level={MAX_MAP_LEVEL} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '지도 축소' })).toBeDisabled();
  });
});
