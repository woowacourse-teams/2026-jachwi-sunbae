import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';

import EntryMapSdkPreload from '@/app/router/EntryMapSdkPreload';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';
import type { PublicConfig } from '@/shared/config/publicConfigTypes';

const NAVER: PublicConfig = { apiBaseUrl: 'https://api.test', mapProviderMode: 'naver', naverMapClientId: 'test' };
const preloads = () =>
  [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="script"]')].map((link) => link.href);
const enter = (path: string, config: PublicConfig = NAVER) =>
  render(
    <PublicConfigProvider config={config}>
      <MemoryRouter initialEntries={[path]}>
        <EntryMapSdkPreload />
      </MemoryRouter>
    </PublicConfigProvider>,
  );

afterEach(() => {
  document.querySelectorAll('link[rel="preload"]').forEach((link) => link.remove());
  sessionStorage.clear();
});

it('홈으로 처음 들어오면 화면 청크를 기다리지 않고 지도 SDK 두 파일을 받기 시작한다', () => {
  enter('/');
  expect(preloads()).toEqual([
    'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=test&submodules=gl&callback=jachwiNaverSdkReady',
    'https://oapi.map.naver.com/openapi/v3/maps-gl.js',
  ]);
});

it('동네 찾기로 처음 들어와도 지도 SDK를 받기 시작한다', () => {
  enter('/neighborhoods');
  expect(preloads()).toHaveLength(2);
});

it('지도를 바로 그리지 않는 화면으로 들어오면 받지 않는다', () => {
  enter('/landing');
  enter('/?view=list');
  expect(preloads()).toHaveLength(0);
});

it('데모 지도나 Client ID가 없는 설정에서는 받지 않는다', () => {
  enter('/', { apiBaseUrl: 'https://api.test', mapProviderMode: 'demo', naverMapClientId: 'test' });
  enter('/', { apiBaseUrl: 'https://api.test', mapProviderMode: 'naver' });
  expect(preloads()).toHaveLength(0);
});
