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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Flex } from "rebass";
import { useToolbarLocation } from "../../stores/toolbar-store";
import { PopupPresenter } from "../../../components/popup-presenter";
import { getToolbarElement } from "../../utils/dom";
import { InsertColumnRight, InsertRowBelow, RowProperties, TableProperties, } from "../../tools/table";
import { getToolDefinition } from "../../tool-definitions";
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
    return (_jsx(PopupPresenter, __assign({ isOpen: true, blocking: false, focusOnRender: false, onClose: function () { }, position: position }, { children: _jsxs(Flex, __assign({ sx: {
                bg: "background",
                flexWrap: "nowrap",
                borderRadius: "default",
                // opacity: isMenuOpen ? 1 : 0.3,
                ":hover": {
                    opacity: 1,
                },
            } }, { children: [_jsx(RowProperties, __assign({}, getToolDefinition("rowProperties"), { icon: "more", variant: "small", editor: editor })), _jsx(InsertRowBelow, __assign({}, getToolDefinition("insertRowBelow"), { editor: editor, variant: "small" }))] })) })));
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
    return (_jsx(PopupPresenter, __assign({ isOpen: true, onClose: function () { }, blocking: false, position: position, focusOnRender: false }, { children: _jsxs(Flex, __assign({ sx: {
                bg: "background",
                flexWrap: "nowrap",
                borderRadius: "default",
                // opacity: 0.3,
                //  opacity: isMenuOpen || showCellProps ? 1 : 0.3,
                ":hover": {
                    opacity: 1,
                },
            } }, { children: [_jsx(TableProperties, { editor: editor, title: "tableProperties", icon: "more", variant: "small" }), _jsx(InsertColumnRight, __assign({}, getToolDefinition("insertColumnRight"), { editor: editor, variant: "small", icon: "plus" }))] })) })));
}
export function TableFloatingMenu(props) {
    var editor = props.editor;
    var toolbarLocation = useToolbarLocation();
    if (!editor.isActive("table"))
        return null;
    return (_jsx(PopupPresenter, __assign({ isOpen: true, onClose: function () { }, blocking: false, position: {
            isTargetAbsolute: true,
            target: getToolbarElement(),
            location: toolbarLocation === "bottom" ? "top" : "below",
        }, focusOnRender: false }, { children: _jsx(Flex, { sx: {
                bg: "background",
                flexWrap: "nowrap",
                borderRadius: "default",
                // opacity: 0.3,
                //  opacity: isMenuOpen || showCellProps ? 1 : 0.3,
                ":hover": {
                    opacity: 1,
                },
            } }) })));
}
