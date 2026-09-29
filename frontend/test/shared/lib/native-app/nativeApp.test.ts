import { afterEach, describe, expect, it } from 'vitest';
import { isRunningInNativeApp } from '../../../../src/shared/lib/native-app/nativeApp';

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
