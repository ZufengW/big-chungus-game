const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/app/app.ts',
  plugins: [
    new CleanWebpackPlugin(['public/']),
    new CopyWebpackPlugin([ { from: 'src/assets', to: 'assets' } ]),
    new HtmlWebpackPlugin({
      template: 'src/templates/index.html'
    }),
  ],
  output: {
    path: __dirname + '/public',
    filename: 'build/[name].[contenthash].js',
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  }
};
