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
    const { editor } = props;
    const buttonRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const toolbarLocation = useToolbarLocation();
    const isMobile = useIsMobile();
    const menuItems = useMemo(() => {
        return [
            tasklist(editor),
            outlinelist(editor),
            horizontalRule(editor),
            codeblock(editor),
            mathblock(editor),
            blockquote(editor),
            image(editor, isMobile),
            attachment(editor),
            isMobile ? embedMobile(editor) : embedDesktop(editor),
            table(editor),
        ];
    }, [isMobile]);
    return (_jsxs(_Fragment, { children: [_jsx(Button, Object.assign({ ref: buttonRef, sx: {
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
                }, onMouseDown: (e) => e.preventDefault(), onClick: () => setIsOpen((s) => !s) }, { children: _jsx(Icon, { path: Icons.plus, size: 18, color: "primary" }) })), _jsx(ResponsivePresenter, { desktop: "menu", mobile: "sheet", title: "Choose a block to insert", isOpen: isOpen, items: menuItems, onClose: () => setIsOpen(false), position: {
                    target: buttonRef.current || undefined,
                    isTargetAbsolute: true,
                    location: toolbarLocation === "bottom" ? "top" : "below",
                    yOffset: 5,
                } })] }));
}
const horizontalRule = (editor) => ({
    key: "hr",
    type: "button",
    title: "Horizontal rule",
    icon: "horizontalRule",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("horizontalRule"),
    onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setHorizontalRule().run(); },
});
const codeblock = (editor) => ({
    key: "codeblock",
    type: "button",
    title: "Code block",
    icon: "codeblock",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("codeBlock"),
    onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleCodeBlock().run(); },
});
const blockquote = (editor) => ({
    key: "blockquote",
    type: "button",
    title: "Quote",
    icon: "blockquote",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("blockQuote"),
    onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBlockquote().run(); },
});
const mathblock = (editor) => ({
    key: "math",
    type: "button",
    title: "Math & formulas",
    icon: "mathBlock",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("mathBlock"),
    onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertMathBlock().run(); },
});
const image = (editor, isMobile) => ({
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
                onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().openAttachmentPicker("image").run(); },
            },
            {
                key: "camera",
                type: "button",
                title: "Take a photo using camera",
                icon: "camera",
                isHidden: !isMobile,
                onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().openAttachmentPicker("camera").run(); },
            },
            isMobile ? uploadImageFromURLMobile(editor) : uploadImageFromURL(editor),
        ],
    },
});
const table = (editor) => ({
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
                component: (props) => (_jsx(TablePopup, { onInsertTable: (size) => {
                        var _a, _b;
                        (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertTable({
                            rows: size.rows,
                            cols: size.columns,
                        }).run();
                        (_b = props.onClick) === null || _b === void 0 ? void 0 : _b.call(props);
                    } })),
            },
        ],
    },
});
const embedMobile = (editor) => ({
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
                component: function ({ onClick }) {
                    return (_jsx(EmbedPopup, { title: "Insert embed", onClose: (embed) => {
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
});
const embedDesktop = (editor) => ({
    key: "embed",
    type: "button",
    title: "Embed",
    icon: "embed",
    onClick: () => {
        if (!editor)
            return;
        showPopup({
            popup: (hide) => (_jsx(EmbedPopup, { title: "Insert embed", onClose: (embed) => {
                    var _a;
                    if (!embed)
                        return hide();
                    (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().insertEmbed(embed).run();
                    hide();
                } })),
        });
    },
});
const attachment = (editor) => ({
    key: "attachment",
    type: "button",
    title: "Attachment",
    icon: "attachment",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("attachment"),
    onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().openAttachmentPicker("file").run(); },
});
const tasklist = (editor) => ({
    key: "tasklist",
    type: "button",
    title: "Task list",
    icon: "checkbox",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("taskList"),
    onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleTaskList().run(); },
});
const outlinelist = (editor) => ({
    key: "outlinelist",
    type: "button",
    title: "Outline list",
    icon: "outlineList",
    isChecked: editor === null || editor === void 0 ? void 0 : editor.isActive("outlineList"),
    onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleOutlineList().run(); },
});
const uploadImageFromURLMobile = (editor) => ({
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
                component: ({ onClick }) => (_jsx(ImageUploadPopup, { onInsert: (image) => {
                        var _a;
                        (_a = editor
                            .requestPermission("insertImage")) === null || _a === void 0 ? void 0 : _a.chain().focus().insertImage(image).run();
                        onClick === null || onClick === void 0 ? void 0 : onClick();
                    }, onClose: () => {
                        onClick === null || onClick === void 0 ? void 0 : onClick();
                    } })),
            },
        ],
    },
});
const uploadImageFromURL = (editor) => ({
    key: "upload-from-url",
    type: "button",
    title: "Attach from URL",
    icon: "link",
    onClick: () => {
        showPopup({
            popup: (hide) => (_jsx(ImageUploadPopup, { onInsert: (image) => {
                    var _a;
                    (_a = editor
                        .requestPermission("insertImage")) === null || _a === void 0 ? void 0 : _a.chain().focus().insertImage(image).run();
                    hide();
                }, onClose: hide })),
        });
    },
});
