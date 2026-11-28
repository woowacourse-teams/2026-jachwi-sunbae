/**
 * 지도 시점을 부드럽게 옮기는 단계 계획.
 *
 * 네이버 지도의 `morph`와 `panTo`는 옮길 거리가 화면보다 꽤 멀면 애니메이션 없이 그 자리로 바로 넘어간다
 * (휴대폰 폭에서 확대 단계 16 기준 3km는 움직이고 4km부터는 순간 이동했다). 확대 단계와 가운데를 함께 바꿔도 바로 넘어간다.
 * 그래서 먼 곳은 (1) 그 자리에서 두 곳이 한 화면에 들 만큼 줄이고, (2) 줄인 채로 옮긴 뒤, (3) 다시 확대한다.
 * 각 단계는 한 가지(확대 단계 또는 가운데)만 바꾸고, 옮기는 거리는 화면 크기 안이라 SDK가 애니메이션으로 그린다.
 */

/** 한 번의 `morph`. `zoom`은 네이버 확대 단계(클수록 가까움)다. */
export type ViewFlightStep<Point> = { center: Point; zoom: number; duration: number };

/** 가까운 곳으로 옮길 때 한 번에 움직이는 시간. 이전부터 써 온 값이다. */
export const NEAR_MOVE_MS = 180;
/** 먼 곳으로 갈 때 줄이기, 옮기기, 확대하기 각 단계 시간. */
export const FLIGHT_ZOOM_MS = 260;
export const FLIGHT_PAN_MS = 420;

type FlightInput<Point> = {
  from: Point;
  fromZoom: number;
  to: Point;
  toZoom: number;
  /** 지금 확대 단계에서 두 곳 사이 화면 거리(px). */
  distancePx: number;
  /** 지도 칸 크기(px). */
  viewport: { width: number; height: number };
  /** 더 줄일 수 없는 확대 단계. */
  minZoom: number;
};

/**
 * 시점을 옮길 `morph` 단계들. 가까우면 한 단계, 멀면 줄이기, 옮기기, 확대하기의 최대 세 단계다.
 * 거리(확대하며 옮기면 도착 단계에서 잰 거리)가 화면 긴 변 안이면 SDK가 한 번에 부드럽게 옮긴다.
 */
export function planViewFlight<Point>({
  from,
  fromZoom,
  to,
  toZoom,
  distancePx,
  viewport,
  minZoom,
}: FlightInput<Point>): ViewFlightStep<Point>[] {
  const limit = Math.max(1, Math.max(viewport.width, viewport.height));
  if (!Number.isFinite(distancePx)) return [{ center: to, zoom: toZoom, duration: NEAR_MOVE_MS }];
  // 확대하며 옮기면 도착 단계에서 잰 거리로 판단된다(멀리 본 채로 가까워도 확대하며 옮기면 바로 넘어갔다).
  if (distancePx * 2 ** Math.max(0, toZoom - fromZoom) <= limit)
    return [{ center: to, zoom: toZoom, duration: NEAR_MOVE_MS }];
  // 확대 단계를 하나 줄일 때마다 화면 거리는 절반이 된다.
  const zoomOut = Math.ceil(Math.log2(distancePx / limit));
  const flightZoom = Math.max(minZoom, Math.min(fromZoom, toZoom, fromZoom - zoomOut));
  const steps: ViewFlightStep<Point>[] = [];
  if (flightZoom < fromZoom) steps.push({ center: from, zoom: flightZoom, duration: FLIGHT_ZOOM_MS });
  steps.push({ center: to, zoom: flightZoom, duration: FLIGHT_PAN_MS });
  if (flightZoom < toZoom) steps.push({ center: to, zoom: toZoom, duration: FLIGHT_ZOOM_MS });
  return steps;
}

/** 단계들을 모두 마치는 데 걸리는 시간(ms). */
export const viewFlightDuration = (steps: readonly ViewFlightStep<unknown>[]): number =>
  steps.reduce((total, step) => total + step.duration, 0);
