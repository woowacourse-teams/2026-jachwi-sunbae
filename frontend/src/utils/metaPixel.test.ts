import { afterEach, describe, expect, it } from 'vitest';
import {
  grantMetaPixelConsent,
  resetMetaPixelForTests,
  revokeMetaPixelConsent,
  trackMetaPixelCompleteRegistration,
  trackMetaPixelFirstPropertyRecorded,
  trackMetaPixelPageView,
} from './metaPixel';

type TestMetaPixelWindow = Window & {
  fbq?: { queue: unknown[][] };
};

const queuedCommands = (): unknown[][] => (window as TestMetaPixelWindow).fbq?.queue ?? [];

describe('Meta Pixel', () => {
  afterEach(() => resetMetaPixelForTests());

  it('유효한 공개 ID와 동의가 있을 때만 스크립트를 초기화한다', () => {
    expect(grantMetaPixelConsent('invalid')).toBe(false);
    expect(document.getElementById('meta-pixel-script')).toBeNull();

    expect(grantMetaPixelConsent('1591771152645660')).toBe(true);

    expect(document.getElementById('meta-pixel-script')).toHaveAttribute(
      'src',
      'https://connect.facebook.net/en_US/fbevents.js',
    );
    expect(queuedCommands()).toEqual([
      ['init', '1591771152645660'],
      ['consent', 'grant'],
    ]);
  });

  it('같은 경로의 중복 PageView는 막고 실제 전환 이벤트는 개인정보 없이 보낸다', () => {
    grantMetaPixelConsent('1591771152645660');

    expect(trackMetaPixelPageView('/intro')).toBe(true);
    expect(trackMetaPixelPageView('/intro')).toBe(false);
    expect(trackMetaPixelPageView('/login')).toBe(true);
    expect(trackMetaPixelCompleteRegistration()).toBe(true);
    expect(trackMetaPixelFirstPropertyRecorded()).toBe(true);

    expect(queuedCommands().slice(2)).toEqual([
      ['track', 'PageView'],
      ['track', 'PageView'],
      ['track', 'CompleteRegistration'],
      ['trackCustom', 'FirstPropertyRecorded'],
    ]);
  });

  it('동의를 철회하면 이후 이벤트를 보내지 않는다', () => {
    grantMetaPixelConsent('1591771152645660');
    revokeMetaPixelConsent();

    expect(trackMetaPixelPageView('/intro')).toBe(false);
    expect(trackMetaPixelCompleteRegistration()).toBe(false);
    expect(queuedCommands().at(-1)).toEqual(['consent', 'revoke']);
  });
});
