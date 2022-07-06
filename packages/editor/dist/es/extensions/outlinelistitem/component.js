import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { findChildren, } from "@tiptap/core";
import { OutlineList } from "../outline-list/outline-list";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
export function OutlineListItemComponent(props) {
    var _a, _b;
    const { editor, updateAttributes, node, getPos, forwardRef } = props;
    const isMobile = useIsMobile();
    const isNested = ((_a = node.lastChild) === null || _a === void 0 ? void 0 : _a.type.name) === OutlineList.name;
    const isCollapsed = isNested && ((_b = node.lastChild) === null || _b === void 0 ? void 0 : _b.attrs.collapsed);
    return (_jsxs(Flex, { children: [_jsxs(Flex, Object.assign({ className: "outline", sx: {
                    flexDirection: "column",
                    alignItems: "center",
                    mt: isMobile ? "0px" : "3px",
                } }, { children: [isNested ? (_jsx(Icon, { path: isCollapsed ? Icons.chevronRight : Icons.chevronDown, title: isCollapsed
                            ? "Click to uncollapse list"
                            : "Click to collapse list", sx: {
                            cursor: "pointer",
                            transition: `all .2s ease-in-out`,
                            ":hover": {
                                transform: ["unset", "scale(1.3)"],
                            },
                            ":active": {
                                transform: ["scale(1.3)", "unset"],
                            },
                            ".icon:hover path": {
                                fill: "var(--checked) !important",
                            },
                        }, size: isMobile ? 24 : 18, onMouseDown: (e) => e.preventDefault(), onClick: () => {
                            const [subList] = findChildren(node, (node) => node.type.name === OutlineList.name);
                            if (!subList)
                                return;
                            const { pos } = subList;
                            editor.commands.toggleOutlineCollapse(pos + getPos() + 1, !isCollapsed);
                        } })) : (_jsx(Icon, { path: Icons.circle, size: isMobile ? 24 : 18, sx: { transform: "scale(0.4)" } })), isNested && !isCollapsed && (_jsx(Box, { sx: {
                            flex: 1,
                            width: 1,
                            mt: 2,
                            backgroundColor: "border",
                            borderRadius: 50,
                            flexShrink: 0,
                            cursor: "pointer",
                            transition: `all .2s ease-in-out`,
                            ":hover": {
                                backgroundColor: "fontTertiary",
                                width: 4,
                            },
                        }, contentEditable: false }))] })), _jsx(Text, { ref: forwardRef, sx: {
                    pl: 2,
                    listStyleType: "none",
                    flex: 1,
                } })] }));
}
