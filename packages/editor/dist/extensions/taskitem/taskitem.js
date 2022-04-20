import { mergeAttributes } from "@tiptap/core";
import { TaskItem } from "@tiptap/extension-task-item";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TaskItemComponent } from "./component";
export var TaskItemNode = TaskItem.extend({
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
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": this.name,
            }),
            0,
        ];
    },
    // addAttributes() {
    //   return {
    //     hash: getDataAttribute("hash"),
    //     filename: getDataAttribute("filename"),
    //     type: getDataAttribute("type"),
    //     size: getDataAttribute("size"),
    //   };
    // },
    // parseHTML() {
    //   return [
    //     {
    //       tag: "span[data-hash]",
    //     },
    //   ];
    // },
    // renderHTML({ HTMLAttributes }) {
    //   return ["span", mergeAttributes(HTMLAttributes)];
    // },
    addNodeView: function () {
        return ReactNodeViewRenderer(TaskItemComponent);
    },
});
