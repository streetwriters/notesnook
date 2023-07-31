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
import svgrPlugin from "vite-plugin-svgr";
import autoprefixer from "autoprefixer";
import { version } from "./package.json";
import envCompatible from "vite-plugin-env-compatible";

export default defineConfig({
  envPrefix: "REACT_APP_",
  build: {
    outDir: "build",
    minify: "esbuild",
    cssMinify: true,
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash:12][extname]",
        chunkFileNames: "assets/[name]-[hash:12].js"
      }
    }
  },
  define: {
    APP_VERSION: `"${version}"`
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "info",
  resolve: {
    dedupe: ["react", "react-dom", "@emotion/react"]
  },
  server: {
    port: 3000
  },
  worker: {
    format: "es"
  },
  css: {
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  plugins: [
    envCompatible(),
    svgrPlugin({
      svgrOptions: {
        icon: true
        // ...svgr options (https://react-svgr.com/docs/options/)
      }
    })
  ]
});
