"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const extension_table_1 = require("@tiptap/extension-table");
const prosemirror_tables_1 = require("@_ueberdosis/prosemirror-tables");
const component_1 = require("./component");
exports.Table = extension_table_1.Table.extend({
    addProseMirrorPlugins() {
        const isResizable = this.options.resizable && this.editor.isEditable;
        return [
            ...(isResizable
                ? [
                    (0, prosemirror_tables_1.columnResizing)({
                        handleWidth: this.options.handleWidth,
                        cellMinWidth: this.options.cellMinWidth,
                        View: (0, component_1.TableNodeView)(this.editor),
                        // TODO: PR for @types/prosemirror-tables
                        // @ts-ignore (incorrect type)
                        lastColumnResizable: this.options.lastColumnResizable,
                    }),
                ]
                : []),
            (0, prosemirror_tables_1.tableEditing)({
                allowTableNodeSelection: this.options.allowTableNodeSelection,
            }),
        ];
    },
});
