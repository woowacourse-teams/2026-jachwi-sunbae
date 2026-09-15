import type { ChecklistItemInputDto, ProvidedChecklistItemInputDto } from '../apis/dtos/ChecklistDto';
import type { ChecklistEditorItem } from '../types/ChecklistEditor';
import { moveItem } from './moveItem';

export const moveEditorItem = (items: ChecklistEditorItem[], index: number, direction: -1 | 1): ChecklistEditorItem[] =>
  moveItem(items, index, direction);

export const editorItemsFingerprint = (items: ChecklistEditorItem[]): string =>
  JSON.stringify(
    items.map((item) =>
      item.origin === 'PROVIDED'
        ? ['PROVIDED', item.checklistItemId, item.sourceCheckItemId]
        : ['CUSTOM', item.checklistItemId, item.question],
    ),
  );

export const toChecklistItemInputs = (items: ChecklistEditorItem[]): ChecklistItemInputDto[] =>
  items.map((item) =>
    item.origin === 'PROVIDED'
      ? { systemCheckItemId: item.sourceCheckItemId }
      : { systemCheckItemId: null, question: item.question.trim() },
  );

export const toProvidedChecklistItemInputs = (items: ChecklistEditorItem[]): ProvidedChecklistItemInputDto[] =>
  items.map((item) => {
    if (item.origin !== 'PROVIDED') throw new Error('새 체크리스트에는 제공 항목만 추가할 수 있습니다.');
    return { systemCheckItemId: item.sourceCheckItemId };
  });
