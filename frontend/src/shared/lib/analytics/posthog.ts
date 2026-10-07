import { initPostHog as initializeClient, resetPostHogClientForTests } from './posthog/client';
import { resetPostHogPageView } from './posthog/events';
import { resetPostHogSessionState } from './posthog/session';

let configurationKey: string | null = null;

// 기존 호출부의 안정된 진입점. 구현 책임은 posthog/ 모듈에서 관리한다.
export { isValidPostHogConfiguration } from './posthog/configuration';
export { trackPostHogEvent, trackPostHogPageView } from './posthog/events';
export { capturePostHogException } from './posthog/exceptions';
export { getPostHogPlatform } from './posthog/platform';
export { identifyPostHogMember, resetPostHogIdentity, setPostHogSessionContext } from './posthog/session';
export type { PostHogErrorCategory, PostHogErrorSeverity } from './posthog/types';

export const initPostHog = (projectToken: string, host: string): boolean => {
  const isEnabled = initializeClient(projectToken, host);
  const nextKey = isEnabled ? `${host.trim().replace(/\/$/, '')}:${projectToken.trim()}` : null;
  if (configurationKey !== nextKey) {
    resetPostHogPageView();
    resetPostHogSessionState();
    configurationKey = nextKey;
  }
  return isEnabled;
};

export const resetPostHogForTests = (): void => {
  configurationKey = null;
  resetPostHogClientForTests();
  resetPostHogPageView();
  resetPostHogSessionState();
};
