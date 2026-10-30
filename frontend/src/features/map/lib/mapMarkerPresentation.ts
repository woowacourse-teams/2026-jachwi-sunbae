import type { MapMarker } from '../model/Map';
const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
/** 이 값이 같으면 마커를 다시 그릴 필요가 없다. */
export const markerSignature = (marker: MapMarker, selectedMarkerId: string | null): string =>
  [
    marker.latitude,
    marker.longitude,
    marker.tone ?? '',
    marker.category ?? '',
    marker.variant ?? '',
    marker.count ?? '',
    marker.rank ?? '',
    marker.label,
    marker.caption ?? '',
    marker.summary?.amount ?? '',
    marker.image?.src ?? '',
    marker.actionable === true ? '1' : '0',
    selectedMarkerId === marker.id ? '1' : '0',
  ].join('|');

/** 매물과 시설 마커는 아래 꼭짓점이 좌표를 가리키는 핀 이미지로 그린다. */
export const isPinMarker = (marker: MapMarker): boolean =>
  marker.image !== undefined ||
  marker.tone === 'property' ||
  marker.tone === 'selected' ||
  marker.tone === 'propertyCluster' ||
  ((marker.tone === 'place' || marker.tone === 'cluster') && marker.category !== undefined);

/** 핀과 말풍선은 아래 가운데가, 나머지 점 마커는 가운데가 좌표에 오게 옮긴다. */
export const markerAnchorTransform = (marker: MapMarker): string =>
  isPinMarker(marker) || marker.tone === 'destination' || marker.tone === 'flash'
    ? 'translate(-50%, -100%)'
    : 'translate(-50%, -50%)';

export const markerZIndex = (marker: MapMarker, selectedMarkerId: string | null): number => {
  if (marker.tone === 'flash') return 11;
  if (selectedMarkerId === marker.id) return 10;
  if (marker.tone === 'selected') return 9;
  if (marker.tone === 'property' || marker.tone === 'propertyCluster') return 8;
  if (marker.tone === 'current') return 7;
  if (marker.tone === 'rank') return 6;
  return 5;
};

/**
 * 배율에 따라 마커를 키우거나 줄이는 비율. 매물 핀은 가까울수록 키우고 멀수록 줄인다.
 * 거리 메모 말풍선은 골목이 보이는 배율(4)까지 그대로 두고, 그보다 멀리 축소할수록 줄여 넓은 화면을 덮지 않게 한다.
 */
export const markerScale = (marker: MapMarker, level: number): number => {
  if (marker.tone === 'property' || marker.tone === 'selected' || marker.tone === 'propertyCluster')
    return Number(clamp(1 + (4 - level) * 0.12, 0.7, 1.36).toFixed(2));
  if (marker.category === 'MEMO') return Number(clamp(1 - (level - 4) * 0.1, 0.6, 1).toFixed(2));
  return 1;
};
