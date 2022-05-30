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
      title: {
        default: null,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.title,
        renderHTML: (attributes) => {
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

  parseHTML() {
    return [
      {
        tag: `ul`,
        getAttrs: (node) => {
          if (node instanceof Node && node instanceof HTMLElement) {
            return node.classList.contains("checklist") && null;
          }
          return false;
        },
        priority: 51,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "checklist",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TaskListComponent);
  },
});
