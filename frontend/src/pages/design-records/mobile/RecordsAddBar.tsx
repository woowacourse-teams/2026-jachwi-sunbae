import { css } from '@emotion/css';

import type { MapCoordinate } from '@/features/map/lib/mapLocation';
import type { MapAddress } from '@/features/map/model/Map';
import { Button } from '@/shared/ui/button/Button';
import Toast from '@/shared/ui/toast/Toast';

import type { RecordsAddKind } from '../hooks/useRecordsAddMode';

type Props = {
  kind: RecordsAddKind;
  coordinate: MapCoordinate | null;
  address: MapAddress | null;
  status: 'idle' | 'loading' | 'error';
  /** 확인을 눌러 추가하는 중이면 버튼을 로딩으로 둔다. */
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const COPY: Record<RecordsAddKind, { title: string; guide: string; region: string; confirm: string }> = {
  memo: {
    title: '📝 메모 추가 중',
    guide: '지도에서 메모할 위치를 눌러요',
    region: '선택한 위치에 메모 남기기',
    confirm: '이 위치에 메모 남기기',
  },
  property: {
    title: '🏠 매물 추가 중',
    guide: '지도에서 매물 위치를 눌러요',
    region: '선택한 위치로 매물 추가',
    confirm: '이 위치로 매물 추가',
  },
};

const description = (
  kind: RecordsAddKind,
  { coordinate, address, status }: Omit<Props, 'kind' | 'isConfirming' | 'onCancel' | 'onConfirm'>,
) => {
  if (coordinate === null) return COPY[kind].guide;
  if (status === 'loading') return '주소를 확인하는 중이에요.';
  const text = address?.roadAddress ?? address?.jibunAddress;
  if (text) return `📍 ${text}`;
  return kind === 'property' ? '주소를 확인하지 못했어요. 다른 위치를 눌러 주세요.' : '주소를 확인하지 못했어요.';
};

/**
 * 휴대폰 추가 모드의 안내와 버튼. 위쪽 토스트로 무엇을 추가하는 중인지와 찍은 위치의 주소를 알리고, 아래쪽에는 버튼만 띄운다.
 * 메모는 좌표만 있으면 남길 수 있어 주소를 못 찾아도 넘기고, 매물은 주소를 찾아야 넘긴다.
 */
const RecordsAddBar = ({ kind, coordinate, address, status, isConfirming = false, onCancel, onConfirm }: Props) => {
  const copy = COPY[kind];
  const canConfirm = coordinate !== null && status !== 'loading' && (kind === 'memo' || address !== null);
  return (
    <>
      <Toast
        className={styles.toast}
        title={copy.title}
        description={description(kind, { coordinate, address, status })}
        isOpen
        duration={0}
        onClose={onCancel}
      />
      <div className={styles.actions} role="group" aria-label={copy.region}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="button" fullWidth disabled={!canConfirm} isLoading={isConfirming} onClick={onConfirm}>
          {copy.confirm}
        </Button>
      </div>
    </>
  );
};

const styles = {
  toast: css`
    label: RecordsAddBar-toast;

    /* 추가 모드 안내 토스트는 헤더를 거둔 위쪽에 띄운다. 공용 토스트의 아래쪽 위치를 이기도록 태그까지 건다. */
    aside& {
      top: max(0.85rem, env(safe-area-inset-top));
      bottom: auto;
    }
  `,

  /* 추가 모드 아래쪽에는 막대 없이 버튼만 띄운다. */
  actions: css`
    label: RecordsAddBar-actions;
    position: absolute;
    right: 1rem;
    bottom: max(1.5rem, env(safe-area-inset-bottom));
    left: 1rem;
    z-index: 30;
    display: flex;
    gap: 0.55rem;

    & > button {
      min-width: 0;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgb(0 0 0 / 14%);
    }
  `,
};

export default RecordsAddBar;
