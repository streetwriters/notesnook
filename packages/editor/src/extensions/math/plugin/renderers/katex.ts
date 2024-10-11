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

import { MathRenderer } from "./types.js";

async function loadKatex() {
  const { default: katex } = await import("katex");

  // Chemistry formulas support
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore TODO: maybe rewrite this in typescript?
  await import("katex/contrib/mhchem/mhchem.js");
  return katex;
}

export const KatexRenderer: MathRenderer = {
  inline: (text, element) => {
    loadKatex().then((katex) => {
      katex.render(text, element, {
        displayMode: false,
        globalGroup: true,
        throwOnError: false
      });
    });
  },
  block: (text, element) => {
    loadKatex().then((katex) => {
      katex.render(text, element, {
        displayMode: true,
        globalGroup: true,
        throwOnError: false
      });
    });
  }
};
