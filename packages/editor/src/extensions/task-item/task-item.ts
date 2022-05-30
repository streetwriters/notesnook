import { nodeInputRule, mergeAttributes } from "@tiptap/core";
import { TaskItem } from "@tiptap/extension-task-item";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Attribute } from "@tiptap/core";
import { TaskItemComponent } from "./component";

export interface AttachmentOptions {
  // HTMLAttributes: Record<string, any>;
  // onDownloadAttachment: (attachment: Attachment) => boolean;
}

export const TaskItemNode = TaskItem.extend({
  draggable: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.classList.contains("checked"),
        renderHTML: (attributes) => ({
          class: attributes.checked ? "checked" : "",
        }),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "checklist--item",
      }),
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: `li`,
        getAttrs: (node) => {
          if (node instanceof Node && node instanceof HTMLElement) {
            return (
              (node.classList.contains("checklist--item") ||
                node.parentElement?.classList.contains("checklist")) &&
              null
            );
          }
          return false;
        },
        priority: 51,
      },
    ];
  },

  // renderHTML({ node, HTMLAttributes }) {
  //   return [
  //     'li',
  //     mergeAttributes(
  //       this.options.HTMLAttributes,
  //       HTMLAttributes,
  //       { 'data-type': this.name },
  //     ),
  //     [
  //       'label',
  //       [
  //         'input',
  //         {
  //           type: 'checkbox',
  //           checked: node.attrs.checked
  //             ? 'checked'
  //             : null,
  //         },
  //       ],
  //       ['span'],
  //     ],
  //     [
  //       'div',
  //       0,
  //     ],
  //   ]
  // },

  addNodeView() {
    return ReactNodeViewRenderer(TaskItemComponent);
  },
});
