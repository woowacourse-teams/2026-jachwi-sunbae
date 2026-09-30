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
                  ['@babel/preset-react', { runtime: 'automatic', development: true }],
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
