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

import type { Editor } from "@tiptap/core";

/**
 * The table operation the toolbar needs but that is implemented by the editor
 * engine (it depends on the engine's table internals). The engine registers
 * its implementation with `registerTableActions` when it loads, so the
 * toolbar never imports from the engine.
 *
 * Everything else a table tool does (moving, selecting, deleting rows and
 * columns, cell attributes, CSV export) is an `EditorController` command.
 */
export type TableActions = {
  importCsvToTable(csvText: string, editor: Editor): void;
};

let actions: TableActions | undefined;

export function registerTableActions(impl: TableActions) {
  actions = impl;
}

function get(): TableActions {
  if (!actions)
    throw new Error(
      "Table actions are not registered. Load the editor before using table tools."
    );
  return actions;
}

export const tableActions: TableActions = {
  importCsvToTable: (csvText, editor) => get().importCsvToTable(csvText, editor)
};
