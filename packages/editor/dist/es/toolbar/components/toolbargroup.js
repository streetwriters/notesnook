var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { findTool } from "../tools";
import { Flex } from "rebass";
import { MoreTools } from "./more-tools";
import { getToolDefinition } from "../tool-definitions";
export function ToolbarGroup(props) {
    const { tools, editor, force, selectedNode } = props, flexProps = __rest(props, ["tools", "editor", "force", "selectedNode"]);
    return (_jsx(Flex, Object.assign({ className: "toolbar-group" }, flexProps, { children: tools.map((toolId) => {
            if (Array.isArray(toolId)) {
                return (_jsx(MoreTools, { title: "More", icon: "more", popupId: toolId.join(""), tools: toolId, editor: editor }, "more-tools"));
            }
            else {
                const Component = findTool(toolId);
                const toolDefinition = getToolDefinition(toolId);
                return (_jsx(Component, Object.assign({ editor: editor, force: force, selectedNode: selectedNode }, toolDefinition), toolDefinition.title));
            }
        }) })));
}
