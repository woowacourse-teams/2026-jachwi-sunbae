import { useMutation } from '@tanstack/react-query';

import { propertyQueryKeys } from '@/features/property/api/propertyQueryKeys';
import { queryClient } from '@/shared/api/queryClient';
import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import { toProvidedChecklistItemInputs } from '../lib/checklistEditor';
import type { ChecklistStage } from '../model/checklistTypes';
import type { ChecklistDraftInput } from '../model/useChecklistDraft';
import { assignActiveChecklist, createChecklistV11, removeChecklist, updateChecklistV11 } from './checklistApi';
import { checklistQueryKeys } from './checklistQueryKeys';

const invalidateChecklistAggregates = async () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: checklistQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: checklistQueryKeys.details() }),
  ]);

export const useCreateChecklist = () => {
  const config = usePublicConfig();
  return useMutation({
    mutationFn: ({ name, stage, items }: ChecklistDraftInput & { stage: ChecklistStage }) =>
      createChecklistV11(config, { name, stage, items: toProvidedChecklistItemInputs(items) }),
    retry: false,
    onSuccess: async (detail) => {
      queryClient.setQueryData(checklistQueryKeys.detail(detail.checklistId), detail);
      await queryClient.invalidateQueries({ queryKey: checklistQueryKeys.lists() });
    },
  });
};

export const useUpdateChecklist = (checklistId: number) => {
  const config = usePublicConfig();
  return useMutation({
    mutationFn: ({ name, items }: ChecklistDraftInput) =>
      updateChecklistV11(config, checklistId, { name, items: toProvidedChecklistItemInputs(items) }),
    retry: false,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: checklistQueryKeys.detail(checklistId), exact: true });
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(checklistQueryKeys.detail(checklistId), detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: checklistQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: propertyQueryKeys.details() }),
      ]);
    },
  });
};

export const useRemoveChecklist = (checklistId: number) => {
  const config = usePublicConfig();
  return useMutation({
    mutationFn: () => removeChecklist(config, checklistId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: checklistQueryKeys.detail(checklistId), exact: true });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: checklistQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: propertyQueryKeys.details() }),
      ]);
      queryClient.removeQueries({ queryKey: checklistQueryKeys.detail(checklistId), exact: true });
    },
  });
};

export const useAssignActiveChecklist = (propertyId: number, stage: ChecklistStage) => {
  const config = usePublicConfig();
  return useMutation({
    mutationFn: (checklistId: number | 'SYSTEM_DEFAULT') =>
      assignActiveChecklist(
        config,
        propertyId,
        stage,
        checklistId === 'SYSTEM_DEFAULT'
          ? { sourceType: 'SYSTEM_DEFAULT', checklistId: null }
          : { sourceType: 'USER', checklistId },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: propertyQueryKeys.detail(propertyId), exact: true }),
        queryClient.invalidateQueries({ queryKey: propertyQueryKeys.checklists(propertyId), exact: true }),
        queryClient.invalidateQueries({ queryKey: propertyQueryKeys.lists() }),
        invalidateChecklistAggregates(),
      ]);
    },
  });
};
