/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
module.exports = {
  projectRoot: __dirname,
  watchFolders: [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../share'),
    path.join(__dirname, '../node_modules'),
    path.join(__dirname, '../e2e'),
    path.join(__dirname, "../../../packages/editor")
  ],
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs'],
    extraNodeModules: {
      "react": path.join(__dirname, "../node_modules/react"),
      "react-dom": path.join(__dirname, "../node_modules/react-dom")
    }
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true
      }
    })
  }
};
