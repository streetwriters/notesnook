var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";
import { Flex } from "rebass";
import { Input } from "@rebass/forms";
import { Popup } from "../components/popup";
var InlineTool = /** @class */ (function () {
    function InlineTool(id, title, icon) {
        var _this = this;
        this.id = id;
        this.title = title;
        this.icon = icon;
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(ToolButton, { title: _this.title, id: _this.id, icon: _this.icon, onClick: function () { return editor.chain().focus().toggleMark(_this.id).run(); }, toggled: editor.isActive(_this.id) }));
        };
    }
    return InlineTool;
}());
var Italic = /** @class */ (function (_super) {
    __extends(Italic, _super);
    function Italic() {
        return _super.call(this, "italic", "Italic", "italic") || this;
    }
    return Italic;
}(InlineTool));
export { Italic };
var Strikethrough = /** @class */ (function (_super) {
    __extends(Strikethrough, _super);
    function Strikethrough() {
        return _super.call(this, "strikethrough", "Strikethrough", "strikethrough") || this;
    }
    return Strikethrough;
}(InlineTool));
export { Strikethrough };
var Underline = /** @class */ (function (_super) {
    __extends(Underline, _super);
    function Underline() {
        return _super.call(this, "underline", "Underline", "underline") || this;
    }
    return Underline;
}(InlineTool));
export { Underline };
var Code = /** @class */ (function (_super) {
    __extends(Code, _super);
    function Code() {
        return _super.call(this, "code", "Code", "code") || this;
    }
    return Code;
}(InlineTool));
export { Code };
var Bold = /** @class */ (function (_super) {
    __extends(Bold, _super);
    function Bold() {
        return _super.call(this, "bold", "Bold", "bold") || this;
    }
    return Bold;
}(InlineTool));
export { Bold };
var Subscript = /** @class */ (function (_super) {
    __extends(Subscript, _super);
    function Subscript() {
        return _super.call(this, "subscript", "Subscript", "subscript") || this;
    }
    return Subscript;
}(InlineTool));
export { Subscript };
var Superscript = /** @class */ (function (_super) {
    __extends(Superscript, _super);
    function Superscript() {
        return _super.call(this, "superscript", "Superscript", "superscript") || this;
    }
    return Superscript;
}(InlineTool));
export { Superscript };
var ClearFormatting = /** @class */ (function () {
    function ClearFormatting() {
        var _this = this;
        this.id = "formatClear";
        this.title = "Clear all formatting";
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(ToolButton, { title: _this.title, id: _this.id, icon: "formatClear", onClick: function () {
                    return editor.chain().focus().clearNodes().unsetAllMarks().run();
                }, toggled: false }));
        };
    }
    return ClearFormatting;
}());
export { ClearFormatting };
var Link = /** @class */ (function () {
    function Link() {
        var _this = this;
        this.id = "link";
        this.title = "Link";
        this.render = function (props) {
            var editor = props.editor;
            var buttonRef = useRef(null);
            var targetRef = useRef();
            var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
            var _b = useState(), href = _b[0], setHref = _b[1];
            var _c = useState(), text = _c[0], setText = _c[1];
            var currentUrl = editor.getAttributes("link").href;
            var isEditing = !!currentUrl;
            return (_jsxs(_Fragment, { children: [_jsx(ToolButton, { ref: buttonRef, title: _this.title, id: _this.id, icon: "link", onClick: function () {
                            if (isEditing)
                                setHref(currentUrl);
                            var _a = editor.state.selection, from = _a.from, to = _a.to, $from = _a.$from;
                            var selectedNode = $from.node();
                            var pos = selectedNode.isTextblock ? $from.before() : $from.pos;
                            var domNode = editor.view.nodeDOM(pos);
                            targetRef.current = domNode;
                            var selectedText = isEditing
                                ? selectedNode.textContent
                                : editor.state.doc.textBetween(from, to);
                            setText(selectedText);
                            setIsOpen(true);
                        }, toggled: isOpen || !!isEditing }), _jsx(MenuPresenter, __assign({ options: {
                            type: "menu",
                            position: {
                                target: targetRef.current || buttonRef.current || undefined,
                                isTargetAbsolute: true,
                                location: "below",
                                yOffset: 5,
                            },
                        }, isOpen: isOpen, items: [], onClose: function () {
                            editor.commands.focus();
                            setIsOpen(false);
                        } }, { children: _jsx(Popup, __assign({ title: isEditing ? "Edit link" : "Insert link", action: {
                                text: isEditing ? "Edit" : "Insert",
                                onClick: function () {
                                    if (!href)
                                        return;
                                    var commandChain = editor
                                        .chain()
                                        .focus()
                                        .extendMarkRange("link")
                                        .setLink({ href: href, target: "_blank" });
                                    if (text)
                                        commandChain = commandChain.insertContent(text).focus();
                                    commandChain.run();
                                    setIsOpen(false);
                                },
                            } }, { children: _jsxs(Flex, __assign({ sx: { p: 1, width: 300, flexDirection: "column" } }, { children: [_jsx(Input, { type: "text", placeholder: "Link text", value: text, onChange: function (e) { return setText(e.target.value); } }), _jsx(Input, { type: "url", sx: { mt: 1 }, autoFocus: true, placeholder: "https://example.com/", value: href, onChange: function (e) { return setHref(e.target.value); } })] })) })) }))] }));
        };
    }
    return Link;
}());
export { Link };
var Attachment = /** @class */ (function () {
    function Attachment() {
        var _this = this;
        this.id = "attachment";
        this.title = "Attachment";
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(ToolButton, { title: _this.title, id: _this.id, icon: "attachment", onClick: function () { }, toggled: false }));
        };
    }
    return Attachment;
}());
export { Attachment };
