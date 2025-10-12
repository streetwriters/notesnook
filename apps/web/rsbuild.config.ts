import { defineConfig, loadEnv, RsbuildPluginAPI } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { InjectManifest } from "@aaroon/workbox-rspack-plugin";
import { execSync } from "child_process";
import { version } from "./package.json";
import path from "path";
import { readFileSync } from "fs";

const gitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    return process.env.GIT_HASH || "gitless";
  }
})();
// const appVersion = version.replaceAll(".", "").replace("-beta", "");
const isBeta = version.includes("-beta");
const isTesting =
  process.env.TEST === "true" || process.env.NODE_ENV === "development";
const isDesktop = process.env.PLATFORM === "desktop";
const isThemeBuilder = process.env.THEME_BUILDER === "true";
const { publicVars } = loadEnv({ prefixes: ["NN_"] });

export default defineConfig({
  html: {
    template: "./src/index.html"
  },
  output: {
    sourceMap: !isDesktop,
    cleanDistPath: true,
    distPath: {
      root: "./build",
      assets: "assets",
      js: "assets",
      css: "assets",
      cssAsync: "assets",
      font: "assets",
      image: "assets",
      jsAsync: "assets",
      svg: "assets",
      wasm: "assets",
      media: "assets"
    }
  },
  source: {
    entry: {
      index: "./src/index.ts"
    },
    define: {
      ...publicVars,
      APP_TITLE: `"${
        isThemeBuilder ? "Notesnook Theme Builder" : "Notesnook"
      }"`,
      GIT_HASH: `"${gitHash}"`,
      APP_VERSION: `"${version}"`,
      PUBLIC_URL: `"${process.env.PUBLIC_URL || ""}"`,
      IS_DESKTOP_APP: isDesktop,
      PLATFORM: `"${process.env.PLATFORM}"`,
      IS_TESTING: process.env.TEST === "true",
      IS_BETA: isBeta,
      IS_THEME_BUILDER: isThemeBuilder
    }
  },
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
    ]
  },
  tools: {
    rspack: {
      externalsPresets: isDesktop
        ? { electronRenderer: true, electron: true }
        : undefined,
      plugins: [
        ...(isThemeBuilder || isDesktop || process.env.NODE_ENV !== "production"
          ? []
          : [
              new InjectManifest({
                swSrc: "./src/service-worker.ts",
                swDest: "service-worker.js",
                mode: "production",
                include: ["**/*.{js,css,html,wasm}", "**/Inter-*.woff2"],
                exclude: [
                  "**/node_modules/**/*",
                  "**/code-lang-*.js",
                  "pdf.worker.min.js"
                ]
              })
            ])
      ],
      externals: isDesktop
        ? {
            "node:crypto": "commonjs crypto",
            stream: "commonjs stream",
            "better-sqlite3-multiple-ciphers":
              "commonjs better-sqlite3-multiple-ciphers",
            path: "commonjs path",
            fs: "commonjs fs",
            url: "commonjs url",
            util: "commonjs util",
            "fs/promises": "commonjs fs/promises",
            crypto: "commonjs crypto"
          }
        : { "node:crypto": "commonjs crypto" },
      resolve: {
        fallback: isDesktop
          ? {}
          : {
              fs: false,
              path: false,
              crypto: false,
              util: false,
              url: false
            }
      },
      optimization: {
        splitChunks: {
          cacheGroups: {
            codeLang: {
              test: (module) => {
                const resource =
                  module.nameForCondition && module.nameForCondition();
                if (!resource) return false;
                return (
                  (resource.includes("/editor/languages/") ||
                    resource.includes("/html/languages/") ||
                    resource.includes("/refractor/lang/")) &&
                  path.basename(resource) !== "index.js"
                );
              },
              name(module) {
                const resource =
                  module.nameForCondition && module.nameForCondition();
                if (!resource) return;
                const base = path.basename(resource, ".js");
                return `code-lang-${base}`;
              },
              chunks: "all",
              enforce: true
            }
          }
        }
      }
    },
    swc: {
      jsc: {
        experimental: {
          plugins: isTesting
            ? []
            : [
                [
                  "@swc/plugin-react-remove-properties",
                  {
                    properties: ["^data-test-id$"]
                  }
                ]
              ]
        }
      }
    }
  },
  plugins: [
    pluginReact(),
    pluginSvgr({
      svgrOptions: {
        icon: true,
        namedExport: "ReactComponent"
      }
    }),
    regexpAliasPlugin([
      {
        find: /desktop-bridge\/index.ts/gm,
        replacement: isDesktop
          ? path.resolve(
              __dirname,
              "src/common/desktop-bridge/index.desktop.ts"
            )
          : path.resolve(__dirname, "src/common/desktop-bridge/index.ts")
      },
      {
        find: /sqlite\/index.ts/gm,
        replacement: isDesktop
          ? path.resolve(__dirname, "src/common/sqlite/index.desktop.ts")
          : path.resolve(__dirname, "src/common/sqlite/index.ts")
      }
    ]),
    {
      name: "bypass-webpack-require-plugin",
      setup(api: RsbuildPluginAPI) {
        api.transform(
          {
            test: /sqlite-kysely\.js$/
          },
          ({ code }) => {
            return code.replaceAll(/require/gm, "__non_webpack_require__");
          }
        );
      }
    },
    {
      name: "emit-editor-styles",
      setup(api: RsbuildPluginAPI) {
        api.transform(
          {
            test: (filename) => filename.endsWith("css")
          },
          (context) => {
            if (
              context.code.includes("KaTeX_Fraktur-Bold-") ||
              context.code.includes("Hack typeface")
            ) {
              context.emitFile("assets/editor-styles.css", context.code);
              return "";
            }
            return context.code;
          }
        );
      }
    }
  ]
});

function regexpAliasPlugin(rules: { find: RegExp; replacement: string }[]) {
  return {
    name: "generic-alias-plugin",
    setup(api: RsbuildPluginAPI) {
      for (const { find, replacement } of rules) {
        api.transform(
          {
            test: find
          },
          () => readFileSync(replacement, "utf-8")
        );
      }
    }
  };
}
