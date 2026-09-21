import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useKeyboardInset } from './useKeyboardInset';

const listeners = new Map<string, () => void>();

const stubViewport = (height: number, offsetTop = 0) => {
  const viewport = {
    height,
    offsetTop,
    addEventListener: (name: string, handler: () => void) => listeners.set(name, handler),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
  return viewport;
};

afterEach(() => {
  listeners.clear();
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
});

describe('키보드 높이', () => {
  it('키보드가 없으면 0이다', () => {
    stubViewport(844);
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
  });

  it('키보드가 덮는 높이를 돌려준다', () => {
    const viewport = stubViewport(844);
    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 508;
      listeners.get('resize')?.();
    });

    expect(result.current).toBe(336);
  });

  it('주소창이 접히는 정도의 작은 변화는 키보드로 보지 않는다', () => {
    const viewport = stubViewport(844);
    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 790;
      listeners.get('resize')?.();
    });

    expect(result.current).toBe(0);
  });

  it('visualViewport가 없는 환경에서도 0으로 동작한다', () => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
  });
});
