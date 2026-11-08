const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["module:@react-native/babel-preset"],
    plugins: [
      "@babel/plugin-transform-export-namespace-from",
      "module:@react-native-gpui/core/babel-plugin-node-addons",
      "react-native-worklets/plugin"
    ],
    overrides: [
      {
        include: path.join(__dirname, "src"),
        plugins: [path.join(__dirname, "tools/babel-plugin-hoist-sx.js")]
      }
    ]
  };
};
