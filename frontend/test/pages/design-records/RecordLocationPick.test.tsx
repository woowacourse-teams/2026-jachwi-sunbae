import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import RecordLocationPick from '@/pages/design-records/ui/record-location-pick/RecordLocationPick';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-22T00:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

const view = (isSaving: boolean) => (
  <RecordLocationPick
    pick={{
      status: 'ready',
      address: {
        latitude: 37.5,
        longitude: 127.0,
        address: '서울 강남구 역삼동 1',
        roadAddress: null,
        jibunAddress: null,
      },
      isSaving,
      hasSaveFailed: false,
      save: vi.fn(),
      cancel: vi.fn(),
    }}
  />
);

it('고른 주소가 그대로 보이므로 빨리 끝난 저장에는 버튼 글자를 바꾸지 않는다', () => {
  const { rerender } = render(view(true));
  expect(screen.getByRole('button', { name: '이 위치로 변경' })).toBeDisabled();

  act(() => vi.advanceTimersByTime(200));
  expect(screen.queryByText('변경 중…')).not.toBeInTheDocument();
  rerender(view(false));
  act(() => vi.runOnlyPendingTimers());
  expect(screen.queryByText('변경 중…')).not.toBeInTheDocument();
});

it('300ms를 넘긴 저장은 변경 중으로 바꾸고, 끝나도 250ms는 유지한다', () => {
  const { rerender } = render(view(true));
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByRole('button', { name: '변경 중…' })).toBeInTheDocument();

  rerender(view(false));
  act(() => vi.advanceTimersByTime(249));
  expect(screen.getByRole('button', { name: '변경 중…' })).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('button', { name: '이 위치로 변경' })).toBeInTheDocument();
});
