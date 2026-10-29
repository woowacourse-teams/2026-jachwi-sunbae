import { afterEach, expect, it, vi } from 'vitest';

import { getAnalyticsTrafficContext } from '@/shared/lib/analytics/trafficContext';

afterEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

it('테스트 링크를 한 번 열면 다음 페이지에도 테스트 기기로 분류한다', () => {
  window.history.replaceState(null, '', '/?analytics_test=1');
  expect(getAnalyticsTrafficContext('production').traffic_type).toBe('test');
  window.history.replaceState(null, '', '/map');
  expect(getAnalyticsTrafficContext('production').traffic_type).toBe('test');
  window.history.replaceState(null, '', '/?analytics_test=0');
  expect(getAnalyticsTrafficContext('production').traffic_type).toBe('external');
});

it('개발 환경은 계정 등록 없이도 제외할 수 있다', () => {
  expect(getAnalyticsTrafficContext('development').traffic_type).toBe('development');
});

it('저장소가 차단되어도 현재 테스트 링크의 트래픽은 외부 유저로 분류하지 않는다', () => {
  window.history.replaceState(null, '', '/?analytics_test=1');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('storage blocked');
  });
  expect(getAnalyticsTrafficContext('production').traffic_type).toBe('test');
});

it('UT 참가자 링크를 한 번 열면 다음 페이지에도 참가자 번호를 싣고 0으로 지운다', () => {
  expect(getAnalyticsTrafficContext('production')).not.toHaveProperty('ut_session_id');
  window.history.replaceState(null, '', '/?ut_session_id=UT01-P01');
  expect(getAnalyticsTrafficContext('production').ut_session_id).toBe('UT01-P01');
  window.history.replaceState(null, '', '/cheap-meals');
  expect(getAnalyticsTrafficContext('production').ut_session_id).toBe('UT01-P01');
  window.history.replaceState(null, '', '/?ut_session_id=UT01-P02');
  expect(getAnalyticsTrafficContext('production').ut_session_id).toBe('UT01-P02');
  window.history.replaceState(null, '', '/?ut_session_id=0');
  expect(getAnalyticsTrafficContext('production')).not.toHaveProperty('ut_session_id');
});

it('형식에 맞지 않는 UT 참가자 값은 싣지 않는다', () => {
  window.history.replaceState(null, '', '/?ut_session_id=%ED%99%8D%EA%B8%B8%EB%8F%99%20010');
  expect(getAnalyticsTrafficContext('production')).not.toHaveProperty('ut_session_id');
});
