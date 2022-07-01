import { Table as TiptapTable } from "@tiptap/extension-table";
import { columnResizing, tableEditing } from "@_ueberdosis/prosemirror-tables";
import { TableNodeView } from "./component";
export const Table = TiptapTable.extend({
    addProseMirrorPlugins() {
        const isResizable = this.options.resizable && this.editor.isEditable;
        return [
            ...(isResizable
                ? [
                    columnResizing({
                        handleWidth: this.options.handleWidth,
                        cellMinWidth: this.options.cellMinWidth,
                        View: TableNodeView(this.editor),
                        // TODO: PR for @types/prosemirror-tables
                        // @ts-ignore (incorrect type)
                        lastColumnResizable: this.options.lastColumnResizable,
                    }),
                ]
                : []),
            tableEditing({
                allowTableNodeSelection: this.options.allowTableNodeSelection,
            }),
        ];
    },
});
