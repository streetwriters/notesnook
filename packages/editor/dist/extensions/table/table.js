"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
var extension_table_1 = require("@tiptap/extension-table");
var prosemirror_tables_1 = require("@_ueberdosis/prosemirror-tables");
var component_1 = require("./component");
exports.Table = extension_table_1.Table.extend({
    addProseMirrorPlugins: function () {
        var isResizable = this.options.resizable && this.editor.isEditable;
        return __spreadArray(__spreadArray([], __read((isResizable
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
            : [])), false), [
            (0, prosemirror_tables_1.tableEditing)({
                allowTableNodeSelection: this.options.allowTableNodeSelection,
            }),
        ], false);
    },
});
