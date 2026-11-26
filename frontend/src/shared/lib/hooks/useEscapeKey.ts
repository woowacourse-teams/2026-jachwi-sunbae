import { useEffect, useEffectEvent } from 'react';

/**
 * `enabled`인 동안 문서에서 Esc를 누르면 `onEscape`를 부른다. 포커스가 어디 있든 닫히게 할 때 쓴다.
 * `onEscape`는 누를 때의 최신 함수여서, 바뀔 때마다 구독을 다시 걸지 않는다.
 */
const useEscapeKey = (onEscape: (event: KeyboardEvent) => void, enabled = true) => {
  const escape = useEffectEvent(onEscape);
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escape(event);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
};

export default useEscapeKey;
