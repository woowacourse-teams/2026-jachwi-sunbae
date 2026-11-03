import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getToken,
  hasPermission,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  requestPermission,
  subscribeToTopic,
} from '@react-native-firebase/messaging';
import { tracePushStep } from '../src/push/diagnostics';
import { createNativePush } from '../src/push/service';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('@react-native-firebase/app', () => ({ getApps: () => [{}] }));
jest.mock('@react-native-firebase/messaging', () => ({
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  getMessaging: () => ({}),
  requestPermission: jest.fn(),
  hasPermission: jest.fn(),
  setAutoInitEnabled: jest.fn(),
  isDeviceRegisteredForRemoteMessages: jest.fn(),
  registerDeviceForRemoteMessages: jest.fn(),
  getToken: jest.fn(),
  subscribeToTopic: jest.fn(),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

let log: jest.SpyInstance;
beforeEach(() => {
  jest.resetAllMocks();
  Object.assign(globalThis, { __DEV__: true });
  log = jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.mocked(requestPermission).mockResolvedValue(1);
  jest.mocked(hasPermission).mockResolvedValue(1);
  jest.mocked(isDeviceRegisteredForRemoteMessages).mockReturnValue(false);
  jest.mocked(getToken).mockResolvedValue('private-test-token');
});
afterEach(() => {
  log.mockRestore();
  Object.assign(globalThis, { __DEV__: true });
});

it('실제 enable 순서를 기록하고 토큰과 저장 값은 출력하지 않는다', async () => {
  expect(await createNativePush()!.enable()).toBe('private-test-token');
  const stages = [
    'permission', 'auto-init', 'apns-registration', 'fcm-token',
    'save-registration', 'topic-subscription', 'save-choice',
  ];
  expect(log.mock.calls).toEqual([
    ['[push-debug] enable start'],
    ...stages.flatMap(stage => [
      [`[push-debug] ${stage} start`],
      [`[push-debug] ${stage} success`],
    ]),
    ['[push-debug] enable success'],
  ]);
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('@jachwi/push/choice-v1', 'enabled');
});

it.each([
  ['permission', requestPermission],
  ['apns-registration', registerDeviceForRemoteMessages],
  ['fcm-token', getToken],
  ['topic-subscription', subscribeToTopic],
] as const)('%s 실패의 안전한 코드만 기록하고 같은 오류를 전달한다', async (stage, fail) => {
  const error = {
    code: 'messaging/unknown', nativeErrorCode: 505,
    message: 'private-test-token', nativeErrorMessage: 'private-test-key',
    stack: 'private-test-stack', userInfo: { token: 'private-test-token' },
  };
  (fail as jest.Mock).mockRejectedValueOnce(error);
  await expect(createNativePush()!.enable()).rejects.toBe(error);
  expect(log.mock.calls.slice(-2)).toEqual([
    [`[push-debug] ${stage} failure code=messaging/unknown nativeCode=505`],
    ['[push-debug] enable failure code=messaging/unknown nativeCode=505'],
  ]);
  expect(JSON.stringify(log.mock.calls)).not.toContain('private-test');
  expect(AsyncStorage.setItem).not.toHaveBeenCalledWith('@jachwi/push/choice-v1', 'enabled');
});

it('이미 APNs에 등록된 기기를 다시 등록하지 않는다', async () => {
  jest.mocked(isDeviceRegisteredForRemoteMessages).mockReturnValue(true);
  await createNativePush()!.enable();
  expect(registerDeviceForRemoteMessages).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith('[push-debug] apns-registration success');
});

it('권한 거절은 denied로 기록하고 등록을 시작하지 않는다', async () => {
  jest.mocked(hasPermission).mockResolvedValue(0);
  expect(await createNativePush()!.enable()).toBeNull();
  expect(log).toHaveBeenCalledWith('[push-debug] permission denied');
  expect(log).toHaveBeenCalledWith('[push-debug] enable denied');
  expect(getToken).not.toHaveBeenCalled();
  expect(registerDeviceForRemoteMessages).not.toHaveBeenCalled();
});

it('허용하지 않은 코드 문자열과 nativeErrorCode도 숨긴다', async () => {
  const error = { code: 'private-test-key', nativeErrorCode: 'private-test-token' };
  await expect(tracePushStep('fcm-token', async () => { throw error; })).rejects.toBe(error);
  expect(log).toHaveBeenLastCalledWith('[push-debug] fcm-token failure code=unknown');
});

it('Release에서는 성공·실패 모두 출력하지 않고 반환·오류를 보존한다', async () => {
  Object.assign(globalThis, { __DEV__: false });
  expect(await createNativePush()!.enable()).toBe('private-test-token');
  const error = new Error('private-test-key');
  jest.mocked(getToken).mockRejectedValueOnce(error);
  await expect(createNativePush()!.enable()).rejects.toBe(error);
  expect(log).not.toHaveBeenCalled();
});

it('진단 출력 자체가 실패해도 반환·오류를 바꾸지 않는다', async () => {
  log.mockImplementation(() => { throw new Error('console unavailable'); });
  expect(await tracePushStep('fcm-token', async () => 'private-test-token')).toBe('private-test-token');
  const error = new Error('private-test-key');
  await expect(tracePushStep('fcm-token', async () => { throw error; })).rejects.toBe(error);
});
