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
        };
    },
    // renderHTML({ node, HTMLAttributes }) {
    //   return [
    //     "li",
    //     mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
    //       "data-type": this.name,
    //     }),
    //     0,
    //   ];
    // },
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
        return ReactNodeViewRenderer(TaskListComponent);
    },
});
