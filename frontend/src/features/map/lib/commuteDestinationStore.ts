/**
 * 마지막으로 동네 찾기를 한 출퇴근 장소를 기억한다.
 * 본 방 기록은 이 장소로 매물마다 통근 시간을 보여 준다. 기기에만 두고 서버로 보내지 않는다.
 */
const STORAGE_KEY = 'jachwi-sunbae:commute-destination';

export type CommuteDestination = { latitude: number; longitude: number; name: string };

const isCoordinate = (value: unknown, limit: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;

export const readCommuteDestination = (): CommuteDestination | null => {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (typeof value !== 'object' || value === null) return null;
    const { latitude, longitude, name } = value as Record<string, unknown>;
    if (!isCoordinate(latitude, 90) || !isCoordinate(longitude, 180) || typeof name !== 'string') return null;
    return { latitude, longitude, name };
  } catch {
    // 저장소를 막아 둔 브라우저나 깨진 값은 장소가 없는 것으로 본다.
    return null;
  }
};

export const writeCommuteDestination = (destination: CommuteDestination): void => {
  try {
    const { latitude, longitude, name } = destination;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ latitude, longitude, name }));
  } catch {
    /* 기억하지 못해도 동네 찾기는 그대로 이어간다. */
  }
};
