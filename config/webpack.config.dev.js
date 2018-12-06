const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

// App files location
const PATHS = {
  app: path.resolve(__dirname, '../frontend/js'),
  commons_frontend: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/frontend'),
  commons_server: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/server')
};

module.exports = {
  // development or production config
  mode: 'development',
  // webpack entry point (frontend/js/main.js)
  entry: {
    'main': [
      'babel-polyfill',
      'react-hot-loader/patch', 
      path.resolve(PATHS.app, 'main.js')
    ],
  },
  // webpack output location after the processing (dist-folder)
  output: {
    path: path.resolve(__dirname, '../dist'), 
    filename: '[name]-bundle.js',
    publicPath: '/'
  },
  // webpack server config in development
  devServer: {
    contentBase: path.resolve(__dirname, '../frontend'), // webpack serves files from frontend folder (index.html)
    port: 3000,
    historyApiFallback: true,
    overlay: true // displays webpack error messages also in browser window
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  stats: {
    colors: true,
    reasons: true
  },
  resolve: {
    alias: {
      commons: path.resolve(PATHS.commons_frontend, 'js'),
      styles: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/frontend/styles'),
      transformations: path.resolve(PATHS.commons_server, 'record-transformations'),
    },
    // We can now require('file') instead of require('file.jsx')
    extensions: ['.js', '.jsx', '.scss']
  },
  module: {
    rules: [
      // jsx files
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
      // font-face imports (fonts)
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        use: [
          { 
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      },
      // images
      {
        test: /\.(jpg|gif|png)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name]-[hash:8].[ext]',
              outputPath: 'images/'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    // new BundleAnalyzerPlugin({
    //   generateStatsFile: true
    // }),
    new CleanWebpackPlugin(['dist']), // removes folder and content (dist).
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
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.§.NODE_ENV': JSON.stringify('development'),
      'process.env.DATA_PROTECTION_CONSENT_URL': JSON.stringify('https://www.kiwi.fi/download/attachments/93205241/melinda-verkkok%C3%A4ytt%C3%B6liittym%C3%A4t%20asiantuntijoille.pdf?api=v2'),
      __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false'))
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })  
  ],
  devtool: 'source-map'
};
