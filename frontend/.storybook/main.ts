import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-webpack5';

const storybookDirectory = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (webpackConfig) => {
    return {
      ...webpackConfig,
      experiments: {
        ...webpackConfig.experiments,
        typescript: false,
      },
      module: {
        ...webpackConfig.module,
        rules: [
          {
            test: /\.(ts|tsx)$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/preset-env',
                  // React 19 운영 런타임에는 jsxDEV가 없어 GitHub Pages 정적 빌드가 렌더링되지 않는다.
                  // Storybook은 공유용 정적 산출물을 배포하므로 운영 JSX 런타임을 사용한다.
                  ['@babel/preset-react', { runtime: 'automatic', development: false }],
                  '@babel/preset-typescript',
                ],
              },
            },
          },
          ...(webpackConfig.module?.rules ?? []),
        ],
      },
      resolve: {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve?.alias,
          '@': path.resolve(storybookDirectory, '../src'),
        },
      },
    };
  },
};

export default config;
