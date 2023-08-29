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

import { AndroidDevice, Page } from "@playwright/test";
import { DeviceSize } from "./device-utils";

export type Keyboard = {
  name: string;
  ime: string;
  pkg: string;
  layout: {
    start: number;
    end: number;
    keyHeight: number;
    keyWidth: number;
    rowMargin: number;
    specialKeyWidth: number;
    spaceBarWidth: number;
    rows: number;
  };
};

const KEYBOARD_ROWS = [
  "QWERTYUIOP".split(""),
  ["", ..."ASDFGHJKL".split(""), ""],
  ["SHIFT", ..."ZXCVBNM".split(""), "DEL"]
];

const SPECIAL_KEY_MAP = {
  "\n": "Enter",
  ".": "Period",
  " ": "Space"
} as const;

/**
 * Pixels to device independent height (percentage based)
 */
function h(px: number) {
  return px / 2460;
}
/**
 * Pixels to device independent width (percentage based)
 */
function w(px: number) {
  return px / 1080;
}

export const SUPPORTED_KEYBOARDS: Keyboard[] = [
  {
    name: "Gboard",
    ime: "com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME",
    pkg: "com.google.android.inputmethod.latin",

    layout: {
      start: h(1700), //,
      end: h(2300),
      keyHeight: h(120),
      keyWidth: w(100),
      rowMargin: h(30),
      specialKeyWidth: w(100 + 50),
      spaceBarWidth: w(100 * 4),
      rows: 4
    }
  },
  {
    name: "OpenBoard",
    ime: "org.dslul.openboard.inputmethod.latin/.LatinIME",
    pkg: "org.dslul.openboard.inputmethod.latin",
    layout: {
      start: h(1650),
      end: h(2300),
      keyHeight: h(110),
      rowMargin: h(40),
      keyWidth: w(100),
      specialKeyWidth: w(100 + 50),
      spaceBarWidth: w(100 * 4),
      rows: 4
    }
  },
  {
    name: "SwiftKey",
    ime: "com.touchtype.swiftkey/com.touchtype.KeyboardService",
    pkg: "com.touchtype.swiftkey",
    layout: {
      start: h(1800),
      end: h(2300),
      keyHeight: h(100),
      rowMargin: h(10),
      keyWidth: w(100),
      specialKeyWidth: w(100 + 50),
      spaceBarWidth: w(100 * 4.5),
      rows: 4
    }
  },
  {
    name: "Grammarly Keyboard",
    ime: "com.grammarly.android.keyboard/.LatinIME",
    pkg: "com.grammarly.android.keyboard",
    layout: {
      start: h(1700),
      end: h(2300),
      keyHeight: h(120),
      rowMargin: h(25),
      keyWidth: w(100),
      specialKeyWidth: w(140),
      spaceBarWidth: w(100 * 4),
      rows: 4
    }
  }
];

export async function getKeyboards(device: AndroidDevice) {
  const imeList = (await device.shell("ime list -s -a"))
    .toString("utf-8")
    .split("\n");
  return SUPPORTED_KEYBOARDS.filter((keyboard) =>
    imeList.includes(keyboard.ime)
  );
}

export async function setKeyboard(device: AndroidDevice, ime: string) {
  const output = (await device.shell(`ime set ${ime}`)).toString("utf-8");
  return output.includes(`Input method ${ime} selected`);
}

export async function type(
  page: Page,
  device: AndroidDevice,
  keyboard: Keyboard,
  deviceSize: DeviceSize,
  str: string
) {
  for (const char of str) {
    const specialKey = SPECIAL_KEY_MAP[char];
    if (specialKey)
      await device.input.tap(getSpecialKey(keyboard, deviceSize, specialKey));
    else await device.input.tap(getKey(keyboard, deviceSize, char));

    await page.waitForTimeout(50);
  }
}

export function getKey(
  keyboard: Keyboard,
  deviceSize: DeviceSize,
  key: string
) {
  key = key.toUpperCase();
  const rowIndex = KEYBOARD_ROWS.findIndex((r) => r.includes(key));
  if (rowIndex < 0) throw new Error(`Key (${key}) not found in any row.`);
  const keyIndex = KEYBOARD_ROWS[rowIndex].indexOf(key);
  const specialKeysCount = KEYBOARD_ROWS[rowIndex].filter(
    (k, i) => k.length > 1 && i <= keyIndex
  ).length;
  const emptySpaceCount = KEYBOARD_ROWS[rowIndex].filter(
    (k, i) => k.length < 1 && i <= keyIndex
  ).length;

  const keyHeight = deviceSize.h(keyboard.layout.keyHeight);
  const rowMargin = deviceSize.h(keyboard.layout.rowMargin);
  const keyWidth = deviceSize.w(keyboard.layout.keyWidth);
  const specialKeyWidth = deviceSize.w(keyboard.layout.specialKeyWidth);
  const start = deviceSize.h(keyboard.layout.start);

  const specialKeysX = specialKeysCount * specialKeyWidth;
  const emptySpaceX = emptySpaceCount * (keyWidth / 2);
  const keysX = (keyIndex + 1 - specialKeysCount - emptySpaceCount) * keyWidth;

  const y = (rowIndex + 1) * (keyHeight + rowMargin) + start;

  //console.log(key, keysX + specialKeysX + emptySpaceX, y);

  return { y, x: keysX + specialKeysX + emptySpaceX };
}

export function getSpecialKey(
  keyboard: Keyboard,
  deviceSize: DeviceSize,
  key: "Space" | "Enter" | "Period"
) {
  const keyHeight = deviceSize.h(keyboard.layout.keyHeight);
  const rowMargin = deviceSize.h(keyboard.layout.rowMargin);
  const keyWidth = deviceSize.w(keyboard.layout.keyWidth);
  const specialKeyWidth = deviceSize.w(keyboard.layout.specialKeyWidth);
  const spaceBarWidth = deviceSize.w(keyboard.layout.spaceBarWidth);
  const start = deviceSize.h(keyboard.layout.start);

  return {
    x:
      key === "Space"
        ? specialKeyWidth + 2 * keyWidth + spaceBarWidth / 2
        : key === "Period"
        ? specialKeyWidth + 3 * keyWidth + spaceBarWidth
        : specialKeyWidth + 4 * keyWidth + spaceBarWidth,
    y: keyboard.layout.rows * (keyHeight + rowMargin) + start
  };
}
