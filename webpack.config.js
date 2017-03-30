const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    index: './src/js.js',
    background: './src/background.js',
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },

  resolve: {
    alias: {
      react: 'react-lite',
      'react-dom': 'react-lite',
    },
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'eslint-loader',
        include: /.\//,
        exclude: /.\/dist/,
        enforce: 'pre',
      },
      {
        test: /\.js$/,
        include: /.\//,
        exclude: /.\/dist/,
        loader: 'babel-loader',
      },
      {
        test: /\.styl$/,
        include: /.\//,
        exclude: /.\/dist/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'stylus-loader?{"resolve url":1}'],
        }),
      },
    ],
  },

  plugins: [
    new ExtractTextPlugin({
      filename: 'index.css',
      allChunks: true,
    }),

    new webpack.LoaderOptionsPlugin({
      options: {
        eslint: {
          failOnError: true,
        },
      },
    }),
  ],
};
