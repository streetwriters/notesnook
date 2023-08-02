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

import Platform from "platform";

const isMac = Platform.os?.toString().toLowerCase().includes("mac");

const combos = {
  macos: {
    chromium: { developerTools: ["Cmd", "Opt", "J"] },
    firefox: { developerTools: ["Command", "Option", "K"] }
  },
  others: {
    chromium: { developerTools: ["Control", "Shift", "J"] },
    firefox: { developerTools: ["Control", "Shift", "K"] }
  }
};

type KeyboardTypes = keyof typeof combos;
type Browsers = keyof (typeof combos)[KeyboardTypes];
type ComboIds = keyof (typeof combos)[KeyboardTypes][Browsers];

export function getCombo(browser: Browsers, id: ComboIds): string[] {
  const keyboardType: KeyboardTypes = isMac ? "macos" : "others";
  return combos[keyboardType][browser][id];
}
