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
        plugins: [
          path.join(__dirname, "tools/babel-plugin-hoist-sx.js"),
          // Raw HTML tags (<strong>, <span>, <style>…) in files shared with
          // apps/web are drawn with the desktop kit's elements.
          path.join(__dirname, "tools/babel-plugin-dom-elements.js")
        ]
      }
    ]
  };
};
