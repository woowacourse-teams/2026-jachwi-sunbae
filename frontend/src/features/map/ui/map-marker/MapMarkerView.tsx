import { css, cx, keyframes } from '@emotion/css';
import { renderToStaticMarkup } from 'react-dom/server';

import logoImage from '@/shared/assets/jachwi-sunbae-goose.webp';

import type { MapMarker } from '../../model/Map';
import MapCategoryIcon from '../map-category-icon/MapCategoryIcon';

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

/** 매물 군집은 로고 위 숫자 배지로 개별 매물과 구분한다. */
const usesCountBadge = (marker: MapMarker): boolean =>
  marker.count !== undefined && (marker.category !== undefined || marker.tone === 'propertyCluster');

const markerClassName = (marker: MapMarker, selectedMarkerId: string | null | undefined): string =>
  [
    styles.marker,
    marker.tone === 'property' ? styles.propertyMarker : '',
    marker.tone === 'current' ? styles.currentMarker : '',
    marker.tone === 'selected' ? styles.selectedMarker : '',
    marker.tone === 'destination' || marker.tone === 'flash' ? styles.destinationMarker : '',
    marker.tone === 'flash' ? styles.flashMarker : '',
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
      {marker.summary && (
        <span className={styles.markerSummaryCard}>
          <strong title={marker.label}>{marker.label}</strong>
          <small title={marker.summary.amount}>{marker.summary.amount}</small>
        </span>
      )}
      {marker.tone === 'destination' || marker.tone === 'flash' ? (
        <>
          <span className={styles.destinationLabel}>{marker.label}</span>
          <span className={styles.destinationTail} aria-hidden="true" />
        </>
      ) : isCurrentLocationDot(marker) ? null : usesCategoryIcon(marker) && marker.category !== undefined ? (
        <MapCategoryIcon category={marker.category} className={styles.categoryIcon} />
      ) : marker.tone === 'property' || marker.tone === 'selected' || marker.tone === 'propertyCluster' ? (
        <img className={styles.markerPhoto} src={logoImage} alt="" draggable={false} decoding="async" />
      ) : (
        <span className={styles.markerIcon} aria-hidden="true">
          {markerSymbol(marker)}
        </span>
      )}
      {usesCountBadge(marker) && <strong className={styles.markerCount}>{marker.count}</strong>}
    </>
  );
  const commonProps = {
    className: markerClassName(marker, selectedMarkerId),
    'data-tone': marker.tone ?? 'property',
    'data-category': marker.category,
    'data-variant': marker.variant,
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
  // React의 이미지 preload 링크가 마커 앞에 생성될 수 있으므로 첫 요소를 사용하지 않는다.
  const element = template.content.querySelector('[data-tone]');
  if (!(element instanceof HTMLElement)) throw new Error('지도 마커를 만들지 못했습니다.');

  if (marker.actionable === true && onSelectMarker !== undefined) {
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelectMarker(marker);
    });
  }
  return element;
};

const markerFlashKeyframes = keyframes`
  0% {
    opacity: 0;
    translate: 0 0.5rem;
  }
  12% {
    opacity: 1;
    translate: 0 0;
  }
  70% {
    opacity: 1;
    translate: 0 -0.6rem;
  }
  100% {
    opacity: 0;
    translate: 0 -2rem;
  }
`;

const markerFlashFadeKeyframes = keyframes`
  0%,
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const styles = {
  marker: css`
    label: MapMarkerView-marker;
    position: relative;
    display: grid;
    width: 1.55rem;
    height: 1.55rem;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    border: 2px solid white;
    border-radius: 50%;
    background: #64748b;
    box-shadow: 0 0.28rem 0.8rem rgb(44 50 39 / 28%);
    color: white;
    cursor: default;
    place-items: center;

    button& {
      cursor: pointer;
    }

    /* WebView에서 지도 이동 중 DOM 마커의 그림자·캡션 합성 비용을 줄인다. */
    [data-map-gesture='true'] & {
      box-shadow: none;
      filter: none;
    }
  `,

  placeMarker: css`
    label: MapMarkerView-placeMarker;

    button&::before {
      position: absolute;
      inset: -0.55rem;
      content: '';
    }

    & {
      z-index: 5;
    }

    &[data-category='HOSPITAL'] {
      background: #212124;
    }

    &[data-category='TRANSPORT'] {
      background: #212124;
    }

    &[data-category='SCHOOL'] {
      background: #ffbf00;
      color: #212124;
    }

    &[data-category='CONVENIENCE'] {
      background: #212124;
    }

    &[data-category='AGENCY'] {
      background: #212124;
    }

    /* 거리 메모는 좋아요·싫어요를 색으로도 나누고, 내용은 마커 이름(aria-label)으로 읽는다. */
    &[data-category='MEMO'][data-variant='positive'] {
      background: var(--color-brand-blue, #6b9ae6);
    }

    &[data-category='MEMO'][data-variant='negative'] {
      background: var(--color-danger, #c96b6b);
    }
  `,

  // 다른 요소의 선택자에서 `.MapMarkerView-clusterMarker`로 가리킨다.
  clusterMarker: cx(
    css`
      label: MapMarkerView-clusterMarker;

      button&::before {
        position: absolute;
        inset: -0.55rem;
        content: '';
      }

      & {
        z-index: 5;
        width: 1.95rem;
        height: 1.95rem;
        border-width: 2px;
        background: #212124;
        box-shadow:
          0 0 0 0.22rem rgb(0 0 0 / 12%),
          0 0.3rem 0.9rem rgb(0 0 0 / 18%);
      }

      &[data-category='HOSPITAL'] {
        background: #212124;
      }

      &[data-category='TRANSPORT'] {
        background: #212124;
      }

      &[data-category='SCHOOL'] {
        background: #ffbf00;
        color: #212124;
      }

      &[data-category='CONVENIENCE'] {
        background: #212124;
      }

      &[data-category='AGENCY'] {
        background: #212124;
      }
    `,
    'MapMarkerView-clusterMarker',
  ),

  /* 파란 물방울 핀 안에 자취선배 로고를 표시한다. */
  // 다른 요소의 선택자에서 `.MapMarkerView-propertyMarker`로 가리킨다.
  propertyMarker: cx(
    css`
      label: MapMarkerView-propertyMarker;
      z-index: 8;
      width: calc(2.35rem * var(--map-marker-scale, 1));
      height: calc(2.35rem * var(--map-marker-scale, 1));
      border: 0;
      border-radius: 50%;
      background: transparent;
      box-shadow: none;
      isolation: isolate;

      & > * {
        z-index: 1;
      }

      &::before {
        position: absolute;
        z-index: 0;
        inset: 0;
        border-radius: 50% 50% 50% 0;
        background: var(--color-brand-blue, #6b9ae6);
        content: '';
        transform: rotate(-45deg);
        pointer-events: none;
      }
    `,
    'MapMarkerView-propertyMarker',
  ),

  markerSummaryCard: css`
    label: MapMarkerView-markerSummaryCard;
    position: absolute;
    z-index: 3;
    left: 50%;
    bottom: calc(100% + 0.45rem);
    display: grid;
    box-sizing: border-box;
    width: 6.5rem;
    height: 2.8rem;
    padding: 0.3rem 0.25rem;
    overflow: hidden;
    border: 1px solid #d8dbe0;
    border-radius: 1.05rem;
    background: #fff;
    box-shadow: 0 0.3rem 0.85rem rgb(25 30 40 / 24%);
    color: #25282d;
    text-align: center;
    transform: translateX(-50%);
    pointer-events: none;

    &::after {
      position: absolute;
      bottom: -0.6rem;
      left: calc(50% - 0.3rem);
      width: 0.55rem;
      height: 0.55rem;
      border-right: 1px solid #d8dbe0;
      border-bottom: 1px solid #d8dbe0;
      background: #fff;
      content: '';
      transform: rotate(45deg);
    }

    & strong,
    & small {
      display: block;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & strong {
      font-size: 0.78rem;
      font-weight: 600;
      line-height: 1.3;
    }

    & small {
      color: #626975;
      font-size: 0.66rem;
      line-height: 1.3;
    }
  `,

  // 다른 요소의 선택자에서 `.MapMarkerView-selectedMarker`로 가리킨다.
  selectedMarker: cx(
    css`
      label: MapMarkerView-selectedMarker;

      &::before {
        position: absolute;
        z-index: 0;
        inset: 0;
        border-radius: 50% 50% 50% 0;
        background: var(--color-brand-blue, #6b9ae6);
        content: '';
        transform: rotate(-45deg);
        pointer-events: none;
      }

      & {
        z-index: 9;
        width: calc(2.6rem * var(--map-marker-scale, 1));
        height: calc(2.6rem * var(--map-marker-scale, 1));
        background: transparent;
        border: 0;
        border-radius: 50%;
        box-shadow: none;
      }
    `,
    'MapMarkerView-selectedMarker',
  ),

  // 다른 요소의 선택자에서 `.MapMarkerView-markerPhoto`로 가리킨다.
  markerPhoto: cx(
    css`
      label: MapMarkerView-markerPhoto;

      .MapMarkerView-propertyMarker &,
      .MapMarkerView-selectedMarker & {
        position: relative;
        z-index: 1;
        box-sizing: border-box;
        border: 2px solid var(--color-brand-blue, #6b9ae6);
      }

      & {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: var(--color-surface-muted, #f7f7f7);
        object-fit: cover;
        pointer-events: none;
      }
    `,
    'MapMarkerView-markerPhoto',
  ),

  // 다른 요소의 선택자에서 `.MapMarkerView-activeMarker`로 가리킨다.
  activeMarker: cx(
    css`
      label: MapMarkerView-activeMarker;

      .MapMarkerView-propertyMarker& .MapMarkerView-markerPhoto,
      .MapMarkerView-selectedMarker& .MapMarkerView-markerPhoto {
        border-width: 3px;
      }

      & {
        outline: 1px solid #212124;
        outline-offset: 2px;
        scale: 1.08;
      }

      .MapMarkerView-propertyMarker&,
      .MapMarkerView-selectedMarker& {
        border-width: 3px;
        outline: 0;
        scale: 1;
      }
    `,
    'MapMarkerView-activeMarker',
  ),

  /* 현재 위치는 지도 앱 관례대로 파란 점으로 그린다. */
  currentMarker: css`
    label: MapMarkerView-currentMarker;
    z-index: 7;
    width: 1.15rem;
    height: 1.15rem;
    border: 3px solid white;
    border-radius: 50%;
    background: #1a73e8;
    box-shadow:
      0 0 0 0.45rem rgb(26 115 232 / 16%),
      0 0.15rem 0.5rem rgb(20 60 120 / 38%);
  `,

  // 다른 요소의 선택자에서 `.MapMarkerView-propertyClusterMarker`로 가리킨다.
  propertyClusterMarker: cx(
    css`
      label: MapMarkerView-propertyClusterMarker;

      &.MapMarkerView-activeMarker {
        border-width: 3px;
        outline: 0;
        scale: 1;
      }

      /* 매물 군집은 숫자 배지로 구분한다. */
      & {
        z-index: 8;
        width: calc(2.35rem * var(--map-marker-scale, 1));
        height: calc(2.35rem * var(--map-marker-scale, 1));
        border: 2px solid var(--color-brand-blue, #6b9ae6);
        border-radius: 0.6rem;
        background: var(--color-brand-blue, #6b9ae6);
      }
    `,
    'MapMarkerView-propertyClusterMarker',
  ),

  markerCount: css`
    label: MapMarkerView-markerCount;

    .MapMarkerView-propertyClusterMarker & {
      right: -0.3rem;
      bottom: -0.3rem;
      min-width: 1.2rem;
      height: 1.2rem;
      font-size: 0.62rem;
      font-weight: 850;
    }

    & {
      position: absolute;
      right: -0.28rem;
      bottom: -0.28rem;
      display: grid;
      min-width: 0.92rem;
      height: 0.92rem;
      padding: 0 0.2rem;
      border: 2px solid white;
      border-radius: 999px;
      background: #252a23;
      color: white;
      font-size: 0.46rem;
      place-items: center;
    }
  `,

  markerIcon: css`
    label: MapMarkerView-markerIcon;
    font-size: 0.78rem;
    font-weight: 900;
    line-height: 1;
  `,

  categoryIcon: css`
    label: MapMarkerView-categoryIcon;
    font-size: 0.78rem;

    .MapMarkerView-clusterMarker & {
      font-size: 0.72rem;
    }
  `,

  markerCaption: css`
    label: MapMarkerView-markerCaption;
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 50%;
    padding: 0.15rem 0.45rem;
    border: 1px solid var(--color-border, #eaebed);
    border-radius: var(--radius-sm, 0.35rem);
    background: rgb(255 255 255 / 96%);
    box-shadow: 0 0.15rem 0.5rem rgb(0 0 0 / 12%);
    color: var(--color-ink, #212124);
    font-size: 0.68rem;
    font-weight: 750;
    line-height: 1.25;
    text-align: center;
    white-space: nowrap;
    transform: translateX(-50%);
    pointer-events: none;

    [data-map-gesture='true'] & {
      visibility: hidden;
    }
  `,

  /* 고른 장소(동네 찾기 목적지)는 이름이 든 말풍선 핀으로 그린다. 아래 꼬리 끝이 좌표를 가리킨다. */
  destinationMarker: css`
    label: MapMarkerView-destinationMarker;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: auto;
    height: auto;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    filter: drop-shadow(0 0.2rem 0.45rem rgb(25 30 40 / 28%));
  `,

  // 다른 요소의 선택자에서 `.MapMarkerView-destinationLabel`로 가리킨다.
  destinationLabel: cx(
    css`
      label: MapMarkerView-destinationLabel;
      max-width: 11rem;
      padding: 0.45rem 0.75rem;
      overflow: hidden;
      border-radius: 999px;
      background: var(--color-ink, #25282d);
      color: white;
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.2;
      white-space: nowrap;
      text-overflow: ellipsis;
    `,
    'MapMarkerView-destinationLabel',
  ),

  // 다른 요소의 선택자에서 `.MapMarkerView-destinationTail`로 가리킨다.
  destinationTail: cx(
    css`
      label: MapMarkerView-destinationTail;
      width: 0;
      height: 0;
      margin-top: -1px;
      border-top: 0.45rem solid var(--color-ink, #25282d);
      border-right: 0.4rem solid transparent;
      border-left: 0.4rem solid transparent;
    `,
    'MapMarkerView-destinationTail',
  ),

  /* 방금 남긴 메모처럼 잠깐 알리는 말풍선. 그 자리에서 떠오르며 사라진다. */
  flashMarker: css`
    label: MapMarkerView-flashMarker;
    pointer-events: none;
    animation: ${markerFlashKeyframes} 2.4s ease-out forwards;

    & .MapMarkerView-destinationLabel {
      max-width: 14rem;
      background: var(--color-brand-blue, #6b9ae6);
    }

    & .MapMarkerView-destinationTail {
      border-top-color: var(--color-brand-blue, #6b9ae6);
    }

    @media (prefers-reduced-motion: reduce) {
      animation: ${markerFlashFadeKeyframes} 2.4s linear forwards;
    }
  `,
};

export default MapMarkerView;
