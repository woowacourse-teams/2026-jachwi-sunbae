import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sdk } = vi.hoisted(() => ({
  sdk: { init: vi.fn(), capture: vi.fn(), captureException: vi.fn(), register: vi.fn() },
}));
vi.mock('posthog-js', () => ({ default: sdk }));

import {
  capturePostHogException,
  getPostHogDiagnostics,
  holdPostHogSdkLoadUntil,
  initPostHog,
  reportPostHogFirstListingCard,
  resetPostHogForTests,
  setPostHogSessionContext,
  startPostHogEarlyErrorCapture,
  startPostHogFirstListingCardTiming,
  trackPostHogEvent,
  trackPostHogPageView,
  waitForPostHogFirstScreen,
} from '@/shared/lib/analytics/posthog';
import { stopPostHogEarlyErrorCaptureForTests } from '@/shared/lib/analytics/posthog/earlyErrors';
import { resetPostHogFirstListingCardForTests } from '@/shared/lib/analytics/posthog/firstListingCard';
import {
  FIRST_LISTING_CARD_WAIT_MS,
  IDLE_FALLBACK_MS,
  resetPostHogFirstScreenForTests,
} from '@/shared/lib/analytics/posthog/firstScreen';

/** 앱 시작과 같은 순서다. PostHogTracker가 이렇게 부른다. */
const startApp = () => {
  holdPostHogSdkLoadUntil(waitForPostHogFirstScreen());
  initPostHog('phc_test', 'https://us.i.posthog.com');
  startPostHogEarlyErrorCapture();
  setPostHogSessionContext({ environment: 'production', app_version: '1.0.0', platform: 'web' });
};

/** SDK가 받은 호출을 순서대로 늘어놓는다. */
const sentInOrder = () =>
  [
    ...sdk.register.mock.calls.map((_, index) => ({
      name: 'register',
      order: sdk.register.mock.invocationCallOrder[index],
    })),
    ...sdk.capture.mock.calls.map(([name], index) => ({ name, order: sdk.capture.mock.invocationCallOrder[index] })),
    ...sdk.captureException.mock.calls.map(([error], index) => ({
      name: `exception:${error instanceof Error ? error.message : String(error)}`,
      order: sdk.captureException.mock.invocationCallOrder[index],
    })),
  ]
    .sort((left, right) => left.order - right.order)
    .map(({ name }) => name);

const settle = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
  await vi.dynamicImportSettled();
};

const setVisibility = (state: DocumentVisibilityState) =>
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });

describe('PostHog SDK를 첫 화면 뒤에 받는다', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom에는 requestIdleCallback이 없어 Safari처럼 짧게 쉬었다가 받는다.
    Reflect.deleteProperty(window, 'requestIdleCallback');
    setVisibility('visible');
    window.history.replaceState(null, '', '/');
    window.localStorage.clear();
  });

  afterEach(() => {
    resetPostHogForTests();
    resetPostHogFirstScreenForTests();
    resetPostHogFirstListingCardForTests();
    stopPostHogEarlyErrorCaptureForTests();
    Reflect.deleteProperty(document, 'visibilityState');
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('홈은 첫 매물 카드가 보일 때까지 SDK를 받지 않고, 그전 이벤트를 카드 이벤트까지 순서대로 보낸다', async () => {
    startApp();
    startPostHogFirstListingCardTiming();
    trackPostHogPageView('/');
    trackPostHogEvent('home_viewed');

    await settle(FIRST_LISTING_CARD_WAIT_MS - 1);
    expect(sdk.init).not.toHaveBeenCalled();
    expect(getPostHogDiagnostics()).toMatchObject({ status: 'deferred', pendingActions: 3 });

    reportPostHogFirstListingCard();
    trackPostHogEvent('after_card');
    await settle(IDLE_FALLBACK_MS);

    expect(sdk.init).toHaveBeenCalledOnce();
    expect(sentInOrder()).toEqual(['register', '$pageview', 'home_viewed', 'first_listing_card_visible', 'after_card']);
    expect(getPostHogDiagnostics()).toMatchObject({ status: 'ready', pendingActions: 0, droppedActions: 0 });
  });

  it('첫 매물 카드가 나오지 않는 홈은 문서 load 뒤 8초가 지나면 받는다', async () => {
    startApp();
    trackPostHogPageView('/');

    await settle(FIRST_LISTING_CARD_WAIT_MS + IDLE_FALLBACK_MS - 1);
    expect(sdk.init).not.toHaveBeenCalled();
    await settle(1);

    expect(sdk.init).toHaveBeenCalledOnce();
    expect(sentInOrder()).toEqual(['register', '$pageview']);
  });

  it('홈이 아닌 화면은 카드를 기다리지 않고 문서 load 뒤 한가할 때 받는다', async () => {
    window.history.replaceState(null, '', '/me');
    startApp();
    trackPostHogPageView('/me');

    await settle(IDLE_FALLBACK_MS);

    expect(sdk.init).toHaveBeenCalledOnce();
    expect(sentInOrder()).toEqual(['register', '$pageview']);
  });

  it('카드를 기다리다 탭을 가리면 남은 이벤트를 보내도록 바로 받는다', async () => {
    startApp();
    trackPostHogEvent('before_hidden');

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(0);

    expect(sdk.init).toHaveBeenCalledOnce();
    expect(sentInOrder()).toEqual(['register', 'before_hidden']);
  });

  it('SDK를 받기 전의 미처리 오류와 거절도 순서대로 모아 보내고, 받은 뒤에는 SDK에 맡긴다', async () => {
    startApp();
    trackPostHogEvent('before_error');
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('render failed'), message: 'render failed' }));
    const rejection = new Event('unhandledrejection');
    Object.defineProperty(rejection, 'reason', { value: new Error('request rejected') });
    window.dispatchEvent(rejection);
    capturePostHogException(new Error('boundary'), { source: 'route_boundary' });

    await settle(FIRST_LISTING_CARD_WAIT_MS + IDLE_FALLBACK_MS);

    expect(sentInOrder()).toEqual([
      'register',
      'before_error',
      'exception:render failed',
      'exception:request rejected',
      'exception:boundary',
    ]);
    expect(sdk.captureException.mock.calls[0][1]).toMatchObject({
      capture_timing: 'before_sdk',
      error_category: 'uncaught',
      severity: 'P0',
    });

    window.dispatchEvent(new ErrorEvent('error', { error: new Error('after ready'), message: 'after ready' }));
    expect(sdk.captureException).toHaveBeenCalledTimes(3);
  });

  it('미루기는 앱 시작 때 한 번만 걸고, 이미 받은 SDK는 다시 미루지 않는다', async () => {
    window.history.replaceState(null, '', '/me');
    startApp();
    await settle(IDLE_FALLBACK_MS);
    expect(getPostHogDiagnostics().status).toBe('ready');

    holdPostHogSdkLoadUntil(new Promise(() => undefined));
    trackPostHogEvent('after_ready');

    expect(sdk.capture).toHaveBeenCalledWith('after_ready', expect.any(Object));
  });
});
