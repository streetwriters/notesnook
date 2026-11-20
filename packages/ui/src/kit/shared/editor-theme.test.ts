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
import { ThemeDark, ThemeLight } from "@notesnook/theme";
import { createEditorThemeTokens } from "./editor-theme";

describe("createEditorThemeTokens", () => {
  it("gives every token a colour for both built-in themes", () => {
    for (const theme of [ThemeLight, ThemeDark]) {
      const tokens = createEditorThemeTokens(theme);
      expect(tokens.colorScheme).toBe(theme.colorScheme);
      for (const [key, value] of Object.entries(tokens)) {
        expect(typeof value, key).toBe("string");
        expect(value, key).not.toBe("");
      }
    }
  });

  it("differs between light and dark", () => {
    const light = createEditorThemeTokens(ThemeLight);
    const dark = createEditorThemeTokens(ThemeDark);
    expect(light.surface).not.toBe(dark.surface);
    expect(light.text).not.toBe(dark.text);
  });
});
