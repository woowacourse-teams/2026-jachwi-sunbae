import type { ChecklistPresetType, ChecklistStage } from '../types/Checklist';
import { CHECKLIST_STAGES, PRESET_TYPES } from '../types/Checklist';

/**
 * 사용자가 직접 만들고 관리하는 체크리스트는 현장 단계 하나만 제공한다.
 * 계약 전 단계는 매물 체크리스트 안의 '계약하러 가기'로 진입한다.
 */
export const USER_CHECKLIST_STAGE: ChecklistStage = 'ON_SITE';

/** 새 API가 제공하는 현장·계약 전 두 단계의 화면 문구다. */
export const checklistStageMeta: Record<ChecklistStage, { label: string; shortLabel: string; description: string }> = {
  ON_SITE: {
    label: '집에서 확인',
    shortLabel: '집에서 확인',
    description: '직접 방문해 채광, 소음과 시설 상태를 확인해요.',
  },
  PRE_CONTRACT: {
    label: '계약 전',
    shortLabel: '계약 전',
    description: '서명하기 전에 등기, 특약과 비용을 마지막으로 확인해요.',
  },
};

export const presetMeta: Record<ChecklistPresetType, { label: string; description: string }> = {
  ONE_ROOM: { label: '원룸', description: '일반적인 원룸을 확인할 때 필요한 항목이에요.' },
  GOSHIWON: { label: '고시원', description: '공용 시설과 생활 규칙까지 살펴보는 항목이에요.' },
};

export const isChecklistStage = (value: unknown): value is ChecklistStage =>
  typeof value === 'string' && CHECKLIST_STAGES.includes(value as ChecklistStage);

export const isChecklistPresetType = (value: unknown): value is ChecklistPresetType =>
  typeof value === 'string' && PRESET_TYPES.includes(value as ChecklistPresetType);
