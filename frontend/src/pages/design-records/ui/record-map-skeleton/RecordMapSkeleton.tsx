import { css, cx } from '@emotion/css';

import * as listStyles from '../record-list/RecordList.styles';

type Props = {
  /** 화면 읽기 프로그램에 불러오는 중임을 알릴지. 데스크탑처럼 리스트 뼈대가 함께 있어 그쪽이 알리면 끄고 장식으로만 둔다. */
  announce?: boolean;
};

/**
 * 기록을 불러오는 동안 지도 자리를 채우는 뼈대. 지도 보기와 데스크탑 지도 칸에서 리스트 뼈대 대신 지도 영역 모양으로 둔다.
 * 라우트 대체 화면과 함께 첫 번들에 들어가므로 리스트 뼈대의 반짝임 스타일을 그대로 쓴다.
 */
const RecordMapSkeleton = ({ announce = true }: Props) => (
  <div
    className={cx(listStyles.skeleton, map)}
    data-testid="record-map-skeleton"
    {...(announce ? { role: 'status' } : { 'aria-hidden': true })}
  >
    {announce && <span className="sr-only">기록을 불러오는 중이에요.</span>}
  </div>
);

/* 지도(MapCanvas)가 들어설 자리를 같은 크기로 채운다. */
const map = css`
  label: RecordMapSkeleton-map;
  flex: 1;
  height: 100%;
  border-radius: 0;
`;

export default RecordMapSkeleton;
