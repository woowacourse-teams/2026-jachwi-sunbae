import { usePropertyChecklistItemStatusMutation } from '../hooks/query/usePropertyChecklistItemMutations';
import type { PropertyChecklistItem, PropertyChecklistItemStatus } from '../types/Property';
import type { PublicConfig } from '../types/PublicConfig';
import styles from './PropertyChecklistItemControl.module.css';
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
}: {
  config: PublicConfig;
  propertyId: number;
  propertyChecklistId: number;
  item: PropertyChecklistItem;
}) => {
  const statusMutation = usePropertyChecklistItemStatusMutation(config, propertyId, propertyChecklistId);

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
      {statusMutation.isError && (
        <p className={styles.error} role="alert">
          변경 내용을 저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </li>
  );
};

export default PropertyChecklistItemControl;
