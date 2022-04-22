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
import { NodeViewWrapper, NodeViewContent, } from "@tiptap/react";
import { findParentNodeClosestToPos, findChildren } from "@tiptap/core";
import { ThemeProvider } from "emotion-theming";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useEffect, useState } from "react";
import { Input } from "@rebass/forms";
export function TaskListComponent(props) {
    var editor = props.editor, getPos = props.getPos, node = props.node, updateAttributes = props.updateAttributes;
    var _a = node.attrs, collapsed = _a.collapsed, title = _a.title;
    var _b = __read(useState({ checked: 0, total: 0, percentage: 0 }), 2), stats = _b[0], setStats = _b[1];
    var theme = editor.storage.theme;
    var resolvedPos = editor.state.doc.resolve(getPos());
    var parentTaskItem = findParentNodeClosestToPos(resolvedPos, function (node) { return node.type.name === "taskItem"; });
    var nested = !!parentTaskItem;
    useEffect(function () {
        if (!parentTaskItem)
            return;
        var node = parentTaskItem.node, pos = parentTaskItem.pos;
        var allChecked = areAllChecked(node);
        var tr = editor.state.tr;
        tr.setNodeMarkup(pos, node.type, { checked: allChecked });
        editor.view.dispatch(tr);
    }, [parentTaskItem]);
    useEffect(function () {
        if (nested)
            return;
        var children = findChildren(node, function (node) { return node.type.name === "taskItem"; });
        var checked = children.filter(function (node) { return node.node.attrs.checked; }).length;
        var total = children.length;
        var percentage = Math.round((checked / total) * 100);
        setStats({ checked: checked, total: total, percentage: percentage });
    }, [nested, node]);
    return (_jsxs(NodeViewWrapper, __assign({ style: { display: collapsed ? "none" : "block" } }, { children: [_jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsx(Flex, __assign({ sx: { flexDirection: "column" } }, { children: nested ? null : (_jsxs(Flex, __assign({ sx: {
                            position: "relative",
                            bg: "bgSecondary",
                            py: 1,
                            borderRadius: "default",
                            mb: 2,
                            alignItems: "center",
                            justifyContent: "end",
                            overflow: "hidden",
                        } }, { children: [_jsx(Box, { sx: {
                                    height: "100%",
                                    width: "".concat(stats.percentage, "%"),
                                    position: "absolute",
                                    bg: "border",
                                    zIndex: 0,
                                    left: 0,
                                    transition: "width 250ms ease-out",
                                } }), _jsx(Input, { value: title || "", variant: "clean", sx: { p: 0, px: 2, zIndex: 1, color: "fontTertiary" }, placeholder: "Untitled", onChange: function (e) {
                                    updateAttributes({ title: e.target.value });
                                } }), _jsxs(Flex, __assign({ sx: { flexShrink: 0, pr: 2 } }, { children: [_jsx(Icon, { path: Icons.checkbox, size: 15, color: "fontTertiary" }), _jsxs(Text, __assign({ variant: "body", sx: { ml: 1, color: "fontTertiary" } }, { children: [stats.checked, "/", stats.total] }))] }))] }))) })) })), _jsx(NodeViewContent, { as: "ul", style: {
                    paddingInlineStart: 0,
                    marginBlockStart: nested ? 15 : 0,
                    marginBlockEnd: 0,
                } })] })));
}
function areAllChecked(node) {
    var children = findChildren(node, function (node) { return node.type.name === "taskItem"; });
    return children.every(function (node) { return node.node.attrs.checked; });
}
