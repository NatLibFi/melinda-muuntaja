const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

// App files location
const PATHS = {
  app: path.resolve(__dirname, '../frontend/js'),
  commons_frontend: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/frontend'),
  commons_styles: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/frontend/styles'),
  commons_server: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/server'),
  commons_images: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/frontend/images'),
  images: path.resolve(__dirname, '../frontend/images'),
  build: path.resolve(__dirname, '../dist/public')
};

const plugins = [
  new CleanWebpackPlugin(['dist']), // removes folder and content.
  new HtmlWebpackPlugin(
    {
      title: 'Muuntaja',
      template: './frontend/index.html',
      favicon: './frontend/favicon.png',
      filename: 'index.html'
    }
  ),
  new MiniCssExtractPlugin({
    filename: 'styles.[hash].css'
  }),
  new CopyWebpackPlugin([
    {
      from: PATHS.commons_images,
      to: 'images'
    }
  ]),
  // Avoid publishing files when compilation fails
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.DATA_PROTECTION_CONSENT_URL': JSON.stringify('https://www.kiwi.fi/download/attachments/93205241/melinda-verkkok%C3%A4ytt%C3%B6liittym%C3%A4t%20asiantuntijoille.pdf?api=v2'),
    __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false'))
  }),
  new webpack.optimize.OccurrenceOrderPlugin()
];

module.exports = {
  mode: 'production',
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  entry: {
    'js/app': path.resolve(PATHS.app, 'main.js')
  },
  output: {
    path: PATHS.build,
    filename: '[name].js',
    publicPath: '/'
  },
  stats: {
    colors: true
  },
  resolve: {
    alias: {
      commons: path.resolve(PATHS.commons_frontend, 'js'),
      styles: PATHS.commons_styles,
      transformations: path.resolve(PATHS.commons_server, 'record-transformations'),
    },
    // We can now require('file') instead of require('file.jsx')
    extensions: ['.js', '.jsx', '.scss']
  },
  module: { 
    rules: [
      {
        test: /\.jsx?$/,
        loaders: ['babel-loader'],
        include: [PATHS.app, PATHS.commons_frontend, PATHS.commons_server]
      },
      // css files
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'
        ]
      },
      // scss files
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'
        ]
      },
      // Inline base64 URLs for <=8k images, direct URLs for the rest
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        loader: 'url-loader?limit=8192&name=images/[name].[ext]?[hash]'
      },
      {
        test: /\.(woff|woff2|eot|ttf)$/,
        loader: 'url-loader?limit=8192&name=fonts/[name].[ext]?[hash]'
      }
    ]
  },
  plugins: plugins,
  devtool: 'source-map'
};
