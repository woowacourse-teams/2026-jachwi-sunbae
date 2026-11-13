import { CHEAP_MEALS_PATH, MY_PATH, NEIGHBORHOODS_PATH, RECORDS_MAP_PATH } from '@/shared/lib/navigation/appPaths';

import type { EventMissionRecord, EventMissionStep } from './eventMissionRecord';

export type EventMission = {
  number: number;
  title: string;
  /** 제목 아래에 작게 붙는 예시. */
  hint?: string;
  /** 미션을 끝내려면 모두 해야 하는 단계. 둘 이상이면 카드에 단계별 진행을 보여 준다. */
  steps: readonly { step: EventMissionStep; label: string }[];
  /** 아직 하지 않은 미션 카드를 누르면 가는 화면. */
  to: string;
  actionLabel: string;
};

export const EVENT_MISSIONS: readonly EventMission[] = [
  {
    number: 1,
    title: '가장 가고 싶은 회사를 검색해 살 동네를 찾아보세요',
    steps: [{ step: 'neighborhood-search', label: '동네 찾기' }],
    to: NEIGHBORHOODS_PATH,
    actionLabel: '동네 찾기로 가기',
  },
  {
    number: 2,
    title: '현재 살고 있는 동네에 메모를 남겨 보세요',
    hint: '(예시: 맛집, 거리, 기억에 남는 장소 등)',
    steps: [{ step: 'street-memo', label: '거리 메모' }],
    to: RECORDS_MAP_PATH,
    actionLabel: '본 방 기록 지도로 가기',
  },
  {
    number: 3,
    title: '방을 등록하고, 체크리스트로 기록해 보세요',
    steps: [
      { step: 'property-created', label: '방 등록' },
      { step: 'checklist-item-checked', label: '체크리스트 기록' },
    ],
    to: RECORDS_MAP_PATH,
    actionLabel: '본 방 기록 지도로 가기',
  },
  {
    number: 4,
    title: '저렴한 한 끼를 둘러보세요',
    steps: [{ step: 'cheap-meals', label: '저렴한 한 끼' }],
    to: CHEAP_MEALS_PATH,
    actionLabel: '저렴한 한 끼로 가기',
  },
  {
    number: 5,
    title: '계정을 연동하고 선물 받아 보세요',
    steps: [{ step: 'oauth-linked', label: '계정 연결' }],
    to: MY_PATH,
    actionLabel: '마이에서 계정 연결하기',
  },
];

export const EVENT_PRIZE = { name: '오리 인형', count: 4 } as const;

/** 미션의 모든 단계를 마친 시각. 단계가 여럿이면 마지막 단계를 마친 시각이고, 하나라도 남았으면 `null`이다. */
export const getEventMissionCompletedAt = (mission: EventMission, record: EventMissionRecord): number | null => {
  const times = mission.steps.map(({ step }) => record[step]);
  if (times.some((time) => time === undefined)) return null;
  return Math.max(...(times as number[]));
};
