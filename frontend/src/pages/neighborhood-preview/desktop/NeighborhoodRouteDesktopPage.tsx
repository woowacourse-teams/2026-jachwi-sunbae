import type { NeighborhoodPreviewContext } from '../hooks/useNeighborhoodPreview';
import RouteDetailBody from '../ui/route-detail/RouteDetailBody';

import * as shared from '../NeighborhoodRoutePage.styles';
import * as styles from './NeighborhoodRouteDesktopPage.styles';

type Props = {
  preview: NeighborhoodPreviewContext;
  area: NonNullable<NeighborhoodPreviewContext['selected']>;
};

/** 데스크탑 대중교통 상세. 목록 옆 상세 칸(ListDetailLayout)을 채우고, 닫기는 칸 옆 지도 위 버튼이 맡는다. */
const NeighborhoodRouteDesktopPage = ({ preview, area }: Props) => (
  <main className={`${shared.detailPage} ${styles.root}`} aria-label={`${area.name} 대중교통 상세`}>
    <header className={shared.header}>
      <h1>{area.name} 대중교통</h1>
    </header>
    <RouteDetailBody preview={preview} area={area} />
  </main>
);

export default NeighborhoodRouteDesktopPage;
