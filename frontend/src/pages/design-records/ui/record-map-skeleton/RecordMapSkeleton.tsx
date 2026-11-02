import { css, keyframes } from '@emotion/css';

type Props = {
  className?: string;
  /** 화면 읽기 프로그램에 불러오는 중임을 알릴지. 데스크탑처럼 리스트 뼈대가 함께 있어 그쪽이 알리면 끄고 장식으로만 둔다. */
  announce?: boolean;
};

/** 기록을 불러오는 동안 지도 자리를 채우는 뼈대. 지도 보기와 데스크탑 지도 칸에서 리스트 뼈대 대신 지도 영역 모양으로 둔다. */
const RecordMapSkeleton = ({ className, announce = true }: Props) => (
  <div
    className={`${styles.map} ${className ?? ''}`.trim()}
    data-testid="record-map-skeleton"
    {...(announce ? { role: 'status' } : { 'aria-hidden': true })}
  >
    {announce && <span className="sr-only">기록을 불러오는 중이에요.</span>}
  </div>
);

const shimmerKeyframes = keyframes`
  to {
    background-position: -200% 0;
  }
`;

const styles = {
  /* 지도(MapCanvas)가 들어설 자리를 같은 크기로 채운다. 색은 리스트 뼈대와 같은 회색 결로 맞춘다. */
  map: css`
    label: RecordMapSkeleton-map;
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    background: linear-gradient(90deg, #eff1f5 25%, #e3e6eb 50%, #eff1f5 75%);
    background-size: 200% 100%;
    animation: ${shimmerKeyframes} 1.2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
};

export default RecordMapSkeleton;
