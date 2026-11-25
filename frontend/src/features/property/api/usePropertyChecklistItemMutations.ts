import { useMutation } from '@tanstack/react-query';

import { isApiErrorCode } from '@/features/auth/api/apiClient';
import { queryClient } from '@/shared/api/queryClient';
import { usePublicConfig } from '@/shared/config/PublicConfigContext';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

import { rememberRecentEdit } from '../lib/recentEdit';
import type { PropertyChecklistDetail, PropertyChecklistItemStatus } from '../model/Property';
import { isPreviewProperty } from '../model/sampleProperties';
import { orPreview } from './previewPropertyApi';
import { updatePropertyChecklistItemMemo, updatePropertyChecklistItemStatus } from './propertyApi';
import { propertyQueryKeys } from './propertyQueryKeys';

const updateChecklistItem = (
  propertyId: number,
  propertyChecklistId: number,
  itemId: number,
  update: (item: PropertyChecklistDetail['items'][number]) => PropertyChecklistDetail['items'][number],
) => {
  queryClient.setQueryData<PropertyChecklistDetail>(
    propertyQueryKeys.checklist(propertyId, propertyChecklistId),
    (current) =>
      current === undefined
        ? current
        : { ...current, items: current.items.map((item) => (item.itemId === itemId ? update(item) : item)) },
  );
  rememberRecentEdit(propertyId, 'checklist');
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: propertyQueryKeys.checklists(propertyId), exact: true }),
    queryClient.invalidateQueries({ queryKey: propertyQueryKeys.lists() }),
  ]);
};

export const usePropertyChecklistItemStatusMutation = (propertyId: number, propertyChecklistId: number) => {
  const config = usePublicConfig();
  return useMutation({
    // 미리보기 매물은 서버에 보내지 않고 화면에서만 바꿔 본다.
    mutationFn: ({
      itemId,
      status,
      expectedVersion,
    }: {
      itemId: number;
      status: PropertyChecklistItemStatus;
      expectedVersion: number;
    }) =>
      orPreview(
        propertyId,
        () => ({ itemId, status, statusVersion: expectedVersion + 1 }),
        () =>
          updatePropertyChecklistItemStatus(config, propertyId, propertyChecklistId, itemId, status, expectedVersion),
      ),
    onError: (error) => refreshAfterConflict(error, propertyId, propertyChecklistId),
    onSuccess: ({ itemId, status, statusVersion }) => {
      const refresh = updateChecklistItem(propertyId, propertyChecklistId, itemId, (item) =>
        statusVersion < item.statusVersion ? item : { ...item, status, statusVersion },
      );
      if (status !== 'UNCONFIRMED' && !isPreviewProperty(propertyId)) {
        trackPostHogEvent('checklist_item_checked', {
          property_id: propertyId,
          property_checklist_id: propertyChecklistId,
          item_id: itemId,
          status,
        });
      }
      return refresh;
    },
  });
};

export const usePropertyChecklistItemMemoMutation = (propertyId: number, propertyChecklistId: number) => {
  const config = usePublicConfig();
  return useMutation({
    mutationFn: ({ itemId, memo, expectedVersion }: { itemId: number; memo: string; expectedVersion: number }) =>
      orPreview(
        propertyId,
        () => ({ itemId, memo, memoVersion: expectedVersion + 1 }),
        () => updatePropertyChecklistItemMemo(config, propertyId, propertyChecklistId, itemId, memo, expectedVersion),
      ),
    onError: (error) => refreshAfterConflict(error, propertyId, propertyChecklistId),
    onSuccess: ({ itemId, memo, memoVersion }) => {
      return updateChecklistItem(propertyId, propertyChecklistId, itemId, (item) =>
        memoVersion < item.memoVersion ? item : { ...item, memo, memoVersion },
      );
    },
  });
};

const refreshAfterConflict = (error: unknown, propertyId: number, propertyChecklistId: number) => {
  if (!isApiErrorCode(error, 'PROPERTY_CHECKLIST_ITEM_CONFLICT')) return;
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: propertyQueryKeys.checklist(propertyId, propertyChecklistId),
      exact: true,
    }),
    queryClient.invalidateQueries({ queryKey: propertyQueryKeys.checklists(propertyId), exact: true }),
    queryClient.invalidateQueries({ queryKey: propertyQueryKeys.lists() }),
  ]);
};
