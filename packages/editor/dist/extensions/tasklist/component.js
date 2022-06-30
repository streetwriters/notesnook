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
exports.TaskListComponent = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var core_1 = require("@tiptap/core");
var icon_1 = require("../../toolbar/components/icon");
var icons_1 = require("../../toolbar/icons");
var react_1 = require("react");
var forms_1 = require("@rebass/forms");
var taskitem_1 = require("../taskitem");
var prosemirror_utils_1 = require("prosemirror-utils");
function TaskListComponent(props) {
    var editor = props.editor, getPos = props.getPos, node = props.node, updateAttributes = props.updateAttributes, forwardRef = props.forwardRef;
    var taskItemType = (0, core_1.getNodeType)(taskitem_1.TaskItemNode.name, editor.schema);
    var _a = node.attrs, title = _a.title, collapsed = _a.collapsed;
    var _b = __read((0, react_1.useState)({ checked: 0, total: 0, percentage: 0 }), 2), stats = _b[0], setStats = _b[1];
    var parentTaskItem = (0, react_1.useMemo)(function () {
        var pos = editor.state.doc.resolve(getPos());
        return (0, prosemirror_utils_1.findParentNodeOfTypeClosestToPos)(pos, taskItemType);
    }, []);
    var nested = !!parentTaskItem;
    (0, react_1.useEffect)(function () {
        if (!parentTaskItem)
            return;
        var node = parentTaskItem.node, pos = parentTaskItem.pos;
        var allChecked = areAllChecked(node, pos, editor.state.doc);
        // check parent item if all child items are checked.
        editor.commands.command(function (_a) {
            var tr = _a.tr;
            tr.setNodeMarkup(pos, undefined, { checked: allChecked });
            return true;
        });
    }, [node, parentTaskItem]);
    (0, react_1.useEffect)(function () {
        var children = (0, core_1.findChildren)(node, function (node) { return node.type.name === taskitem_1.TaskItemNode.name; });
        var checked = children.filter(function (node) { return node.node.attrs.checked; }).length;
        var total = children.length;
        var percentage = Math.round((checked / total) * 100);
        setStats({ checked: checked, total: total, percentage: percentage });
    }, [nested, node]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ sx: {
                    flexDirection: "column",
                    ":hover > div > .toggleSublist": { opacity: 1 },
                } }, { children: nested ? ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: {
                        position: "absolute",
                        top: 0,
                        right: 0,
                    }, contentEditable: false }, { children: [collapsed && ((0, jsx_runtime_1.jsxs)(rebass_1.Text, __assign({ variant: "body", sx: { color: "fontTertiary", mr: 35 } }, { children: [stats.checked, "/", stats.total] }))), (0, jsx_runtime_1.jsx)(icon_1.Icon, { className: "toggleSublist", path: collapsed ? icons_1.Icons.chevronDown : icons_1.Icons.chevronUp, sx: {
                                opacity: collapsed ? 1 : 0,
                                position: "absolute",
                                right: 0,
                                alignSelf: "start",
                                mr: 2,
                                cursor: "pointer",
                                ".icon:hover path": {
                                    fill: "var(--checked) !important",
                                },
                            }, size: 20, onClick: function () {
                                updateAttributes({ collapsed: !collapsed });
                            } })] }))) : ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: {
                        position: "relative",
                        bg: "bgSecondary",
                        py: 1,
                        borderRadius: "default",
                        mb: 2,
                        alignItems: "center",
                        justifyContent: "end",
                        overflow: "hidden",
                    }, contentEditable: false }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Box, { sx: {
                                height: "100%",
                                width: "".concat(stats.percentage, "%"),
                                position: "absolute",
                                bg: "border",
                                zIndex: 0,
                                left: 0,
                                transition: "width 250ms ease-out",
                            } }), (0, jsx_runtime_1.jsx)(forms_1.Input, { readOnly: !editor.isEditable, value: title || "", variant: "clean", sx: { p: 0, px: 2, zIndex: 1, color: "fontTertiary" }, placeholder: "Untitled", onChange: function (e) {
                                updateAttributes({ title: e.target.value });
                            } }), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { flexShrink: 0, pr: 2 } }, { children: [(0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.checkbox, size: 15, color: "fontTertiary" }), (0, jsx_runtime_1.jsxs)(rebass_1.Text, __assign({ variant: "body", sx: { ml: 1, color: "fontTertiary" } }, { children: [stats.checked, "/", stats.total] }))] }))] }))) })), (0, jsx_runtime_1.jsx)(rebass_1.Text, { as: "div", ref: forwardRef, sx: {
                    ul: {
                        display: collapsed ? "none" : "block",
                        paddingInlineStart: 0,
                        marginBlockStart: nested ? 10 : 0,
                        marginBlockEnd: 0,
                    },
                    li: {
                        listStyleType: "none",
                        position: "relative",
                    },
                } })] }));
}
exports.TaskListComponent = TaskListComponent;
function areAllChecked(node, pos, doc) {
    var e_1, _a;
    var children = (0, core_1.findChildren)(node, function (node) { return node.type.name === taskitem_1.TaskItemNode.name; });
    try {
        for (var children_1 = __values(children), children_1_1 = children_1.next(); !children_1_1.done; children_1_1 = children_1.next()) {
            var child = children_1_1.value;
            var childPos = pos + child.pos + 1;
            var node_1 = doc.nodeAt(childPos);
            if (!(node_1 === null || node_1 === void 0 ? void 0 : node_1.attrs.checked))
                return false;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (children_1_1 && !children_1_1.done && (_a = children_1.return)) _a.call(children_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return true;
}
