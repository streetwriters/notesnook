import { mergeAttributes } from "@tiptap/core";
import { TaskList } from "@tiptap/extension-task-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TaskListComponent } from "./component";
export var TaskListNode = TaskList.extend({
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
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: "checklist",
            }),
            0,
        ];
    },
    addNodeView: function () {
        return ReactNodeViewRenderer(TaskListComponent);
    },
});
