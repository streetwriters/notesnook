module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    es2021: true,
    'react-native/react-native': true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    es6: true,
    sourceType: 'module'
  },
  plugins: ['react', 'react-native', 'prettier', 'unused-imports', '@typescript-eslint'],
  rules: {
    'react/display-name': 0,
    'no-unused-vars': 'off',
    'react/no-unescaped-entities': 'off',
    'unused-imports/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'prefer-const': 'off',
    'no-empty': 'off',
    'react/prop-types': 0,
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', 'ts', 'tsx'] }],
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true
      }
    ]
  }
};
