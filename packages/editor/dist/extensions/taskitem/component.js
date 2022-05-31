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
import { NodeViewWrapper, NodeViewContent } from "../react";
import { ThemeProvider } from "emotion-theming";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { findChildren, } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskItemNode } from "./task-item";
export function TaskItemComponent(props) {
    var _a;
    var checked = props.node.attrs.checked;
    var _b = __read(useState({ checked: 0, total: 0 }), 2), stats = _b[0], setStats = _b[1];
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
    var nestedTaskList = useMemo(function () {
        return getChildren(node, getPos()).find(function (_a) {
            var node = _a.node;
            return node.type.name === "taskList";
        });
    }, [node.childCount]);
    var isNested = !!nestedTaskList;
    var isCollapsed = nestedTaskList
        ? (_a = editor.state.doc.nodeAt(nestedTaskList.pos)) === null || _a === void 0 ? void 0 : _a.attrs.collapsed
        : false;
    useEffect(function () {
        if (!nestedTaskList)
            return;
        var pos = nestedTaskList.pos, node = nestedTaskList.node;
        var children = findChildren(node, function (node) { return node.type.name === TaskItemNode.name; });
        var checked = children.filter(function (_a) {
            var node = _a.node;
            return node.attrs.checked;
        }).length;
        var total = children.length;
        setStats({ checked: checked, total: total });
    }, []);
    return (_jsx(NodeViewWrapper, { children: _jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsxs(Flex, __assign({ sx: {
                    //  mb: isNested ? 0 : 2,
                    alignItems: "center",
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
                        }, onMouseDown: function (e) {
                            if (toggle())
                                e.preventDefault();
                        }, color: checked ? "checked" : "icon", size: 13 }), _jsx(NodeViewContent, { style: {
                            textDecorationLine: checked ? "line-through" : "none",
                            color: checked ? "var(--checked)" : "var(--text)",
                            flex: 1,
                            // marginBottom: isNested ? 0 : 5,
                        } }), isNested && (_jsxs(_Fragment, { children: [isCollapsed && (_jsxs(Text, __assign({ variant: "body", sx: { color: "fontTertiary", mr: 35 } }, { children: [stats.checked, "/", stats.total] }))), _jsx(Icon, { className: "toggleSublist", path: isCollapsed ? Icons.chevronDown : Icons.chevronUp, sx: {
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
                                            collapsed: !isCollapsed,
                                        });
                                        return true;
                                    })
                                        .run();
                                } })] }))] })) })) }));
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
