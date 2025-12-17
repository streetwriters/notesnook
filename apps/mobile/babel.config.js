let PROCESS_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;
/**
 * @type {import('@babel/core').ConfigFunction}
 */
module.exports = function (api, opts) {
  if (!PROCESS_ENV) PROCESS_ENV = "production";

  const env = {
    presets: ["module:@react-native/babel-preset"],
    plugins: [
      "@babel/plugin-transform-named-capturing-groups-regex",
      "@babel/plugin-transform-export-namespace-from"
    ]
  };

  if (env === "production") {
    env.plugins.push("transform-remove-console");
  }

  if (env === "test") {
    env.overrides.push({
      test: "../node_modules/jest-runner"
    });
  }

  env.plugins.push("react-native-worklets/plugin");

  api.cache(true);
  return env;
};
