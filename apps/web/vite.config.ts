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

import { Plugin, PluginOption, ResolvedConfig, defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgrPlugin from "vite-plugin-svgr";
import envCompatible from "vite-plugin-env-compatible";
import { VitePWA } from "vite-plugin-pwa";
import autoprefixer from "autoprefixer";
import { WEB_MANIFEST } from "./web-manifest";
import { execSync } from "child_process";
import { version } from "./package.json";
import { visualizer } from "rollup-plugin-visualizer";
import { OutputPlugin } from "rollup";
import path from "path";

const gitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    return process.env.GIT_HASH || "gitless";
  }
})();
const appVersion = version.replaceAll(".", "").replace("-beta", "");
const isBeta = version.endsWith("-beta");
const isTesting =
  process.env.TEST === "true" || process.env.NODE_ENV === "development";
const isDesktop = process.env.PLATFORM === "desktop";
const isThemeBuilder = process.env.THEME_BUILDER === "true";
const isAnalyzing = process.env.ANALYZING === "true";

export default defineConfig({
  envPrefix: "NN_",
  root: "src/",
  publicDir: isThemeBuilder ? path.join(__dirname, "public") : "../public",
  build: {
    target: isDesktop ? "esnext" : "modules",
    outDir: "../build",
    minify: "esbuild",
    cssMinify: true,
    emptyOutDir: true,
    sourcemap: !isDesktop,
    rollupOptions: {
      output: {
        plugins: [emitEditorStyles()],
        assetFileNames: "assets/[name]-[hash:12][extname]",
        chunkFileNames: "assets/[name]-[hash:12].js",
        manualChunks: (id: string) => {
          if (
            (id.includes("/editor/languages/") ||
              id.includes("/html/languages/")) &&
            path.basename(id) !== "index.js"
          )
            return `code-lang-${path.basename(id, "js")}`;
          return null;
        }
      }
    }
  },
  define: {
    APP_TITLE: `"${isThemeBuilder ? "Notesnook Theme Builder" : "Notesnook"}"`,
    GIT_HASH: `"${gitHash}"`,
    APP_VERSION: `"${appVersion}"`,
    PUBLIC_URL: `"${process.env.PUBLIC_URL || ""}"`,
    IS_DESKTOP_APP: isDesktop,
    PLATFORM: `"${process.env.PLATFORM}"`,
    IS_TESTING: process.env.TEST === "true",
    IS_BETA: isBeta,
    IS_THEME_BUILDER: isThemeBuilder
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "info",
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@mdi/js",
      "@mdi/react",
      "@emotion/react",
      "katex",
      "react-modal",
      "dayjs",
      "@streetwriters/kysely"
    ],

    alias: [
      {
        find: /\/desktop-bridge$/gm,
        replacement: isDesktop
          ? "/desktop-bridge/index.desktop"
          : "/desktop-bridge/index"
      },
      {
        find: /\/sqlite$/gm,
        replacement: isDesktop ? "/sqlite/index.desktop" : "/sqlite/index"
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
        assetFileNames: "assets/[name]-[hash:12][extname]",
        chunkFileNames: "assets/[name]-[hash:12].js",
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
    ...((isThemeBuilder || isDesktop) && process.env.NODE_ENV === "production"
      ? []
      : [
          VitePWA({
            strategies: "injectManifest",
            minify: true,
            manifest: WEB_MANIFEST,
            injectRegister: null,
            srcDir: "",
            filename: "service-worker.ts",
            mode: "production",
            workbox: { mode: "production" },
            injectManifest: {
              globPatterns: ["**/*.{js,css,html,wasm}", "**/open-sans-*.woff2"],
              globIgnores: [
                "**/node_modules/**/*",
                "**/code-lang-*.js",
                "pdf.worker.min.js"
              ]
            }
          })
        ]),
    react({
      plugins: isTesting
        ? undefined
        : [
            [
              "@swc/plugin-react-remove-properties",
              {
                properties: ["^data-test-id$"]
              }
            ]
          ]
    }),
    envCompatible({
      prefix: "NN_",
      mountedPath: "process.env"
    }),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        namedExport: "ReactComponent"
        // ...svgr options (https://react-svgr.com/docs/options/)
      }
    }),
    ...(isDesktop
      ? []
      : [
          prefetchPlugin({
            excludeFn: (assetName) =>
              assetName.includes("wa-sqlite-async") ||
              !assetName.includes("wa-sqlite")
          })
        ])
  ]
});

function emitEditorStyles(): OutputPlugin {
  return {
    name: "rollup-plugin-emit-editor-styles",
    generateBundle(options, bundle) {
      for (const file in bundle) {
        const chunk = bundle[file];
        if (
          chunk.type === "asset" &&
          chunk.fileName.endsWith(".css") &&
          typeof chunk.source === "string" &&
          (chunk.source.includes("KaTeX_Fraktur-Bold-") ||
            chunk.source.includes("Hack typeface"))
        ) {
          this.emitFile({
            type: "asset",
            fileName: "assets/editor-styles.css",
            name: "editor-styles.css",
            source: chunk.source
          });
        }
      }
    }
  };
}

function prefetchPlugin(options?: {
  excludeFn?: (assetName: string) => boolean;
}): Plugin {
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-bundle-prefetch",
    apply: "build",
    configResolved(resolvedConfig: ResolvedConfig) {
      // store the resolved config
      config = resolvedConfig;
    },
    transformIndexHtml(
      html: string,
      ctx: {
        path: string;
        filename: string;
        bundle?: import("rollup").OutputBundle;
        chunk?: import("rollup").OutputChunk;
      }
    ) {
      const bundles = Object.keys(ctx.bundle ?? {});
      const isLegacy = bundles.some((bundle) => bundle.includes("legacy"));
      if (isLegacy) {
        //legacy build won't add prefetch
        return html;
      }
      // remove map files
      let modernBundles = bundles.filter(
        (bundle) => bundle.endsWith(".map") === false
      );
      const excludeFn = options?.excludeFn;
      if (excludeFn) {
        modernBundles = modernBundles.filter((bundle) => !excludeFn(bundle));
      }
      // Remove existing files and concatenate them into link tags
      const prefechBundlesString = modernBundles
        .filter((bundle) => html.includes(bundle) === false)
        .map((bundle) => `<link rel="prefetch" href="${config.base}${bundle}">`)
        .join("\n");

      // Use regular expression to get the content within <head> </head>
      const headContent = html.match(/<head>([\s\S]*)<\/head>/)?.[1] ?? "";
      // Insert the content of prefetch into the head
      const newHeadContent = `${headContent}${prefechBundlesString}`;
      // Replace the original head
      html = html.replace(
        /<head>([\s\S]*)<\/head>/,
        `<head>${newHeadContent}</head>`
      );

      return html;
    }
  };
}
