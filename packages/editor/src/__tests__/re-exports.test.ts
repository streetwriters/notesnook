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

import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";

const EDITOR_SRC = path.resolve(__dirname, "..");
const UI_SRC = path.resolve(__dirname, "../../../editor-ui/src");
const SHIM_DIRS = ["toolbar", "components", "hooks"];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function uiSource(rel: string) {
  return [".ts", ".tsx"]
    .map((ext) => path.join(UI_SRC, rel.replace(/\.js$/, ext)))
    .find((file) => fs.existsSync(file));
}

describe("editor re-exports editor-ui", () => {
  test("the package entry point re-exports everything from editor-ui", () => {
    const index = fs.readFileSync(path.join(EDITOR_SRC, "index.ts"), "utf-8");
    expect(index).toMatch(/export \* from "@notesnook\/editor-ui";/);
  });

  test("every moved toolbar, component and hook module keeps a deprecated shim", () => {
    for (const dir of SHIM_DIRS) {
      for (const file of walk(path.join(UI_SRC, dir))) {
        if (file.includes("__tests__")) continue;
        const rel = path.relative(UI_SRC, file).replace(/\.tsx$/, ".ts");
        expect(
          fs.existsSync(path.join(EDITOR_SRC, rel)),
          `missing shim for ${rel}`
        ).toBe(true);
      }
    }
  });

  test("every shim points at an editor-ui module that exists", () => {
    let checked = 0;
    for (const dir of SHIM_DIRS) {
      for (const file of walk(path.join(EDITOR_SRC, dir))) {
        const text = fs.readFileSync(file, "utf-8");
        const specs = [
          ...text.matchAll(/from "@notesnook\/editor-ui\/([^"]+)"/g)
        ].map((m) => m[1]);
        expect(specs.length, file).toBeGreaterThan(0);
        for (const spec of specs) {
          expect(uiSource(spec), `${file} -> ${spec}`).toBeTruthy();
        }
        expect(text).toContain("@deprecated");
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(40);
  });
});
