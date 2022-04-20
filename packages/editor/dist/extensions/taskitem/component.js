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
import { Flex, Text } from "rebass";
import { NodeViewWrapper, NodeViewContent, } from "@tiptap/react";
import { ThemeProvider } from "emotion-theming";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { findChildren, } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";
export function TaskItemComponent(props) {
    var checked = props.node.attrs.checked;
    var _a = useState({ checked: 0, total: 0 }), stats = _a[0], setStats = _a[1];
    var editor = props.editor, updateAttributes = props.updateAttributes, node = props.node, getPos = props.getPos;
    var theme = editor.storage.theme;
    var toggle = useCallback(function () {
        if (!editor.isEditable)
            return false;
        updateAttributes({ checked: !checked });
        var tr = editor.state.tr;
        var parentPos = getPos();
        toggleChildren(node, tr, !checked, parentPos);
        editor.view.dispatch(tr);
        return true;
    }, [editor, getPos, node]);
    var nestedTaskList = getChildren(node, getPos()).find(function (_a) {
        var node = _a.node;
        return node.type.name === "taskList";
    });
    var isNested = !!nestedTaskList;
    var isCollapsed = nestedTaskList
        ? nestedTaskList.node.attrs.collapsed
        : false;
    useEffect(function () {
        if (!nestedTaskList)
            return;
        var pos = nestedTaskList.pos, node = nestedTaskList.node;
        var children = findChildren(node, function (node) { return node.type.name === "taskItem"; });
        var checked = children.filter(function (_a) {
            var node = _a.node;
            return node.attrs.checked;
        }).length;
        var total = children.length;
        setStats({ checked: checked, total: total });
    }, [isNested, nestedTaskList, node]);
    return (_jsx(NodeViewWrapper, { children: _jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsxs(Flex, __assign({ sx: {
                    mb: 2,
                    ":hover > .dragHandle, :hover > .toggleSublist": {
                        opacity: 1,
                    },
                } }, { children: [_jsx(Icon, { className: "dragHandle", draggable: "true", contentEditable: false, "data-drag-handle": true, path: Icons.dragHandle, sx: {
                            opacity: 0,
                            alignSelf: "start",
                            mr: 2,
                            cursor: "grab",
                            ".icon:hover path": {
                                fill: "var(--checked) !important",
                            },
                        }, size: 20 }), _jsx(Icon, { path: checked ? Icons.check : "", stroke: "1px", sx: {
                            border: "2px solid",
                            borderColor: checked ? "checked" : "icon",
                            borderRadius: "default",
                            alignSelf: "start",
                            mr: 2,
                            p: "1px",
                            cursor: "pointer",
                            ":hover": {
                                borderColor: "checked",
                            },
                            ":hover .icon path": {
                                fill: "var(--checked) !important",
                            },
                        }, onMouseEnter: function (e) {
                            if (e.buttons > 0) {
                                toggle();
                            }
                        }, onMouseDown: function (e) {
                            if (toggle())
                                e.preventDefault();
                        }, color: checked ? "checked" : "icon", size: 13 }), _jsx(NodeViewContent, { as: "li", style: {
                            listStyleType: "none",
                            textDecorationLine: checked ? "line-through" : "none",
                            color: checked ? "var(--checked)" : "var(--text)",
                            flex: 1,
                        } }), isNested && (_jsxs(_Fragment, { children: [isCollapsed && (_jsxs(Text, __assign({ variant: "body", sx: { color: "fontTertiary", mr: 35 } }, { children: [stats.checked, "/", stats.total] }))), _jsx(Icon, { className: "toggleSublist", path: nestedTaskList.node.attrs.collapsed
                                    ? Icons.chevronDown
                                    : Icons.chevronUp, sx: {
                                    opacity: isCollapsed ? 1 : 0,
                                    position: "absolute",
                                    right: 0,
                                    alignSelf: "start",
                                    mr: 2,
                                    cursor: "pointer",
                                    ".icon:hover path": {
                                        fill: "var(--checked) !important",
                                    },
                                }, size: 20, onClick: function () {
                                    editor
                                        .chain()
                                        .setNodeSelection(getPos())
                                        .command(function (_a) {
                                        var tr = _a.tr;
                                        var pos = nestedTaskList.pos, node = nestedTaskList.node;
                                        tr.setNodeMarkup(pos, undefined, {
                                            collapsed: !node.attrs.collapsed,
                                        });
                                        return true;
                                    })
                                        .run();
                                } })] }))] })) })) }));
}
function toggleChildren(node, tr, toggleState, parentPos) {
    var children = findChildren(node, function (node) { return node.type.name === "taskItem"; });
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var pos = children_1[_i].pos;
        // need to add 1 to get inside the node
        var actualPos = pos + parentPos + 1;
        tr.setNodeMarkup(actualPos, undefined, {
            checked: toggleState,
        });
    }
    return tr;
}
function getChildren(node, parentPos) {
    var children = [];
    node.forEach(function (node, offset) {
        children.push({ node: node, pos: parentPos + offset + 1 });
    });
    return children;
}
