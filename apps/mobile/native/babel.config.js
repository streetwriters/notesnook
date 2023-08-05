const env = process.env.BABEL_ENV || process.env.NODE_ENV;
const configs = {
  env: {
    development: {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: [
        '@babel/plugin-transform-named-capturing-groups-regex',
        'react-native-reanimated/plugin',
      ]
    },
    test: {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: [
        '@babel/plugin-transform-named-capturing-groups-regex',
        'react-native-reanimated/plugin',
        ["@babel/plugin-transform-private-methods", { "loose": true }]
      ]
    },
    production: {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: [
        'transform-remove-console',
        '@babel/plugin-transform-named-capturing-groups-regex',
        'react-native-reanimated/plugin',
      ]
    }
  }
};
module.exports = function (api, opts) {
  api.cache(true);
  if (!env) env = 'production';
  return configs.env[env];
};
