/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const path = require("path");

/**
 * @type {import('@rspack/cli').Configuration}
 */
module.exports = {
  context: __dirname,
  entry: {
    main: "./index.ts"
  },
  output: {
    library: {
      type: "commonjs2"
    },
    filename: "index.js",
    path: path.resolve(__dirname, "dist")
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".jsx"]
  },
  optimization: {
    minimize: false
  },
  externals: {
    "@lingui/core": "@lingui/core",
    "@lingui/react": "@lingui/react"
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              sourceMap: true,
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true
                },
                experimental: {
                  plugins: [
                    [
                      "@lingui/swc-plugin",
                      {
                        runtimeModules: {
                          i18n: ["./setup", "i18n"]
                        }
                      }
                    ]
                  ]
                }
              }
            }
          }
        ]
      }
    ]
  }
};
