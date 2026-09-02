const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// 로컬 개발용 키는 .env.local 에 둔다(저장소에 커밋하지 않는다). 이미 설정된 환경 변수를 덮어쓰지 않는다.
const loadLocalEnv = () => {
  const envPath = path.resolve(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match === null) continue;
    if (process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
};

loadLocalEnv();

const shouldAnalyze = process.env.ANALYZE === 'true';
const isBrowserTestHarness = process.env.BROWSER_TEST_HARNESS === 'true';

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';
  const isMockingEnabled = !isProduction && process.env.ENABLE_MSW !== 'false';
  const apiBaseUrl = process.env.API_BASE_URL ?? (isMockingEnabled ? 'http://127.0.0.1:3000' : 'http://localhost:8080');

  const naverMapClientId = process.env.NAVER_MAP_CLIENT_ID ?? '';
  // 배포 빌드는 항상 실제 Naver 지도를 사용한다. 키가 없으면 앱 설정 오류를 보여 주고
  // 데모 지도로 조용히 대체하지 않아 배포 설정 누락을 바로 발견할 수 있게 한다.
  const mapProviderMode = isProduction
    ? 'naver'
    : (process.env.MAP_PROVIDER_MODE ?? (naverMapClientId === '' ? 'demo' : 'naver'));
  const metaPixelId = process.env.META_PIXEL_ID ?? '';
  const posthogProjectToken = process.env.POSTHOG_PROJECT_TOKEN ?? '';
  const posthogHost = process.env.POSTHOG_HOST ?? '';

  return {
    entry: isBrowserTestHarness ? './src/test-browser/main.tsx' : './src/main.tsx',
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    },
    devtool: isProduction ? false : 'eval-cheap-module-source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      // 운영에서만 contenthash 를 붙인다. 내용이 바뀌면 파일명이 바뀌므로 CDN 캐시를 무효화하지 않아도
      // 브라우저가 새 파일을 받는다. 개발에서는 파일명이 매번 바뀌면 dev-server 의 HMR 이 불편해진다.
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash].js' : '[name].js',
      assetModuleFilename: isProduction ? 'assets/[name].[contenthash][ext]' : 'assets/[name][ext]',
      publicPath: '/',
      clean: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        __API_BASE_URL__: JSON.stringify(apiBaseUrl),
        __MAP_PROVIDER_MODE__: JSON.stringify(mapProviderMode),
        __NAVER_MAP_CLIENT_ID__: JSON.stringify(naverMapClientId),
        __META_PIXEL_ID__: JSON.stringify(metaPixelId),
        __POSTHOG_PROJECT_TOKEN__: JSON.stringify(posthogProjectToken),
        __POSTHOG_HOST__: JSON.stringify(posthogHost),
        __ENABLE_MSW__: JSON.stringify(isMockingEnabled),
      }),
      new HtmlWebpackPlugin({
        template: './index.html',
        filename: 'index.html',
        inject: true,
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: '[name].[contenthash].css',
              chunkFilename: '[name].[contenthash].css',
            }),
          ]
        : []),
      new BundleAnalyzerPlugin({
        analyzerMode: shouldAnalyze ? 'static' : 'disabled',
        reportFilename: 'bundle-report.html',
        openAnalyzer: false,
      }),
    ],
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/preset-env',
                  // development 를 명시한다. webpack 의 --mode production 은 번들 안의 NODE_ENV 만 바꾸고
                  // 빌드 프로세스의 NODE_ENV 는 건드리지 않는다. babel 이 그걸 기본값 development 로 보고
                  // jsxDEV 를 내보내면, React 19 의 운영 런타임에 그 함수가 없어 화면이 뜨지 않는다.
                  ['@babel/preset-react', { runtime: 'automatic', development: !isProduction }],
                  '@babel/preset-typescript',
                ],
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: /\.module\.css$/i,
                  namedExport: false,
                  exportLocalsConvention: 'camel-case-only',
                  localIdentName: isProduction ? '[hash:base64:6]' : '[name]__[local]__[hash:base64:5]',
                },
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset',
        },
        {
          test: /\.mp4$/i,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    performance: {
      maxAssetSize: 350 * 1024,
      maxEntrypointSize: 350 * 1024,
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      port: 3000,
      open: false,
      hot: true,
      historyApiFallback: true,
      client: {
        overlay: true,
      },
    },
  };
};
