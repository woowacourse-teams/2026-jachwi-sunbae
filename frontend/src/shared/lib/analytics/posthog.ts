// 호출부는 SDK 상태를 모르고 이 진입점만 사용한다.
export { isValidPostHogConfiguration } from './posthog/configuration';
export { startPostHogEarlyErrorCapture } from './posthog/earlyErrors';
export { capturePostHogException } from './posthog/exceptions';
export { getPostHogPlatform } from './posthog/platform';
export {
  getPostHogDiagnostics,
  holdPostHogSdkLoadUntil,
  identifyPostHogMember,
  initPostHog,
  resetPostHogClientForTests as resetPostHogForTests,
  resetPostHogIdentity,
  setPostHogSessionContext,
  setPostHogAuthenticationReader,
  trackPostHogEvent,
  trackPostHogOutboundEvent,
  trackPostHogPageView,
} from './posthog/runtime';
export { waitForPostHogFirstScreen } from './posthog/firstScreen';
export { reportPostHogFirstListingCard, startPostHogFirstListingCardTiming } from './posthog/firstListingCard';
export { startPostHogWebVitals } from './posthog/webVitals';
export type { PostHogErrorCategory, PostHogErrorSeverity } from './posthog/types';
