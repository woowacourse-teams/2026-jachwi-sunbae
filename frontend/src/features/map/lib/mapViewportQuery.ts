import type { MapBounds } from '../model/Map';

export type MapSearchRadius = 500 | 1000 | 2000;
export type ViewportQuery = {
  center: { latitude: number; longitude: number };
  radius: MapSearchRadius;
  bounds: MapBounds;
};

const RADII: MapSearchRadius[] = [500, 1000, 2000];
const EARTH_RADIUS_METERS = 6_371_008.8;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceMeters = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) => {
  const dLatitude = toRadians(to.latitude - from.latitude);
  const dLongitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
};

/** 좌표를 소수점 5자리(약 1m)로 맞춰 같은 화면을 다시 볼 때 같은 요청이 되게 한다. */
const round = (value: number) => Math.round(value * 100_000) / 100_000;

/**
 * 지도 화면의 가운데를 중심으로, 화면 모서리까지 덮는 가장 작은 지원 반경을 고른다.
 * 서버 반경은 최대 2km라 화면이 그보다 넓으면 가운데 2km만 요청한다.
 */
export const viewportQuery = (bounds: MapBounds): ViewportQuery => {
  const center = {
    latitude: round((bounds.south + bounds.north) / 2),
    longitude: round((bounds.west + bounds.east) / 2),
  };
  const corner = distanceMeters(center, { latitude: bounds.north, longitude: bounds.east });
  return { center, radius: RADII.find((radius) => radius >= corner) ?? 2000, bounds };
};

/**
 * 정류장처럼 화면 가장자리까지 빠짐없이 보여야 하는 조회를 위한 범위 나누기.
 * 화면이 서버 최대 반경(2km)보다 넓으면 화면을 네 칸으로 나눠 칸마다 반경을 고른다. 가운데 2km만 조회하면 가장자리가 빈다.
 * 네 칸으로도 다 덮지 못할 만큼 넓으면 칸마다 가운데 2km씩만 덮는다.
 */
export const viewportTiles = (bounds: MapBounds): ViewportQuery[] => {
  const whole = viewportQuery(bounds);
  if (distanceMeters(whole.center, { latitude: bounds.north, longitude: bounds.east }) <= 2000) return [whole];
  const middle = { latitude: (bounds.south + bounds.north) / 2, longitude: (bounds.west + bounds.east) / 2 };
  return [
    { south: middle.latitude, north: bounds.north, west: bounds.west, east: middle.longitude },
    { south: middle.latitude, north: bounds.north, west: middle.longitude, east: bounds.east },
    { south: bounds.south, north: middle.latitude, west: bounds.west, east: middle.longitude },
    { south: bounds.south, north: middle.latitude, west: middle.longitude, east: bounds.east },
  ].map(viewportQuery);
};

/** 병원처럼 촘촘한 시설을 나눠 조회하는 칸 한 변. 카카오는 한 번에 거리순 45개까지만 주어, 반경 500m 조회도 도심에서는 200m 안팎만 채운다. */
export const FACILITY_CELL_METERS = 400;
/** 한 화면에서 조회하는 칸 수의 상한. 칸마다 카카오를 최대 세 번 부르므로, 넘으면 화면 가운데에 가까운 칸부터 이만큼만 조회한다. */
export const MAX_FACILITY_CELLS = 9;
const METERS_PER_LATITUDE = 111_320;

/**
 * 병원, 학교, 편의점, 중개사무소를 화면 가장자리까지 채우려고 화면을 고정된 격자 칸으로 나눈다.
 * 칸을 화면이 아니라 지구 좌표 격자에 맞춰, 지도를 조금 옮겨도 겹치는 칸은 같은 요청이 되어 캐시를 다시 쓴다.
 * 칸 가운데에서 반경 500m로 조회하면 칸 모서리(약 283m)까지 덮는다.
 */
export const facilityCells = (bounds: MapBounds): ViewportQuery[] => {
  const latitudeStep = FACILITY_CELL_METERS / METERS_PER_LATITUDE;
  const middle = { latitude: (bounds.south + bounds.north) / 2, longitude: (bounds.west + bounds.east) / 2 };
  const cells: ViewportQuery[] = [];
  for (let row = Math.floor(bounds.south / latitudeStep); row * latitudeStep < bounds.north; row++) {
    // 경도 칸 폭은 화면이 아니라 그 줄의 위도로 정해, 지도를 옮겨도 같은 자리는 같은 칸이 된다.
    const rowLatitude = (row + 0.5) * latitudeStep;
    const longitudeStep = FACILITY_CELL_METERS / (METERS_PER_LATITUDE * Math.cos(toRadians(rowLatitude)));
    for (let column = Math.floor(bounds.west / longitudeStep); column * longitudeStep < bounds.east; column++) {
      const cell = {
        south: row * latitudeStep,
        north: (row + 1) * latitudeStep,
        west: column * longitudeStep,
        east: (column + 1) * longitudeStep,
      };
      cells.push({
        center: { latitude: round((cell.south + cell.north) / 2), longitude: round((cell.west + cell.east) / 2) },
        radius: 500,
        bounds: cell,
      });
    }
  }
  return cells
    .sort((a, b) => distanceMeters(middle, a.center) - distanceMeters(middle, b.center))
    .slice(0, MAX_FACILITY_CELLS);
};

export const isInBounds = (point: { latitude: number; longitude: number }, bounds: MapBounds) =>
  point.latitude >= bounds.south &&
  point.latitude <= bounds.north &&
  point.longitude >= bounds.west &&
  point.longitude <= bounds.east;
