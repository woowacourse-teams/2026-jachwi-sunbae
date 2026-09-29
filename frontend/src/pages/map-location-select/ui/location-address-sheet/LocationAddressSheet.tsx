import type { MapAddress } from '@/features/map/model/Map';

import type { LocationSelectionStatus } from '../../hooks/useLocationSelection';

import styles from './LocationAddressSheet.module.css';

type LocationAddressSheetProps = {
  selected: MapAddress;
  status: LocationSelectionStatus;
  isEditing: boolean;
  isCreating: boolean;
  hasCreateError: boolean;
  onOpenSearch: () => void;
  onConfirm: () => void;
};

const LocationAddressSheet = ({
  selected,
  status,
  isEditing,
  isCreating,
  hasCreateError,
  onOpenSearch,
  onConfirm,
}: LocationAddressSheetProps) => {
  const selectedAddress = selected.roadAddress ?? selected.jibunAddress;

  return (
    <section className={styles.sheet} aria-live="polite">
      <strong>
        {selectedAddress ?? (status === 'error' ? '주소를 확인하지 못했어요' : '주소를 확인하는 중이에요')}
      </strong>
      <p>
        {selected.roadAddress !== null && selected.jibunAddress !== null
          ? selected.jibunAddress
          : '지도를 움직이거나 위치를 눌러 주세요.'}
      </p>
      {status === 'error' ? (
        <button className={styles.addressNotice} type="button" onClick={onOpenSearch}>
          주소로 다시 찾아볼까요?
        </button>
      ) : (
        <p className={styles.addressHint}>표시된 주소가 맞는지 확인해 주세요.</p>
      )}
      <button
        className={styles.confirmButton}
        type="button"
        disabled={status !== 'ready' || selectedAddress === null || isCreating}
        onClick={onConfirm}
      >
        {isCreating ? '매물을 등록하는 중…' : isEditing ? '이 위치 적용하기' : '이 위치로 매물 등록하기'}
      </button>
      {hasCreateError && (
        <p className={styles.addressError} role="alert">
          매물을 등록하지 못했어요. 입력한 정보는 유지되니 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
};

export default LocationAddressSheet;
