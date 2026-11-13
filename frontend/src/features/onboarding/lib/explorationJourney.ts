import type { MapAddress } from '@/features/map/model/Map';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

type Journey = {
  id: string;
  mode: 'commute' | 'price';
  createdAt: number;
  mock: boolean;
  completed: boolean;
  converted?: boolean;
  selectedLocation?: MapAddress;
};
const KEY = 'jachwi.exploration-journey';
let memoryJourney: Journey | null = null;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const parseSelectedLocation = (value: unknown): MapAddress | undefined => {
  if (!isRecord(value)) return undefined;
  const { address, roadAddress, jibunAddress, latitude, longitude } = value;
  return isNullableString(address) &&
    isNullableString(roadAddress) &&
    isNullableString(jibunAddress) &&
    typeof latitude === 'number' &&
    typeof longitude === 'number'
    ? { address, roadAddress, jibunAddress, latitude, longitude }
    : undefined;
};
/** 저장소 값은 타입을 믿을 수 없으므로 unknown으로 받아 필드마다 확인한다. 필수 값의 형식이 다르면 여정이 없는 것으로 본다. */
const parseJourney = (value: unknown): Journey | null => {
  if (!isRecord(value)) return null;
  const { id, mode, createdAt, mock, completed } = value;
  if (
    typeof id !== 'string' ||
    (mode !== 'commute' && mode !== 'price') ||
    typeof createdAt !== 'number' ||
    typeof mock !== 'boolean' ||
    typeof completed !== 'boolean'
  )
    return null;
  // 선택 위치의 형식이 다르면 위치만 버리고 여정은 이어간다.
  const selectedLocation = parseSelectedLocation(value.selectedLocation);
  return {
    id,
    mode,
    createdAt,
    mock,
    completed,
    ...(value.converted === true ? { converted: true } : {}),
    ...(selectedLocation ? { selectedLocation } : {}),
  };
};
const read = (): Journey | null => {
  try {
    const journey = parseJourney(JSON.parse(sessionStorage.getItem(KEY) ?? 'null'));
    return journey && Date.now() - journey.createdAt >= 0 && Date.now() - journey.createdAt < 30 * 60 * 1000
      ? journey
      : null;
  } catch {
    return memoryJourney && Date.now() - memoryJourney.createdAt < 30 * 60 * 1000 ? memoryJourney : null;
  }
};
const write = (value: Journey) => {
  memoryJourney = value;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* 저장소가 차단되면 현재 탭의 메모리로 이어간다. */
  }
};
const capture = (event: string, journey: Journey, extra: Record<string, unknown> = {}) =>
  trackPostHogEvent(event, {
    journey_id: journey.id,
    exploration_mode: journey.mode,
    source: 'landing',
    mock_data: journey.mock,
    ...extra,
  });
export const startExploration = (mode: Journey['mode'], mock: boolean) => {
  const journey: Journey = { id: crypto.randomUUID(), mode, mock, createdAt: Date.now(), completed: false };
  write(journey);
  capture('exploration_started', journey);
};
export const completeExploration = (count: number) => {
  const journey = read();
  if (!journey || journey.completed) return;
  write({ ...journey, completed: true });
  capture('exploration_completed', journey, { result_count: count });
};
export const prepareExplorationRecord = (selectedLocation: MapAddress) => {
  const journey = read();
  if (!journey?.completed) return;
  write({ ...journey, converted: true, selectedLocation });
  capture('exploration_record_cta_clicked', journey);
};
export const getExplorationRecordLocation = () => {
  const journey = read();
  const value = journey?.converted ? journey.selectedLocation : undefined;
  return value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) ? value : undefined;
};
export const trackExplorationLogin = (newMember: boolean) => {
  const journey = read();
  if (journey?.converted) capture('exploration_login_completed', journey, { new_member: newMember });
};
