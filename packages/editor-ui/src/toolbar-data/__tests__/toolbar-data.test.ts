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
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strings } from "@notesnook/intl";
import {
  ICONS,
  MOBILE_STATIC_TOOLBAR_GROUPS,
  READONLY_MOBILE_STATIC_TOOLBAR_GROUPS,
  STATIC_TOOLBAR_GROUPS,
  TOOLBAR_PRESETS,
  TOOLS,
  TOOL_IDS
} from "../index.js";
import { getAllTools } from "../../toolbar/tool-definitions.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..");

function assertPlain(value: unknown, path: string) {
  if (value === null) return;
  const type = typeof value;
  if (type === "string" || type === "boolean" || type === "number") return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertPlain(v, `${path}[${i}]`));
    return;
  }
  expect(type, path).toBe("object");
  expect(Object.getPrototypeOf(value), path).toBe(Object.prototype);
  for (const [k, v] of Object.entries(value as object))
    assertPlain(v, `${path}.${k}`);
}

const allGroups = [
  ...STATIC_TOOLBAR_GROUPS,
  ...MOBILE_STATIC_TOOLBAR_GROUPS,
  ...READONLY_MOBILE_STATIC_TOOLBAR_GROUPS,
  ...Object.values(TOOLBAR_PRESETS).flat()
];

describe("toolbar data", () => {
  test("tool definitions hold only plain values", () => {
    assertPlain(TOOLS, "TOOLS");
    expect(Object.keys(TOOLS).sort()).toEqual([...TOOL_IDS].sort());
  });

  test("icons are SVG path strings, not components", () => {
    assertPlain(ICONS, "ICONS");
    for (const [name, path] of Object.entries(ICONS)) {
      if (name === "none") expect(path).toBe("");
      else expect(path, name).toMatch(/^[Mm][\d\s.,\-+eEMmLlHhVvCcSsQqTtAaZz]+$/);
    }
  });

  test("every tool refers to an existing icon and a real intl string", () => {
    for (const [id, tool] of Object.entries(TOOLS)) {
      expect(ICONS, id).toHaveProperty(tool.icon);
      if (tool.titleKey)
        expect(typeof (strings as any)[tool.titleKey], id).toBe("function");
    }
  });

  test("toolbar config refers to tools by id only", () => {
    assertPlain(TOOLBAR_PRESETS, "TOOLBAR_PRESETS");
    for (const group of allGroups)
      for (const entry of group)
        for (const id of Array.isArray(entry) ? entry : [entry])
          expect(TOOL_IDS, id).toContain(id);
  });

  test("everything round-trips through JSON unchanged", () => {
    const data = {
      ICONS,
      TOOLS,
      TOOL_IDS,
      TOOLBAR_PRESETS,
      STATIC_TOOLBAR_GROUPS,
      MOBILE_STATIC_TOOLBAR_GROUPS,
      READONLY_MOBILE_STATIC_TOOLBAR_GROUPS
    };
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  test("the data module imports nothing outside itself", () => {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const source = readFileSync(join(dir, file), "utf8");
      const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map(
        (m) => m[1]
      );
      for (const s of specifiers) expect(s, file).toMatch(/^\.\/[\w-]+\.js$/);
    }
  });

  test("resolved definitions keep icon, title and conditional flag", () => {
    const resolved = getAllTools();
    for (const id of TOOL_IDS) {
      const { icon, titleKey, conditional } = TOOLS[id];
      expect(resolved[id].icon).toBe(icon);
      expect(resolved[id].conditional).toBe(conditional);
      expect(resolved[id].title).toBe(
        titleKey ? (strings as any)[titleKey]() : ""
      );
    }
  });
});
