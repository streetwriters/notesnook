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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskItemComponent = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var icon_1 = require("../../toolbar/components/icon");
var icons_1 = require("../../toolbar/icons");
var core_1 = require("@tiptap/core");
var react_1 = require("react");
var taskitem_1 = require("./taskitem");
function TaskItemComponent(props) {
    var editor = props.editor, updateAttributes = props.updateAttributes, node = props.node, getPos = props.getPos, forwardRef = props.forwardRef;
    var checked = props.node.attrs.checked;
    var toggle = (0, react_1.useCallback)(function () {
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
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ "data-drag-image": true, sx: {
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
                    }, size: 20 }), (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: checked ? icons_1.Icons.check : "", stroke: "1px", sx: {
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
                    }, onMouseDown: function (e) {
                        e.preventDefault();
                        toggle();
                    }, color: checked ? "checked" : "icon", size: 13 }), (0, jsx_runtime_1.jsx)(rebass_1.Text, { as: "div", ref: forwardRef, sx: {
                        textDecorationLine: checked ? "line-through" : "none",
                        color: checked ? "var(--checked)" : "var(--text)",
                        flex: 1,
                    } })] })) }));
}
exports.TaskItemComponent = TaskItemComponent;
function toggleChildren(node, tr, toggleState, parentPos) {
    var e_1, _a;
    var children = (0, core_1.findChildren)(node, function (node) { return node.type.name === taskitem_1.TaskItemNode.name; });
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
    var children = (0, core_1.findChildren)(node, function (node) { return node.type.name === taskitem_1.TaskItemNode.name; });
    if (children.length <= 0)
        return undefined;
    return children.every(function (node) { return node.node.attrs.checked; });
}
