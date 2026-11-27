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

// The kit is imported as `@notesnook/ui-kit` everywhere: each target's config
// maps the bare name to its implementation, and the old `@ui` alias is gone.

import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import Module, { createRequire } from "module";
import { fileURLToPath } from "url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(appDir, "../..");
const kit = path.join(repo, "packages/ui/src/kit");
const read = (p) => fs.readFileSync(path.join(repo, p), "utf8");
const json = (p) => JSON.parse(read(p));

/** Loads metro.config.js with its React Native helpers stubbed. */
function loadMetroResolver() {
  const stubs = {
    "@react-native/metro-config": { mergeConfig: (a, b) => ({ ...a, ...b }) },
    "@react-native-gpui/core/metro.config": {
      makeMetroConfig: () => ({
        watchFolders: [],
        resolver: { sourceExts: [], nodeModulesPaths: [] }
      })
    },
    "@react-native-gpui/pdf/metro.cjs": (c) => c
  };
  const load = Module._load;
  const resolve = Module._resolveFilename;
  Module._load = function (req, ...rest) {
    if (req in stubs) return stubs[req];
    return load.call(this, req, ...rest);
  };
  Module._resolveFilename = function (req, ...rest) {
    if (req === "@react-native-gpui/pdf/package.json")
      return path.join(appDir, "pdf-stub/a/b/package.json");
    return resolve.call(this, req, ...rest);
  };
  try {
    const file = path.join(appDir, "metro.config.js");
    const require = createRequire(import.meta.url);
    delete require.cache[file];
    return require(file).resolver.resolveRequest;
  } finally {
    Module._load = load;
    Module._resolveFilename = resolve;
  }
}

describe("@notesnook/ui-kit import name", () => {
  it("Metro maps the bare name to the desktop target and subpaths to the kit", () => {
    const resolveRequest = loadMetroResolver();
    const context = {
      originModulePath: path.join(appDir, "src/app/x.tsx"),
      resolveRequest: (_c, m) => ({ type: "sourceFile", filePath: m })
    };
    const to = (m) => resolveRequest(context, m, "desktop").filePath;
    expect(to("@notesnook/ui-kit")).toBe(
      path.join(appDir, "src/targets/desktop/ui")
    );
    expect(to("@notesnook/ui-kit/desktop/primitives")).toBe(
      path.join(kit, "desktop/primitives")
    );
    // the old alias is not mapped any more
    expect(to("@ui")).toBe("@ui");
  });

  it("the Vite web target maps the bare name to the web target only", () => {
    const vite = read("apps/desktop-native/vite.config.web.ts");
    expect(vite).toMatch(
      /find: \/\^@notesnook\\\/ui-kit\$\/,\s*replacement: path\.join\(webTarget, "ui\/index\.ts"\)/
    );
    expect(vite).not.toMatch(/@ui\$/);
    expect(
      fs.existsSync(path.join(appDir, "src/targets/web/ui/index.ts"))
    ).toBe(true);
  });

  it.each([
    ["apps/desktop-native/tsconfig.json", "kit/contracts/index.ts"],
    [
      "apps/desktop-native/src/targets/web/tsconfig.json",
      "kit/contracts/index.ts"
    ],
    ["packages/editor-ui/tsconfig.json", "kit/contracts/index.ts"],
    ["packages/editor-mobile/tsconfig.json", "kit/web/index.ts"],
    ["apps/web/tsconfig.json", "kit/web/index.ts"]
  ])("%s maps the bare name and has no @ui path", (file, target) => {
    const paths = json(file).compilerOptions.paths;
    expect(paths["@notesnook/ui-kit"]?.[0]).toMatch(target);
    expect(Object.keys(paths).filter((k) => k.startsWith("@ui"))).toEqual([]);
  });

  it.each([
    "apps/web/vite.config.ts",
    "apps/web/vitest.config.ts",
    "packages/editor/vitest.config.ts",
    "packages/editor-mobile/patches/react-scripts+5.0.1.patch"
  ])("%s aliases the bare name to the web kit, not @ui", (file) => {
    const text = read(file);
    expect(text).toMatch(/@notesnook\\?\/ui-kit\$/);
    expect(text).not.toMatch(/@ui\$/);
  });

  it("no source file imports @ui any more", () => {
    const roots = [
      "apps/desktop-native/src",
      "packages/editor-ui/src",
      "packages/ui/src/kit"
    ];
    const offenders = [];
    let kitImports = 0;
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name !== "node_modules") walk(p);
        } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
          const s = fs.readFileSync(p, "utf8");
          if (/(from|import|require\()\s*["']@ui(\/[^"']*)?["']/.test(s))
            offenders.push(path.relative(repo, p));
          if (/from\s*["']@notesnook\/ui-kit["']/.test(s)) kitImports++;
        }
      }
    };
    roots.forEach((r) => walk(path.join(repo, r)));
    expect(offenders).toEqual([]);
    expect(kitImports).toBeGreaterThan(200);
  });
});
