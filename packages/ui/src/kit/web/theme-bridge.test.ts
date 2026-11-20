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
import { ThemeDark, ThemeLight, useThemeEngineStore } from "@notesnook/theme";
import { syncThemeEngine } from "./theme-bridge";

describe("syncThemeEngine", () => {
  it("points the emotion theme engine at the @ui theme", () => {
    syncThemeEngine(ThemeDark);
    expect(useThemeEngineStore.getState().theme).toBe(ThemeDark);
    syncThemeEngine(ThemeLight);
    expect(useThemeEngineStore.getState().theme).toBe(ThemeLight);
  });

  it("does not notify subscribers when the theme is unchanged", () => {
    syncThemeEngine(ThemeLight);
    let calls = 0;
    const off = useThemeEngineStore.subscribe(() => calls++);
    syncThemeEngine(ThemeLight);
    off();
    expect(calls).toBe(0);
  });
});
