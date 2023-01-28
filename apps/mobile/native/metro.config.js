/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const nodeModulesPaths = [path.resolve(path.join(__dirname, '../node_modules'))];
module.exports = {
  projectRoot: __dirname,
  watchFolders: [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../share'),
    path.join(__dirname, '../node_modules'),
    path.join(__dirname, '../e2e'),
    path.join(__dirname, "../../../packages"),
  ],
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs'],
    nodeModulesPaths,
    extraNodeModules: {
      "react": path.join(__dirname, "../node_modules/react"),
      "@types/react": path.join(__dirname, "../node_modules/@types/react"),
      "react-dom": path.join(__dirname, "../node_modules/react-dom"),
      "@notesnook":  path.join(__dirname, "../../../packages"),
      "@notifee/react-native": path.join(__dirname, "../node_modules/@ammarahmed/notifee-react-native")
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
