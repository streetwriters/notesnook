import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { findChildren, getNodeType, } from "@tiptap/core";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@rebass/forms";
import { TaskItemNode } from "../task-item";
import { findParentNodeOfTypeClosestToPos } from "prosemirror-utils";
export function TaskListComponent(props) {
    const { editor, getPos, node, updateAttributes, forwardRef } = props;
    const taskItemType = getNodeType(TaskItemNode.name, editor.schema);
    const { title, collapsed } = node.attrs;
    const [stats, setStats] = useState({ checked: 0, total: 0, percentage: 0 });
    const parentTaskItem = useMemo(() => {
        const pos = editor.state.doc.resolve(getPos());
        return findParentNodeOfTypeClosestToPos(pos, taskItemType);
    }, []);
    const nested = !!parentTaskItem;
    useEffect(() => {
        if (!parentTaskItem)
            return;
        const { node, pos } = parentTaskItem;
        const allChecked = areAllChecked(node, pos, editor.state.doc);
        // check parent item if all child items are checked.
        editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { checked: allChecked });
            return true;
        });
    }, [node, parentTaskItem]);
    useEffect(() => {
        const children = findChildren(node, (node) => node.type.name === TaskItemNode.name);
        const checked = children.filter((node) => node.node.attrs.checked).length;
        const total = children.length;
        const percentage = Math.round((checked / total) * 100);
        setStats({ checked, total, percentage });
    }, [nested, node]);
    return (_jsxs(_Fragment, { children: [_jsx(Flex, Object.assign({ sx: {
                    flexDirection: "column",
                    ":hover > div > .toggleSublist": { opacity: 1 },
                } }, { children: nested ? (_jsxs(Flex, Object.assign({ sx: {
                        position: "absolute",
                        top: 0,
                        right: 0,
                    }, contentEditable: false }, { children: [collapsed && (_jsxs(Text, Object.assign({ variant: "body", sx: { color: "fontTertiary", mr: 35 } }, { children: [stats.checked, "/", stats.total] }))), _jsx(Icon, { className: "toggleSublist", path: collapsed ? Icons.chevronDown : Icons.chevronUp, sx: {
                                opacity: collapsed ? 1 : 0,
                                position: "absolute",
                                right: 0,
                                alignSelf: "start",
                                mr: 2,
                                cursor: "pointer",
                                ".icon:hover path": {
                                    fill: "var(--checked) !important",
                                },
                            }, size: 20, onClick: () => {
                                updateAttributes({ collapsed: !collapsed });
                            } })] }))) : (_jsxs(Flex, Object.assign({ sx: {
                        position: "relative",
                        bg: "bgSecondary",
                        py: 1,
                        borderRadius: "default",
                        mb: 2,
                        alignItems: "center",
                        justifyContent: "end",
                        overflow: "hidden",
                    }, contentEditable: false }, { children: [_jsx(Box, { sx: {
                                height: "100%",
                                width: `${stats.percentage}%`,
                                position: "absolute",
                                bg: "border",
                                zIndex: 0,
                                left: 0,
                                transition: "width 250ms ease-out",
                            } }), _jsx(Input, { readOnly: !editor.isEditable, value: title || "", variant: "clean", sx: { p: 0, px: 2, zIndex: 1, color: "fontTertiary" }, placeholder: "Untitled", onChange: (e) => {
                                updateAttributes({ title: e.target.value });
                            } }), _jsxs(Flex, Object.assign({ sx: { flexShrink: 0, pr: 2 } }, { children: [_jsx(Icon, { path: Icons.checkbox, size: 15, color: "fontTertiary" }), _jsxs(Text, Object.assign({ variant: "body", sx: { ml: 1, color: "fontTertiary" } }, { children: [stats.checked, "/", stats.total] }))] }))] }))) })), _jsx(Text, { as: "div", ref: forwardRef, sx: {
                    ul: {
                        display: collapsed ? "none" : "block",
                        paddingInlineStart: 0,
                        marginBlockStart: nested ? 10 : 0,
                        marginBlockEnd: 0,
                    },
                    li: {
                        listStyleType: "none",
                        position: "relative",
                        marginBottom: [2, "7px"],
                    },
                } })] }));
}
function areAllChecked(node, pos, doc) {
    const children = findChildren(node, (node) => node.type.name === TaskItemNode.name);
    for (const child of children) {
        const childPos = pos + child.pos + 1;
        const node = doc.nodeAt(childPos);
        if (!(node === null || node === void 0 ? void 0 : node.attrs.checked))
            return false;
    }
    return true;
}
