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

import { Extension } from "@tiptap/core";

const ligatures = {
  "->": "→",
  "<-": "←",
  "<=": "≤",
  ">=": "≥",
  "!=": "≠",
  "==>": "⟹",
  "<==": "⟸",
  "--": "—"
};

export const FontLigature = Extension.create({
  name: "fontLigature",

  addOptions() {
    return {
      enabled: false
    };
  },

  addInputRules() {
    if (!this.options.enabled) return [];

    return Object.entries(ligatures).map(([from, to]) => ({
      find: new RegExp(`${from}$`),
      handler: ({ state, range }) => {
        const { from: start, to: end } = range;
        state.tr.replaceRangeWith(start, end, state.schema.text(to));
      }
    }));
  }
});
