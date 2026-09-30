import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import type { ChecklistPresetType, ChecklistStage } from '../model/checklistTypes';
import { fetchCheckItems, fetchChecklistDetail, fetchChecklistPreset, fetchChecklists } from './checklistApi';
import { checklistQueryKeys } from './checklistQueryKeys';

export const useChecklistList = (stage: ChecklistStage) => {
  const config = usePublicConfig();
  return useInfiniteQuery({
    queryKey: checklistQueryKeys.list(stage),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => fetchChecklists(config, { stage, page: pageParam }, signal),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
};

export const useCheckItemSearch = (stage: ChecklistStage, query: string, enabled = true) => {
  const config = usePublicConfig();
  return useInfiniteQuery({
    queryKey: checklistQueryKeys.checkItems(stage, query),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => fetchCheckItems(config, { stage, query, page: pageParam }, signal),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled,
  });
};

export const useActiveCheckItems = (stage: ChecklistStage) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: checklistQueryKeys.activeCheckItems(stage),
    queryFn: ({ signal }) => fetchCheckItems(config, { stage, query: '', page: 0, size: 100 }, signal),
  });
};

export const useChecklistPreset = (stage: ChecklistStage, presetType: ChecklistPresetType, enabled: boolean) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: checklistQueryKeys.preset(stage, presetType),
    queryFn: ({ signal }) => fetchChecklistPreset(config, stage, presetType, signal),
    enabled,
  });
};

export const useChecklistDetail = (checklistId: number) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: checklistQueryKeys.detail(checklistId),
    queryFn: ({ signal }) => fetchChecklistDetail(config, checklistId, signal),
  });
};
