import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

// 화면 진입 로그는 UsageGuidePage가 공용 LogScreen으로 남긴다.

/** 자동 시연은 실제 기능 사용으로 수집하지 않는다. */
export const trackUsageGuideDemoInteraction = (action: 'mode', value: string) =>
  trackPostHogEvent('usage_guide_demo_interacted', { action, value });
