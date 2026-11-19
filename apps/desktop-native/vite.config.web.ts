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

import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

const root = __dirname;
const webTarget = path.join(root, "src/targets/web");
const desktopTarget = path.join(root, "src/targets/desktop");
const webApp = path.join(root, "../web/src");
const uiKit = path.join(root, "../../packages/ui/src/kit");
const uiKitDesktop = path.join(uiKit, "desktop");

function sharedWebAppDependencies(): Plugin {
  return {
    name: "nn-shared-web-app-dependencies",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (
        !importer ||
        !(
          importer.startsWith(webApp + path.sep) ||
          importer.startsWith(uiKit + path.sep)
        ) ||
        source.startsWith(".") ||
        source.startsWith("/") ||
        source.includes("?")
      )
        return null;
      return this.resolve(source, path.join(root, "index.html"), {
        ...options,
        skipSelf: true
      });
    }
  };
}

const NOT_IMPLEMENTED_EXPORTS: Record<string, string[]> = {
  "@react-native-gpui/fs": [],
  "@react-native-gpui/pdf": ["createPdfEngine"],
  "@react-native-gpui/webauthn": ["installSoftAuthenticator"]
};

function notImplementedOnWeb(): Plugin {
  const prefix = "\0nn-not-implemented:";
  return {
    name: "nn-not-implemented-on-web",
    enforce: "pre",
    resolveId(source, importer) {
      const native =
        source.startsWith("@react-native-gpui/") ||
        source.startsWith("@react-native/") ||
        source === "react-native" ||
        source.startsWith("react-native/") ||
        source.startsWith("react-native-");
      if (!native) return null;
      if (
        importer &&
        (importer.startsWith(uiKit + path.sep) ||
          importer.startsWith(path.join(webTarget, "ui") + path.sep))
      )
        throw new Error(
          `The web ui must not import react-native packages: "${source}" from ${importer}.`
        );
      return prefix + source;
    },
    load(id) {
      if (!id.startsWith(prefix)) return null;
      const name = id.slice(prefix.length);
      const names = NOT_IMPLEMENTED_EXPORTS[name] ?? [];
      return [
        `const create = (path) => new Proxy(function () {}, {`,
        `  get: (_, key) => key === "then" || typeof key === "symbol" ? undefined : create(path + "." + String(key)),`,
        `  apply: () => { throw new Error(path + " is not implemented on web"); },`,
        `  construct: () => { throw new Error(path + " is not implemented on web"); }`,
        `});`,
        `export default create(${JSON.stringify(name)});`,
        ...names.map(
          (item) =>
            `export const ${item} = create(${JSON.stringify(`${name}.${item}`)});`
        )
      ].join("\n");
    }
  };
}

function intlStaticLocales(): Plugin {
  const pattern = /require\("(@notesnook\/intl\/dist\/locales\/[^"]+\.json)"\)/g;
  return {
    name: "nn-intl-static-locales",
    enforce: "pre",
    transform(code, id) {
      if (!/packages\/intl\/dist\/index\.mjs$/.test(id)) return null;
      const specifiers: string[] = [];
      const body = code.replace(pattern, (_match, specifier: string) => {
        let index = specifiers.indexOf(specifier);
        if (index < 0) index = specifiers.push(specifier) - 1;
        return `__locale${index}`;
      });
      const imports = specifiers.map(
        (specifier, index) =>
          `import __locale${index} from ${JSON.stringify(
            path.join(
              root,
              "../../packages/intl/dist/locales",
              specifier.split("/locales/")[1]
            )
          )};`
      );
      return { code: `${imports.join("\n")}\n${body}`, map: null };
    }
  };
}

function noDesktopFallback(): Plugin {
  return {
    name: "nn-no-desktop-fallback",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer) return null;
      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true
      });
      if (
        resolved &&
        (resolved.id.startsWith(desktopTarget + path.sep) ||
          resolved.id.startsWith(uiKitDesktop + path.sep))
      )
        throw new Error(
          `The web build must not import the desktop target: "${source}" from ${importer} resolved to ${resolved.id}. Implement it in src/targets/web or packages/ui/src/kit/web, or stub it there.`
        );
      return null;
    }
  };
}

export default defineConfig({
  root,
  publicDir: false,
  plugins: [
    notImplementedOnWeb(),
    sharedWebAppDependencies(),
    intlStaticLocales(),
    noDesktopFallback(),
    react()
  ],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
    global: "globalThis",
    APP_TITLE: JSON.stringify("Notesnook"),
    GIT_HASH: JSON.stringify("web"),
    APP_VERSION: JSON.stringify("0.0.1"),
    PUBLIC_URL: JSON.stringify(""),
    IS_DESKTOP_APP: false,
    PLATFORM: JSON.stringify("web"),
    IS_TESTING: process.env.TEST === "true",
    IS_BETA: false,
    IS_THEME_BUILDER: false
  },
  resolve: {
    alias: [
      {
        find: /^@notesnook\/editor\/styles\/(.*)$/,
        replacement: path.join(root, "../../packages/editor/dist/styles/$1")
      },
      {
        find: /^@notesnook\/editor$/,
        replacement: path.join(root, "../../packages/editor/dist/esm/index.js")
      },
      {
        find: /^@notesnook\/ui$/,
        replacement: path.join(root, "../../packages/ui/dist/index.mjs")
      },
      { find: /^@ui$/, replacement: path.join(webTarget, "ui/index.ts") },
      { find: /^@notesnook\/ui-kit\/(.*)$/, replacement: path.join(uiKit, "$1") },
      { find: /^@platform$/, replacement: path.join(webTarget, "platform/index.ts") },
      {
        find: /^@notesnook\/desktop$/,
        replacement: path.join(webTarget, "platform/desktop-shim.ts")
      },
      {
        find: /^web-app-editor\/(.*)$/,
        replacement: path.join(webApp, "components/editor/$1")
      },
      {
        find: /^(@emotion\/react|@theme-ui\/core|@theme-ui\/components)(\/.*)?$/,
        replacement: path.join(webApp, "../node_modules/$1$2")
      },
      {
        find: /^web-app-sqlite$/,
        replacement: path.join(webApp, "common/sqlite/index.ts")
      },
    ],
    dedupe: [
      "react",
      "react-dom",
      "@theme-ui/css",
      "@streetwriters/kysely"
    ]
  },
  server: {
    port: 5190,
    fs: { allow: [path.join(root, "../..")] }
  },
  worker: { format: "es" },
  build: {
    outDir: "build/web",
    emptyOutDir: true,
    target: "esnext",
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ["@notesnook/sodium"]
  }
});
