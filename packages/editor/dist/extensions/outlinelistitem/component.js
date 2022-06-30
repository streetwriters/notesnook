"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineListItemComponent = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var icon_1 = require("../../toolbar/components/icon");
var icons_1 = require("../../toolbar/icons");
var core_1 = require("@tiptap/core");
var outlinelist_1 = require("../outline-list/outlinelist");
function OutlineListItemComponent(props) {
    var _a, _b;
    var editor = props.editor, updateAttributes = props.updateAttributes, node = props.node, getPos = props.getPos, forwardRef = props.forwardRef;
    var isNested = ((_a = node.lastChild) === null || _a === void 0 ? void 0 : _a.type.name) === outlinelist_1.OutlineList.name;
    var isCollapsed = isNested && ((_b = node.lastChild) === null || _b === void 0 ? void 0 : _b.attrs.collapsed);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ className: "outline", sx: {
                    flexDirection: "column",
                    alignItems: "center",
                    mt: "3px",
                } }, { children: [isNested ? ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: isCollapsed ? icons_1.Icons.chevronRight : icons_1.Icons.chevronDown, title: isCollapsed
                            ? "Click to uncollapse list"
                            : "Click to collapse list", sx: {
                            cursor: "pointer",
                            transition: "all .2s ease-in-out",
                            ":hover": {
                                transform: "scale(1.3)",
                            },
                            ".icon:hover path": {
                                fill: "var(--checked) !important",
                            },
                        }, size: 18, onMouseDown: function (e) { return e.preventDefault(); }, onClick: function () {
                            var _a = __read((0, core_1.findChildren)(node, function (node) { return node.type.name === outlinelist_1.OutlineList.name; }), 1), subList = _a[0];
                            if (!subList)
                                return;
                            var pos = subList.pos;
                            editor.commands.toggleOutlineCollapse(pos + getPos() + 1, !isCollapsed);
                        } })) : ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.circle, size: 18, sx: { transform: "scale(0.4)" } })), isNested && !isCollapsed && ((0, jsx_runtime_1.jsx)(rebass_1.Box, { sx: {
                            flex: 1,
                            width: 1,
                            mt: 2,
                            backgroundColor: "border",
                            borderRadius: 50,
                            flexShrink: 0,
                            cursor: "pointer",
                            transition: "all .2s ease-in-out",
                            ":hover": {
                                backgroundColor: "fontTertiary",
                                width: 4,
                            },
                        }, contentEditable: false }))] })), (0, jsx_runtime_1.jsx)(rebass_1.Text, { as: "li", ref: forwardRef, sx: {
                    pl: 2,
                    listStyleType: "none",
                    flex: 1,
                } })] }));
}
exports.OutlineListItemComponent = OutlineListItemComponent;
