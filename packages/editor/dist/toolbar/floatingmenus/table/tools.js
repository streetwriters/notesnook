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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { MenuPresenter, PopupPresenter, } from "../../../components/menu/menu";
import { ToolButton } from "../../components/tool-button";
import { CellProperties } from "../../popups/cell-properties";
import { moveColumnLeft, moveColumnRight, moveRowDown, moveRowUp, } from "./actions";
export function RowProperties(props) {
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
export function InsertRowBelow(props) {
    var editor = props.editor, toolProps = __rest(props, ["editor"]);
    return (_jsx(ToolButton, __assign({ toggled: false }, toolProps, { onClick: function () { return editor.chain().focus().addRowAfter().run(); } })));
}
export function ColumnProperties(props) {
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
                }); }); } })), _jsx(PopupPresenter, { isOpen: isMenuOpen, onClose: function () {
                    setIsMenuOpen(false);
                    editor.commands.focus();
                }, mobile: "sheet", items: isInsideCellSelection
                    ? __spreadArray(__spreadArray([], __read(mergeSplitProperties), false), __read(cellProperties), false) : __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(columnProperties), false), [
                    { type: "seperator", key: "cellSeperator" }
                ], false), __read(cellProperties), false), [
                    { type: "seperator", key: "tableSeperator" }
                ], false), __read(tableProperties), false) }), _jsx(PopupPresenter, __assign({ isOpen: showCellProps, onClose: function () {
                    setShowCellProps(false);
                    editor.commands.focus();
                }, options: {
                    type: "menu",
                    position: menuPosition || {},
                }, mobile: "sheet" }, { children: _jsx(CellProperties, { editor: editor, onClose: function () { return setShowCellProps(false); } }) }))] }));
}
export function InsertColumnRight(props) {
    var editor = props.editor, toolProps = __rest(props, ["editor"]);
    return (_jsx(ToolButton, __assign({}, toolProps, { toggled: false, onClick: function () { return editor.chain().focus().addColumnAfter().run(); } })));
}
