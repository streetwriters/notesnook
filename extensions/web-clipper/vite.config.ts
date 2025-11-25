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

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import path from "path";
import { getManifest } from "./build-utils/manifest.js";
import { version } from "./package.json";
import { execSync } from "child_process";

const MANIFEST_VERSION = process.env.MANIFEST_VERSION || "2";
const gitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    return process.env.GIT_HASH || "gitless";
  }
})();

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"]
      }
    }),
    crx({ manifest: getManifest(MANIFEST_VERSION) })
  ],
  define: {
    APP_TITLE: `"Notesnook Web Clipper"`,
    GIT_HASH: `"${gitHash}"`,
    APP_VERSION: `"${version}"`,
    IS_DESKTOP_APP: false,
    PLATFORM: `"${process.env.PLATFORM}"`,
    IS_TESTING: false,
    IS_BETA: false,
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    )
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@mdi/js",
      "@mdi/react",
      "@emotion/react",
      "react-modal",
      "dayjs",
      "@streetwriters/kysely"
    ]
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    target: "esnext"
  },
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash:12][extname]",
        chunkFileNames: "assets/[name]-[hash:12].js",
        inlineDynamicImports: true
      }
    }
  },
  server: {
    port: 3333,
    strictPort: true,
    hmr: {
      port: 3333
    }
  }
});
