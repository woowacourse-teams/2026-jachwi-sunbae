import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import AreaNearbyCard from '../area-nearby-card/AreaNearbyCard';
import PropertyCommuteList from '../property-commute/PropertyCommuteList';

type Area = NonNullable<NeighborhoodPreviewContext['selected']>;

type Props = {
  area: Area;
  preview: Pick<
    NeighborhoodPreviewContext,
    'mapPath' | 'destination' | 'isPublicExplore' | 'openNearby' | 'openPropertyCommute'
  >;
};

/**
 * 고른 동네의 `동네 정보` 탭 아래쪽. 그 동네 주변 분석 카드와, 회원이면 기록한 매물마다 출퇴근 장소까지 통근 시간을 둔다.
 * 공개 동네 찾기는 로그인 전이라 매물 기록이 없으므로 매물 통근 시간을 부르지 않는다.
 */
const AreaOverview = ({ area, preview }: Props) => (
  <>
    <AreaNearbyCard area={area} mapPath={preview.mapPath} onOpen={preview.openNearby} />
    {!preview.isPublicExplore && (
      <PropertyCommuteList destination={preview.destination} onOpen={preview.openPropertyCommute} />
    )}
  </>
);

export default AreaOverview;
