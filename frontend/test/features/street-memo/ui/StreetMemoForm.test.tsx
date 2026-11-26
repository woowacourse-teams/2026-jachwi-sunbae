import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import StreetMemoForm from '@/features/street-memo/ui/street-memo-form/StreetMemoForm';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-22T00:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

const view = (isSubmitting: boolean, onSubmit = vi.fn()) => (
  <StreetMemoForm isSubmitting={isSubmitting} submitFailed={false} onSubmit={onSubmit} onCancel={vi.fn()} />
);

const fill = () => {
  fireEvent.click(screen.getByRole('button', { name: /좋아요/ }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '밤에도 밝아요' } });
};

it('빨리 끝난 등록에는 남기는 중 글자를 띄우지 않고, 등록 중 두 번째 제출은 막는다', () => {
  const onSubmit = vi.fn();
  const { rerender } = render(view(false, onSubmit));
  fill();
  rerender(view(true, onSubmit));
  fireEvent.click(screen.getByRole('button', { name: '평가 남기기' }));
  expect(onSubmit).not.toHaveBeenCalled();

  act(() => vi.advanceTimersByTime(200));
  rerender(view(false, onSubmit));
  act(() => vi.runOnlyPendingTimers());
  expect(screen.queryByText('남기는 중…')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '평가 남기기' })).toBeEnabled();
});

it('300ms를 넘긴 등록은 남기는 중으로 바꾸고, 끝나도 250ms는 유지한다', () => {
  const { rerender } = render(view(false));
  fill();
  rerender(view(true));
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByRole('button', { name: /남기는 중…/ })).toBeDisabled();

  rerender(view(false));
  act(() => vi.advanceTimersByTime(249));
  expect(screen.getByText('남기는 중…')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('button', { name: '평가 남기기' })).toBeEnabled();
});
