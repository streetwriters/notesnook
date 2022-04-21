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
import { Box, Button, Flex } from "rebass";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { ToolButton } from "../components/tool-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";
var ListTool = /** @class */ (function () {
    function ListTool(id, title, options) {
        var _this = this;
        this.id = id;
        this.title = title;
        this.options = options;
        this.render = function (props) {
            var editor = props.editor;
            var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
            var ref = useRef(null);
            var isActive = editor.isActive(_this.options.type);
            return (_jsxs(Flex, __assign({ ref: ref }, { children: [_jsx(ToolButton, { title: _this.title, id: _this.id, icon: _this.options.icon, onClick: function () { return _this.options.onClick(editor); }, toggled: isActive, sx: { mr: 0 } }), _jsx(Button, __assign({ sx: {
                            p: 0,
                            m: 0,
                            bg: "transparent",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: function () { return setIsOpen(function (s) { return !s; }); } }, { children: _jsx(Icon, { path: Icons.chevronDown, color: "text", size: 18 }) })), _jsx(MenuPresenter, { isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: _this.options.subTypes.map(function (item) { return ({
                            key: item.type,
                            tooltip: item.title,
                            type: "menuitem",
                            component: function () { return _jsx(ListThumbnail, { listStyleType: item.type }); },
                            onClick: function () {
                                var chain = editor.chain().focus();
                                if (!isActive) {
                                    if (_this.options.type === "bulletList")
                                        chain = chain.toggleBulletList();
                                    else
                                        chain = chain.toggleOrderedList();
                                }
                                return chain
                                    .updateAttributes(_this.options.type, { listType: item.type })
                                    .run();
                            },
                        }); }), sx: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", p: 1 }, options: {
                            type: "menu",
                            position: {
                                target: ref.current || undefined,
                                isTargetAbsolute: true,
                                location: "below",
                                yOffset: 5,
                            },
                        } })] })));
        };
    }
    return ListTool;
}());
var NumberedList = /** @class */ (function (_super) {
    __extends(NumberedList, _super);
    function NumberedList() {
        var options = {
            type: "orderedList",
            icon: "numberedList",
            onClick: function (editor) { return editor.chain().focus().toggleOrderedList().run(); },
            subTypes: [
                { type: "decimal", title: "Decimal", items: ["1", "2", "3"] },
                { type: "upper-alpha", title: "Upper alpha", items: ["A", "B", "C"] },
                { type: "lower-alpha", title: "Lower alpha", items: ["a", "b", "c"] },
                {
                    type: "upper-roman",
                    title: "Upper Roman",
                    items: ["I", "II", "III"],
                },
                {
                    type: "lower-roman",
                    title: "Lower Roman",
                    items: ["i", "ii", "iii"],
                },
                { type: "lower-greek", title: "Lower Greek", items: ["α", "β", "γ"] },
            ],
        };
        return _super.call(this, "numberedList", "Numbered list", options) || this;
    }
    return NumberedList;
}(ListTool));
export { NumberedList };
var BulletList = /** @class */ (function (_super) {
    __extends(BulletList, _super);
    function BulletList() {
        var options = {
            type: "bulletList",
            icon: "bulletList",
            onClick: function (editor) { return editor.chain().focus().toggleOrderedList().run(); },
            subTypes: [
                { type: "disc", title: "Decimal", items: ["1", "2", "3"] },
                { type: "circle", title: "Upper alpha", items: ["A", "B", "C"] },
                { type: "square", title: "Lower alpha", items: ["a", "b", "c"] },
            ],
        };
        return _super.call(this, "bulletList", "Bullet list", options) || this;
    }
    return BulletList;
}(ListTool));
export { BulletList };
var Checklist = /** @class */ (function () {
    function Checklist() {
        var _this = this;
        this.id = "checklist";
        this.title = "Checklist";
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(ToolButton, { title: _this.title, id: _this.id, icon: "checklist", onClick: function () { return editor.chain().focus().toggleTaskList().run(); }, toggled: false }));
        };
    }
    return Checklist;
}());
export { Checklist };
function ListThumbnail(props) {
    var listStyleType = props.listStyleType;
    return (_jsx(Flex, __assign({ as: "ul", sx: {
            flexDirection: "column",
            flex: 1,
            p: 0,
            listStyleType: listStyleType,
        } }, { children: [0, 0, 0].map(function () { return (_jsx(Box, __assign({ as: "li", sx: {
                display: "list-item",
                color: "text",
                fontSize: 8,
                mb: "1px",
            } }, { children: _jsx(Flex, __assign({ sx: {
                    alignItems: "center",
                } }, { children: _jsx(Box, { sx: {
                        width: "100%",
                        flexShrink: 0,
                        height: 4,
                        bg: "#cbcbcb",
                        borderRadius: "2px",
                    } }) })) }))); }) })));
}
