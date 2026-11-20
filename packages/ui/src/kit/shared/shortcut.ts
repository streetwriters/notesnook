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

export type ShortcutPlatform = "mac" | "pc" | "touch";

const MAC: Record<string, string> = {
  mod: "⌘",
  cmd: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧"
};

const PC: Record<string, string> = {
  mod: "Ctrl",
  cmd: "Ctrl",
  command: "Ctrl",
  meta: "Win",
  ctrl: "Ctrl",
  control: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift"
};

export function formatShortcutFor(
  keys: string,
  platform: ShortcutPlatform
): string {
  if (platform === "touch" || !keys) return "";
  const names = platform === "mac" ? MAC : PC;
  return keys
    .split(/-(?!$)/)
    .map((part) => {
      const name = names[part.toLowerCase()];
      if (name) return name;
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join(platform === "mac" ? "" : "+");
}
