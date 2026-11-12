import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  completeExploration,
  getExplorationRecordLocation,
  prepareExplorationRecord,
  startExploration,
  trackExplorationLogin,
} from '@/features/onboarding/lib/explorationJourney';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

vi.mock('@/shared/lib/analytics/posthog', () => ({ trackPostHogEvent: vi.fn() }));
const location = { latitude: 37.4, longitude: 127.1, address: '동네 주소', roadAddress: null, jibunAddress: null };
const STORAGE_KEY = 'jachwi.exploration-journey';
const storedJourney = { id: 'journey-1', mode: 'commute', createdAt: Date.now(), mock: true, completed: true };
beforeEach(() => {
  vi.mocked(trackPostHogEvent).mockClear();
  sessionStorage.clear();
});
afterEach(() => vi.useRealTimers());

it('완료 전에는 기록 CTA를 전환으로 집계하지 않는다', () => {
  startExploration('commute', true);
  prepareExplorationRecord(location);
  expect(getExplorationRecordLocation()).toBeUndefined();
  expect(trackPostHogEvent).toHaveBeenCalledTimes(1);
});
it('완료부터 로그인까지 같은 journey로 집계하며 개인정보를 보내지 않는다', () => {
  startExploration('price', true);
  completeExploration(3);
  completeExploration(3);
  prepareExplorationRecord(location);
  expect(getExplorationRecordLocation()).toEqual(location);
  trackExplorationLogin(true);
  const calls = vi.mocked(trackPostHogEvent).mock.calls;
  expect(calls.map(([event]) => event)).toEqual([
    'exploration_started',
    'exploration_completed',
    'exploration_record_cta_clicked',
    'exploration_login_completed',
  ]);
  expect(new Set(calls.map(([, properties]) => properties?.journey_id)).size).toBe(1);
  expect(JSON.stringify(calls)).not.toContain('동네 주소');
  expect(JSON.stringify(calls)).not.toContain('latitude');
});
it('30분 후에는 선택 위치를 로그인으로 넘기지 않는다', () => {
  vi.useFakeTimers();
  startExploration('commute', true);
  completeExploration(0);
  prepareExplorationRecord(location);
  vi.advanceTimersByTime(30 * 60 * 1000);
  expect(getExplorationRecordLocation()).toBeUndefined();
});
it('저장소가 차단돼도 현재 탭에서는 기록으로 이어간다', () => {
  const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  try {
    startExploration('price', true);
    completeExploration(2);
    prepareExplorationRecord(location);
    expect(getExplorationRecordLocation()).toEqual(location);
  } finally {
    read.mockRestore();
    write.mockRestore();
  }
});
it.each([
  ['문자열', '"journey"'],
  ['배열', '[]'],
  ['숫자 ID', JSON.stringify({ ...storedJourney, id: 1 })],
  ['모르는 mode', JSON.stringify({ ...storedJourney, mode: 'other' })],
  ['문자열 createdAt', JSON.stringify({ ...storedJourney, createdAt: String(Date.now()) })],
  ['문자열 completed', JSON.stringify({ ...storedJourney, completed: 'true' })],
  ['빠진 mock', JSON.stringify({ ...storedJourney, mock: undefined })],
])('저장된 값이 %s이면 여정이 없는 것으로 본다', (_label, stored) => {
  sessionStorage.setItem(STORAGE_KEY, stored);
  prepareExplorationRecord(location);
  trackExplorationLogin(false);
  expect(trackPostHogEvent).not.toHaveBeenCalled();
  expect(sessionStorage.getItem(STORAGE_KEY)).toBe(stored);
});
it('저장된 선택 위치의 형식이 다르면 위치만 버리고 여정은 이어간다', () => {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...storedJourney, converted: true, selectedLocation: { ...location, latitude: '37.4' } }),
  );
  expect(getExplorationRecordLocation()).toBeUndefined();
  trackExplorationLogin(true);
  expect(trackPostHogEvent).toHaveBeenCalledWith(
    'exploration_login_completed',
    expect.objectContaining({ journey_id: 'journey-1', new_member: true }),
  );
});
it('저장된 값의 형식이 맞으면 선택 위치를 그대로 돌려준다', () => {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...storedJourney, converted: true, selectedLocation: location }),
  );
  expect(getExplorationRecordLocation()).toEqual(location);
});
