import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Alert, AppState, DevSettings } from 'react-native';
import { createNativePush } from '../src/push/service';
import { usePushNotifications } from '../src/push/usePushNotifications';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  DevSettings: { addMenuItem: jest.fn() },
  Linking: { openSettings: jest.fn() },
}));
jest.mock('../src/push/service', () => ({
  createNativePush: jest.fn(),
  getConfiguredMessaging: () => ({}),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getInitialNotification: async () => null,
  onMessage: () => jest.fn(),
  onNotificationOpenedApp: () => jest.fn(),
  onTokenRefresh: () => jest.fn(),
}));

const nativePush = {
  status: jest.fn(),
  token: jest.fn(),
  shouldPrompt: jest.fn(),
  defer: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  restore: jest.fn(),
};
const noop = () => {};
let push: ReturnType<typeof usePushNotifications>;
let root: ReactTestRenderer | undefined;
const Harness = () => {
  push = usePushNotifications(noop, noop);
  return null;
};
const mount = async () => {
  await act(async () => {
    root = create(<Harness />);
  });
};
const reopenPrompt = () => {
  const entry = jest.mocked(DevSettings.addMenuItem).mock.calls[0];
  expect(entry?.[0]).toBe('알림 받기 안내 다시 보기');
  entry[1]();
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(globalThis, { __DEV__: true });
  AppState.currentState = 'active';
  jest.mocked(createNativePush).mockReturnValue(nativePush);
  nativePush.shouldPrompt.mockResolvedValue(false);
  nativePush.restore.mockResolvedValue(null);
  nativePush.enable.mockResolvedValue('test-token');
});
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  Object.assign(globalThis, { __DEV__: true });
});

it('기존 선택 기록이 있어도 안내를 반복 표시하며 취소 시 선택·권한을 변경하지 않는다', async () => {
  await mount();
  await push.onLoad();
  expect(Alert.alert).not.toHaveBeenCalled();

  reopenPrompt();
  const buttons = jest.mocked(Alert.alert).mock.calls[0][2];
  expect(buttons?.find(button => button.text === '나중에')?.onPress).toBeUndefined();
  reopenPrompt();
  expect(Alert.alert).toHaveBeenCalledTimes(2);
  expect(nativePush.defer).not.toHaveBeenCalled();
  expect(nativePush.enable).not.toHaveBeenCalled();
  expect(nativePush.disable).not.toHaveBeenCalled();
});

it('다시 띄운 안내에서 알림 받기를 누르면 기존 권한 요청 흐름을 실행한다', async () => {
  await mount();
  reopenPrompt();
  const buttons = jest.mocked(Alert.alert).mock.calls[0][2];
  const accept = buttons?.find(button => button.text === '알림 받기');
  expect(accept?.onPress).toBeDefined();
  await act(async () => accept?.onPress?.());
  expect(nativePush.enable).toHaveBeenCalledTimes(1);
  expect(nativePush.defer).not.toHaveBeenCalled();
});

it('Release에서는 테스트 메뉴를 등록하지 않는다', async () => {
  Object.assign(globalThis, { __DEV__: false });
  await mount();
  expect(DevSettings.addMenuItem).not.toHaveBeenCalled();
});

it('첫 웹 로드의 자동 안내는 기존처럼 선택 기록을 저장하고 한 번 표시한다', async () => {
  nativePush.shouldPrompt.mockResolvedValue(true);
  await mount();
  await push.onLoad();
  await push.onLoad();
  expect(nativePush.defer).toHaveBeenCalledTimes(1);
  expect(Alert.alert).toHaveBeenCalledTimes(1);
});

it('백그라운드나 해제된 화면에서는 테스트 안내를 띄우지 않는다', async () => {
  await mount();
  AppState.currentState = 'background';
  reopenPrompt();
  AppState.currentState = 'active';
  await act(async () => root?.unmount());
  root = undefined;
  reopenPrompt();
  expect(Alert.alert).not.toHaveBeenCalled();
});
