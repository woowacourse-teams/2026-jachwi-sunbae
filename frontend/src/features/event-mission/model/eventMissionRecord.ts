/**
 * 이벤트 미션 완료 기록. 짧은 오프라인 이벤트용이라 서버 없이 이 기기(localStorage)에 키 하나로 남긴다.
 * 회원과 상관없이 기기 기준이므로, 계정을 연결해 회원이 바뀌어도 기록이 그대로 이어진다.
 */
export const EVENT_MISSION_STEPS = [
  'neighborhood-search',
  'street-memo',
  'property-created',
  'checklist-item-checked',
  'checklist-created',
  'cheap-meals',
  'oauth-linked',
] as const;

export type EventMissionStep = (typeof EVENT_MISSION_STEPS)[number];

/** 단계마다 처음 완료한 시각(ms). 없는 단계는 아직 하지 않았다. */
export type EventMissionRecord = Partial<Record<EventMissionStep, number>>;

const STORAGE_KEY = 'jachwi:event-mission';

const listeners = new Set<() => void>();
const stepListeners = new Set<(step: EventMissionStep) => void>();

/** 저장된 원문. `useSyncExternalStore`가 값이 바뀌었는지 비교하는 데 쓴다. 저장소를 못 쓰면 기록이 없는 것으로 본다. */
export const readEventMissionRecordSnapshot = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** 형식이 다른 값은 버리고, 아는 단계의 시각만 남긴다. */
export const parseEventMissionRecord = (raw: string | null): EventMissionRecord => {
  if (raw === null) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return {};
    const record: EventMissionRecord = {};
    EVENT_MISSION_STEPS.forEach((step) => {
      const completedAt = (value as Record<string, unknown>)[step];
      if (typeof completedAt === 'number' && Number.isFinite(completedAt)) record[step] = completedAt;
    });
    return record;
  } catch {
    return {};
  }
};

export const readEventMissionRecord = (): EventMissionRecord =>
  parseEventMissionRecord(readEventMissionRecordSnapshot());

/** 단계를 완료했다고 남긴다. 이미 남긴 단계는 처음 시각을 그대로 둔다. */
export const recordEventMission = (step: EventMissionStep, now = Date.now()) => {
  const record = readEventMissionRecord();
  if (record[step] !== undefined) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...record, [step]: now }));
  } catch {
    // 저장소를 쓸 수 없으면 미션만 기록되지 않는다. 하던 기능은 막지 않는다.
    return;
  }
  listeners.forEach((listener) => listener());
  stepListeners.forEach((listener) => listener(step));
};

/** 이 탭에서 남긴 기록과 다른 탭이 남긴 기록(`storage` 이벤트)을 모두 알린다. */
export const subscribeEventMissionRecord = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

/** 이 탭에서 단계를 새로 남길 때마다 알린다. 미션 완료 토스트가 쓴다. */
export const subscribeEventMissionStepRecorded = (listener: (step: EventMissionStep) => void) => {
  stepListeners.add(listener);
  return () => {
    stepListeners.delete(listener);
  };
};
