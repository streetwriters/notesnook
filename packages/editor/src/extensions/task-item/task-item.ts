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

  addNodeView() {
    return ReactNodeViewRenderer(TaskItemComponent);
  },
});
