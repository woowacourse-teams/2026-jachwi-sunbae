/** 지도가 붙이는 SDK `<script>`. 이미 붙었으면 미리 받을 필요가 없다. */
export const NAVER_SDK_SCRIPT_SELECTOR = 'script[data-jachwi-naver-map]';
export const naverSdkUrl = (clientId: string) =>
  `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=gl&callback=jachwiNaverSdkReady`;
export const NAVER_GL_SCRIPT_URL = 'https://oapi.map.naver.com/openapi/v3/maps-gl.js';

/**
 * 지도를 그리기 전에 SDK 파일 받기만 먼저 시작한다. 실행은 지금처럼 지도가 붙을 때 `load`가 한다.
 * 일찍 실행하면 `maps-gl.js` 실행(느린 휴대폰에서 약 2초)이 매물 목록을 그리는 일과 메인 스레드를 다퉈 첫 화면이 늦어졌다.
 * 두 파일 모두 하루 캐시라 나중에 붙는 `<script>`가 받아 둔 응답을 쓴다. `maps-gl.js`는 `maps.js`가 부르는 고정 주소다.
 * 주소가 바뀌어도 받아 둔 파일을 쓰지 않을 뿐 지도는 그대로 뜬다.
 *
 * 지도 엔진(`naverMapEngine`)과 파일을 나눈 이유: 첫 진입에서 화면 청크를 받는 동안 부르려면 이 함수가 첫 번들에 있어야 하는데,
 * 엔진까지 첫 번들에 실으면 지도가 없는 화면도 그 코드를 받는다.
 */
export const preloadNaverSdk = (clientId: string): void => {
  if (clientId === '' || window.naver?.maps != null || document.querySelector(NAVER_SDK_SCRIPT_SELECTOR) !== null)
    return;
  const preloaded = new Set(
    [...document.querySelectorAll('link[rel="preload"]')].map((link) => link.getAttribute('href')),
  );
  for (const href of [naverSdkUrl(clientId), NAVER_GL_SCRIPT_URL]) {
    if (preloaded.has(href)) continue;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.setAttribute('as', 'script');
    link.href = href;
    document.head.append(link);
  }
};
