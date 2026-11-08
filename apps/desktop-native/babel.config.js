module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["module:@react-native/babel-preset"],
    plugins: [
      "module:@react-native-gpui/core/babel-plugin-node-addons",
      "react-native-worklets/plugin"
    ]
  };
};
