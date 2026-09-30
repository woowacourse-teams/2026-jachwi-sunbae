import { renderToStaticMarkup } from 'react-dom/server';

import type { MapMarker } from '../../model/Map';
import MapCategoryIcon from '../map-category-icon/MapCategoryIcon';

import styles from './MapMarkerView.module.css';

type MapMarkerViewProps = {
  marker: MapMarker;
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarker) => void;
};

const markerSymbol = (marker: MapMarker): string => {
  if (marker.tone === 'cluster' || marker.tone === 'propertyCluster') return String(marker.count ?? '');
  if (marker.tone === 'property' || marker.tone === 'selected') return '⌂';
  return '•';
};

/** 현재 위치는 지도 앱 관례대로 글리프 없는 파란 점 하나로 그린다. */
const isCurrentLocationDot = (marker: MapMarker): boolean => marker.tone === 'current';

const usesCategoryIcon = (marker: MapMarker): boolean =>
  (marker.tone === 'place' || marker.tone === 'cluster') && marker.category !== undefined;

/** 매물·매물 군집 마커는 대표 사진을 받았을 때 그 사진을 마커 안에 넣는다. */
const usesPhoto = (marker: MapMarker): boolean =>
  (marker.tone === 'property' || marker.tone === 'selected' || marker.tone === 'propertyCluster') &&
  marker.photoUrl !== undefined;

/** 묶음 숫자 배지. 사진이 없는 매물 군집은 숫자를 마커 본문에 그대로 쓰므로 배지를 겹치지 않는다. */
const usesCountBadge = (marker: MapMarker): boolean =>
  marker.count !== undefined &&
  (marker.category !== undefined || (marker.tone === 'propertyCluster' && marker.photoUrl !== undefined));

const markerClassName = (marker: MapMarker, selectedMarkerId: string | null | undefined): string =>
  [
    styles.marker,
    marker.tone === 'property' ? styles.propertyMarker : '',
    marker.tone === 'current' ? styles.currentMarker : '',
    marker.tone === 'selected' ? styles.selectedMarker : '',
    marker.tone === 'place' ? styles.placeMarker : '',
    marker.tone === 'cluster' ? styles.clusterMarker : '',
    marker.tone === 'propertyCluster' ? styles.propertyClusterMarker : '',
    selectedMarkerId === marker.id ? styles.activeMarker : '',
  ]
    .filter(Boolean)
    .join(' ');

/** 지도 SDK와 데모 지도 양쪽에서 재사용하는 마커의 순수 시각 UI. */
const MapMarkerView = ({ marker, selectedMarkerId = null, onSelectMarker }: MapMarkerViewProps) => {
  const canSelect = marker.actionable === true && onSelectMarker !== undefined;
  const markerContent = (
    <>
      {isCurrentLocationDot(marker) ? null : usesCategoryIcon(marker) && marker.category !== undefined ? (
        <MapCategoryIcon category={marker.category} className={styles.categoryIcon} />
      ) : usesPhoto(marker) && marker.photoUrl !== undefined ? (
        <img className={styles.markerPhoto} src={marker.photoUrl} alt="" draggable={false} />
      ) : (
        <span className={styles.markerIcon} aria-hidden="true">
          {markerSymbol(marker)}
        </span>
      )}
      {usesCountBadge(marker) && <strong className={styles.markerCount}>{marker.count}</strong>}
      {(marker.tone === 'selected' || marker.tone === 'property') && (
        <span className={styles.markerCaption}>{marker.caption ?? marker.label}</span>
      )}
    </>
  );
  const commonProps = {
    className: markerClassName(marker, selectedMarkerId),
    'data-tone': marker.tone ?? 'property',
    'data-category': marker.category,
    'aria-label': marker.label,
  };

  if (!canSelect)
    return (
      <div {...commonProps} role="img">
        {markerContent}
      </div>
    );

  return (
    <button
      {...commonProps}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelectMarker(marker);
      }}
    >
      {markerContent}
    </button>
  );
};

/** Naver overlay가 요구하는 HTMLElement로 동일한 마커 UI를 변환한다. */
export const createMapMarkerElement = (
  marker: MapMarker,
  selectedMarkerId: string | null,
  onSelectMarker?: (marker: MapMarker) => void,
): HTMLElement => {
  const template = document.createElement('template');
  template.innerHTML = renderToStaticMarkup(
    <MapMarkerView marker={marker} selectedMarkerId={selectedMarkerId} onSelectMarker={onSelectMarker} />,
  );
  const element = template.content.firstElementChild;
  if (!(element instanceof HTMLElement)) throw new Error('지도 마커를 만들지 못했습니다.');

  if (marker.actionable === true && onSelectMarker !== undefined) {
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelectMarker(marker);
    });
  }
  return element;
};

export default MapMarkerView;
