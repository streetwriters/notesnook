const LICENSE = [
  "",
  "This file is part of the Notesnook project (https://notesnook.com/)",
  "",
  "Copyright (C) 2023 Streetwriters (Private) Limited",
  "",
  "This program is free software: you can redistribute it and/or modify",
  "it under the terms of the GNU General Public License as published by",
  "the Free Software Foundation, either version 3 of the License, or",
  "(at your option) any later version.",
  "",
  "This program is distributed in the hope that it will be useful,",
  "but WITHOUT ANY WARRANTY; without even the implied warranty of",
  "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the",
  "GNU General Public License for more details.",
  "",
  "You should have received a copy of the GNU General Public License",
  "along with this program.  If not, see <http://www.gnu.org/licenses/>.",
  ""
];

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
    "react-native",
    "header",
    "react-hooks"
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "warn", // Checks effect dependencies
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
    "react/prop-types": "off",
    "header/header": ["error", "block", LICENSE, 1],
    "@typescript-eslint/no-empty-interface": [
      "error",
      {
        allowSingleExtends: true
      }
    ]
  },
  settings: {
    react: {
      version: "17"
    }
  },
  overrides: [
    {
      files: ["apps/web/__e2e__/**/**/*.{jsx,tsx,ts,js}"],
      rules: { "react-hooks/rules-of-hooks": "off" }
    },
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
