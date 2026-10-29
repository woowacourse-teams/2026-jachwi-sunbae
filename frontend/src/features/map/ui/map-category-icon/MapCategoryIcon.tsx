import { css } from '@emotion/css';

import { mapCategoryIconSrc } from '../../lib/mapIconAssets';
import type { MapCategory, MapMarker } from '../../model/Map';

type MapCategoryIconProps = {
  category: MapCategory;
  /** 거리 메모의 좋아요(positive)와 싫어요(negative)를 다른 그림으로 그린다. */
  variant?: MapMarker['variant'];
  className?: string;
};

const classNames = (...names: Array<string | undefined>): string => names.filter(Boolean).join(' ');

/** 시설 종류 아이콘. 글자 크기(1em)에 맞춰 커지고, 이름은 옆 글자가 읽으므로 그림은 숨긴다. */
export const MapCategoryIcon = ({ category, variant, className }: MapCategoryIconProps) => (
  <img
    className={classNames(styles.icon, className)}
    src={mapCategoryIconSrc(category, variant)}
    data-map-category-icon={category}
    alt=""
    aria-hidden="true"
    draggable={false}
    decoding="async"
  />
);

const styles = {
  icon: css`
    label: MapCategoryIcon-icon;
    display: block;
    width: 1em;
    height: 1em;
    object-fit: contain;
    pointer-events: none;
  `,
};

export default MapCategoryIcon;
