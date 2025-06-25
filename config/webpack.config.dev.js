const common = require("./webpack.config.common.js");
const { merge } = require("webpack-merge");

module.exports = (env) => {
  return merge(common, {
    mode: "development",
    devtool: "eval",
    output: {
      publicPath: env.WEBPACK_SERVE ? "/" : "./",
    },
    entry: [`./src/Script/base/appStart/localdev.ts`, "./src/Script/game.ts"],
    devServer: {
      host: "localhost",
      port: 10001, // port that we're using for local host (localhost:10001)
      static: {
        directory: "./dist", // tells webpack to serve from the dist folder
      },
      // hot: true, Unfortunately this doesn't work with HtmlWebpackPlugin (doesn't update html changes) so we rather just reload on any change
      hot: false,
      open: true,
      server: {
        type: "http",
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  });
};
