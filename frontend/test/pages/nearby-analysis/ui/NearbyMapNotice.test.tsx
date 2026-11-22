import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import NearbyMapNotice from '@/pages/nearby-analysis/ui/nearby-map-notice/NearbyMapNotice';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-22T00:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

const view = (isNearbyPending: boolean) => (
  <NearbyMapNotice
    isPropertyPending={false}
    isNearbyPending={isNearbyPending}
    isNearbyError={false}
    onRetry={vi.fn()}
  />
);

it('지도는 먼저 보이므로 300ms 안에 끝난 주변 시설 요청에는 분석 중 안내를 띄우지 않는다', () => {
  const { rerender } = render(view(true));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  act(() => vi.advanceTimersByTime(299));
  rerender(view(false));
  act(() => vi.runOnlyPendingTimers());
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('300ms를 넘긴 요청에는 분석 중 안내를 띄우고, 끝나도 250ms는 남긴다', () => {
  const { rerender } = render(view(true));
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByRole('status')).toHaveTextContent('주변 시설을 분석하는 중이에요.');

  rerender(view(false));
  act(() => vi.advanceTimersByTime(249));
  expect(screen.getByRole('status')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
