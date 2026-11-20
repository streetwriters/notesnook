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

import { describe, expect, it } from "vitest";
import { formatShortcutFor } from "./shortcut";

describe("formatShortcutFor", () => {
  it("writes macOS glyphs without a separator", () => {
    expect(formatShortcutFor("Mod-Shift-t", "mac")).toBe("⌘⇧T");
    expect(formatShortcutFor("Mod-Alt-c", "mac")).toBe("⌘⌥C");
  });

  it("writes names joined with + elsewhere", () => {
    expect(formatShortcutFor("Mod-Shift-T", "pc")).toBe("Ctrl+Shift+T");
    expect(formatShortcutFor("Mod-Alt-Enter", "pc")).toBe("Ctrl+Alt+Enter");
  });

  it("keeps a trailing minus key", () => {
    expect(formatShortcutFor("Mod--", "pc")).toBe("Ctrl+-");
  });

  it("shows nothing on touch platforms or for no keys", () => {
    expect(formatShortcutFor("Mod-b", "touch")).toBe("");
    expect(formatShortcutFor("", "pc")).toBe("");
  });
});
