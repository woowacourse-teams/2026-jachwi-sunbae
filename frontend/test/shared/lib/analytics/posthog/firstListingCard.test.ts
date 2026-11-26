import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPostHog } = vi.hoisted(() => ({
  mockPostHog: { capture: vi.fn(), register: vi.fn(), init: vi.fn() },
}));

vi.mock('posthog-js', () => ({ default: mockPostHog }));

import { createMapMarkerElement } from '@/features/map/ui/map-marker/MapMarkerView';
import { PROPERTY_PLACEHOLDER } from '@/shared/assets/propertyImageAssets';
import {
  initPostHog,
  reportPostHogFirstListingCard,
  resetPostHogForTests,
  setPostHogSessionContext,
  startPostHogFirstListingCardTiming,
} from '@/shared/lib/analytics/posthog';
import {
  FIRST_LISTING_CARD_EVENT,
  resetPostHogFirstListingCardForTests,
} from '@/shared/lib/analytics/posthog/firstListingCard';

const photoMarker = (photo: string) => ({
  id: '1',
  latitude: 37.5,
  longitude: 127,
  label: '방',
  summary: { amount: '월세 50' },
  tone: 'property' as const,
  photo,
});

const setConnection = (value: unknown) => Object.defineProperty(navigator, 'connection', { value, configurable: true });

const sentEvents = () => mockPostHog.capture.mock.calls.filter(([name]) => name === FIRST_LISTING_CARD_EVENT);

describe('첫 매물 카드 노출 시간', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    window.localStorage.clear();
    initPostHog('phc_test', 'https://us.i.posthog.com');
    setPostHogSessionContext({ environment: 'production', app_version: '1.0.0', platform: 'web' });
  });

  afterEach(() => {
    resetPostHogForTests();
    resetPostHogFirstListingCardForTests();
    Reflect.deleteProperty(navigator, 'connection');
    vi.clearAllMocks();
  });

  it('썸네일이 그려진 첫 순간에 한 번만 시간과 회선, 방문 구분을 보낸다', async () => {
    setConnection({ effectiveType: '3g', downlink: 1.4, rtt: 300 });
    startPostHogFirstListingCardTiming();
    const element = createMapMarkerElement(photoMarker('blob:thumbnail'), null);
    const image = element.querySelector('img');

    image?.dispatchEvent(new Event('load'));
    image?.dispatchEvent(new Event('load'));
    createMapMarkerElement(photoMarker('blob:second'), null).querySelector('img')?.dispatchEvent(new Event('load'));

    await vi.waitFor(() => expect(sentEvents()).toHaveLength(1));
    const [, properties] = sentEvents()[0];
    expect(properties).toMatchObject({
      screen_route: '/',
      platform: 'web',
      visit_type: 'first',
      connection_effective_type: '3g',
      connection_downlink: 1.4,
      connection_rtt: 300,
    });
    expect(Number.isInteger(properties.time_ms)).toBe(true);
    expect(properties.time_ms).toBeGreaterThanOrEqual(0);
  });

  it('회선 정보를 지원하지 않으면 null이고, 다음 방문은 재방문으로 구분한다', async () => {
    startPostHogFirstListingCardTiming();
    resetPostHogFirstListingCardForTests();
    startPostHogFirstListingCardTiming();

    reportPostHogFirstListingCard();

    await vi.waitFor(() => expect(sentEvents()).toHaveLength(1));
    expect(sentEvents()[0][1]).toMatchObject({
      visit_type: 'returning',
      connection_effective_type: null,
      connection_downlink: null,
      connection_rtt: null,
    });
  });

  it('카드가 없으면 보내지 않는다', () => {
    startPostHogFirstListingCardTiming();

    expect(sentEvents()).toHaveLength(0);
    expect(mockPostHog.capture).not.toHaveBeenCalled();
  });

  it('기본 집 이미지만 그려진 카드는 첫 매물 카드로 세지 않는다', () => {
    startPostHogFirstListingCardTiming();
    const image = createMapMarkerElement(photoMarker(PROPERTY_PLACEHOLDER.src2x), null).querySelector('img');

    image?.dispatchEvent(new Event('load'));

    expect(sentEvents()).toHaveLength(0);
  });

  it('홈이 아닌 화면에서 연 방문과 홈을 떠난 뒤에는 보내지 않는다', () => {
    window.history.replaceState(null, '', '/neighborhoods');
    startPostHogFirstListingCardTiming();
    expect(reportPostHogFirstListingCard()).toBe(false);

    resetPostHogFirstListingCardForTests();
    window.history.replaceState(null, '', '/');
    startPostHogFirstListingCardTiming();
    window.history.replaceState(null, '', '/neighborhoods');
    expect(reportPostHogFirstListingCard()).toBe(false);
    expect(sentEvents()).toHaveLength(0);
  });
});
