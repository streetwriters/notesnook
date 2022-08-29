module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    "jest/globals": true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/jsx-runtime",
    "plugin:jest/style"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: [
    "react",
    "@typescript-eslint",
    "unused-imports",
    "detox",
    "jest",
    "react-native"
  ],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_"
      }
    ],
    "linebreak-style": ["error", "unix"],
    "jest/no-mocks-import": 0,
    "@typescript-eslint/no-var-requires": 0,
    quotes: [
      "error",
      "double",
      { avoidEscape: true, allowTemplateLiterals: true }
    ],
    semi: ["error", "always"],
    "@typescript-eslint/no-empty-function": "off",
    "react/prop-types": "off"
  },
  settings: {
    react: {
      version: "17"
    }
  },
  overrides: [
    {
      files: ["apps/mobile/**/**/*.{jsx,tsx,ts,js}"],
      env: {
        "react-native/react-native": true,
        es2021: true,
        browser: true,
        "detox/detox": true
      },
      rules: {
        // TODO: remove this gradually
        "@typescript-eslint/ban-ts-comment": "off",
        "react/react-in-jsx-scope": 2,
        "react/jsx-uses-react": 2
      }
    }
  ]
};
