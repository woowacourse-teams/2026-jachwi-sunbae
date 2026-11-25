import { http } from 'msw';

import { CHECKLIST_STAGES } from '@/features/checklist/model/checklistTypes';
import { readRecord } from '@/shared/api/responseParsers';

import {
  emptyProgress,
  failure,
  getMockAppliedByProperty,
  getMockChecklists,
  getProperty,
  obsoleteEndpoint,
  progressFromItems,
  propertyProgress,
  readPositiveInteger,
  readStage,
  setMockAppliedByProperty,
  success,
  takeNextAppliedChecklistId,
  takeNextAppliedItemId,
} from '../mockStore';

export const propertyChecklistHandlers = [
  http.get('*/api/properties/:propertyId/checklists', ({ params }) => {
    const property = getProperty(params.propertyId);
    if (property === undefined) return failure('PROPERTY_NOT_FOUND', 404);
    const applied = getMockAppliedByProperty().get(property.id) ?? new Map();
    const stages = CHECKLIST_STAGES.map((stage) => {
      const checklist = applied.get(stage);
      return {
        stage,
        applied: checklist !== undefined,
        propertyChecklistId: checklist?.id ?? null,
        checklistName: checklist?.checklistName ?? null,
        sourceChecklistId: checklist?.sourceChecklistId ?? null,
        progress: checklist === undefined ? emptyProgress : progressFromItems(checklist.items),
      };
    });
    return success({ propertyId: property.id, overallProgress: propertyProgress(property.id), stages });
  }),
  http.put('*/api/properties/:propertyId/checklists/:stage', async ({ params, request }) => {
    const property = getProperty(params.propertyId);
    const stage = readStage(params.stage);
    const body = (await request.json()) as { checklistId?: unknown };
    const isSystemDefault = body.checklistId === null || body.checklistId === undefined;
    const source = isSystemDefault
      ? getMockChecklists().find((checklist) => checklist.stage === stage)
      : getMockChecklists().find((checklist) => checklist.id === body.checklistId);
    if (property === undefined) return failure('PROPERTY_NOT_FOUND', 404);
    if (stage === null || source === undefined) return failure('CHECKLIST_NOT_FOUND', 404);
    if (source.stage !== stage) return failure('CHECKLIST_STAGE_MISMATCH', 400);
    const previous = getMockAppliedByProperty().get(property.id)?.get(stage);
    const previousBySource = new Map(
      previous?.items.map((item) => [
        item.systemCheckItemId === null ? `CUSTOM:${item.question}` : `SYSTEM:${item.systemCheckItemId}`,
        item,
      ]) ?? [],
    );
    const applied = {
      id: previous?.id ?? takeNextAppliedChecklistId(),
      propertyId: property.id,
      sourceChecklistId: isSystemDefault ? null : source.id,
      checklistName: source.name,
      stage,
      items: source.items.map((item, index) => {
        const sourceKey =
          item.systemCheckItemId === null ? `CUSTOM:${item.question}` : `SYSTEM:${item.systemCheckItemId}`;
        const previousItem = previousBySource.get(sourceKey);
        return {
          id: takeNextAppliedItemId(),
          systemCheckItemId: item.systemCheckItemId,
          question: item.question,
          displayOrder: index + 1,
          status: previousItem?.status ?? ('UNCONFIRMED' as const),
          memo: previousItem?.memo ?? '',
          statusVersion: 0,
          memoVersion: 0,
        };
      }),
    };
    const propertyChecklists = new Map(getMockAppliedByProperty().get(property.id) ?? []).set(stage, applied);
    setMockAppliedByProperty(new Map(getMockAppliedByProperty()).set(property.id, propertyChecklists));
    return success(applied);
  }),
  http.get('*/api/properties/:propertyId/checklists/:propertyChecklistId', ({ params }) => {
    const property = getProperty(params.propertyId);
    const propertyChecklistId = readPositiveInteger(params.propertyChecklistId);
    if (property === undefined || propertyChecklistId === null) return failure('PROPERTY_CHECKLIST_NOT_FOUND', 404);
    const checklist = Array.from(getMockAppliedByProperty().get(property.id)?.values() ?? []).find(
      (candidate) => candidate.id === propertyChecklistId,
    );
    return checklist === undefined ? failure('PROPERTY_CHECKLIST_NOT_FOUND', 404) : success(checklist);
  }),
  http.patch(
    '*/api/properties/:propertyId/checklists/:propertyChecklistId/items/:itemId/status',
    async ({ params, request }) => {
      const property = getProperty(params.propertyId);
      const propertyChecklistId = readPositiveInteger(params.propertyChecklistId);
      const itemId = readPositiveInteger(params.itemId);
      const body = readRecord(await request.json());
      if (property === undefined || propertyChecklistId === null || itemId === null) {
        return failure('PROPERTY_CHECKLIST_ITEM_NOT_FOUND', 404);
      }
      const checklist = Array.from(getMockAppliedByProperty().get(property.id)?.values() ?? []).find(
        (candidate) => candidate.id === propertyChecklistId,
      );
      const item = checklist?.items.find((candidate) => candidate.id === itemId);
      if (
        item === undefined ||
        (body.status !== 'UNCONFIRMED' && body.status !== 'GOOD' && body.status !== 'CAUTION')
      ) {
        return failure(item === undefined ? 'PROPERTY_CHECKLIST_ITEM_NOT_FOUND' : 'INVALID_REQUEST', item ? 400 : 404);
      }
      if (
        !Number.isSafeInteger(body.expectedVersion) ||
        typeof body.expectedVersion !== 'number' ||
        body.expectedVersion < 0
      ) {
        return failure('INVALID_REQUEST', 400);
      }
      if (item.status !== body.status) {
        if (item.statusVersion !== body.expectedVersion) return failure('PROPERTY_CHECKLIST_ITEM_CONFLICT', 400);
        item.status = body.status;
        item.statusVersion += 1;
      }
      return success({ item: { id: item.id, status: item.status, statusVersion: item.statusVersion } });
    },
  ),
  http.patch(
    '*/api/properties/:propertyId/checklists/:propertyChecklistId/items/:itemId/memo',
    async ({ params, request }) => {
      const property = getProperty(params.propertyId);
      const propertyChecklistId = readPositiveInteger(params.propertyChecklistId);
      const itemId = readPositiveInteger(params.itemId);
      const body = readRecord(await request.json());
      if (property === undefined || propertyChecklistId === null || itemId === null) {
        return failure('PROPERTY_CHECKLIST_ITEM_NOT_FOUND', 404);
      }
      const checklist = Array.from(getMockAppliedByProperty().get(property.id)?.values() ?? []).find(
        (candidate) => candidate.id === propertyChecklistId,
      );
      const item = checklist?.items.find((candidate) => candidate.id === itemId);
      if (item === undefined || typeof body.memo !== 'string' || body.memo.length > 500) {
        return failure(item === undefined ? 'PROPERTY_CHECKLIST_ITEM_NOT_FOUND' : 'INVALID_REQUEST', item ? 400 : 404);
      }
      if (
        !Number.isSafeInteger(body.expectedVersion) ||
        typeof body.expectedVersion !== 'number' ||
        body.expectedVersion < 0
      ) {
        return failure('INVALID_REQUEST', 400);
      }
      if (item.memo !== body.memo) {
        if (item.memoVersion !== body.expectedVersion) return failure('PROPERTY_CHECKLIST_ITEM_CONFLICT', 400);
        item.memo = body.memo;
        item.memoVersion += 1;
      }
      return success({ item: { id: item.id, memo: item.memo, memoVersion: item.memoVersion } });
    },
  ),
  http.all('*/api/properties/:propertyId/active-checklists/*', obsoleteEndpoint),
];
