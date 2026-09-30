import type { MapAddress } from '@/features/map/model/Map';
import { Button } from '@/shared/ui/button/Button';

import styles from './MapAddPropertySheet.module.css';

type AddAddressStatus = 'idle' | 'loading' | 'error';

type MapAddPropertySheetProps = {
  address: MapAddress | null;
  status: AddAddressStatus;
  onCancel: () => void;
  onConfirm: (address: MapAddress) => void;
};

const MapAddPropertySheet = ({ address, status, onCancel, onConfirm }: MapAddPropertySheetProps) => (
  <section className={styles.sheet} aria-label="선택한 위치로 매물 추가">
    <strong>
      {status === 'loading'
        ? '주소를 확인하는 중이에요.'
        : (address?.roadAddress ?? address?.jibunAddress ?? '주소를 확인하지 못했어요.')}
    </strong>
    {status === 'error' && <p>지도를 움직여 다른 위치를 선택해 주세요.</p>}
    <div className={styles.actions}>
      <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
        취소
      </Button>
      <Button
        type="button"
        variant="primary"
        fullWidth
        disabled={address === null || status === 'loading'}
        onClick={() => {
          if (address !== null) onConfirm(address);
        }}
      >
        이 주소로 매물 추가
      </Button>
    </div>
  </section>
);

export default MapAddPropertySheet;
