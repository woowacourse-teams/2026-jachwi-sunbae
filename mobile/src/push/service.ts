import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  deleteToken,
  getMessaging,
  getToken,
  hasPermission,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  requestPermission,
  setAutoInitEnabled,
  subscribeToTopic,
  unsubscribeFromTopic,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { createPushController } from './controller';
import { tracePushStep } from './diagnostics';

const CHOICE_KEY = '@jachwi/push/choice-v1';
const REGISTERED_KEY = '@jachwi/push/registered-v1';
// 공개 서비스 안내만 허용한다. 개인 정보·개인 매물 알림에는 토픽을 사용하지 않는다.
export const PUSH_TOPIC = __DEV__
  ? 'jachwi-service-dev'
  : 'jachwi-service-prod';
export const getConfiguredMessaging = () =>
  getApps().length ? getMessaging() : null;

export const createNativePush = () => {
  const messaging = getConfiguredMessaging();
  if (!messaging) return null;
  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      return (
        Number(Platform.Version) < 33 ||
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )
      );
    }
    const permission = await hasPermission(messaging);
    return (
      permission === AuthorizationStatus.AUTHORIZED ||
      permission === AuthorizationStatus.PROVISIONAL
    );
  };
  return createPushController({
    getChoice: () => AsyncStorage.getItem(CHOICE_KEY),
    setChoice: value =>
      tracePushStep('save-choice', () => AsyncStorage.setItem(CHOICE_KEY, value)),
    hasPermission: checkPermission,
    requestPermission: () =>
      tracePushStep('permission', async () => {
        if (Platform.OS === 'android') {
          return (
            Number(Platform.Version) < 33 ||
            (await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            )) === PermissionsAndroid.RESULTS.GRANTED
          );
        }
        await requestPermission(messaging, {
          alert: true,
          badge: true,
          sound: true,
        });
        return checkPermission();
      }),
    register: async () => {
      await tracePushStep('auto-init', () => setAutoInitEnabled(messaging, true));
      if (Platform.OS === 'ios') {
        await tracePushStep('apns-registration', async () => {
          if (!isDeviceRegisteredForRemoteMessages(messaging)) {
            await registerDeviceForRemoteMessages(messaging);
          }
        });
      }
      const token = await tracePushStep('fcm-token', () => getToken(messaging));
      await tracePushStep('save-registration', () =>
        AsyncStorage.setItem(REGISTERED_KEY, 'yes'),
      );
      return token;
    },
    subscribe: () =>
      tracePushStep('topic-subscription', () =>
        subscribeToTopic(messaging, PUSH_TOPIC),
      ),
    unregister: async () => {
      await setAutoInitEnabled(messaging, false);
      // 동의한 적 없는 최초 실행에서는 토큰을 새로 만들지 않는다.
      if ((await AsyncStorage.getItem(REGISTERED_KEY)) === 'yes') {
        await unsubscribeFromTopic(messaging, PUSH_TOPIC);
        await deleteToken(messaging);
        await AsyncStorage.removeItem(REGISTERED_KEY);
      }
    },
  });
};
