/** 앱 셸이 화면 주소로 정하는 배치 상태. 데스크탑·휴대폰 레이아웃이 같은 기준으로 셸 속성을 단다. */
export type AppShellState = {
  fullScreen: boolean;
  isMapPage: boolean;
  isPropertyDetailPath: boolean;
  isHomeWidthPage: boolean;
  /** 휴대폰 기준 폭보다 넓은 휴대폰에서도 양옆 빈칸 없이 화면을 채우는 화면(체크리스트 편집). */
  isWidePage: boolean;
};

export const appShellAttributes = ({
  fullScreen,
  isMapPage,
  isPropertyDetailPath,
  isHomeWidthPage,
  isWidePage,
}: AppShellState) => ({
  'data-design-shell': true,
  'data-full-screen': fullScreen || undefined,
  'data-map-page': isMapPage || undefined,
  'data-wide-property-page': isPropertyDetailPath || undefined,
  'data-home-width-page': isHomeWidthPage || undefined,
  'data-wide-page': isWidePage || undefined,
});
