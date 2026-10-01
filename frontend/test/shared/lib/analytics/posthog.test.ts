import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockPostHog } = vi.hoisted(() => ({
  mockPostHog: {
    capture: vi.fn(),
    captureException: vi.fn(),
    register: vi.fn(),
    identify: vi.fn(),
    init: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock('posthog-js', () => ({ default: mockPostHog }));

import {
  capturePostHogException,
  identifyPostHogMember,
  initPostHog,
  isValidPostHogConfiguration,
  resetPostHogForTests,
  resetPostHogIdentity,
  setPostHogSessionContext,
  trackPostHogEvent,
  trackPostHogPageView,
} from '@/shared/lib/analytics/posthog';

describe('PostHog 제품 분석', () => {
  afterEach(() => {
    resetPostHogForTests();
    vi.clearAllMocks();
  });

  it('유효한 토큰과 호스트로 세션 녹화 및 마스킹과 함께 초기화한다', async () => {
    expect(isValidPostHogConfiguration('', 'https://us.i.posthog.com')).toBe(false);
    expect(isValidPostHogConfiguration('phc_test', 'not-a-url')).toBe(false);
    expect(initPostHog('phc_test', 'https://us.i.posthog.com')).toBe(true);

    await vi.waitFor(() => {
      expect(mockPostHog.init).toHaveBeenCalledWith('phc_test', {
        api_host: 'https://us.i.posthog.com',
        autocapture: true,
        capture_exceptions: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
        },
        before_send: expect.any(Function),
        capture_pageview: false,
        disable_session_recording: false,
        mask_all_text: true,
        mask_all_element_attributes: true,
      });
    });
  });

  it('초기화 이후에만 페이지와 이벤트를 기록하고 같은 경로는 중복 기록하지 않는다', async () => {
    expect(trackPostHogPageView('/properties')).toBe(false);
    initPostHog('phc_test', 'https://us.i.posthog.com');

    expect(trackPostHogPageView('/properties')).toBe(true);
    expect(trackPostHogPageView('/properties')).toBe(false);
    expect(trackPostHogEvent('property_created', { count: 1 })).toBe(true);

    await vi.waitFor(() => {
      expect(mockPostHog.capture).toHaveBeenCalledWith('$pageview', { path: '/properties' });
      expect(mockPostHog.capture).toHaveBeenCalledWith('property_created', { count: 1 });
    });
  });

  it('예외를 Error Tracking 이벤트로 전송한다', async () => {
    const error = new Error('request failed');
    expect(capturePostHogException(error, { source: 'api_request' })).toBe(false);

    initPostHog('phc_test', 'https://us.i.posthog.com');
    expect(capturePostHogException(error, { source: 'api_request' })).toBe(true);

    await vi.waitFor(() => {
      expect(mockPostHog.captureException).toHaveBeenCalledWith(error, { source: 'api_request' });
    });
  });

  it('세션 환경과 버전 정보를 공통 속성으로 등록한다', async () => {
    initPostHog('phc_test', 'https://us.i.posthog.com');
    expect(
      setPostHogSessionContext({
        environment: 'production',
        app_version: '1.1.1',
        platform: 'ios_webview',
      }),
    ).toBe(true);

    await vi.waitFor(() => {
      expect(mockPostHog.register).toHaveBeenCalledWith({
        environment: 'production',
        app_version: '1.1.1',
        platform: 'ios_webview',
      });
    });
  });

  it('회원 식별과 초기화를 수행한다', async () => {
    expect(identifyPostHogMember(12, '자취선배1')).toBe(false);
    initPostHog('phc_test', 'https://us.i.posthog.com');

    expect(identifyPostHogMember(12, '자취선배1')).toBe(true);
    await vi.waitFor(() => {
      expect(mockPostHog.identify).toHaveBeenCalledWith('member-12', {
        name: '자취선배1',
        nickname: '자취선배1',
      });
    });

    resetPostHogIdentity();
    await vi.waitFor(() => expect(mockPostHog.reset).toHaveBeenCalledOnce());
  });
});
