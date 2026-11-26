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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildReport,
  comparePair,
  diffLines,
  globToRegExp,
  normaliseImports,
  pairFiles,
  parseAllowlist
} from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("normaliseImports", () => {
  it("drops import declarations, single and multi-line, type and side-effect", () => {
    const source = [
      'import "./polyfill";',
      'import type { A } from "a";',
      "import {",
      "  B,",
      "  C",
      '} from "@notesnook/ui";',
      'import D = require("d");',
      "const x = 1;"
    ].join("\n");
    expect(normaliseImports(source, "x.ts").trim()).toBe("const x = 1;");
  });

  it("replaces specifiers of re-exports, import() and require()", () => {
    const source = [
      'export { a } from "./a";',
      'const m = await import("../m");',
      'const r = require("r");',
      'type T = typeof import("./t");'
    ].join("\n");
    expect(normaliseImports(source, "x.ts")).toBe(
      [
        'export { a } from "<module>";',
        'const m = await import("<module>");',
        'const r = require("<module>");',
        'type T = typeof import("<module>");'
      ].join("\n")
    );
  });

  it("leaves strings that are not module specifiers alone", () => {
    const source = 'const s = "import x from y";\nconsole.log(s);';
    expect(normaliseImports(source, "x.ts")).toBe(source);
  });
});

describe("comparePair", () => {
  it("reports zero changed lines when only imports differ", () => {
    const web = [
      'import { Button, Flex } from "@theme-ui/components";',
      'import { useStore } from "../../stores/theme-store";',
      "",
      "export function X() {",
      "  return <Flex><Button /></Flex>;",
      "}"
    ].join("\n");
    const desktop = [
      "import {",
      "  Button,",
      "  Flex",
      '} from "@notesnook/ui-kit";',
      "export function X() {",
      "  return <Flex><Button /></Flex>;",
      "}   "
    ].join("\n");
    expect(comparePair(desktop, web, "x.tsx", "x.tsx").changed).toBe(0);
  });

  it("counts added and removed lines outside imports", () => {
    const web = "a\nb\nc\nd";
    const desktop = "a\nB\nc\nd\ne";
    const result = comparePair(desktop, web, "x.ts", "x.ts");
    expect(result).toMatchObject({ added: 2, removed: 1, changed: 3 });
  });
});

describe("diffLines", () => {
  const apply = (script) => ({
    a: script.filter((s) => s.op !== "+").map((s) => s.line),
    b: script.filter((s) => s.op !== "-").map((s) => s.line)
  });
  const cases = [
    [[], []],
    [[], ["x"]],
    [["x"], []],
    [
      ["a", "b", "c"],
      ["a", "b", "c"]
    ],
    ["abcabba".split(""), "cbabac".split("")],
    ["xaxbxc".split(""), "abc".split("")]
  ];
  it.each(cases)("is a valid, minimal edit script for %j → %j", (a, b) => {
    const script = diffLines(a, b);
    expect(apply(script)).toEqual({ a, b });
    const edits = script.filter((s) => s.op !== " ").length;
    // Brute-force LCS for the minimum.
    const lcs = Array.from({ length: a.length + 1 }, () =>
      new Array(b.length + 1).fill(0)
    );
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        lcs[i][j] =
          a[i - 1] === b[j - 1]
            ? lcs[i - 1][j - 1] + 1
            : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
    expect(edits).toBe(a.length + b.length - 2 * lcs[a.length][b.length]);
  });
});

describe("pairFiles", () => {
  it("pairs by relative path, across extensions and index folders", () => {
    const result = pairFiles(
      ["a.tsx", "b/c.ts", "checkbox.tsx", "only-desktop.ts"],
      ["a.ts", "b/c.ts", "checkbox/index.tsx", "only-web.ts"]
    );
    expect(result.pairs).toEqual([
      { desktop: "a.tsx", web: "a.ts" },
      { desktop: "b/c.ts", web: "b/c.ts" },
      { desktop: "checkbox.tsx", web: "checkbox/index.tsx" }
    ]);
    expect(result.desktopOnly).toEqual(["only-desktop.ts"]);
    expect(result.webOnly).toEqual(["only-web.ts"]);
  });
});

describe("allowlist", () => {
  it("matches globs on path segments", () => {
    expect(globToRegExp("**/*.generated.ts").test("a/b/x.generated.ts")).toBe(
      true
    );
    expect(globToRegExp("**/*.generated.ts").test("x.generated.ts")).toBe(true);
    expect(globToRegExp("dev/*").test("dev/a/b.ts")).toBe(false);
    expect(globToRegExp("dev/**").test("dev/a/b.ts")).toBe(true);
    expect(globToRegExp("a.tsx").test("aXtsx")).toBe(false);
  });

  it("rejects entries without a category or a reason", () => {
    expect(() =>
      parseAllowlist({
        entries: [
          { path: "a.ts", category: "platform", reason: "" },
          { path: "b.ts", category: "because", reason: "a long enough reason" },
          { category: "platform", reason: "a long enough reason" }
        ]
      })
    ).toThrow(
      /entry 1 \(a\.ts\): "reason"[\s\S]*entry 2 \(b\.ts\): "category"[\s\S]*entry 3: "path"/
    );
  });

  it("the committed allowlist is valid", () => {
    const json = JSON.parse(
      fs.readFileSync(path.join(here, "allowlist.json"), "utf8")
    );
    expect(parseAllowlist(json).length).toBeGreaterThan(0);
  });
});

describe("buildReport", () => {
  const dirs = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true });
  });
  const tree = (files) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "divergence-"));
    dirs.push(root);
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), content);
    }
    return root;
  };

  it("separates identical, allowlisted and unexplained files", () => {
    const appSrc = tree({
      "same.tsx":
        'import { Box } from "@notesnook/ui-kit";\nexport const a = 1;\n',
      "drift.ts": "export const b = 2;\n",
      "editor.ts": "export const c = 3;\n",
      "smoke.tsx": "export const d = 4;\n",
      "extra.ts": "export const e = 5;\n",
      "x.test.ts": "test\n"
    });
    const webSrc = tree({
      "same.tsx":
        'import { Box } from "@theme-ui/components";\nexport const a = 1;\n',
      "drift.ts": "export const b = 1;\n",
      "editor.ts": "export const c = 1;\n",
      "web-only.ts": "x\n"
    });
    const allowlist = parseAllowlist({
      entries: [
        {
          path: "editor.ts",
          category: "native-editor",
          reason: "native editor host"
        },
        {
          path: "smoke.tsx",
          category: "desktop-only",
          reason: "smoke screen only"
        },
        { path: "gone.ts", category: "platform", reason: "no longer exists" }
      ]
    });
    const report = buildReport({ appSrc, webSrc, allowlist });
    expect(report.identical).toEqual(["same.tsx"]);
    expect(
      report.divergent.map((d) => [d.desktop, d.changed, d.allowed?.category])
    ).toEqual([
      ["drift.ts", 2, undefined],
      ["editor.ts", 2, "native-editor"]
    ]);
    expect(
      report.desktopOnly.map((o) => [o.desktop, o.allowed?.category])
    ).toEqual([
      ["extra.ts", undefined],
      ["smoke.tsx", "desktop-only"]
    ]);
    expect(report.webOnly).toEqual(["web-only.ts"]);
    expect(report.stale.map((e) => e.path)).toEqual(["gone.ts"]);
    expect(report.summary).toMatchObject({
      desktopFiles: 5,
      paired: 3,
      identical: 1,
      divergent: 2,
      divergentAllowed: 1,
      divergentUnexplained: 1,
      changedLines: 4,
      unexplainedChangedLines: 2,
      desktopOnlyAllowed: 1,
      desktopOnlyUnexplained: 1,
      webOnly: 1,
      staleAllowlistEntries: 1
    });
  });
});
