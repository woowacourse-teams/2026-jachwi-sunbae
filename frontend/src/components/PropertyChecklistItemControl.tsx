import { useEffect, useState } from 'react';
import {
  usePropertyChecklistItemMemoMutation,
  usePropertyChecklistItemStatusMutation,
} from '../hooks/query/usePropertyChecklistItemMutations';
import type { PropertyChecklistItem, PropertyChecklistItemStatus } from '../types/Property';
import type { PublicConfig } from '../types/PublicConfig';
import styles from './PropertyChecklistItemControl.module.css';
import Icon from './ui/Icon';
import SelectionControl from './ui/SelectionControl';

const STATUS_OPTIONS: Array<{ value: PropertyChecklistItemStatus; label: string }> = [
  { value: 'GOOD', label: '괜찮음' },
  { value: 'CAUTION', label: '주의' },
  { value: 'UNCONFIRMED', label: '미확인' },
];

const PropertyChecklistItemControl = ({
  config,
  propertyId,
  propertyChecklistId,
  item,
  isMemoEditing,
  isMemoEditDisabled,
  onStartMemoEdit,
  onFinishMemoEdit,
}: {
  config: PublicConfig;
  propertyId: number;
  propertyChecklistId: number;
  item: PropertyChecklistItem;
  isMemoEditing: boolean;
  isMemoEditDisabled: boolean;
  onStartMemoEdit: () => void;
  onFinishMemoEdit: () => void;
}) => {
  const [memo, setMemo] = useState(item.memo);
  const statusMutation = usePropertyChecklistItemStatusMutation(config, propertyId, propertyChecklistId);
  const memoMutation = usePropertyChecklistItemMemoMutation(config, propertyId, propertyChecklistId);

  useEffect(() => {
    if (!isMemoEditing) setMemo(item.memo);
  }, [isMemoEditing, item.memo]);

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
    <li className={styles.item}>
      <fieldset>
        <legend className="sr-only">{item.question}</legend>
        <div className={styles.content}>
          <strong aria-hidden="true">{item.question}</strong>
          <div className={styles.statuses}>
            {STATUS_OPTIONS.map((option) => (
              <SelectionControl
                key={option.value}
                type="radio"
                dataAttributes={{ 'data-status': option.value }}
                name={`property-checklist-item-${item.itemId}`}
                value={option.value}
                checked={item.status === option.value}
                disabled={statusMutation.isPending}
                onSelect={() => statusMutation.mutate({ itemId: item.itemId, status: option.value })}
              >
                <span aria-hidden="true" />
                <small>{option.label}</small>
              </SelectionControl>
            ))}
          </div>
        </div>
      </fieldset>
      {isMemoEditing ? (
        <div className={styles.memoPanel} id={`property-checklist-memo-${item.itemId}`}>
          <label className="sr-only" htmlFor={`property-checklist-memo-input-${item.itemId}`}>
            {item.question} 메모
          </label>
          <textarea
            id={`property-checklist-memo-input-${item.itemId}`}
            value={memo}
            maxLength={500}
            rows={2}
            placeholder="확인한 내용을 메모해 주세요."
            onChange={(event) => setMemo(event.target.value)}
          />
          <div className={styles.memoActions}>
            <button
              type="button"
              className={styles.memoCancelButton}
              disabled={memoMutation.isPending}
              onClick={() => {
                setMemo(item.memo);
                onFinishMemoEdit();
              }}
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
      ) : (
        <div className={styles.memoSummary}>
          <p>{item.memo.trim() === '' ? '메모 없음' : item.memo}</p>
          <button
            type="button"
            aria-label={`${item.question} 메모 편집`}
            disabled={isMemoEditDisabled}
            onClick={onStartMemoEdit}
          >
            <Icon name="edit" size={15} />
          </button>
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
