import { HOME_PATH } from '@/shared/lib/navigation/appPaths';

import { getAnalyticsScreenRoute, getCurrentAnalyticsScreenRoute } from '../screenRoute';
import { markPostHogFirstListingCardShown } from './firstScreen';
import { getPostHogEventProperties, runPostHogAction } from './runtime';

export const FIRST_LISTING_CARD_EVENT = 'first_listing_card_visible';

const VISITED_STORAGE_KEY = 'jachwi-analytics-visited';
const EFFECTIVE_TYPES = ['slow-2g', '2g', '3g', '4g'] as const;

type VisitType = 'first' | 'returning';
let armed: { screenRoute: string; visitType: VisitType | null } | null = null;
let reported = false;

/** 이 브라우저가 전에 열어 본 적이 있는지. 값은 `1` 한 글자뿐이고 개인 정보는 없다. 저장소를 못 쓰면 알 수 없다. */
const readVisitType = (): VisitType | null => {
  try {
    const visited = window.localStorage.getItem(VISITED_STORAGE_KEY) === '1';
    if (!visited) window.localStorage.setItem(VISITED_STORAGE_KEY, '1');
    return visited ? 'returning' : 'first';
  } catch {
    return null;
  }
};

const readConnectionValue = (key: string): unknown => {
  const connection: unknown = Reflect.get(navigator, 'connection');
  return typeof connection === 'object' && connection !== null ? Reflect.get(connection, key) : undefined;
};

const finiteOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/** 지원하지 않는 브라우저(Safari, iOS 앱 WebView)는 모두 null이다. */
export const readNetworkConnection = () => {
  const effectiveType = readConnectionValue('effectiveType');
  return {
    connection_effective_type: EFFECTIVE_TYPES.find((type) => type === effectiveType) ?? null,
    connection_downlink: finiteOrNull(readConnectionValue('downlink')),
    connection_rtt: finiteOrNull(readConnectionValue('rtt')),
  };
};

/**
 * 첫 화면이 홈(`/`)일 때만 재기 시작한다. 재는 기준점이 처음 연 문서의 navigation start라서,
 * 앱 안에서 옮겨 온 화면은 이 값으로 잴 수 없다. 방문 구분은 이때 읽어 카드가 없던 방문도 다녀간 것으로 남긴다.
 */
export const startPostHogFirstListingCardTiming = (): void => {
  if (armed !== null || typeof window === 'undefined') return;
  const screenRoute = getAnalyticsScreenRoute(window.location.pathname);
  if (screenRoute !== HOME_PATH) return;
  armed = { screenRoute, visitType: readVisitType() };
};

/**
 * 첫 매물 카드의 썸네일이 그려진 순간을 한 번만 보낸다. 카드를 그리는 쪽이 이미지 `load`에서 부른다.
 * 홈을 떠났거나 탭이 가려져 있었다면 사용자가 본 시간이 아니므로 보내지 않는다.
 */
export const reportPostHogFirstListingCard = (): boolean => {
  if (armed === null || reported) return false;
  if (getCurrentAnalyticsScreenRoute() !== armed.screenRoute || document.visibilityState !== 'visible') return false;
  reported = true;
  const properties = getPostHogEventProperties({
    time_ms: Math.round(performance.now()),
    screen_route: armed.screenRoute,
    visit_type: armed.visitType,
    ...readNetworkConnection(),
  });
  const accepted = runPostHogAction((client) => client.capture(FIRST_LISTING_CARD_EVENT, properties));
  // 카드 시간을 큐에 넣은 뒤에 SDK를 받게 한다. 카드 이벤트가 SDK 받기 뒤로 밀려 순서가 바뀌지 않는다.
  markPostHogFirstListingCardShown();
  return accepted;
};

export const resetPostHogFirstListingCardForTests = (): void => {
  armed = null;
  reported = false;
};
