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
import { Box, Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { findChildren, } from "@tiptap/core";
import { OutlineList } from "../outline-list/outline-list";
export function OutlineListItemComponent(props) {
    var _a, _b;
    var editor = props.editor, updateAttributes = props.updateAttributes, node = props.node, getPos = props.getPos, forwardRef = props.forwardRef;
    var isNested = ((_a = node.lastChild) === null || _a === void 0 ? void 0 : _a.type.name) === OutlineList.name;
    var isCollapsed = isNested && ((_b = node.lastChild) === null || _b === void 0 ? void 0 : _b.attrs.collapsed);
    return (_jsxs(Flex, { children: [_jsxs(Flex, __assign({ className: "outline", sx: {
                    flexDirection: "column",
                    alignItems: "center",
                    mt: "3px",
                } }, { children: [isNested ? (_jsx(Icon, { path: isCollapsed ? Icons.chevronRight : Icons.chevronDown, title: isCollapsed
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
                            var _a = __read(findChildren(node, function (node) { return node.type.name === OutlineList.name; }), 1), subList = _a[0];
                            if (!subList)
                                return;
                            var pos = subList.pos;
                            editor.commands.toggleOutlineCollapse(pos + getPos() + 1, !isCollapsed);
                        } })) : (_jsx(Icon, { path: Icons.circle, size: 18, sx: { transform: "scale(0.4)" } })), isNested && !isCollapsed && (_jsx(Box, { sx: {
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
                        }, contentEditable: false }))] })), _jsx(Text, { as: "li", ref: forwardRef, sx: {
                    pl: 2,
                    listStyleType: "none",
                    flex: 1,
                } })] }));
}
