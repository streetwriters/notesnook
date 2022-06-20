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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { useCallback, useMemo, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { ResponsivePresenter } from "../../components/responsive";
import { moveColumnLeft as moveColumnLeftAction, moveColumnRight as moveColumnRightAction, moveRowDown as moveRowDownAction, moveRowUp as moveRowUpAction, } from "../../extensions/table/actions";
import { MoreTools } from "../components/more-tools";
import { menuButtonToTool } from "./utils";
import { getToolDefinition } from "../tool-definitions";
import { CellProperties as CellPropertiesPopup } from "../popups/cell-properties";
import { ColorTool } from "./colors";
import { Counter } from "../components/counter";
import { useToolbarLocation } from "../stores/toolbar-store";
import { showPopup } from "../../components/popup-presenter";
export function TableSettings(props) {
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("table") || !isBottom)
        return null;
    return (_jsx(MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "tableSettings", tools: [
            "insertColumnLeft",
            "insertColumnRight",
            "insertRowAbove",
            "insertRowBelow",
            "cellProperties",
            "columnProperties",
            "rowProperties",
            "deleteRow",
            "deleteColumn",
            "deleteTable",
        ] })));
}
export function RowProperties(props) {
    var editor = props.editor;
    var buttonRef = useRef();
    var _a = __read(useState(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    var items = useMemo(function () { return [
        insertRowAbove(editor),
        insertRowBelow(editor),
        moveRowUp(editor),
        moveRowDown(editor),
        deleteRow(editor),
    ]; }, []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: function () { return setIsMenuOpen(true); } })), _jsx(ResponsivePresenter, { title: "Row properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: function () { return setIsMenuOpen(false); }, position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
export function ColumnProperties(props) {
    var editor = props.editor;
    var buttonRef = useRef();
    var _a = __read(useState(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    var items = useMemo(function () { return [
        insertColumnLeft(editor),
        insertColumnRight(editor),
        moveColumnLeft(editor),
        moveColumnRight(editor),
        deleteColumn(editor),
    ]; }, []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: function () { return setIsMenuOpen(true); } })), _jsx(ResponsivePresenter, { title: "Column properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: function () { return setIsMenuOpen(false); }, position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
export function TableProperties(props) {
    var editor = props.editor;
    var buttonRef = useRef();
    var _a = __read(useState(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    var items = useMemo(function () { return [
        insertColumnLeft(editor),
        insertColumnRight(editor),
        moveColumnLeft(editor),
        moveColumnRight(editor),
        deleteColumn(editor),
        { type: "separator", key: "cellSeperator" },
        mergeCells(editor),
        splitCells(editor),
        cellProperties(editor),
        { type: "separator", key: "tableSeperator" },
        deleteTable(editor),
    ]; }, []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: function () { return setIsMenuOpen(true); } })), _jsx(ResponsivePresenter, { title: "Table properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: function () { return setIsMenuOpen(false); }, position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
export function CellProperties(props) {
    return (_jsx(_Fragment, { children: _jsx(MoreTools, __assign({}, props, { popupId: "cellProperties", tools: [
                "mergeCells",
                "splitCells",
                "cellBackgroundColor",
                "cellTextColor",
                "cellBorderColor",
                "cellBorderWidth",
            ] })) }));
}
export function CellBackgroundColor(props) {
    return (_jsx(ColorTool, __assign({}, props, { isActive: function (editor) {
            return editor.isActive("tableCell", { backgroundColor: /\W+/gm });
        }, getActiveColor: function (editor) {
            return editor.getAttributes("tableCell").backgroundColor;
        }, title: "Cell background color", onColorChange: function (editor, color) {
            return editor.chain().setCellAttribute("backgroundColor", color).run();
        } })));
}
export function CellTextColor(props) {
    return (_jsx(ColorTool, __assign({}, props, { isActive: function (editor) { return editor.isActive("tableCell", { color: /\W+/gm }); }, getActiveColor: function (editor) { return editor.getAttributes("tableCell").color; }, title: "Cell text color", onColorChange: function (editor, color) {
            return editor.chain().focus().setCellAttribute("color", color).run();
        } })));
}
export function CellBorderColor(props) {
    return (_jsx(ColorTool, __assign({}, props, { isActive: function (editor) {
            return editor.isActive("tableCell", { borderColor: /\W+/gm });
        }, getActiveColor: function (editor) { return editor.getAttributes("tableCell").borderColor; }, title: "Cell border color", onColorChange: function (editor, color) {
            return editor.chain().focus().setCellAttribute("borderColor", color).run();
        } })));
}
export function CellBorderWidth(props) {
    var editor = props.editor;
    var _borderWidth = editor.getAttributes("tableCell").borderWidth;
    var borderWidth = _borderWidth ? _borderWidth : 1;
    var decreaseBorderWidth = useCallback(function () {
        return Math.max(1, borderWidth - 1);
    }, [borderWidth]);
    var increaseBorderWidth = useCallback(function () {
        return Math.min(10, borderWidth + 1);
    }, [borderWidth]);
    return (_jsxs(Flex, __assign({ sx: { justifyContent: "center", alignItems: "center" } }, { children: [_jsx(Text, __assign({ variant: "subBody", sx: { mx: 1 } }, { children: "Border width:" })), _jsx(Counter, { title: "cell border width", onDecrease: function () {
                    return editor.commands.setCellAttribute("borderWidth", decreaseBorderWidth());
                }, onIncrease: function () {
                    return editor.commands.setCellAttribute("borderWidth", increaseBorderWidth());
                }, onReset: function () { return editor.commands.setCellAttribute("borderWidth", 1); }, value: borderWidth + "px" })] })));
}
var insertColumnLeft = function (editor) { return (__assign(__assign({}, getToolDefinition("insertColumnLeft")), { key: "addColumnLeft", type: "button", onClick: function () { return editor.chain().focus().addColumnBefore().run(); } })); };
var insertColumnRight = function (editor) { return (__assign(__assign({}, getToolDefinition("insertColumnRight")), { key: "addColumnRight", type: "button", title: "Add column right", onClick: function () { return editor.chain().focus().addColumnAfter().run(); }, icon: "insertColumnRight" })); };
var moveColumnLeft = function (editor) { return (__assign(__assign({}, getToolDefinition("moveColumnLeft")), { key: "moveColumnLeft", type: "button", onClick: function () { return moveColumnLeftAction(editor); } })); };
var moveColumnRight = function (editor) { return (__assign(__assign({}, getToolDefinition("moveColumnRight")), { key: "moveColumnRight", type: "button", onClick: function () { return moveColumnRightAction(editor); } })); };
var deleteColumn = function (editor) { return (__assign(__assign({}, getToolDefinition("deleteColumn")), { key: "deleteColumn", type: "button", onClick: function () { return editor.chain().focus().deleteColumn().run(); } })); };
var splitCells = function (editor) { return (__assign(__assign({}, getToolDefinition("splitCells")), { key: "splitCells", type: "button", onClick: function () { return editor.chain().focus().splitCell().run(); } })); };
var mergeCells = function (editor) { return (__assign(__assign({}, getToolDefinition("mergeCells")), { key: "mergeCells", type: "button", onClick: function () { return editor.chain().focus().mergeCells().run(); } })); };
var insertRowAbove = function (editor) { return (__assign(__assign({}, getToolDefinition("insertRowAbove")), { key: "insertRowAbove", type: "button", onClick: function () { return editor.chain().focus().addRowBefore().run(); } })); };
var insertRowBelow = function (editor) { return (__assign(__assign({}, getToolDefinition("insertRowBelow")), { key: "insertRowBelow", type: "button", onClick: function () { return editor.chain().focus().addRowAfter().run(); } })); };
var moveRowUp = function (editor) { return (__assign(__assign({}, getToolDefinition("moveRowUp")), { key: "moveRowUp", type: "button", onClick: function () { return moveRowUpAction(editor); } })); };
var moveRowDown = function (editor) { return (__assign(__assign({}, getToolDefinition("moveRowDown")), { key: "moveRowDown", type: "button", onClick: function () { return moveRowDownAction(editor); } })); };
var deleteRow = function (editor) { return (__assign(__assign({}, getToolDefinition("deleteRow")), { key: "deleteRow", type: "button", onClick: function () { return editor.chain().focus().deleteRow().run(); } })); };
var deleteTable = function (editor) { return (__assign(__assign({}, getToolDefinition("deleteTable")), { key: "deleteTable", type: "button", onClick: function () { return editor.chain().focus().deleteTable().run(); } })); };
var cellProperties = function (editor) { return (__assign(__assign({}, getToolDefinition("cellProperties")), { key: "cellProperties", type: "button", onClick: function () {
        showPopup({
            theme: editor.storage.theme,
            popup: function (hide) { return _jsx(CellPropertiesPopup, { onClose: hide, editor: editor }); },
        });
    } })); };
export var InsertColumnLeft = menuButtonToTool(insertColumnLeft);
export var InsertColumnRight = menuButtonToTool(insertColumnRight);
export var MoveColumnLeft = menuButtonToTool(moveColumnLeft);
export var MoveColumnRight = menuButtonToTool(moveColumnRight);
export var DeleteColumn = menuButtonToTool(deleteColumn);
export var SplitCells = menuButtonToTool(splitCells);
export var MergeCells = menuButtonToTool(mergeCells);
export var InsertRowAbove = menuButtonToTool(insertRowAbove);
export var InsertRowBelow = menuButtonToTool(insertRowBelow);
export var MoveRowUp = menuButtonToTool(moveRowUp);
export var MoveRowDown = menuButtonToTool(moveRowDown);
export var DeleteRow = menuButtonToTool(deleteRow);
export var DeleteTable = menuButtonToTool(deleteTable);
