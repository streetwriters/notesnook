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
import { callOrReturn, getExtensionField, mergeAttributes, Node, } from "@tiptap/core";
import { TextSelection } from "prosemirror-state";
import { addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, CellSelection, columnResizing, deleteColumn, deleteRow, deleteTable, fixTables, goToNextCell, mergeCells, setCellAttr, splitCell, tableEditing, toggleHeader, toggleHeaderCell, } from "prosemirror-tables";
import { TableNodeView } from "./component";
import { createTable } from "./utils/createTable";
import { deleteTableWhenAllCellsSelected } from "./utils/deleteTableWhenAllCellsSelected";
export var Table = Node.create({
    name: "table",
    // @ts-ignore
    addOptions: function () {
        return {
            HTMLAttributes: {},
            resizable: false,
            handleWidth: 5,
            cellMinWidth: 25,
            // TODO: fix
            View: null,
            lastColumnResizable: true,
            allowTableNodeSelection: false,
        };
    },
    content: "tableRow+",
    tableRole: "table",
    isolating: true,
    group: "block",
    parseHTML: function () {
        return [{ tag: "table" }];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "table",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
            ["tbody", 0],
        ];
    },
    addCommands: function () {
        return {
            insertTable: function (_a) {
                var _b = _a === void 0 ? {} : _a, _c = _b.rows, rows = _c === void 0 ? 3 : _c, _d = _b.cols, cols = _d === void 0 ? 3 : _d, _e = _b.withHeaderRow, withHeaderRow = _e === void 0 ? true : _e;
                return function (_a) {
                    var tr = _a.tr, dispatch = _a.dispatch, editor = _a.editor;
                    var node = createTable(editor.schema, rows, cols, withHeaderRow);
                    if (dispatch) {
                        var offset = tr.selection.anchor + 1;
                        tr.replaceSelectionWith(node)
                            .scrollIntoView()
                            .setSelection(TextSelection.near(tr.doc.resolve(offset)));
                    }
                    return true;
                };
            },
            addColumnBefore: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return addColumnBefore(state, dispatch);
                };
            },
            addColumnAfter: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return addColumnAfter(state, dispatch);
                };
            },
            deleteColumn: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return deleteColumn(state, dispatch);
                };
            },
            addRowBefore: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return addRowBefore(state, dispatch);
                };
            },
            addRowAfter: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return addRowAfter(state, dispatch);
                };
            },
            deleteRow: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return deleteRow(state, dispatch);
                };
            },
            deleteTable: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return deleteTable(state, dispatch);
                };
            },
            mergeCells: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return mergeCells(state, dispatch);
                };
            },
            splitCell: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return splitCell(state, dispatch);
                };
            },
            toggleHeaderColumn: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return toggleHeader("column")(state, dispatch);
                };
            },
            toggleHeaderRow: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return toggleHeader("row")(state, dispatch);
                };
            },
            toggleHeaderCell: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return toggleHeaderCell(state, dispatch);
                };
            },
            mergeOrSplit: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    if (mergeCells(state, dispatch)) {
                        return true;
                    }
                    return splitCell(state, dispatch);
                };
            },
            setCellAttribute: function (name, value) {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return setCellAttr(name, value)(state, dispatch);
                };
            },
            goToNextCell: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return goToNextCell(1)(state, dispatch);
                };
            },
            goToPreviousCell: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    return goToNextCell(-1)(state, dispatch);
                };
            },
            fixTables: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    if (dispatch) {
                        fixTables(state);
                    }
                    return true;
                };
            },
            setCellSelection: function (position) {
                return function (_a) {
                    var tr = _a.tr, dispatch = _a.dispatch;
                    if (dispatch) {
                        var selection = CellSelection.create(tr.doc, position.anchorCell, position.headCell);
                        // @ts-ignore
                        tr.setSelection(selection);
                    }
                    return true;
                };
            },
        };
    },
    addKeyboardShortcuts: function () {
        var _this = this;
        return {
            Tab: function () {
                if (_this.editor.commands.goToNextCell()) {
                    return true;
                }
                if (!_this.editor.can().addRowAfter()) {
                    return false;
                }
                return _this.editor.chain().addRowAfter().goToNextCell().run();
            },
            "Shift-Tab": function () { return _this.editor.commands.goToPreviousCell(); },
            Backspace: deleteTableWhenAllCellsSelected,
            "Mod-Backspace": deleteTableWhenAllCellsSelected,
            Delete: deleteTableWhenAllCellsSelected,
            "Mod-Delete": deleteTableWhenAllCellsSelected,
        };
    },
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
    extendNodeSchema: function (extension) {
        var context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
        };
        return {
            tableRole: callOrReturn(getExtensionField(extension, "tableRole", context)),
        };
    },
});
