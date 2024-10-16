let PROCESS_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;
/**
 * @type {import('@babel/core').ConfigFunction}
 */
module.exports = function (api, opts) {
  if (!PROCESS_ENV) PROCESS_ENV = 'production';

  const env = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      '@babel/plugin-transform-named-capturing-groups-regex',
      'react-native-reanimated/plugin',
      "@babel/plugin-transform-export-namespace-from",
      ["@babel/plugin-transform-private-methods", { "loose": true }]
    ],
    // overrides: [
    //   {
    //     test: '../node_modules/@streetwriters/kysely',
    //     plugins: [
    //       ["@babel/plugin-transform-private-methods", { "loose": true }]
    //     ]
    //   },
    //   {
    //     test: '../node_modules/@streetwriters/kysely',
    //     plugins: [
    //       ["@babel/plugin-transform-private-methods", { "loose": true }]
    //     ]
    //   },
    // ]
  }

  if (env === 'production') {
    env.plugins.push('transform-remove-console');
  }

  if (env === 'test') {
    env.overrides.push({
      test: '../node_modules/jest-runner',
      plugins: [
        ["@babel/plugin-transform-private-methods", { "loose": true }]
      ]
    })
  }

  api.cache(true);
  return env;
};
