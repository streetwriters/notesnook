"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskListComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const core_1 = require("@tiptap/core");
const icon_1 = require("../../toolbar/components/icon");
const icons_1 = require("../../toolbar/icons");
const react_1 = require("react");
const forms_1 = require("@rebass/forms");
const taskitem_1 = require("../taskitem");
const prosemirror_utils_1 = require("prosemirror-utils");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
function TaskListComponent(props) {
    const isMobile = (0, toolbarstore_1.useIsMobile)();
    const { editor, getPos, node, updateAttributes, forwardRef } = props;
    const taskItemType = (0, core_1.getNodeType)(taskitem_1.TaskItemNode.name, editor.schema);
    const { title, collapsed } = node.attrs;
    const [stats, setStats] = (0, react_1.useState)({ checked: 0, total: 0, percentage: 0 });
    const parentTaskItem = (0, react_1.useMemo)(() => {
        const pos = editor.state.doc.resolve(getPos());
        return (0, prosemirror_utils_1.findParentNodeOfTypeClosestToPos)(pos, taskItemType);
    }, []);
    const nested = !!parentTaskItem;
    (0, react_1.useEffect)(() => {
        if (!parentTaskItem)
            return;
        const { node, pos } = parentTaskItem;
        const allChecked = areAllChecked(node, pos, editor.state.doc);
        // no need to create a transaction if the check state is
        // not changed.
        if (node.attrs.checked === allChecked)
            return;
        // check parent item if all child items are checked.
        editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { checked: allChecked });
            return true;
        });
    }, [node, parentTaskItem]);
    (0, react_1.useEffect)(() => {
        const children = (0, core_1.findChildren)(node, (node) => node.type.name === taskitem_1.TaskItemNode.name);
        const checked = children.filter((node) => node.node.attrs.checked).length;
        const total = children.length;
        const percentage = Math.round((checked / total) * 100);
        setStats({ checked, total, percentage });
    }, [nested, node]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                    flexDirection: "column",
                    ":hover > div > .toggleSublist": { opacity: 1 },
                } }, { children: nested ? ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
                        position: "absolute",
                        top: 0,
                        right: 0,
                    }, contentEditable: false }, { children: [collapsed && ((0, jsx_runtime_1.jsxs)(rebass_1.Text, Object.assign({ variant: "body", sx: { color: "fontTertiary", mr: 35 } }, { children: [stats.checked, "/", stats.total] }))), (0, jsx_runtime_1.jsx)(icon_1.Icon, { className: "toggleSublist", path: collapsed ? icons_1.Icons.chevronDown : icons_1.Icons.chevronUp, sx: {
                                opacity: isMobile || collapsed ? 1 : 0,
                                position: "absolute",
                                right: 0,
                                alignSelf: "start",
                                mr: 2,
                                cursor: "pointer",
                                ".icon:hover path": {
                                    fill: "var(--checked) !important",
                                },
                            }, size: isMobile ? 24 : 20, onClick: () => {
                                updateAttributes({ collapsed: !collapsed }, { addToHistory: false, preventUpdate: true });
                            } })] }))) : ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
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
                                width: `${stats.percentage}%`,
                                position: "absolute",
                                bg: "border",
                                zIndex: 0,
                                left: 0,
                                transition: "width 250ms ease-out",
                            } }), (0, jsx_runtime_1.jsx)(forms_1.Input, { readOnly: !editor.isEditable, value: title || "", variant: "clean", sx: { p: 0, px: 2, zIndex: 1, color: "fontTertiary" }, placeholder: "Untitled", onChange: (e) => {
                                updateAttributes({ title: e.target.value }, { addToHistory: true, preventUpdate: false });
                            } }), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { flexShrink: 0, pr: 2 } }, { children: [(0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.checkbox, size: 15, color: "fontTertiary" }), (0, jsx_runtime_1.jsxs)(rebass_1.Text, Object.assign({ variant: "body", sx: { ml: 1, color: "fontTertiary" } }, { children: [stats.checked, "/", stats.total] }))] }))] }))) })), (0, jsx_runtime_1.jsx)(rebass_1.Text, { as: "div", ref: forwardRef, sx: {
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
exports.TaskListComponent = TaskListComponent;
function areAllChecked(node, pos, doc) {
    const children = (0, core_1.findChildren)(node, (node) => node.type.name === taskitem_1.TaskItemNode.name);
    for (const child of children) {
        const childPos = pos + child.pos + 1;
        const node = doc.nodeAt(childPos);
        if (!(node === null || node === void 0 ? void 0 : node.attrs.checked))
            return false;
    }
    return true;
}
