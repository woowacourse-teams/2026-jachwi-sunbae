import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useTimeout from '@/shared/lib/hooks/useTimeout';

describe('useTimeout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('정한 시간 뒤에 한 번 부른다', () => {
    const onTimeout = vi.fn();
    renderHook(() => useTimeout(onTimeout, 1000));
    vi.advanceTimersByTime(999);
    expect(onTimeout).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('시간이 null이면 기다리지 않고, 언마운트하면 취소한다', () => {
    const onTimeout = vi.fn();
    const { rerender, unmount } = renderHook(({ delay }) => useTimeout(onTimeout, delay), {
      initialProps: { delay: null as number | null },
    });
    vi.advanceTimersByTime(5000);
    expect(onTimeout).not.toHaveBeenCalled();
    rerender({ delay: 1000 });
    unmount();
    vi.advanceTimersByTime(5000);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('다시 재는 키가 바뀌면 처음부터 다시 재고, 부를 때의 최신 함수를 쓴다', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderHook(({ onTimeout, key }) => useTimeout(onTimeout, 1000, key), {
      initialProps: { onTimeout: first, key: 0 },
    });
    vi.advanceTimersByTime(600);
    rerender({ onTimeout: first, key: 1 });
    vi.advanceTimersByTime(600);
    expect(first).not.toHaveBeenCalled();
    rerender({ onTimeout: latest, key: 1 });
    vi.advanceTimersByTime(400);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });
});
