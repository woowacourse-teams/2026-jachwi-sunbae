import type { MapCoordinate } from '@/features/map/lib/mapLocation';

/** 결과 지도에서 동네를 고르면 다가가는 확대 단계(작을수록 가까움). 동네 하나가 화면을 채울 만큼이다. */
export const AREA_FOCUS_LEVEL = 5;
/** 데스크탑에서 출발 정류장을 고르면 다가가는 확대 단계. 주변 정류장·부동산 마커가 함께 보일 만큼 가깝다. */
export const STATION_FOCUS_LEVEL = 3;
/** 동네를 고르지 않은 결과 지도의 확대 단계. 결과 동네 전체가 보이도록 멀리 둔다. */
export const RESULT_OVERVIEW_LEVEL = 10;

/** Web Mercator의 픽셀 간격을 사용해 결과가 지도 중앙보다 48px 위에 보이게 한다. */
export const resultMapCenter = (point: MapCoordinate, level: number): MapCoordinate => {
  const latitude = (Math.max(-85, Math.min(85, point.latitude)) * Math.PI) / 180;
  const worldSize = 256 * 2 ** (20 - level);
  const y = (1 - Math.log(Math.tan(Math.PI / 4 + latitude / 2)) / Math.PI) / 2;
  const shiftedLatitude = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 48 / worldSize)))) * 180) / Math.PI;
  return { latitude: shiftedLatitude, longitude: point.longitude };
};
