import type { MapCoordinate } from './mapLocation';

/** 가려지지 않은 영역의 가운데에 좌표가 보이도록 지도 중심을 옮긴다. Naver GL의 512px 타일 기준이다. */
export const centerWithInsets = (
  point: MapCoordinate,
  level: number,
  padding: { left: number; right: number; top: number; bottom: number },
): MapCoordinate => {
  const worldSize = 512 * 2 ** (20 - level);
  const latitude = (Math.max(-85, Math.min(85, point.latitude)) * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(Math.PI / 4 + latitude / 2)) / Math.PI) / 2;
  return {
    latitude:
      (Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + (padding.bottom - padding.top) / 2 / worldSize)))) * 180) / Math.PI,
    longitude: point.longitude + ((padding.right - padding.left) / 2 / worldSize) * 360,
  };
};
