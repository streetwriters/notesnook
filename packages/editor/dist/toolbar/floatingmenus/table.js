var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Slider } from "@rebass/forms";
import { useEffect, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { ActionSheetPresenter, MenuPresenter, } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { ToolButton } from "../components/tool-button";
import { selectedRect } from "prosemirror-tables";
import { DesktopOnly, MobileOnly } from "../../components/responsive";
export function TableRowFloatingMenu(props) {
    var editor = props.editor;
    // const theme = editor.storage.theme as Theme;
    var _a = __read(useState(null), 2), position = _a[0], setPosition = _a[1];
    useEffect(function () {
        var _a;
        if (!editor.isActive("tableCell") &&
            !editor.isActive("tableRow") &&
            !editor.isActive("tableHeader")) {
            setPosition(null);
            return;
        }
        var $from = editor.state.selection.$from;
        var selectedNode = $from.node();
        var pos = selectedNode.isTextblock ? $from.before() : $from.pos;
        var currentRow = (_a = editor.view.nodeDOM(pos)) === null || _a === void 0 ? void 0 : _a.closest("tr");
        if (!currentRow)
            return;
        setPosition(function (old) {
            if ((old === null || old === void 0 ? void 0 : old.target) === currentRow)
                return old;
            return {
                isTargetAbsolute: true,
                location: "left",
                xOffset: -5,
                target: currentRow,
                // parent: editor.view.dom as HTMLElement,
            };
        });
    }, [editor.state.selection]);
    if (!position)
        return null;
    return (_jsx(MenuPresenter, __assign({ isOpen: true, items: [], onClose: function () { }, options: {
            type: "autocomplete",
            position: position,
        } }, { children: _jsxs(Flex, __assign({ sx: {
                bg: "background",
                flexWrap: "nowrap",
                borderRadius: "default",
                // opacity: isMenuOpen ? 1 : 0.3,
                ":hover": {
                    opacity: 1,
                },
            } }, { children: [_jsx(RowProperties, { title: "Row properties", editor: editor, variant: "small", icon: "more" }), _jsx(InsertRowBelow, { title: "Insert row below", icon: "insertRowBelow", editor: editor, variant: "small" })] })) })));
}
function RowProperties(props) {
    var editor = props.editor, toolProps = __rest(props, ["editor"]);
    var _a = __read(useState(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({ toggled: isMenuOpen }, toolProps, { onClick: function () { return setIsMenuOpen(true); } })), _jsx(MenuPresenter, { isOpen: isMenuOpen, onClose: function () {
                    setIsMenuOpen(false);
                    editor.commands.focus();
                }, options: {
                    type: "menu",
                    position: {},
                }, items: [
                    {
                        key: "addRowAbove",
                        type: "menuitem",
                        title: "Add row above",
                        onClick: function () { return editor.chain().focus().addRowBefore().run(); },
                        icon: "insertRowAbove",
                    },
                    {
                        key: "moveRowUp",
                        type: "menuitem",
                        title: "Move row up",
                        onClick: function () { return moveRowUp(editor); },
                        icon: "moveRowUp",
                    },
                    {
                        key: "moveRowDown",
                        type: "menuitem",
                        title: "Move row down",
                        onClick: function () { return moveRowDown(editor); },
                        icon: "moveRowDown",
                    },
                    {
                        key: "deleteRow",
                        type: "menuitem",
                        title: "Delete row",
                        onClick: function () { return editor.chain().focus().deleteRow().run(); },
                        icon: "deleteRow",
                    },
                ] })] }));
}
function InsertRowBelow(props) {
    var editor = props.editor, toolProps = __rest(props, ["editor"]);
    return (_jsx(ToolButton, __assign({ toggled: false }, toolProps, { onClick: function () { return editor.chain().focus().addRowAfter().run(); } })));
}
function ColumnProperties(props) {
    var _this = this;
    var editor = props.editor, currentCell = props.currentCell, toolProps = __rest(props, ["editor", "currentCell"]);
    var _a = __read(useState(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    var isInsideCellSelection = !editor.state.selection.empty &&
        editor.state.selection.$anchor.node().type.name === "tableCell";
    var _b = __read(useState(false), 2), showCellProps = _b[0], setShowCellProps = _b[1];
    var _c = __read(useState(null), 2), menuPosition = _c[0], setMenuPosition = _c[1];
    var columnProperties = [
        {
            key: "addColumnLeft",
            type: "menuitem",
            title: "Add column left",
            onClick: function () { return editor.chain().focus().addColumnBefore().run(); },
            icon: "insertColumnLeft",
        },
        {
            key: "addColumnRight",
            type: "menuitem",
            title: "Add column right",
            onClick: function () { return editor.chain().focus().addColumnAfter().run(); },
            icon: "insertColumnRight",
        },
        {
            key: "moveColumnLeft",
            type: "menuitem",
            title: "Move column left",
            onClick: function () { return moveColumnLeft(editor); },
            icon: "moveColumnLeft",
        },
        {
            key: "moveColumnRight",
            type: "menuitem",
            title: "Move column right",
            onClick: function () { return moveColumnRight(editor); },
            icon: "moveColumnRight",
        },
        {
            key: "deleteColumn",
            type: "menuitem",
            title: "Delete column",
            onClick: function () { return editor.chain().focus().deleteColumn().run(); },
            icon: "deleteColumn",
        },
    ];
    var mergeSplitProperties = [
        {
            key: "splitCells",
            type: "menuitem",
            title: "Split cells",
            onClick: function () { return editor.chain().focus().splitCell().run(); },
            icon: "splitCells",
        },
        {
            key: "mergeCells",
            type: "menuitem",
            title: "Merge cells",
            onClick: function () { return editor.chain().focus().mergeCells().run(); },
            icon: "mergeCells",
        },
    ];
    var cellProperties = [
        {
            key: "cellProperties",
            type: "menuitem",
            title: "Cell properties",
            onClick: function () {
                setShowCellProps(true);
                setMenuPosition({
                    target: currentCell || undefined,
                    isTargetAbsolute: true,
                    yOffset: 10,
                    location: "below",
                });
            },
            icon: "cellProperties",
        },
    ];
    var tableProperties = [
        {
            key: "deleteTable",
            type: "menuitem",
            title: "Delete table",
            icon: "deleteTable",
            onClick: function () { return editor.chain().focus().deleteTable().run(); },
        },
    ];
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({ toggled: isMenuOpen }, toolProps, { onClick: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, setIsMenuOpen(true)];
                }); }); } })), _jsx(MenuPresenter, { isOpen: isMenuOpen, onClose: function () {
                    setIsMenuOpen(false);
                    editor.commands.focus();
                }, options: {
                    type: "menu",
                    position: {},
                }, items: isInsideCellSelection
                    ? __spreadArray(__spreadArray([], __read(mergeSplitProperties), false), __read(cellProperties), false) : __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(columnProperties), false), [
                    { type: "seperator", key: "cellSeperator" }
                ], false), __read(cellProperties), false), [
                    { type: "seperator", key: "tableSeperator" }
                ], false), __read(tableProperties), false) }), _jsx(DesktopOnly, { children: _jsx(MenuPresenter, __assign({ isOpen: showCellProps, onClose: function () {
                        setShowCellProps(false);
                        editor.commands.focus();
                    }, options: {
                        type: "menu",
                        position: menuPosition || {},
                    }, items: [] }, { children: _jsx(CellProperties, { editor: editor, onClose: function () { return setShowCellProps(false); } }) })) }), _jsx(MobileOnly, { children: _jsx(ActionSheetPresenter, __assign({ isOpen: showCellProps, onClose: function () {
                        setShowCellProps(false);
                        editor.commands.focus();
                    }, items: [] }, { children: _jsx(CellProperties, { editor: editor, onClose: function () { return setShowCellProps(false); } }) })) })] }));
}
function InsertColumnRight(props) {
    var editor = props.editor, toolProps = __rest(props, ["editor"]);
    return (_jsx(ToolButton, __assign({}, toolProps, { toggled: false, onClick: function () { return editor.chain().focus().addColumnAfter().run(); } })));
}
export function TableColumnFloatingMenu(props) {
    var editor = props.editor;
    var _a = __read(useState(null), 2), position = _a[0], setPosition = _a[1];
    useEffect(function () {
        var _a;
        if (!editor.isActive("tableCell") &&
            !editor.isActive("tableRow") &&
            !editor.isActive("tableHeader")) {
            setPosition(null);
            return;
        }
        var $from = editor.state.selection.$from;
        var selectedNode = $from.node();
        var pos = selectedNode.isTextblock ? $from.before() : $from.pos;
        var currentCell = (_a = editor.view.nodeDOM(pos)) === null || _a === void 0 ? void 0 : _a.closest("td,th");
        var currentTable = currentCell === null || currentCell === void 0 ? void 0 : currentCell.closest("table");
        if (!currentCell || !currentTable)
            return;
        setPosition(function (old) {
            if ((old === null || old === void 0 ? void 0 : old.target) === currentCell)
                return old;
            return {
                isTargetAbsolute: true,
                location: "top",
                align: "center",
                yAnchor: currentTable,
                yOffset: 2,
                target: currentCell,
            };
        });
    }, [editor.state.selection]);
    if (!position)
        return null;
    return (_jsx(MenuPresenter, __assign({ isOpen: true, items: [], onClose: function () { }, options: {
            type: "autocomplete",
            position: position,
        } }, { children: _jsxs(Flex, __assign({ sx: {
                bg: "background",
                flexWrap: "nowrap",
                borderRadius: "default",
                // opacity: 0.3,
                //  opacity: isMenuOpen || showCellProps ? 1 : 0.3,
                ":hover": {
                    opacity: 1,
                },
            } }, { children: [_jsx(ColumnProperties, { currentCell: position.target, title: "Column properties", editor: editor, icon: "more", variant: "small" }), _jsx(InsertColumnRight, { editor: editor, title: "Insert column right", variant: "small", icon: "plus" })] })) })));
}
function CellProperties(props) {
    var editor = props.editor, onClose = props.onClose;
    var attributes = editor.getAttributes("tableCell");
    console.log(attributes);
    return (_jsx(Popup, __assign({ title: "Cell properties", action: {
            icon: "close",
            iconColor: "error",
            onClick: onClose,
        } }, { children: _jsxs(Flex, __assign({ sx: { flexDirection: "column", px: 1, mb: 2 } }, { children: [_jsx(ColorPickerTool, { color: attributes.backgroundColor, title: "Background color", icon: "backgroundColor", onColorChange: function (color) {
                        return editor.commands.setCellAttribute("backgroundColor", color);
                    } }), _jsx(ColorPickerTool, { color: attributes.color, title: "Text color", icon: "textColor", onColorChange: function (color) {
                        return editor.commands.setCellAttribute("color", color);
                    } }), _jsx(ColorPickerTool, { color: attributes.borderColor, title: "Border color", icon: "borderColor", onColorChange: function (color) {
                        return editor.commands.setCellAttribute("borderColor", color);
                    } }), _jsxs(Flex, __assign({ sx: { flexDirection: "column" } }, { children: [_jsxs(Flex, __assign({ sx: {
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 1,
                            } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: "Border width" })), _jsxs(Text, __assign({ variant: "body" }, { children: [attributes.borderWidth || 1, "px"] }))] })), _jsx(Slider, { min: 1, max: 5, value: attributes.borderWidth || 1, onChange: function (e) {
                                editor.commands.setCellAttribute("borderWidth", e.target.valueAsNumber);
                            } })] }))] })) })));
}
function ColorPickerTool(props) {
    var color = props.color, title = props.title, icon = props.icon, onColorChange = props.onColorChange;
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var buttonRef = useRef(null);
    return (_jsxs(_Fragment, { children: [_jsxs(Flex, __assign({ sx: { justifyContent: "space-between", alignItems: "center", mt: 1 } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: title })), _jsx(ToolButton, { buttonRef: buttonRef, toggled: isOpen, title: title, id: icon, icon: icon, iconSize: 16, sx: {
                            p: "2.5px",
                            borderRadius: "small",
                            backgroundColor: color || "transparent",
                            ":hover": { bg: color, filter: "brightness(90%)" },
                        }, onClick: function () { return setIsOpen(true); } })] })), _jsx(MenuPresenter, __assign({ isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: [], options: {
                    type: "menu",
                    position: {
                        target: buttonRef.current || undefined,
                        location: "below",
                        align: "center",
                        isTargetAbsolute: true,
                        yOffset: 5,
                    },
                } }, { children: _jsx(Flex, { sx: {
                        flexDirection: "column",
                        bg: "background",
                        boxShadow: "menu",
                        border: "1px solid var(--border)",
                        borderRadius: "default",
                        p: 1,
                        width: 160,
                    } }) }))] }));
}
/**
 * Done:
 * insertTable
 *
 * addRowBefore
 * addRowAfter
 * deleteRow
 *
 * addColumnBefore
 * addColumnAfter
 * deleteColumn
 *
 * setCellAttribute
 *
 * deleteTable
 *
 * mergeCells
 * splitCell
 * mergeOrSplit
 *
 * toggleHeaderColumn
 * toggleHeaderRow
 * toggleHeaderCell
 * fixTables
 * goToNextCell
 * goToPreviousCell
 */
function moveColumnRight(editor) {
    var tr = editor.state.tr;
    var rect = selectedRect(editor.state);
    if (rect.right === rect.map.width)
        return;
    var transaction = moveColumn(tr, rect, rect.left, rect.left + 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
function moveColumnLeft(editor) {
    var tr = editor.state.tr;
    var rect = selectedRect(editor.state);
    if (rect.left === 0)
        return;
    var transaction = moveColumn(tr, rect, rect.left, rect.left - 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
function moveRowDown(editor) {
    var tr = editor.state.tr;
    var rect = selectedRect(editor.state);
    if (rect.top + 1 === rect.map.height)
        return;
    var transaction = moveRow(tr, rect, rect.top, rect.top + 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
function moveRowUp(editor) {
    var tr = editor.state.tr;
    var rect = selectedRect(editor.state);
    if (rect.top === 0)
        return;
    var transaction = moveRow(tr, rect, rect.top, rect.top - 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
function moveColumn(tr, rect, from, to) {
    var fromCells = getColumnCells(rect, from);
    var toCells = getColumnCells(rect, to);
    return moveCells(tr, rect, fromCells, toCells);
}
function getColumnCells(_a, col) {
    var map = _a.map, table = _a.table;
    var cells = [];
    for (var row = 0; row < map.height;) {
        var index = row * map.width + col;
        if (index >= map.map.length)
            break;
        var pos = map.map[index];
        var cell = table.nodeAt(pos);
        if (!cell)
            continue;
        cells.push({ cell: cell, pos: pos });
        row += cell.attrs.rowspan;
        console.log(cell.textContent);
    }
    return cells;
}
function moveRow(tr, rect, from, to) {
    var fromCells = getRowCells(rect, from);
    var toCells = getRowCells(rect, to);
    return moveCells(tr, rect, fromCells, toCells);
}
function getRowCells(_a, row) {
    var map = _a.map, table = _a.table;
    var cells = [];
    for (var col = 0, index = row * map.width; col < map.width; col++, index++) {
        if (index >= map.map.length)
            break;
        var pos = map.map[index];
        var cell = table.nodeAt(pos);
        if (!cell)
            continue;
        cells.push({ cell: cell, pos: pos });
        col += cell.attrs.colspan - 1;
    }
    return cells;
}
function moveCells(tr, rect, fromCells, toCells) {
    if (fromCells.length !== toCells.length)
        return;
    var mapStart = tr.mapping.maps.length;
    for (var i = 0; i < toCells.length; ++i) {
        var fromCell = fromCells[i];
        var toCell = toCells[i];
        var fromStart = tr.mapping
            .slice(mapStart)
            .map(rect.tableStart + fromCell.pos);
        var fromEnd = fromStart + fromCell.cell.nodeSize;
        var fromSlice = tr.doc.slice(fromStart, fromEnd);
        var toStart = tr.mapping
            .slice(mapStart)
            .map(rect.tableStart + toCell.pos);
        var toEnd = toStart + toCell.cell.nodeSize;
        var toSlice = tr.doc.slice(toStart, toEnd);
        tr.replace(toStart, toEnd, fromSlice);
        fromStart = tr.mapping.slice(mapStart).map(rect.tableStart + fromCell.pos);
        fromEnd = fromStart + fromCell.cell.nodeSize;
        tr.replace(fromStart, fromEnd, toSlice);
    }
    return tr;
}
