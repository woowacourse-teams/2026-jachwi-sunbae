import { LogImpression } from '@/shared/lib/analytics/logging';

import { memoLogParams } from '../../hooks/useStreetMemoLayer';
import type { StreetMemo } from '../../model/StreetMemo';

const memoKey = (memo: StreetMemo) => memo.id;

/** 지도 화면에 보인 거리 메모를 메모마다 이번 방문에 한 번 노출로 남긴다. 메모별 노출 순위를 보려고 메모 id와 내용을 싣는다. */
const StreetMemoImpressionLog = ({ memos }: { memos: readonly StreetMemo[] }) => (
  <LogImpression event="street_memo_impressed" items={memos} getKey={memoKey} getParams={memoLogParams} />
);

export default StreetMemoImpressionLog;
