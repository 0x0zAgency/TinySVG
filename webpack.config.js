const path = require("path")

module.exports = {
  entry: path.resolve(__dirname, "src/tinysvg.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "tinysvg.js",
    library: "$",
    libraryTarget: "umd",
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  mode: "development",
}