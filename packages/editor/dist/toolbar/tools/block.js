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
import { useMemo, useRef, useState } from "react";
import { Icon } from "../components/icon";
import { EmbedPopup } from "../popups/embed-popup";
import { TablePopup } from "../popups/table-popup";
import { useIsMobile, useToolbarLocation } from "../stores/toolbar-store";
import { ResponsivePresenter } from "../../components/responsive";
import { showPopup } from "../../components/popup-presenter";
import { ImageUploadPopup } from "../popups/image-upload";
import { Button } from "../../components/button";
export function InsertBlock(props) {
    var editor = props.editor;
    var buttonRef = useRef(null);
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var toolbarLocation = useToolbarLocation();
    var isMobile = useIsMobile();
    var menuItems = useMemo(function () {
        return [
            tasklist(editor),
            horizontalRule(editor),
            codeblock(editor),
            blockquote(editor),
            image(editor, isMobile),
            attachment(editor),
            isMobile ? embedMobile(editor) : embedDesktop(editor),
            table(editor),
        ];
    }, [isMobile]);
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
                }, onMouseDown: function (e) { return e.preventDefault(); }, onClick: function () { return setIsOpen(function (s) { return !s; }); } }, { children: _jsx(Icon, { path: Icons.plus, size: 18, color: "primary" }) })), _jsx(ResponsivePresenter, { desktop: "menu", mobile: "sheet", title: "Choose a block to insert", isOpen: isOpen, items: menuItems, onClose: function () { return setIsOpen(false); }, position: {
                    target: buttonRef.current || undefined,
                    isTargetAbsolute: true,
                    location: toolbarLocation === "bottom" ? "top" : "below",
                    yOffset: 5,
                } })] }));
}
var horizontalRule = function (editor) { return ({
    key: "hr",
    type: "button",
    title: "Horizontal rule",
    icon: "horizontalRule",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("horizontalRule"),
    onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setHorizontalRule().run(); },
}); };
var codeblock = function (editor) { return ({
    key: "codeblock",
    type: "button",
    title: "Code block",
    icon: "codeblock",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("codeBlock"),
    onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleCodeBlock().run(); },
}); };
var blockquote = function (editor) { return ({
    key: "blockquote",
    type: "button",
    title: "Quote",
    icon: "blockquote",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("blockQuote"),
    onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBlockquote().run(); },
}); };
var image = function (editor, isMobile) { return ({
    key: "image",
    type: "button",
    title: "Image",
    icon: "image",
    menu: {
        title: "Insert an image",
        items: [
            {
                key: "upload-from-disk",
                type: "button",
                title: "Upload from disk",
                icon: "upload",
                onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().openAttachmentPicker("image").run(); },
            },
            isMobile ? uploadImageFromURLMobile(editor) : uploadImageFromURL(editor),
        ],
    },
}); };
var table = function (editor) { return ({
    key: "table",
    type: "button",
    title: "Table",
    icon: "table",
    menu: {
        title: "Insert a table",
        items: [
            {
                key: "table-size-selector",
                type: "popup",
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
    },
}); };
var embedMobile = function (editor) { return ({
    key: "embed",
    type: "button",
    title: "Embed",
    icon: "embed",
    menu: {
        title: "Insert an embed",
        items: [
            {
                key: "embed-popup",
                type: "popup",
                component: function (_a) {
                    var onClick = _a.onClick;
                    return (_jsx(EmbedPopup, { title: "Insert embed", onClose: function (embed) {
                            var _a;
                            if (!embed)
                                return onClick === null || onClick === void 0 ? void 0 : onClick();
                            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().insertEmbed(embed).run();
                            onClick === null || onClick === void 0 ? void 0 : onClick();
                        } }));
                },
            },
        ],
    },
}); };
var embedDesktop = function (editor) { return ({
    key: "embed",
    type: "button",
    title: "Embed",
    icon: "embed",
    onClick: function () {
        if (!editor)
            return;
        showPopup({
            theme: editor.storage.theme,
            popup: function (hide) { return (_jsx(EmbedPopup, { title: "Insert embed", onClose: function (embed) {
                    var _a;
                    if (!embed)
                        return hide();
                    (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().insertEmbed(embed).run();
                    hide();
                } })); },
        });
    },
}); };
var attachment = function (editor) { return ({
    key: "attachment",
    type: "button",
    title: "Attachment",
    icon: "attachment",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("attachment"),
    onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().openAttachmentPicker("file").run(); },
}); };
var tasklist = function (editor) { return ({
    key: "tasklist",
    type: "button",
    title: "Task list",
    icon: "checkbox",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("taskList"),
    onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleTaskList().run(); },
}); };
var uploadImageFromURLMobile = function (editor) { return ({
    key: "upload-from-url",
    type: "button",
    title: "Attach from URL",
    icon: "link",
    menu: {
        title: "Attach image from URL",
        items: [
            {
                key: "attach-image",
                type: "popup",
                component: function (_a) {
                    var onClick = _a.onClick;
                    return (_jsx(ImageUploadPopup, { onInsert: function (image) {
                            var _a;
                            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertImage(image).run();
                            onClick === null || onClick === void 0 ? void 0 : onClick();
                        }, onClose: function () {
                            onClick === null || onClick === void 0 ? void 0 : onClick();
                        } }));
                },
            },
        ],
    },
}); };
var uploadImageFromURL = function (editor) { return ({
    key: "upload-from-url",
    type: "button",
    title: "Attach from URL",
    icon: "link",
    onClick: function () {
        if (!editor)
            return;
        showPopup({
            theme: editor.storage.theme,
            popup: function (hide) { return (_jsx(ImageUploadPopup, { onInsert: function (image) {
                    var _a;
                    (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertImage(image).run();
                    hide();
                }, onClose: hide })); },
        });
    },
}); };
