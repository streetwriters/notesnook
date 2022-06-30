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
var jsx_runtime_1 = require("react/jsx-runtime");
var tools_1 = require("../tools");
var rebass_1 = require("rebass");
var moretools_1 = require("./moretools");
var tooldefinitions_1 = require("../tooldefinitions");
function ToolbarGroup(props) {
    var tools = props.tools, editor = props.editor, force = props.force, selectedNode = props.selectedNode, flexProps = __rest(props, ["tools", "editor", "force", "selectedNode"]);
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ className: "toolbar-group" }, flexProps, { children: tools.map(function (toolId) {
            if (Array.isArray(toolId)) {
                return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, { title: "More", icon: "more", popupId: toolId.join(""), tools: toolId, editor: editor }, "more-tools"));
            }
            else {
                var Component = (0, tools_1.findTool)(toolId);
                var toolDefinition = (0, tooldefinitions_1.getToolDefinition)(toolId);
                return ((0, jsx_runtime_1.jsx)(Component, __assign({ editor: editor, force: force, selectedNode: selectedNode }, toolDefinition), toolDefinition.title));
            }
        }) })));
}
exports.ToolbarGroup = ToolbarGroup;
