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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskItemNode = void 0;
var core_1 = require("@tiptap/core");
var commands_1 = require("../list-item/commands");
var extension_task_item_1 = require("@tiptap/extension-task-item");
var component_1 = require("./component");
var react_1 = require("../react");
exports.TaskItemNode = extension_task_item_1.TaskItem.extend({
    draggable: true,
    addAttributes: function () {
        return {
            checked: {
                default: false,
                keepOnSplit: false,
                parseHTML: function (element) { return element.classList.contains("checked"); },
                renderHTML: function (attributes) { return ({
                    class: attributes.checked ? "checked" : "",
                }); },
            },
        };
    },
    renderHTML: function (_a) {
        var node = _a.node, HTMLAttributes = _a.HTMLAttributes;
        return [
            "li",
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
                class: "checklist--item",
            }),
            0,
        ];
    },
    parseHTML: function () {
        return [
            {
                tag: "li",
                getAttrs: function (node) {
                    var _a;
                    if (node instanceof Node && node instanceof HTMLElement) {
                        return node.classList.contains("checklist--item") ||
                            ((_a = node.parentElement) === null || _a === void 0 ? void 0 : _a.classList.contains("checklist"))
                            ? null
                            : false;
                    }
                    return false;
                },
                priority: 51,
            },
        ];
    },
    addKeyboardShortcuts: function () {
        var _this = this;
        var _a;
        return __assign(__assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { Backspace: function (_a) {
                var editor = _a.editor;
                return (0, commands_1.onBackspacePressed)(editor, _this.name, _this.type);
            } });
    },
    addNodeView: function () {
        return (0, react_1.createNodeView)(component_1.TaskItemComponent, {
            contentDOMFactory: true,
            wrapperFactory: function () { return document.createElement("li"); },
            shouldUpdate: function (_a, _b) {
                var prev = _a.attrs;
                var next = _b.attrs;
                return (prev.checked !== next.checked || prev.collapsed !== next.collapsed);
            },
        });
    },
});
