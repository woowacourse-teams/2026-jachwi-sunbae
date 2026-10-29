import { useEffect, useState } from 'react';

import {
  usePropertyChecklistItemMemoMutation,
  usePropertyChecklistItemStatusMutation,
} from '@/features/property/api/usePropertyChecklistItemMutations';
import type { PropertyChecklistItem, PropertyChecklistItemStatus } from '@/features/property/model/Property';
import Icon from '@/shared/ui/icon/Icon';

import * as styles from './PropertyChecklistItemControl.styles';

/** 미확인은 아무것도 고르지 않은 상태라 버튼으로 두지 않는다. 고른 상태를 다시 누르면 미확인으로 돌아간다. */
const STATUS_OPTIONS: Array<{ value: Exclude<PropertyChecklistItemStatus, 'UNCONFIRMED'>; label: string }> = [
  { value: 'GOOD', label: '괜찮음' },
  { value: 'CAUTION', label: '주의' },
];

const PropertyChecklistItemControl = ({
  propertyId,
  propertyChecklistId,
  item,
  isMemoEditing,
  isMemoEditDisabled,
  onStartMemoEdit,
  onFinishMemoEdit,
}: {
  propertyId: number;
  propertyChecklistId: number;
  item: PropertyChecklistItem;
  isMemoEditing: boolean;
  isMemoEditDisabled: boolean;
  onStartMemoEdit: () => void;
  onFinishMemoEdit: () => void;
}) => {
  const [memo, setMemo] = useState(item.memo);
  const statusMutation = usePropertyChecklistItemStatusMutation(propertyId, propertyChecklistId);
  const memoMutation = usePropertyChecklistItemMemoMutation(propertyId, propertyChecklistId);
  const hasMemo = item.memo.trim() !== '';

  useEffect(() => {
    if (!isMemoEditing) setMemo(item.memo);
  }, [isMemoEditing, item.memo]);

  const selectStatus = (status: PropertyChecklistItemStatus) => {
    const nextStatus = item.status === status ? 'UNCONFIRMED' : status;
    statusMutation.mutate({ itemId: item.itemId, status: nextStatus });
  };

  const cancelMemo = () => {
    setMemo(item.memo);
    onFinishMemoEdit();
  };

  const saveMemo = async () => {
    const nextMemo = memo.trim();
    if (memoMutation.isPending) return;
    if (nextMemo === item.memo) {
      onFinishMemoEdit();
      return;
    }
    try {
      await memoMutation.mutateAsync({ itemId: item.itemId, memo: nextMemo });
      onFinishMemoEdit();
    } catch {
      // 작성 내용을 유지해 같은 자리에서 다시 저장할 수 있게 한다.
    }
  };

  return (
    <li className={styles.item} data-status={item.status}>
      <div className={styles.row}>
        <div className={styles.question}>
          <strong id={`property-checklist-question-${item.itemId}`}>{item.question}</strong>
          {hasMemo && !isMemoEditing && <p className={styles.memoText}>{item.memo}</p>}
        </div>
        <div className={styles.statuses} role="group" aria-labelledby={`property-checklist-question-${item.itemId}`}>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              data-status={option.value}
              aria-pressed={item.status === option.value}
              disabled={statusMutation.isPending}
              onClick={() => selectStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.memoButton}
            aria-label={`${item.question} ${hasMemo ? '메모 편집' : '메모 추가'}`}
            disabled={isMemoEditDisabled || isMemoEditing}
            onClick={onStartMemoEdit}
          >
            <Icon name={hasMemo ? 'edit' : 'plus'} size={16} />
          </button>
        </div>
      </div>
      {isMemoEditing && (
        <div className={styles.memoPanel} id={`property-checklist-memo-${item.itemId}`}>
          <label className="sr-only" htmlFor={`property-checklist-memo-input-${item.itemId}`}>
            {item.question} 메모
          </label>
          <textarea
            id={`property-checklist-memo-input-${item.itemId}`}
            value={memo}
            maxLength={500}
            rows={2}
            // 메모 버튼을 눌러 열었으니 바로 적을 수 있게 포커스를 옮긴다.
            autoFocus
            placeholder="확인한 내용을 메모해 주세요."
            onChange={(event) => setMemo(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') cancelMemo();
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void saveMemo();
            }}
          />
          <div className={styles.memoActions}>
            <button
              type="button"
              className={styles.memoCancelButton}
              disabled={memoMutation.isPending}
              onClick={cancelMemo}
            >
              취소
            </button>
            <button
              type="button"
              className={styles.memoSaveButton}
              disabled={memoMutation.isPending}
              onClick={() => void saveMemo()}
            >
              {memoMutation.isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      )}
      {(statusMutation.isError || memoMutation.isError) && (
        <p className={styles.error} role="alert">
          변경 내용을 저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </li>
  );
};

export default PropertyChecklistItemControl;
