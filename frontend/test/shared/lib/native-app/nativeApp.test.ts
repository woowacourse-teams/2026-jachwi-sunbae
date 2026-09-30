import { afterEach, describe, expect, it } from 'vitest';

import { hasNativeAppFeature, isRunningInNativeApp } from '@/shared/lib/native-app/nativeApp';

afterEach(() => {
  delete window.__JACHWI_NATIVE_APP__;
});

describe('isRunningInNativeApp', () => {
  it('네이티브 브리지가 주입되면 앱 환경으로 판별한다', () => {
    window.__JACHWI_NATIVE_APP__ = { platform: 'ios', version: 1 };
    expect(isRunningInNativeApp()).toBe(true);
  });

  it('일반 브라우저는 앱 환경으로 판별하지 않는다', () => {
    expect(isRunningInNativeApp()).toBe(false);
  });
});

describe('hasNativeAppFeature', () => {
  it('앱이 알려 준 기능만 지원한다고 판별한다', () => {
    window.__JACHWI_NATIVE_APP__ = { platform: 'ios', version: 2, features: ['tab-bar'] };
    expect(hasNativeAppFeature('tab-bar')).toBe(true);
  });

  it('기능 목록이 없는 구버전 앱은 지원하지 않는다고 판별한다', () => {
    window.__JACHWI_NATIVE_APP__ = { platform: 'ios', version: 1 };
    expect(hasNativeAppFeature('tab-bar')).toBe(false);
  });
});
