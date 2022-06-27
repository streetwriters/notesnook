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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { findChildren, } from "@tiptap/core";
import { useCallback } from "react";
import { TaskItemNode } from "./task-item";
export function TaskItemComponent(props) {
    var editor = props.editor, updateAttributes = props.updateAttributes, node = props.node, getPos = props.getPos, forwardRef = props.forwardRef;
    var checked = props.node.attrs.checked;
    var toggle = useCallback(function () {
        if (!editor.isEditable)
            return false;
        updateAttributes({ checked: !checked });
        editor.commands.command(function (_a) {
            var tr = _a.tr;
            var parentPos = getPos();
            toggleChildren(node, tr, !checked, parentPos);
            return true;
        });
        return true;
    }, [editor, getPos, node, checked]);
    return (_jsx(_Fragment, { children: _jsxs(Flex, __assign({ "data-drag-image": true, sx: {
                ":hover > .dragHandle": {
                    opacity: 1,
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
                        cursor: "pointer",
                        ":hover": {
                            borderColor: "checked",
                        },
                        ":hover .icon path": {
                            fill: "var(--checked) !important",
                        },
                    }, onMouseDown: function (e) {
                        e.preventDefault();
                        toggle();
                    }, color: checked ? "checked" : "icon", size: 13 }), _jsx(Text, { as: "div", ref: forwardRef, sx: {
                        textDecorationLine: checked ? "line-through" : "none",
                        color: checked ? "var(--checked)" : "var(--text)",
                        flex: 1,
                    } })] })) }));
}
function toggleChildren(node, tr, toggleState, parentPos) {
    var e_1, _a;
    var children = findChildren(node, function (node) { return node.type.name === TaskItemNode.name; });
    try {
        for (var children_1 = __values(children), children_1_1 = children_1.next(); !children_1_1.done; children_1_1 = children_1.next()) {
            var pos = children_1_1.value.pos;
            // need to add 1 to get inside the node
            var actualPos = pos + parentPos + 1;
            tr.setNodeMarkup(actualPos, undefined, {
                checked: toggleState,
            });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (children_1_1 && !children_1_1.done && (_a = children_1.return)) _a.call(children_1);
        }
        finally { if (e_1) throw e_1.error; }
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
function areAllChecked(node) {
    var children = findChildren(node, function (node) { return node.type.name === TaskItemNode.name; });
    if (children.length <= 0)
        return undefined;
    return children.every(function (node) { return node.node.attrs.checked; });
}
