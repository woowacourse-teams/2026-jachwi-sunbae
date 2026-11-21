/**
 * 네이버 지도(v3, GL이 아닌 타일 지도)의 확대 애니메이션을 CSS `zoom` 대신 `transform`으로 돌린다.
 *
 * SDK는 데스크탑 크롬 계열만 `Agent.poorGPU`로 판정해 CSS transform 지원 확인을 건너뛴다.
 * 그러면 확대하는 동안 타일 판에 `zoom`과 `left`, `top`을 프레임마다 다시 써서, 프레임마다 레이아웃을 다시 계산하고
 * 타일 이미지가 전부 "밀린 요소"로 잡힌다. 마우스 휠은 CLS가 빼 주는 입력이 아니라서 휠 확대 네 번에 CLS가 1.4 넘게 쌓였다.
 * 휴대폰과 사파리, 파이어폭스에서는 SDK가 원래 `transform: matrix()`로 확대한다. 그 경로의 함수를 그대로 옮겨 끼운다.
 *
 * `Util.DOM`과 `Util.Agent`는 공개 문서에 없는 내부 도구라 모양을 확인한 뒤에만 바꾼다.
 * 모양이 달라졌으면 아무것도 하지 않고 false를 돌려주며, 지도는 SDK 기본 방식대로 움직인다.
 * 첫 지도를 만들기 전에 불러야 한다. 지도가 선 뒤에 바꾸면 이미 `left`, `top`으로 놓인 판과 어긋난다.
 */
type Offset = { x: number; y: number };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const hasAdd = (value: unknown): value is { add: (x: number, y: number) => unknown } =>
  isRecord(value) && typeof value.add === 'function';

const REPLACED = ['transform', 'setScale', 'translate', 'getTranslate'] as const;
const MATRIX_PATTERN = /matrix\(([^)]+)\)/;

const applyMatrix = (
  element: HTMLElement,
  scale: number,
  x: number,
  y: number,
  origin: Offset | undefined,
  unit: 'px' | '%',
) => {
  element.style.transform = `matrix(${scale},0,0,${scale},${x},${y})`;
  element.style.transformOrigin = `${origin?.x ?? 0}${unit} ${origin?.y ?? 0}${unit}`;
};

export const enableNaverTransformZoom = (maps: NaverMapsNamespace): boolean => {
  const util = maps.Util;
  if (!isRecord(util)) return false;
  const { DOM: dom, Agent: agent } = util;
  if (!isRecord(dom) || !isRecord(agent) || agent.poorGPU !== true) return false;
  const styles = dom.css3Styles;
  // 이미 transform 경로이거나(다른 브라우저, 두 번째 호출) 내부 모양이 바뀌었으면 건드리지 않는다.
  if (!isRecord(styles) || styles.transform !== null || styles.transformOrigin !== null) return false;
  if (REPLACED.some((name) => typeof dom[name] !== 'function')) return false;
  if (!('transform' in document.documentElement.style)) return false;
  const getRawOffset = dom.getRawOffset;
  if (typeof getRawOffset !== 'function') return false;

  styles.transform = 'transform';
  styles.transformOrigin = 'transformOrigin';
  dom.transform = (element: HTMLElement, scale: number, x: number, y: number, origin?: Offset) =>
    applyMatrix(element, scale, x, y, origin, 'px');
  dom.setScale = (element: HTMLElement, scale: number, origin?: Offset) =>
    applyMatrix(element, scale, 0, 0, origin, 'px');
  dom.setScaleByPercent = (element: HTMLElement, scale: number, origin?: Offset) =>
    applyMatrix(element, scale, 0, 0, origin, '%');
  dom.translate = (element: HTMLElement, offset: Offset) =>
    applyMatrix(element, 1, offset.x, offset.y, undefined, 'px');
  // 판의 위치는 matrix의 이동 값에 `left`, `top`을 더한 값이다. SDK가 돌려받은 좌표를 바로 고쳐 쓰므로 SDK의 좌표 객체로 돌려준다.
  dom.getTranslate = (element: HTMLElement): unknown => {
    const offset: unknown = getRawOffset.call(dom, element);
    const parts = MATRIX_PATTERN.exec(element.style.transform)?.[1].split(',') ?? [];
    if (hasAdd(offset) && parts.length === 6) offset.add(parseFloat(parts[4]), parseFloat(parts[5]));
    return offset;
  };
  return true;
};
