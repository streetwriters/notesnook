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

import { Table as TiptapTable, TableOptions } from "@tiptap/extension-table";
import { tableEditing, columnResizing, TableView } from "@tiptap/pm/tables";
import { TableNodeView } from "./component.js";
import { Plugin, PluginKey } from "prosemirror-state";

export const Table = TiptapTable.extend<TableOptions>({
  addProseMirrorPlugins() {
    const isResizable = this.options.resizable && this.editor.isEditable;

    return [
      ...(isResizable
        ? [
            columnResizing({
              handleWidth: this.options.handleWidth,
              cellMinWidth: this.options.cellMinWidth,
              View: TableNodeView(this.editor),
              lastColumnResizable: this.options.lastColumnResizable
            })
          ]
        : [tiptapTableView(this.options.cellMinWidth)]),
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection
      })
    ];
  }
});

const TiptapTableViewPluginKey = new PluginKey("TiptapTableView");
function tiptapTableView(cellMinWidth: number): Plugin {
  return new Plugin({
    key: TiptapTableViewPluginKey,
    props: {
      nodeViews: { [Table.name]: (node) => new TableView(node, cellMinWidth) }
    }
  });
}
