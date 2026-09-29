const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const createStylesRule = (isProduction) => ({
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
});

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
  createStylesRule(isProduction),
  {
    test: /\.(png|svg|jpg|jpeg|gif)$/i,
    type: 'asset',
  },
  {
    test: /\.mp4$/i,
    type: 'asset/resource',
  },
];

module.exports = { createModuleRules };
