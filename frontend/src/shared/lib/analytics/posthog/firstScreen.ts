import { HOME_PATH } from '@/shared/lib/navigation/appPaths';

import { getAnalyticsScreenRoute } from '../screenRoute';

/** 홈에서 첫 매물 카드를 기다리는 최대 시간. 문서 `load` 뒤부터 센다. 카드가 없는 홈도 이만큼 뒤에는 SDK를 받는다. */
export const FIRST_LISTING_CARD_WAIT_MS = 8_000;
/** 브라우저가 한가해질 때를 기다리는 최대 시간. */
export const IDLE_TIMEOUT_MS = 2_000;
/** `requestIdleCallback`이 없는 브라우저(Safari)에서 기다리는 시간. */
export const IDLE_FALLBACK_MS = 300;

let firstListingCardShown = false;
let firstScreen: Promise<void> | null = null;
const firstListingCardListeners = new Set<() => void>();

/** 첫 매물 카드가 보였다고 알린다. `firstListingCard.ts`가 카드 시간을 보낼 때 부른다. */
export const markPostHogFirstListingCardShown = (): void => {
  if (firstListingCardShown) return;
  firstListingCardShown = true;
  firstListingCardListeners.forEach((listener) => listener());
  firstListingCardListeners.clear();
};

const whenIdle = (callback: () => void): void => {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return;
  }
  window.setTimeout(callback, IDLE_FALLBACK_MS);
};

const whenLoaded = (callback: () => void): (() => void) => {
  if (document.readyState === 'complete') {
    callback();
    return () => undefined;
  }
  window.addEventListener('load', callback, { once: true });
  return () => window.removeEventListener('load', callback);
};

/**
 * 첫 화면이 그려진 뒤에 끝나는 약속이다. 문서 `load` 뒤, 홈이면 첫 매물 카드가 보인 뒤(최대 8초),
 * 그다음 브라우저가 한가할 때 끝난다. 탭을 가리거나 떠나면 남은 이벤트를 보낼 기회를 잡도록 바로 끝난다.
 */
export const waitForPostHogFirstScreen = (): Promise<void> => {
  firstScreen ??= createFirstScreenPromise();
  return firstScreen;
};

const createFirstScreenPromise = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    const waitsForListingCard = getAnalyticsScreenRoute(window.location.pathname) === HOME_PATH;
    let settled = false;
    let timer: number | undefined;
    let stopWaitingForLoad = (): void => undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') finish();
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      stopWaitingForLoad();
      window.clearTimeout(timer);
      firstListingCardListeners.delete(finishWhenIdle);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', finish);
      resolve();
    };
    const finishWhenIdle = () => {
      if (!settled) whenIdle(finish);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', finish);
    stopWaitingForLoad = whenLoaded(() => {
      if (!waitsForListingCard || firstListingCardShown) {
        finishWhenIdle();
        return;
      }
      firstListingCardListeners.add(finishWhenIdle);
      timer = window.setTimeout(finishWhenIdle, FIRST_LISTING_CARD_WAIT_MS);
    });
  });

export const resetPostHogFirstScreenForTests = (): void => {
  firstListingCardShown = false;
  firstScreen = null;
  firstListingCardListeners.clear();
};
