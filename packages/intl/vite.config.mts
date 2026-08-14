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

import path, { resolve } from "path";
import { defineConfig } from "vite";
import swc from "vite-plugin-swc-transform";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    swc({
      swcOptions: {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true
          },
          baseUrl: __dirname,
          paths: {
            "$src/*": ["src/*"]
          },
          experimental: {
            plugins: [
              [
                "@lingui/swc-plugin",
                {
                  runtimeModules: {
                    i18n: ["$src/setup", "i18n"]
                  }
                }
              ]
            ]
          }
        }
      }
    }),
    dts({
      exclude: ["**/locales/*.json"],
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["cjs", "es"],
      fileName(format) {
        return format === "cjs" ? "index.js" : "index.mjs";
      }
    },
    outDir: resolve(__dirname, "dist")
  }
});
