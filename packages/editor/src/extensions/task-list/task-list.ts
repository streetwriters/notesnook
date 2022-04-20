import { nodeInputRule, mergeAttributes } from "@tiptap/core";
import { TaskList } from "@tiptap/extension-task-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Attribute } from "@tiptap/core";
import { TaskListComponent } from "./component";

export const TaskListNode = TaskList.extend({
  addAttributes() {
    return {
      collapsed: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.collapsed === "true",
        renderHTML: (attributes) => ({
          "data-collapsed": attributes.collapsed === true,
        }),
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

  addNodeView() {
    return ReactNodeViewRenderer(TaskListComponent);
  },
});
