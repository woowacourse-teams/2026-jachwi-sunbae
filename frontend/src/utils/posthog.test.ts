import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockPostHog } = vi.hoisted(() => ({
  mockPostHog: {
    capture: vi.fn(),
    init: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock('posthog-js', () => ({ default: mockPostHog }));

import {
  initPostHog,
  isValidPostHogConfiguration,
  resetPostHogForTests,
  trackPostHogEvent,
  trackPostHogPageView,
} from './posthog';

describe('PostHog 익명 제품 분석', () => {
  afterEach(() => {
    resetPostHogForTests();
    vi.clearAllMocks();
  });

  it('유효한 토큰과 호스트로 세션 녹화 없이 안전하게 초기화한다', () => {
    expect(isValidPostHogConfiguration('', 'https://us.i.posthog.com')).toBe(false);
    expect(isValidPostHogConfiguration('phc_test', 'not-a-url')).toBe(false);
    expect(initPostHog('phc_test', 'https://us.i.posthog.com')).toBe(true);

    expect(mockPostHog.init).toHaveBeenCalledWith('phc_test', {
      api_host: 'https://us.i.posthog.com',
      autocapture: true,
      capture_pageview: false,
      disable_session_recording: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
  });

  it('초기화 이후에만 페이지와 이벤트를 기록하고 같은 경로는 중복 기록하지 않는다', () => {
    expect(trackPostHogPageView('/properties')).toBe(false);
    initPostHog('phc_test', 'https://us.i.posthog.com');

    expect(trackPostHogPageView('/properties')).toBe(true);
    expect(trackPostHogPageView('/properties')).toBe(false);
    expect(trackPostHogEvent('property_created', { count: 1 })).toBe(true);

    expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview', { path: '/properties' });
    expect(mockPostHog.capture).toHaveBeenCalledWith('property_created', { count: 1 });
  });
});
