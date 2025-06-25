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

import { nativeTheme } from "electron";
import { config } from "./config";
import { z } from "zod";

export const Theme = z.union([
  z.literal("system"),
  z.literal("light"),
  z.literal("dark")
]);

export type Theme = z.infer<typeof Theme>;

function getTheme() {
  return config.theme;
}

function setTheme(theme: Theme) {
  changeTheme(theme);
  if (globalThis.window)
    globalThis.window.setBackgroundColor(getBackgroundColor());
  config.theme = theme;
}

function getBackgroundColor() {
  return (
    config.backgroundColor ||
    (nativeTheme.shouldUseDarkColors ? "#0f0f0f" : "#ffffff")
  );
}

function getSystemTheme() {
  const listeners = nativeTheme.rawListeners("updated");
  nativeTheme.removeAllListeners("updated");

  const oldThemeSource = nativeTheme.themeSource;
  nativeTheme.themeSource = "system";
  const currentTheme = nativeTheme.shouldUseDarkColors ? "dark" : "light";
  nativeTheme.themeSource = oldThemeSource;

  setTimeout(
    () =>
      listeners.forEach((a) => nativeTheme.addListener("updated", () => a())),
    1000
  );
  return currentTheme;
}

export { getTheme, setTheme, getBackgroundColor, getSystemTheme };

function changeTheme(theme: Theme) {
  const listeners = nativeTheme.rawListeners("updated");
  nativeTheme.removeAllListeners("updated");

  nativeTheme.themeSource = theme;

  setTimeout(
    () =>
      listeners.forEach((a) => nativeTheme.addListener("updated", () => a())),
    1000
  );
}
