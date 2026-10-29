import { css } from '@emotion/css';

import Icon from '@/shared/ui/icon/Icon';
import IconButton from '@/shared/ui/icon-button/IconButton';

import type { RecordsState } from '../../hooks/useRecords';
import RecordGroupList from './RecordGroupList';

type Props = {
  records: RecordsState['records'];
  onOpen: (recordId: string) => void;
  onClose: () => void;
  onNotice: (message: string) => void;
  className?: string;
};

/** 데스크탑 지도에서 겹쳐 묶인 매물을 함께 보는 카드. 카드를 누르면 리스트 옆 칸에 그 매물 상세를 연다. 놓을 자리는 화면이 className으로 정한다. */
const RecordGroupPanel = ({ records, onOpen, onClose, onNotice, className }: Props) => {
  if (records.length === 0) return null;
  const title = `이 자리 매물 ${records.length}개`;
  return (
    <section className={`${styles.panel} ${className ?? ''}`.trim()} aria-label={title}>
      <header className={styles.header}>
        <h2>{title}</h2>
        <IconButton label="매물 묶음 닫기" onClick={onClose}>
          <Icon name="close" size={22} />
        </IconButton>
      </header>
      <RecordGroupList records={records} onOpen={onOpen} onNotice={onNotice} />
    </section>
  );
};

const styles = {
  panel: css`
    label: RecordGroupPanel-panel;
    display: grid;
    align-content: start;
    gap: 0.75rem;
    padding: 1.25rem;
  `,

  header: css`
    label: RecordGroupPanel-header;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;

    & h2 {
      margin: 0;
      font-size: 1.125rem;
    }
  `,
};

export default RecordGroupPanel;
