"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskListNode = void 0;
var core_1 = require("@tiptap/core");
var extension_task_list_1 = require("@tiptap/extension-task-list");
var react_1 = require("../react");
var component_1 = require("./component");
exports.TaskListNode = extension_task_list_1.TaskList.extend({
    addAttributes: function () {
        return {
            collapsed: {
                default: false,
                keepOnSplit: false,
                parseHTML: function (element) { return element.dataset.collapsed === "true"; },
                renderHTML: function (attributes) { return ({
                    "data-collapsed": attributes.collapsed === true,
                }); },
            },
            title: {
                default: null,
                keepOnSplit: false,
                parseHTML: function (element) { return element.dataset.title; },
                renderHTML: function (attributes) {
                    if (!attributes.title || attributes.nested) {
                        return {};
                    }
                    return {
                        "data-title": attributes.title,
                    };
                },
            },
        };
    },
    parseHTML: function () {
        return [
            {
                tag: "ul",
                getAttrs: function (node) {
                    if (node instanceof Node && node instanceof HTMLElement) {
                        return node.classList.contains("checklist") && null;
                    }
                    return false;
                },
                priority: 51,
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "ul",
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
                class: "checklist",
            }),
            0,
        ];
    },
    addCommands: function () {
        var _this = this;
        return {
            toggleTaskList: function () {
                return function (_a) {
                    var editor = _a.editor, commands = _a.commands, state = _a.state, tr = _a.tr;
                    var _b = state.selection, $from = _b.$from, $to = _b.$to;
                    commands.toggleList(_this.name, _this.options.itemTypeName);
                    var position = {
                        from: tr.mapping.map($from.pos),
                        to: tr.mapping.map($to.pos),
                    };
                    // There is a minor bug in Prosemirror or Tiptap where creating
                    // nested node view causes the editor selection to act weird.
                    // The solution is to manually force the editor back to the correct
                    // position.
                    // NOTE: We have to wrap this in setTimeout & use the editor
                    // directly or else it won't run.
                    setTimeout(function () { return editor.commands.setTextSelection(position); }, 0);
                    return true;
                };
            },
        };
    },
    addNodeView: function () {
        var _this = this;
        return (0, react_1.createNodeView)(component_1.TaskListComponent, {
            contentDOMFactory: function () {
                var content = document.createElement("ul");
                content.classList.add("".concat(_this.name.toLowerCase(), "-content-wrapper"));
                content.style.whiteSpace = "inherit";
                return { dom: content };
            },
        });
    },
});
