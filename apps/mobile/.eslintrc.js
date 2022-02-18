module.exports = {
  parser: '@babel/eslint-parser',
  env: {
    browser: true,
    es2021: true,
    'react-native/react-native': true
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    es6: true,
    sourceType: 'module'
  },
  plugins: ['react', 'react-native', 'prettier', 'unused-imports'],
  rules: {
    'react/display-name': 0,
    'no-unused-vars': 'off',
    'react/no-unescaped-entities': 'off',
    'unused-imports/no-unused-vars': 'off',
    'no-empty': 'off',
    'react/prop-types': 0,
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true
      }
    ]
  }
};
