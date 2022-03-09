let env = process.env.BABEL_ENV;
const configs = {
  env: {
    development: {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: ['@babel/plugin-transform-named-capturing-groups-regex']
    },
    production: {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: ['transform-remove-console', '@babel/plugin-transform-named-capturing-groups-regex']
    }
  }
};
module.exports = function (api, opts) {
  api.cache(true);
  if (!env) env = 'production';
  console.log('babel-env:', env);
  return configs.env[env];
};
