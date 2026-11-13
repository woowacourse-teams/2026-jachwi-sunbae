import { EVENT_MISSIONS, getEventMissionCompletedAt } from '@/features/event-mission/model/eventMissions';
import { useEventMissionRecord } from '@/features/event-mission/model/useEventMissionRecord';

/** 현황판에 그릴 미션 상태. 모두 이 기기에 남긴 기록으로만 판정한다. */
const useEventMissionBoard = () => {
  const record = useEventMissionRecord();

  const missions = EVENT_MISSIONS.map((mission) => ({
    mission,
    completedAt: getEventMissionCompletedAt(mission, record),
    steps: mission.steps.map(({ step, label }) => ({ step, label, isDone: record[step] !== undefined })),
  }));
  const completedTimes = missions.flatMap(({ completedAt }) => (completedAt === null ? [] : [completedAt]));
  const isAllCompleted = completedTimes.length === missions.length;

  return {
    missions,
    completedCount: completedTimes.length,
    totalCount: missions.length,
    /** 마지막 미션을 마친 시각. 다 마치기 전에는 `null`이다. */
    allCompletedAt: isAllCompleted ? Math.max(...completedTimes) : null,
  };
};

export type EventMissionBoardItem = ReturnType<typeof useEventMissionBoard>['missions'][number];

export default useEventMissionBoard;
