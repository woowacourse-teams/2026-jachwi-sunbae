import { capturePostHogException } from './exceptions';
import { isPostHogSdkReady } from './runtime';

let started = false;

const captureBeforeSdk = (error: unknown): void => {
  // SDK가 준비되면 SDK의 미처리 오류 수집(capture_exceptions)이 맡는다. 같은 오류를 두 번 보내지 않는다.
  if (isPostHogSdkReady()) return;
  capturePostHogException(error, { capture_timing: 'before_sdk' });
};

const onError = (event: ErrorEvent): void => {
  captureBeforeSdk(event.error ?? new Error(event.message));
};

const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
  captureBeforeSdk(event.reason);
};

/**
 * SDK를 첫 화면 뒤로 미루면 그사이 미처리 오류를 SDK가 듣지 못한다. 그동안은 직접 들어 큐에 넣고,
 * SDK가 준비된 뒤에는 아무것도 하지 않는다.
 */
export const startPostHogEarlyErrorCapture = (): void => {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
};

export const stopPostHogEarlyErrorCaptureForTests = (): void => {
  started = false;
  window.removeEventListener('error', onError);
  window.removeEventListener('unhandledrejection', onUnhandledRejection);
};
