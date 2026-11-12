import { useMemo, useSyncExternalStore } from 'react';

import {
  parseEventMissionRecord,
  readEventMissionRecordSnapshot,
  subscribeEventMissionRecord,
} from './eventMissionRecord';

/** 이 기기의 미션 기록. 다른 화면이나 다른 탭에서 단계를 남기면 다시 그린다. */
export const useEventMissionRecord = () => {
  const snapshot = useSyncExternalStore(subscribeEventMissionRecord, readEventMissionRecordSnapshot);
  return useMemo(() => parseEventMissionRecord(snapshot), [snapshot]);
};
