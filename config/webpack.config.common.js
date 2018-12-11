const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const PATHS = require('./paths');

// App files location

// const PATHS = {
//   app: path.resolve(__dirname, '../frontend/js'),
//   commons_frontend: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/frontend'),
//   commons_server: path.resolve(__dirname, '../node_modules/@natlibfi/melinda-ui-commons/dist/server')
// };

module.exports = {
  // separates app.js and vendor files (node_modules)
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
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
      }
    ]
  },
  plugins: [
    // visual map of webpack output files, comment off for use
    
    // new BundleAnalyzerPlugin({
    //   generateStatsFile: true
    // }),

    // removes folder and content (dist).
    new CleanWebpackPlugin(['dist']),
    // generates index.html
    new HtmlWebpackPlugin(
      {
        title: 'Muuntaja',
        template: './frontend/index.html',
        favicon: './frontend/favicon.png',
        filename: 'index.html'
      }
    ),
    // extracts CSS into separate file(s)
    new MiniCssExtractPlugin({
      filename: 'styles.[hash].css'
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    // for global jquery use
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    // only fi locale import instead of all (moment)
    new webpack.ContextReplacementPlugin(
      /moment[/\\]locale$/,/fi/
    )  
  ]
};
