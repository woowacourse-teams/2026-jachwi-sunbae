import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useEscapeKey from '@/shared/lib/hooks/useEscapeKey';

describe('useEscapeKey', () => {
  it('Esc만 알리고 다른 키는 알리지 않는다', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(onEscape));
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onEscape).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('꺼져 있거나 언마운트하면 알리지 않는다', () => {
    const onEscape = vi.fn();
    const { rerender, unmount } = renderHook(({ enabled }) => useEscapeKey(onEscape, enabled), {
      initialProps: { enabled: false },
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
    rerender({ enabled: true });
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('누를 때의 최신 함수를 부른다', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderHook(({ onEscape }) => useEscapeKey(onEscape), { initialProps: { onEscape: first } });
    rerender({ onEscape: latest });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });
});
