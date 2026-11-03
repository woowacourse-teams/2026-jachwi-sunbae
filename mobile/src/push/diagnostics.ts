type PushStep =
  | 'enable'
  | 'permission'
  | 'auto-init'
  | 'apns-registration'
  | 'fcm-token'
  | 'save-registration'
  | 'topic-subscription'
  | 'save-choice';

// 임의 문자열은 코드 필드에 담겨 있어도 출력하지 않는다.
const SAFE_CODES = new Set([
  'messaging/unknown',
  'messaging/unregistered',
  'messaging/registration-timeout',
  'messaging/registration-superseded',
  'messaging/unavailable-in-extension',
  'messaging/unimplemented',
  'messaging/invalid-apns-token',
  'messaging/invalid-argument',
  'messaging/internal-error',
  'messaging/network-request-failed',
  'messaging/permission-denied',
  'messaging/too-many-requests',
]);
// FirebaseMessaging 및 iOS 네트워크/APNs의 알려진 숫자 코드만 허용한다.
const SAFE_NATIVE_CODES = new Set([
  0, 1, 4, 6, 7, 8, 501, 502, 503, 504, 505, 506,
  1001, 1003, 1004, 1005, 2001, 3000, 3005, 3010,
  -1001, -1003, -1004, -1005, -1009, -1200, -1202,
]);

const logStep = (
  step: PushStep,
  status: 'start' | 'success' | 'denied' | 'failure',
  error?: unknown,
) => {
  if (!__DEV__) return;
  try {
    let suffix = '';
    if (status === 'failure') {
      const details = error as { code?: unknown; nativeErrorCode?: unknown } | null;
      const code = details?.code;
      const nativeCode = details?.nativeErrorCode;
      suffix = ` code=${typeof code === 'string' && SAFE_CODES.has(code) ? code : 'unknown'}`;
      if (typeof nativeCode === 'number' && SAFE_NATIVE_CODES.has(nativeCode)) {
        suffix += ` nativeCode=${nativeCode}`;
      }
    }
    console.info(`[push-debug] ${step} ${status}${suffix}`);
  } catch {
    // 진단 출력이나 오류 속성 접근 실패가 기존 푸시 흐름을 바꾸지 않는다.
  }
};

export const tracePushStep = async <T>(
  step: PushStep,
  work: () => Promise<T>,
): Promise<T> => {
  if (!__DEV__) return work();
  logStep(step, 'start');
  try {
    const result = await work();
    const denied =
      (step === 'permission' && result === false) ||
      (step === 'enable' && result === null);
    logStep(step, denied ? 'denied' : 'success');
    return result;
  } catch (error) {
    logStep(step, 'failure', error);
    throw error;
  }
};
