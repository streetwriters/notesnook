import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { findChildren, } from "@tiptap/core";
import { useCallback } from "react";
import { TaskItemNode } from "./task-item";
export function TaskItemComponent(props) {
    const { editor, updateAttributes, node, getPos, forwardRef } = props;
    const { checked } = props.node.attrs;
    const toggle = useCallback(() => {
        if (!editor.isEditable)
            return false;
        updateAttributes({ checked: !checked });
        editor.commands.command(({ tr }) => {
            const parentPos = getPos();
            toggleChildren(node, tr, !checked, parentPos);
            return true;
        });
        return true;
    }, [editor, getPos, node, checked]);
    return (_jsx(_Fragment, { children: _jsxs(Flex, Object.assign({ "data-drag-image": true, sx: {
                ":hover > .dragHandle": {
                    opacity: editor.isEditable ? 1 : 0,
                },
            } }, { children: [_jsx(Icon, { className: "dragHandle", draggable: "true", "data-drag-handle": true, path: Icons.dragHandle, sx: {
                        opacity: [1, 1, 0],
                        alignSelf: "start",
                        mr: 2,
                        bg: "transparent",
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
                        cursor: editor.isEditable ? "pointer" : "unset",
                        ":hover": {
                            borderColor: "checked",
                        },
                        ":hover .icon path": {
                            fill: "var(--checked) !important",
                        },
                    }, onMouseDown: (e) => {
                        e.preventDefault();
                        toggle();
                    }, color: checked ? "checked" : "icon", size: 13 }), _jsx(Text, { as: "div", ref: forwardRef, sx: {
                        textDecorationLine: checked ? "line-through" : "none",
                        color: checked ? "var(--checked)" : "var(--text)",
                        flex: 1,
                    } })] })) }));
}
function toggleChildren(node, tr, toggleState, parentPos) {
    const children = findChildren(node, (node) => node.type.name === TaskItemNode.name);
    for (const { pos } of children) {
        // need to add 1 to get inside the node
        const actualPos = pos + parentPos + 1;
        tr.setNodeMarkup(actualPos, undefined, {
            checked: toggleState,
        });
    }
    return tr;
}
function getChildren(node, parentPos) {
    const children = [];
    node.forEach((node, offset) => {
        children.push({ node, pos: parentPos + offset + 1 });
    });
    return children;
}
function areAllChecked(node) {
    const children = findChildren(node, (node) => node.type.name === TaskItemNode.name);
    if (children.length <= 0)
        return undefined;
    return children.every((node) => node.node.attrs.checked);
}
