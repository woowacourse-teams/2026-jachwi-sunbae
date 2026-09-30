import { useEffect, useState } from 'react';

/** 키보드가 화면을 덮는 높이(px). 화면 아래 고정 버튼이 키보드에 가리지 않게 쓴다. */
const MIN_KEYBOARD_HEIGHT = 80;

export const useKeyboardInset = (): number => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (viewport === null || viewport === undefined) return;

    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      // 주소창이 접히는 정도의 작은 변화는 키보드로 보지 않는다.
      setInset(covered < MIN_KEYBOARD_HEIGHT ? 0 : Math.round(covered));
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
};
