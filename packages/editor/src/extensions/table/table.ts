import { Table as TiptapTable, TableOptions } from "@tiptap/extension-table";
import { columnResizing, tableEditing } from "@_ueberdosis/prosemirror-tables";
import { Editor } from "../../types";
import { TableNodeView } from "./component";
import { Plugin } from "prosemirror-state";
import { NodeView } from "prosemirror-view";

// TODO: send PR
declare module "@_ueberdosis/prosemirror-tables" {
  export function columnResizing(props: {
    handleWidth?: number;
    cellMinWidth?: number;
    View?: NodeView;
    lastColumnResizable?: boolean;
  }): Plugin;
}

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
