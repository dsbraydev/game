const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      },
      { // this loader is for files referenced from html, if there is a file
        test: /\.(png|svg|jpg|jpeg|gif|mp4|webp|ico)$/i,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    path: path.resolve('./dist'),
    filename: `game.js`,
    publicPath: './',
    assetModuleFilename: (pathData) => { // keeps the folder structure
      const filepath = path
        .dirname(pathData.filename)
        .split('/')
        .slice(1)
        .join('/')
      return `${filepath}/[name][ext][query]`
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `[name].css`
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      favicon: 'src/favicon.ico',
      minify: {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        removeComments: true
      }
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/Audio',
          to: `Audio/[path][name][ext]`,
          noErrorOnMissing: true
        },
        {
          from: 'src/Models',
          to: `Models/[path][name][ext]`,
          noErrorOnMissing: true
        },
        {
          from: 'src/Region',
          to: `Region/[path][name][ext]`,
          noErrorOnMissing: true
        },
        {
          from: 'src/Textures',
          to: `Textures/[path][name][ext]`,
          noErrorOnMissing: true
        },
        {
          from: 'src/Videos',
          to: `Videos/[path][name][ext]`,
          noErrorOnMissing: true
        },
        {
          from: 'src/Animations',
          to: `Animations/[path][name][ext]`,
          noErrorOnMissing: true
        }
      ]
    })
  ]
}
