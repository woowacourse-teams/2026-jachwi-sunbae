/** 앱 셸이 화면 주소로 정하는 배치 상태. 데스크탑·휴대폰 레이아웃이 같은 기준으로 셸 속성을 단다. */
export type AppShellState = {
  fullScreen: boolean;
  isMapPage: boolean;
  isPropertyDetailPath: boolean;
  isHomeWidthPage: boolean;
};

export const appShellAttributes = ({
  fullScreen,
  isMapPage,
  isPropertyDetailPath,
  isHomeWidthPage,
}: AppShellState) => ({
  'data-design-shell': true,
  'data-full-screen': fullScreen || undefined,
  'data-map-page': isMapPage || undefined,
  'data-wide-property-page': isPropertyDetailPath || undefined,
  'data-home-width-page': isHomeWidthPage || undefined,
});
