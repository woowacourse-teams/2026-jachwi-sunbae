import type { PublicConfig } from '../types/PublicConfig';

const requireHttpUrl = (value: string, variableName: string): string => {
  if (value.trim().length === 0) {
    throw new Error(`${variableName} 환경변수가 필요합니다.`);
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} 환경변수는 올바른 URL이어야 합니다.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${variableName} 환경변수는 http 또는 https URL이어야 합니다.`);
  }

  return url.toString().replace(/\/$/, '');
};

export const getPublicConfig = (): PublicConfig => {
  const mapProviderMode = typeof __MAP_PROVIDER_MODE__ === 'string' && __MAP_PROVIDER_MODE__ === 'naver'
    ? 'naver'
    : 'demo';

  if (
    mapProviderMode === 'naver' &&
    (typeof __NAVER_MAP_CLIENT_ID__ !== 'string' || __NAVER_MAP_CLIENT_ID__.trim().length === 0)
  ) {
    throw new Error('NAVER_MAP_CLIENT_ID 환경변수가 필요합니다.');
  }

  return {
    apiBaseUrl: requireHttpUrl(typeof __API_BASE_URL__ === 'string' ? __API_BASE_URL__ : '', 'API_BASE_URL'),
    mapProviderMode,
    naverMapClientId: typeof __NAVER_MAP_CLIENT_ID__ === 'string' ? __NAVER_MAP_CLIENT_ID__.trim() : '',
    metaPixelId: typeof __META_PIXEL_ID__ === 'string' ? __META_PIXEL_ID__.trim() : '',
    posthogProjectToken: typeof __POSTHOG_PROJECT_TOKEN__ === 'string' ? __POSTHOG_PROJECT_TOKEN__.trim() : '',
    posthogHost: typeof __POSTHOG_HOST__ === 'string' ? __POSTHOG_HOST__.trim() : '',
  };
};
