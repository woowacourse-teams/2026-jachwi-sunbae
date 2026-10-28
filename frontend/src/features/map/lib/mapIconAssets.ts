import agencyIcon from '@/shared/assets/map-icons/icons/icon-agency.svg';
import busStopIcon from '@/shared/assets/map-icons/icons/icon-bus-stop.svg';
import convenienceIcon from '@/shared/assets/map-icons/icons/icon-convenience.svg';
import hospitalIcon from '@/shared/assets/map-icons/icons/icon-hospital.svg';
import memoBadIcon from '@/shared/assets/map-icons/icons/icon-memo-bad.svg';
import memoGoodIcon from '@/shared/assets/map-icons/icons/icon-memo-good.svg';
import schoolIcon from '@/shared/assets/map-icons/icons/icon-school.svg';
import subwayStationIcon from '@/shared/assets/map-icons/icons/icon-subway-station.svg';
import agencyMarker from '@/shared/assets/map-icons/markers/marker-agency.svg';
import busStopMarker from '@/shared/assets/map-icons/markers/marker-bus-stop.svg';
import convenienceMarker from '@/shared/assets/map-icons/markers/marker-convenience.svg';
import hospitalMarker from '@/shared/assets/map-icons/markers/marker-hospital.svg';
import memoBadMarker from '@/shared/assets/map-icons/markers/marker-memo-bad.svg';
import memoGoodMarker from '@/shared/assets/map-icons/markers/marker-memo-good.svg';
import propertyMarker from '@/shared/assets/map-icons/markers/marker-property.svg';
import schoolMarker from '@/shared/assets/map-icons/markers/marker-school.svg';
import subwayStationMarker from '@/shared/assets/map-icons/markers/marker-subway-station.svg';

import type { MapCategory, MapMarker } from '../model/Map';

type MapIconVariant = MapMarker['variant'];

/** 교통 카테고리는 기본으로 버스 정류장 그림을 쓰고, variant가 subway면 지하철역 그림을 쓴다. */
const CATEGORY_ICONS: Record<Exclude<MapCategory, 'MEMO'>, string> = {
  HOSPITAL: hospitalIcon,
  TRANSPORT: busStopIcon,
  SCHOOL: schoolIcon,
  CONVENIENCE: convenienceIcon,
  AGENCY: agencyIcon,
};

const CATEGORY_MARKERS: Record<Exclude<MapCategory, 'MEMO'>, string> = {
  HOSPITAL: hospitalMarker,
  TRANSPORT: busStopMarker,
  SCHOOL: schoolMarker,
  CONVENIENCE: convenienceMarker,
  AGENCY: agencyMarker,
};

/** 목록, 버튼, 상세 카드에 쓰는 둥근 사각 아이콘. 거리 메모는 싫어요를, 교통은 지하철역을 따로 그린다. */
export const mapCategoryIconSrc = (category: MapCategory, variant?: MapIconVariant): string => {
  if (category === 'MEMO') return variant === 'negative' ? memoBadIcon : memoGoodIcon;
  if (category === 'TRANSPORT' && variant === 'subway') return subwayStationIcon;
  return CATEGORY_ICONS[category];
};

/** 지도 위 핀 이미지. 아래 꼭짓점이 좌표를 가리킨다. */
export const mapCategoryMarkerSrc = (category: MapCategory, variant?: MapIconVariant): string => {
  if (category === 'MEMO') return variant === 'negative' ? memoBadMarker : memoGoodMarker;
  if (category === 'TRANSPORT' && variant === 'subway') return subwayStationMarker;
  return CATEGORY_MARKERS[category];
};

export const propertyMarkerSrc = propertyMarker;

/** 통근 정류장 ID는 철도역이면 RS_로 시작한다. 지하철역이면 교통 variant를 subway로 둔다. */
export const stationVariant = (stopId: string): MapIconVariant => (stopId.startsWith('RS_') ? 'subway' : undefined);

export const stationIconSrc = (stopId: string): string => mapCategoryIconSrc('TRANSPORT', stationVariant(stopId));
