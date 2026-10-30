import { css } from '@emotion/css';

import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';

import type { RecordsState } from '../hooks/useRecords';
import RecordGroupList from '../ui/record-group/RecordGroupList';

type Props = {
  /** 지도에서 고른 매물. 겹쳐 묶인 마커를 누르면 여러 개다. */
  records: RecordsState['records'];
  onClose: () => void;
  onNotice: (message: string) => void;
};

/** 휴대폰 지도에서 고른 매물을 보는 바텀시트. 겹친 매물은 함께 늘어놓고, 카드를 누르면 상세 화면으로 간다. */
const RecordsSelectedSheet = ({ records, onClose, onNotice }: Props) => {
  if (records.length === 0) return null;
  return (
    <BottomSheet
      title={records.length > 1 ? `이 자리 매물 ${records.length}개` : '선택한 매물'}
      // 카드 한 장이면 그만큼만, 여러 장이면 두세 장이 보이게 연다. 더 많으면 끌어 올려 본다.
      initialHeightPercent={records.length > 1 ? 45 : 28}
      closeLabel="매물 닫기"
      onClose={onClose}
    >
      <RecordGroupList records={records} onNotice={onNotice} className={styles.list} />
    </BottomSheet>
  );
};

const styles = {
  list: css`
    label: RecordsSelectedSheet-list;
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  `,
};

export default RecordsSelectedSheet;
