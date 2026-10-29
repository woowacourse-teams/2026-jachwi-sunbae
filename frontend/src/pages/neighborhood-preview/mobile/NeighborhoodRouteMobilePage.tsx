import { Button } from '@/shared/ui/button/Button';
import Icon from '@/shared/ui/icon/Icon';

import type { NeighborhoodPreviewContext } from '../hooks/useNeighborhoodPreview';
import RouteDetailBody from '../ui/route-detail/RouteDetailBody';

import * as shared from '../NeighborhoodRoutePage.styles';

type Props = {
  preview: NeighborhoodPreviewContext;
  area: NonNullable<NeighborhoodPreviewContext['selected']>;
};

/** 휴대폰·태블릿 대중교통 상세. 지도 위를 덮고, 머리의 닫기 버튼으로 지도에 돌아간다. */
const NeighborhoodRouteMobilePage = ({ preview, area }: Props) => (
  <main className={shared.detailPage} aria-label={`${area.name} 대중교통 상세`}>
    <header className={shared.header}>
      <Button variant="text" aria-label="대중교통 상세 닫기" onClick={preview.closeAreaDetails}>
        <Icon name="close" size={24} />
      </Button>
      <h1>{area.name} 대중교통</h1>
    </header>
    <RouteDetailBody preview={preview} area={area} />
  </main>
);

export default NeighborhoodRouteMobilePage;
