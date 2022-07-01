"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarGroup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const tools_1 = require("../tools");
const rebass_1 = require("rebass");
const moretools_1 = require("./moretools");
const tooldefinitions_1 = require("../tooldefinitions");
function ToolbarGroup(props) {
    const { tools, editor, force, selectedNode } = props, flexProps = __rest(props, ["tools", "editor", "force", "selectedNode"]);
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ className: "toolbar-group" }, flexProps, { children: tools.map((toolId) => {
            if (Array.isArray(toolId)) {
                return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, { title: "More", icon: "more", popupId: toolId.join(""), tools: toolId, editor: editor }, "more-tools"));
            }
            else {
                const Component = (0, tools_1.findTool)(toolId);
                const toolDefinition = (0, tooldefinitions_1.getToolDefinition)(toolId);
                return ((0, jsx_runtime_1.jsx)(Component, Object.assign({ editor: editor, force: force, selectedNode: selectedNode }, toolDefinition), toolDefinition.title));
            }
        }) })));
}
exports.ToolbarGroup = ToolbarGroup;
