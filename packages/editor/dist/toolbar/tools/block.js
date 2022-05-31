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
import { Icons } from "../icons";
import { ActionSheetPresenter, } from "../../components/menu/menu";
import { useRef, useState } from "react";
import { Icon } from "../components/icon";
import { Button } from "rebass";
import { EmbedPopup } from "../popups/embed-popup";
import { TablePopup } from "../popups/table-popup";
import { useToolbarLocation } from "../stores/toolbar-store";
export function InsertBlock(props) {
    var buttonRef = useRef();
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var toolbarLocation = useToolbarLocation();
    return (_jsxs(_Fragment, { children: [_jsx(Button, __assign({ ref: buttonRef, sx: {
                    p: 1,
                    m: 0,
                    bg: isOpen ? "hover" : "transparent",
                    mr: 1,
                    display: "flex",
                    alignItems: "center",
                    ":hover": { bg: "hover" },
                    ":last-of-type": {
                        mr: 0,
                    },
                }, onMouseDown: function (e) { return e.preventDefault(); }, onClick: function () { return setIsOpen(function (s) { return !s; }); } }, { children: _jsx(Icon, { path: Icons.plus, size: 18, color: "primary" }) })), _jsx(ActionSheetPresenter, { title: "Choose a block to insert", isOpen: isOpen, items: [
                    tasklist(editor),
                    horizontalRule(editor),
                    codeblock(editor),
                    blockquote(editor),
                    imageActionSheet(editor),
                    attachment(editor),
                    embedActionSheet(editor),
                    tableActionSheet(editor),
                ], onClose: function () { return setIsOpen(false); } })] }));
}
var horizontalRule = function (editor) { return ({
    key: "hr",
    type: "menuitem",
    title: "Horizontal rule",
    icon: "horizontalRule",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("horizontalRule"),
    onClick: function () { return editor === null || editor === void 0 ? void 0 : editor.chain().focus().setHorizontalRule().run(); },
}); };
var codeblock = function (editor) { return ({
    key: "codeblock",
    type: "menuitem",
    title: "Code block",
    icon: "codeblock",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("codeBlock"),
    onClick: function () { return editor === null || editor === void 0 ? void 0 : editor.chain().focus().toggleCodeBlock().run(); },
}); };
var blockquote = function (editor) { return ({
    key: "blockquote",
    type: "menuitem",
    title: "Quote",
    icon: "blockquote",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("blockQuote"),
    onClick: function () { return editor === null || editor === void 0 ? void 0 : editor.chain().focus().toggleBlockquote().run(); },
}); };
var image = function (editor) { return ({
    key: "image",
    type: "menuitem",
    title: "Image",
    icon: "image",
    items: [
        {
            key: "upload-from-disk",
            type: "menuitem",
            title: "Upload from disk",
            icon: "upload",
            onClick: function () { },
        },
        {
            key: "upload-from-url",
            type: "menuitem",
            title: "Attach from URL",
            icon: "link",
            onClick: function () { },
        },
    ],
}); };
var imageActionSheet = function (editor) { return ({
    key: "image",
    type: "menuitem",
    title: "Image",
    icon: "image",
    items: [
        {
            key: "imageOptions",
            type: "menuitem",
            component: function (_a) {
                var onClick = _a.onClick;
                var _b = __read(useState(true), 2), isOpen = _b[0], setIsOpen = _b[1];
                return (_jsx(ActionSheetPresenter, { isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: [
                        {
                            key: "upload-from-disk",
                            type: "menuitem",
                            title: "Upload from disk",
                            icon: "upload",
                            onClick: function () { },
                        },
                        {
                            key: "upload-from-url",
                            type: "menuitem",
                            title: "Attach from URL",
                            icon: "link",
                            onClick: function () { },
                        },
                    ] }));
            },
        },
    ],
}); };
var embed = function (editor) { return ({
    key: "embed",
    type: "menuitem",
    title: "Embed",
    icon: "embed",
}); };
var table = function (editor) { return ({
    key: "table",
    type: "menuitem",
    title: "Table",
    icon: "table",
    items: [
        {
            key: "table-size-selector",
            type: "menuitem",
            component: function (props) { return (_jsx(TablePopup, { onInsertTable: function (size) {
                    var _a;
                    editor === null || editor === void 0 ? void 0 : editor.chain().focus().insertTable({
                        rows: size.rows,
                        cols: size.columns,
                    }).run();
                    (_a = props.onClick) === null || _a === void 0 ? void 0 : _a.call(props);
                } })); },
        },
    ],
}); };
var embedActionSheet = function (editor) { return ({
    key: "embed",
    type: "menuitem",
    title: "Embed",
    icon: "embed",
    items: [
        {
            key: "table-size-selector",
            type: "menuitem",
            component: function (_a) {
                var onClick = _a.onClick;
                var _b = __read(useState(true), 2), isOpen = _b[0], setIsOpen = _b[1];
                return (_jsx(ActionSheetPresenter, __assign({ isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: [] }, { children: _jsx(EmbedPopup, { title: "Insert embed", icon: "check", onClose: function (embed) {
                            editor === null || editor === void 0 ? void 0 : editor.chain().insertEmbed(embed).run();
                            setIsOpen(false);
                            onClick === null || onClick === void 0 ? void 0 : onClick();
                        } }) })));
            },
        },
    ],
}); };
var tableActionSheet = function (editor) { return ({
    key: "table",
    type: "menuitem",
    title: "Table",
    icon: "table",
    items: [
        {
            key: "table-size-selector",
            type: "menuitem",
            component: function (_a) {
                var onClick = _a.onClick;
                var _b = __read(useState(true), 2), isOpen = _b[0], setIsOpen = _b[1];
                return (_jsx(ActionSheetPresenter, __assign({ isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: [] }, { children: _jsx(TablePopup, { cellSize: 30, autoExpand: false, onInsertTable: function (size) {
                            editor === null || editor === void 0 ? void 0 : editor.chain().focus().insertTable({
                                rows: size.rows,
                                cols: size.columns,
                            }).run();
                            setIsOpen(false);
                            onClick === null || onClick === void 0 ? void 0 : onClick();
                        } }) })));
            },
        },
    ],
}); };
var attachment = function (editor) { return ({
    key: "attachment",
    type: "menuitem",
    title: "Attachment",
    icon: "attachment",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("attachment"),
    onClick: function () { return editor === null || editor === void 0 ? void 0 : editor.chain().focus().openAttachmentPicker().run(); },
}); };
var tasklist = function (editor) { return ({
    key: "tasklist",
    type: "menuitem",
    title: "Task list",
    icon: "checkbox",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("taskList"),
    onClick: function () { return editor === null || editor === void 0 ? void 0 : editor.chain().toggleTaskList().run(); },
}); };
