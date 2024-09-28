const path = require('path');

module.exports = {
  mode: 'production',// mode: 'development',
  entry: './globe/main.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'minimal-globe.js',
    path: path.resolve(__dirname, 'build'),
  },
};
