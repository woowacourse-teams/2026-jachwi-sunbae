const webpack = require('webpack');
const fs = require('node:fs');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const path = require('node:path');
const packageVersion = require('../package.json').version;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { createBoundaryAssets, compressBrotli } = require('./admin-boundary-assets.cjs');

// 파일만 배포 산출물에 복사한다. HTML이나 초기 JS에서 다운로드하지 않는다.
class AdminBoundaryAssetsPlugin {
  /** `brotli`가 true면 시도별 경계 파일의 brotli 파일(`.geojson.br`)도 만든다. 압축에 십여 초가 걸려 운영 빌드에서만 켠다. */
  constructor({ brotli = false } = {}) {
    this.brotli = brotli;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('AdminBoundaryAssets', (compilation) => {
      const sourcePath = path.resolve(__dirname, '../data/admin-dongs.geojson');
      compilation.fileDependencies.add(sourcePath);
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'AdminBoundaryAssets',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        async () => {
          const assets = createBoundaryAssets(fs.readFileSync(sourcePath));
          const files = {};
          for (const kind of ['emd', 'lio', 'sig']) {
            const legalPath = path.resolve(__dirname, `../data/legal-${kind}.geojson`);
            compilation.fileDependencies.add(legalPath);
            const source = fs.readFileSync(legalPath);
            const hash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 12);
            const filename = `legal-${kind}.${hash}.geojson`;
            files[kind] = filename;
            compilation.emitAsset(`boundaries/${filename}`, new webpack.sources.RawSource(source));
            compilation.emitAsset(`boundaries/${filename}.gz`, new webpack.sources.RawSource(zlib.gzipSync(source)));
          }
          compilation.emitAsset(
            'boundaries/legal-manifest.json',
            new webpack.sources.RawSource(JSON.stringify({ files })),
          );
          for (const [filename, content] of [
            ...assets.partitions.flatMap((part) => [
              [part.filename, part.source],
              [`${part.filename}.gz`, part.gzip],
            ]),
            [assets.filename, assets.source],
            [`${assets.filename}.gz`, assets.gzip],
            ['manifest.json', assets.manifest],
          ])
            compilation.emitAsset(`boundaries/${filename}`, new webpack.sources.RawSource(content));
          // 전국 파일과 법정동 파일은 화면이 받지 않거나 드물게 받아 gzip만 둔다.
          if (!this.brotli) return;
          const compressed = await Promise.all(assets.partitions.map((part) => compressBrotli(part.source)));
          for (const [index, part] of assets.partitions.entries())
            compilation.emitAsset(`boundaries/${part.filename}.br`, new webpack.sources.RawSource(compressed[index]));
        },
      );
    });
  }
}

// 검색엔진이 사이트 루트에서 찾는 파일. 개발 서버는 public을 그대로 서빙하므로 빌드에만 복사한다.
const SEO_FILES = ['robots.txt', 'sitemap.xml'];

class SeoFilesPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('SeoFiles', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'SeoFiles', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        () => {
          for (const filename of SEO_FILES) {
            const sourcePath = path.resolve(__dirname, '../public', filename);
            compilation.fileDependencies.add(sourcePath);
            compilation.emitAsset(filename, new webpack.sources.RawSource(fs.readFileSync(sourcePath)));
          }
        },
      );
    });
  }
}

const createPlugins = ({ isProduction, buildEnvironment }) => [
  new AdminBoundaryAssetsPlugin({ brotli: isProduction }),
  new SeoFilesPlugin(),
  new webpack.DefinePlugin({
    __API_BASE_URL__: JSON.stringify(buildEnvironment.apiBaseUrl),
    __MAP_PROVIDER_MODE__: JSON.stringify(buildEnvironment.mapProviderMode),
    __NAVER_MAP_CLIENT_ID__: JSON.stringify(buildEnvironment.naverMapClientId),
    __POSTHOG_PROJECT_TOKEN__: JSON.stringify(buildEnvironment.posthogProjectToken),
    __POSTHOG_HOST__: JSON.stringify(buildEnvironment.posthogHost),
    __APP_VERSION__: JSON.stringify(buildEnvironment.appVersion ?? packageVersion),
    __APP_ENVIRONMENT__: JSON.stringify(buildEnvironment.appEnvironment),
    __ENABLE_MSW__: JSON.stringify(buildEnvironment.isMockingEnabled),
    __COMMUTE_DATA_SOURCE__: JSON.stringify(buildEnvironment.commuteDataSource),
    __ADMIN_BOUNDARY_BASE_URL__: JSON.stringify(buildEnvironment.boundaryBaseUrl),
  }),
  new HtmlWebpackPlugin({
    template: './index.html',
    filename: 'index.html',
    inject: true,
  }),
  new BundleAnalyzerPlugin({
    analyzerMode: process.env.ANALYZE === 'true' ? 'static' : 'disabled',
    reportFilename: 'bundle-report.html',
    openAnalyzer: false,
  }),
];

module.exports = { createPlugins };
