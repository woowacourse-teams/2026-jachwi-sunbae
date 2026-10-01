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
    const rules = (webpackConfig.module?.rules ?? []).map((rule) => {
      if (
        rule === undefined ||
        typeof rule !== 'object' ||
        !('test' in rule) ||
        !(rule.test instanceof RegExp) ||
        !rule.test.test('example.css') ||
        !('use' in rule) ||
        !Array.isArray(rule.use)
      ) {
        return rule;
      }

      return {
        ...rule,
        use: rule.use.map((loader) => {
          if (
            loader === undefined ||
            typeof loader !== 'object' ||
            !('loader' in loader) ||
            typeof loader.loader !== 'string' ||
            !loader.loader.includes('css-loader')
          ) {
            return loader;
          }

          return {
            ...loader,
            options: {
              ...(typeof loader.options === 'object' && loader.options !== null ? loader.options : {}),
              modules: {
                auto: /\.module\.css$/i,
                namedExport: false,
                exportLocalsConvention: 'camel-case-only',
              },
            },
          };
        }),
      };
    });

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
          ...rules,
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
