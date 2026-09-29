import { createContext, type ReactNode, use } from 'react';

import type { PublicConfig } from './publicConfigTypes';

const PublicConfigContext = createContext<PublicConfig | null>(null);

type PublicConfigProviderProps = {
  config: PublicConfig;
  children: ReactNode;
};

/** 빌드 때 정해진 공개 설정을 앱 전체에 제공한다. 테스트는 원하는 설정을 넣어 감싼다. */
export const PublicConfigProvider = ({ config, children }: PublicConfigProviderProps) => (
  <PublicConfigContext value={config}>{children}</PublicConfigContext>
);

export const usePublicConfig = (): PublicConfig => {
  const config = use(PublicConfigContext);
  if (config === null) throw new Error('PublicConfigProvider 안에서만 공개 설정을 읽을 수 있습니다.');
  return config;
};
