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

import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as desktopDefinitions from "./toolbar-definitions";
import { Icons } from "./toolbar-icons";

// Mobile imports the toolbar data from `@notesnook/editor-ui/dist/cjs/...`.
// Load the built files by that path, so a layout change that would break the
// mobile app (or any other deep importer) fails here.
const require = createRequire(import.meta.url);
const distCjs = path.dirname(require.resolve("@notesnook/editor-ui"));

function deepImport(file: string) {
  expect(distCjs.endsWith(path.join("dist", "cjs"))).toBe(true);
  return require(path.join(distCjs, file));
}

describe("toolbar data", () => {
  // desktop-native gets the ES build and the deep imports the CommonJS build,
  // so the two are compared by value: one source, two module formats.
  it("is one source for desktop-native and the dist/cjs deep imports", () => {
    const definitions = deepImport("toolbar/tool-definitions.js");
    expect(desktopDefinitions.getAllTools()).toEqual(definitions.getAllTools());
    expect(desktopDefinitions.getDefaultPresets()).toEqual(
      definitions.getDefaultPresets()
    );
    expect(desktopDefinitions.STATIC_TOOLBAR_GROUPS).toEqual(
      definitions.STATIC_TOOLBAR_GROUPS
    );
    expect(Icons).toEqual(deepImport("toolbar/icons.js").Icons);
  });

  it("loads the other deep imports mobile uses", () => {
    expect(typeof deepImport("utils/font.js")).toBe("object");
    expect(deepImport("toolbar-data/index.js").TOOL_IDS.length).toBeGreaterThan(
      60
    );
  });

  it("gives every tool an icon and a title", () => {
    const tools = desktopDefinitions.getAllTools();
    const ids = Object.keys(tools);
    expect(ids.length).toBeGreaterThan(60);
    for (const id of ids) {
      const tool = tools[id as keyof typeof tools];
      expect(Icons, `icon of ${id}`).toHaveProperty(tool.icon);
      if (id !== "none") expect(tool.title, `title of ${id}`).not.toBe("");
    }
  });

  it("only puts known tools in the presets and static groups", () => {
    const known = new Set(Object.keys(desktopDefinitions.getAllTools()));
    const groups = [
      ...desktopDefinitions.getDefaultPresets().default,
      ...desktopDefinitions.getDefaultPresets().minimal,
      ...desktopDefinitions.STATIC_TOOLBAR_GROUPS,
      ...desktopDefinitions.MOBILE_STATIC_TOOLBAR_GROUPS,
      ...desktopDefinitions.READONLY_MOBILE_STATIC_TOOLBAR_GROUPS
    ];
    for (const id of groups.flat(2)) expect(known.has(id), id).toBe(true);
  });
});
