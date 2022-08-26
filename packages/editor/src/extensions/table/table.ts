import { Table as TiptapTable, TableOptions } from "@tiptap/extension-table";
import { columnResizing, tableEditing } from "@_ueberdosis/prosemirror-tables";
import { Editor } from "../../types";
import { TableNodeView } from "./component";

export const Table = TiptapTable.extend<TableOptions>({
  addProseMirrorPlugins() {
    const isResizable = this.options.resizable && this.editor.isEditable;

    return [
      ...(isResizable
        ? [
            columnResizing({
              handleWidth: this.options.handleWidth,
              cellMinWidth: this.options.cellMinWidth,
              View: TableNodeView(this.editor as Editor),
              // TODO: PR for @types/prosemirror-tables
              // @ts-ignore (incorrect type)
              lastColumnResizable: this.options.lastColumnResizable
            })
          ]
        : []),
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection
      })
    ];
  }
});
