import type { usePropertyMemo } from '@/features/property/api/useProperties';

import styles from './PropertyMemoSection.module.css';

type PropertyMemoQuery = ReturnType<typeof usePropertyMemo>;

type PropertyMemoContentProps = {
  memo: PropertyMemoQuery;
  onEdit: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const PropertyMemoContent = ({ memo, onEdit, triggerRef }: PropertyMemoContentProps) => {
  if (memo.isPending) {
    return <p className={styles.state}>매물 메모를 불러오는 중이에요.</p>;
  }

  if (memo.isError) {
    return (
      <button className={styles.retry} type="button" onClick={() => void memo.refetch()}>
        매물 메모를 불러오지 못했어요. 다시 시도
      </button>
    );
  }

  return (
    <button ref={triggerRef} type="button" className={styles.field} onClick={onEdit}>
      {memo.data.freeMemo || '탭해서 메모를 입력해 주세요.'}
    </button>
  );
};

export default PropertyMemoContent;
