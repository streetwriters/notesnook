"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskItemComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const icon_1 = require("../../toolbar/components/icon");
const icons_1 = require("../../toolbar/icons");
const core_1 = require("@tiptap/core");
const react_1 = require("react");
const taskitem_1 = require("./taskitem");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
function TaskItemComponent(props) {
    const { editor, updateAttributes, node, getPos, forwardRef } = props;
    const { checked } = props.node.attrs;
    const isMobile = (0, toolbarstore_1.useIsMobile)();
    const toggle = (0, react_1.useCallback)(() => {
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
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ "data-drag-image": true, sx: {
                bg: "background",
                borderRadius: "default",
                ":hover > .dragHandle": {
                    opacity: editor.isEditable ? 1 : 0,
                },
            } }, { children: [(0, jsx_runtime_1.jsx)(icon_1.Icon, { className: "dragHandle", draggable: "true", "data-drag-handle": true, path: icons_1.Icons.dragHandle, sx: {
                        opacity: [1, 1, 0],
                        alignSelf: "start",
                        mr: 2,
                        bg: "transparent",
                        cursor: "grab",
                        ".icon:hover path": {
                            fill: "var(--checked) !important",
                        },
                    }, size: isMobile ? 24 : 20, onMouseDown: (e) => e.preventDefault() }), (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: checked ? icons_1.Icons.check : "", stroke: "1px", sx: {
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
                    }, color: checked ? "checked" : "icon", size: isMobile ? 16 : 14 }), (0, jsx_runtime_1.jsx)(rebass_1.Text, { as: "div", ref: forwardRef, sx: {
                        textDecorationLine: checked ? "line-through" : "none",
                        color: checked ? "var(--checked)" : "var(--text)",
                        flex: 1,
                    } })] })) }));
}
exports.TaskItemComponent = TaskItemComponent;
function toggleChildren(node, tr, toggleState, parentPos) {
    const children = (0, core_1.findChildren)(node, (node) => node.type.name === taskitem_1.TaskItemNode.name);
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
    const children = (0, core_1.findChildren)(node, (node) => node.type.name === taskitem_1.TaskItemNode.name);
    if (children.length <= 0)
        return undefined;
    return children.every((node) => node.node.attrs.checked);
}
