const path = require('path');
const environment = require('./configuration/environment');

module.exports = {
  entry: {
    app: path.resolve(environment.paths.source, 'index.js'),
  },
  output: {
    filename: 'main.js',
    path: environment.paths.output,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader:"babel-loader",
          options: {
            presets: ['@babel/preset-env']
          }
        },
      },
    ],
  },
  target: 'web',
};
