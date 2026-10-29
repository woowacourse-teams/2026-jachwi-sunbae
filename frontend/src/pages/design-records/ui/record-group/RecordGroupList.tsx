import { css } from '@emotion/css';

import PropertyCard from '@/features/property/ui/property-card/PropertyCard';
import { RECORDS_PATH } from '@/shared/lib/navigation/appPaths';

import type { RecordsState } from '../../hooks/useRecords';
import RecordCardMenu from '../record-list/RecordCardMenu';

type Props = {
  records: RecordsState['records'];
  /** 주면 카드를 눌러도 상세로 넘어가지 않고 이 함수를 부른다(데스크탑은 리스트 옆 칸에 상세를 연다). */
  onOpen?: (recordId: string) => void;
  /** 카드 더보기 메뉴에서 삭제를 마치면 알릴 문구를 넘긴다. */
  onNotice: (message: string) => void;
  className?: string;
};

/** 지도에서 고른 자리의 매물 목록. 겹쳐 묶인 매물을 함께 보거나 매물 하나를 볼 때 리스트와 같은 공용 PropertyCard로 보여 준다. */
const RecordGroupList = ({ records, onOpen, onNotice, className }: Props) => (
  <ul className={`${styles.items} ${className ?? ''}`.trim()}>
    {records.map((record) => (
      <li key={record.id}>
        <PropertyCard
          property={record.summary}
          returnTo={RECORDS_PATH}
          onOpen={onOpen === undefined ? undefined : () => onOpen(record.id)}
          actions={<RecordCardMenu propertyId={Number(record.id)} propertyName={record.name} onDone={onNotice} />}
        />
      </li>
    ))}
  </ul>
);

const styles = {
  items: css`
    label: RecordGroupList-items;
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  `,
};

export default RecordGroupList;
