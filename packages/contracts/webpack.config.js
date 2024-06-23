const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');

const baseConfig = {
  mode: 'production',
  entry: './src/index.ts',
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "os": require.resolve("os-browserify/browser"),
      "path": require.resolve("path-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "vm": require.resolve("vm-browserify"),
      "bufferutil": false,
      "utf-8-validate": false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
    usedExports: true,
  },
};

const esmConfig = merge(baseConfig, {
  output: {
    filename: 'iohtee-contracts.min.mjs',
    path: path.resolve(__dirname, 'lib-bundle/esm'),
    library: {
      type: 'module',
    },
    module: true,
  },
  experiments: {
    outputModule: true,
  },
});

const cjsConfig = merge(baseConfig, {
  output: {
    filename: 'iohtee-contracts.min.cjs',
    path: path.resolve(__dirname, 'lib-bundle/cjs'),
    library: {
      type: 'commonjs',
    },
  },
  target: 'node',
});

module.exports = [esmConfig, cjsConfig];
