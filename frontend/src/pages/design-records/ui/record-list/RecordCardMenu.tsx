import { useState } from 'react';

import Icon from '@/shared/ui/icon/Icon';

import RecordDeleteButton from './RecordDeleteButton';

import * as styles from './RecordList.styles';

type Props = {
  propertyId: number;
  propertyName: string;
  /** 삭제를 마치거나 실패하면 알릴 문구를 넘긴다. */
  onDone: (message: string) => void;
};

/** 기록 카드 오른쪽 위 더보기(⋮) 메뉴. 리스트와 지도 아래 매물 목록이 함께 쓰고, 지금은 삭제만 둔다. */
const RecordCardMenu = ({ propertyId, propertyName, onDone }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.menuToggle}
        aria-label={`${propertyName} 메뉴`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon name="more-vertical" size={20} />
      </button>
      {isOpen && (
        <div className={styles.menu}>
          <RecordDeleteButton
            propertyId={propertyId}
            onDone={(message) => {
              setIsOpen(false);
              onDone(message);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RecordCardMenu;
