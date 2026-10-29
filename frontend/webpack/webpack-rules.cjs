const createModuleRules = (isProduction) => [
  {
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            ['@babel/preset-react', { runtime: 'automatic', development: !isProduction }],
            '@babel/preset-typescript',
          ],
        },
      },
    ],
    exclude: /node_modules/,
  },
  {
    // 작은 이미지도 data URI로 번들에 넣지 않고 항상 별도 파일 URL로 내보낸다.
    test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
    type: 'asset/resource',
  },
  {
    test: /\.mp4$/i,
    type: 'asset/resource',
  },
];

module.exports = { createModuleRules };
