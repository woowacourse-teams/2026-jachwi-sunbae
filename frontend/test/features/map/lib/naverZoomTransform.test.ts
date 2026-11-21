import { expect, it, vi } from 'vitest';

import { enableNaverTransformZoom } from '@/features/map/lib/naverZoomTransform';

/** SDK가 데스크탑 크롬에서 만드는 내부 도구 모양(CSS zoom 경로). */
const zoomPathSdk = () => {
  const original = {
    transform: vi.fn(),
    setScale: vi.fn(),
    translate: vi.fn(),
    getTranslate: vi.fn(),
  };
  const dom: Record<string, unknown> = {
    css3Styles: {
      transition: null,
      transform: null,
      transformOrigin: null,
      backfaceVisibility: null,
      willChange: null,
    },
    ...original,
    // SDK는 호출할 때마다 새 좌표 객체를 돌려주고, 받은 쪽이 그 객체를 고쳐 쓴다.
    getRawOffset: (element: HTMLElement) => {
      const point = {
        x: parseFloat(element.style.left) || 0,
        y: parseFloat(element.style.top) || 0,
        add(x: number, y: number) {
          point.x += x;
          point.y += y;
          return point;
        },
      };
      return point;
    },
  };
  const agent: Record<string, unknown> = { poorGPU: true, usingGPU: false };
  const maps = { Util: { DOM: dom, Agent: agent } } as unknown as NaverMapsNamespace;
  return { maps, dom, agent, original };
};
const call = (fn: unknown, ...args: unknown[]): unknown => {
  if (typeof fn !== 'function') throw new Error('함수가 아니다');
  return fn(...args) as unknown;
};

it('데스크탑 크롬의 CSS zoom 경로를 transform 경로로 바꾼다', () => {
  const { maps, dom, original } = zoomPathSdk();

  expect(enableNaverTransformZoom(maps)).toBe(true);

  // SDK의 다른 코드가 확대를 끝낼 때 이 값으로 분기하므로 함께 바꿔야 판 위치가 어긋나지 않는다.
  expect(dom.css3Styles).toMatchObject({
    transform: 'transform',
    transformOrigin: 'transformOrigin',
    transition: null,
  });
  const pane = document.createElement('div');
  call(dom.setScale, pane, 1.04, { x: 874, y: 480 });
  expect(pane.style.transform).toBe('matrix(1.04,0,0,1.04,0,0)');
  expect(pane.style.transformOrigin).toBe('874px 480px');
  // 레이아웃을 다시 계산하게 하는 속성은 쓰지 않는다.
  expect(pane.style.zoom ?? '').toBe('');
  expect(pane.style.left).toBe('');
  expect(pane.style.top).toBe('');
  expect(original.setScale).not.toHaveBeenCalled();
});

it('확대가 끝나 배율 1로 되돌리면 판을 제자리 matrix로 돌려놓는다', () => {
  const { maps, dom } = zoomPathSdk();
  enableNaverTransformZoom(maps);
  const pane = document.createElement('div');
  call(dom.setScale, pane, 2, { x: 100, y: 50 });

  call(dom.transform, pane, 1, 0, 0, { x: 0, y: 0 });

  expect(pane.style.transform).toBe('matrix(1,0,0,1,0,0)');
  expect(pane.style.transformOrigin).toBe('0px 0px');
});

it('지도를 끌어 옮긴 거리는 matrix에 쓰고, 읽을 때는 left와 top을 더해 돌려준다', () => {
  const { maps, dom } = zoomPathSdk();
  enableNaverTransformZoom(maps);
  const container = document.createElement('div');
  container.style.left = '10px';
  container.style.top = '-4px';

  call(dom.translate, container, { x: -300, y: 150.5 });

  expect(container.style.transform).toBe('matrix(1,0,0,1,-300,150.5)');
  expect(call(dom.getTranslate, container)).toMatchObject({ x: -290, y: 146.5 });
  // 아직 옮긴 적이 없는 판은 left와 top만 돌려준다.
  expect(call(dom.getTranslate, document.createElement('div'))).toMatchObject({ x: 0, y: 0 });
});

it('오버레이 확대 효과가 쓰는 퍼센트 기준점도 같은 방식으로 쓴다', () => {
  const { maps, dom } = zoomPathSdk();
  enableNaverTransformZoom(maps);
  const icon = document.createElement('div');

  call(dom.setScaleByPercent, icon, 0.5, { x: 50, y: 100 });

  expect(icon.style.transform).toBe('matrix(0.5,0,0,0.5,0,0)');
  expect(icon.style.transformOrigin).toBe('50% 100%');
});

it('두 번 불러도 한 번만 바꾼다', () => {
  const { maps, dom } = zoomPathSdk();
  expect(enableNaverTransformZoom(maps)).toBe(true);
  const patched = dom.transform;

  expect(enableNaverTransformZoom(maps)).toBe(false);
  expect(dom.transform).toBe(patched);
});

it('SDK가 이미 transform으로 확대하는 브라우저에서는 건드리지 않는다', () => {
  const { maps, dom, agent, original } = zoomPathSdk();
  agent.poorGPU = false;
  dom.css3Styles = { transform: 'transform', transformOrigin: 'transformOrigin' };

  expect(enableNaverTransformZoom(maps)).toBe(false);
  expect(dom.transform).toBe(original.transform);
});

it.each([
  ['Util이 없다', (sdk: ReturnType<typeof zoomPathSdk>) => Object.assign(sdk.maps, { Util: undefined })],
  ['DOM 도구가 없다', (sdk: ReturnType<typeof zoomPathSdk>) => Object.assign(sdk.maps, { Util: { Agent: sdk.agent } })],
  ['판정 값 이름이 바뀌었다', (sdk: ReturnType<typeof zoomPathSdk>) => delete sdk.agent.poorGPU],
  ['스타일 표가 없다', (sdk: ReturnType<typeof zoomPathSdk>) => delete sdk.dom.css3Styles],
  ['바꿔 끼울 함수가 없다', (sdk: ReturnType<typeof zoomPathSdk>) => delete sdk.dom.getTranslate],
  ['위치를 읽는 함수가 없다', (sdk: ReturnType<typeof zoomPathSdk>) => delete sdk.dom.getRawOffset],
])('SDK 내부 모양이 달라졌으면(%s) 아무것도 바꾸지 않는다', (_name, breakSdk) => {
  const sdk = zoomPathSdk();
  breakSdk(sdk);

  expect(enableNaverTransformZoom(sdk.maps)).toBe(false);
  if (sdk.dom.css3Styles !== undefined) expect(sdk.dom.css3Styles).toMatchObject({ transform: null });
  expect(sdk.dom.transform).toBe(sdk.original.transform);
  expect(sdk.dom.setScale).toBe(sdk.original.setScale);
  expect(sdk.dom.translate).toBe(sdk.original.translate);
});
