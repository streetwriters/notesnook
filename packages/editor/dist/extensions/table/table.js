var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { Table as TiptapTable } from "@tiptap/extension-table";
import { columnResizing, tableEditing } from "prosemirror-tables";
import { TableNodeView } from "./component";
export var Table = TiptapTable.extend({
    addProseMirrorPlugins: function () {
        var isResizable = this.options.resizable && this.editor.isEditable;
        return __spreadArray(__spreadArray([], __read((isResizable
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
            : [])), false), [
            tableEditing({
                allowTableNodeSelection: this.options.allowTableNodeSelection,
            }),
        ], false);
    },
});
