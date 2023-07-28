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

import { Plugin, PluginOption, defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgrPlugin from "vite-plugin-svgr";
import envCompatible from "vite-plugin-env-compatible";
import { VitePWA } from "vite-plugin-pwa";
import autoprefixer from "autoprefixer";
import { WEB_MANIFEST } from "./web-manifest";
import { execSync } from "child_process";
import { version } from "./package.json";
import { visualizer } from "rollup-plugin-visualizer";

const gitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    return process.env.GIT_HASH || "gitless";
  }
})();
const appVersion = version.replaceAll(".", "");
const isTesting =
  process.env.TEST === "true" || process.env.NODE_ENV === "development";
const isDesktop = process.env.PLATFORM === "desktop";
const isAnalyzing = process.env.ANALYZING === "true";

export default defineConfig({
  envPrefix: "REACT_APP_",
  build: {
    target: isDesktop ? "esnext" : "modules",
    outDir: "build",
    minify: "esbuild",
    cssMinify: true,
    emptyOutDir: true,
    sourcemap: isTesting,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash:12][extname]",
        chunkFileNames: "assets/[name]-[hash:12].js"
      }
    }
  },
  define: {
    GIT_HASH: `"${gitHash}"`,
    APP_VERSION: `"${appVersion}"`,
    PUBLIC_URL: `"${process.env.PUBLIC_URL || ""}"`,
    IS_DESKTOP_APP: isDesktop,
    PLATFORM: `"${process.env.PLATFORM}"`,
    IS_TESTING: process.env.TEST === "true",
    IS_BETA: process.env.BETA === "true"
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "info",
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@mdi/js",
      "@mdi/react",
      "@emotion/react",
      "katex"
    ],

    alias: [
      {
        find: /desktop-bridge/gm,
        replacement: isDesktop
          ? "desktop-bridge/index.desktop"
          : "desktop-bridge/index"
      }
    ]
  },
  server: {
    port: 3000
  },
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  css: {
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  plugins: [
    ...(isAnalyzing
      ? [
          visualizer({
            gzipSize: true,
            brotliSize: true,
            open: true
          }) as PluginOption
        ]
      : []),

    requireTransformPlugin(),
    ...(isDesktop && process.env.NODE_ENV === "production"
      ? []
      : [
          VitePWA({
            strategies: "injectManifest",
            minify: true,
            manifest: WEB_MANIFEST,
            injectRegister: null,
            srcDir: "src",
            filename: "service-worker.ts"
          })
        ]),
    react({
      plugins: isTesting
        ? undefined
        : [["swc-plugin-react-remove-properties", {}]]
    }),
    envCompatible(),
    svgrPlugin({
      svgrOptions: {
        icon: true
        // ...svgr options (https://react-svgr.com/docs/options/)
      }
    })
  ]
});

function requireTransformPlugin(): Plugin {
  return {
    transform(code, id) {
      if (/\/node_modules\//g.test(id)) return;
      if (!/require/.test(code)) return;

      return {
        code: code.replace(/require\(/gm, "await import(")
      };
    },
    name: "require-transform-plugin"
  };
}
