import { Node, nodeInputRule, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Attribute } from "@tiptap/core";
import { AttachmentComponent } from "./component";

export interface AttachmentOptions {
  // HTMLAttributes: Record<string, any>;
  onDownloadAttachment: (attachment: Attachment) => boolean;
}

export type Attachment = {
  hash: string;
  filename: string;
  type: string;
  size: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    attachment: {
      insertAttachment: (attachment: Attachment) => ReturnType;
      downloadAttachment: (attachment: Attachment) => ReturnType;
    };
  }
}

export const AttachmentNode = Node.create<AttachmentOptions>({
  name: "attachment",
  content: "inline*",
  marks: "",
  inline: true,
  atom: true,

  addOptions() {
    return {
      //   HTMLAttributes: {},
      onDownloadAttachment: () => false,
    };
  },

  group() {
    return "inline";
  },

  draggable: true,

  addAttributes() {
    return {
      hash: getDataAttribute("hash"),
      filename: getDataAttribute("filename"),
      type: getDataAttribute("type"),
      size: getDataAttribute("size"),
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-hash]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentComponent);
  },

  addCommands() {
    return {
      insertAttachment:
        (attachment) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attachment,
          });
        },
      downloadAttachment:
        (attachment) =>
        ({}) => {
          return this.options.onDownloadAttachment(attachment);
        },
    };
  },

  //   addInputRules() {
  //     return [
  //       nodeInputRule({
  //         find: inputRegex,
  //         type: this.type,
  //         getAttributes: (match) => {
  //           const [, , alt, src, title] = match;

  //           return { src, alt, title };
  //         },
  //       }),
  //     ];
  //   },
});

function getDataAttribute(name: keyof Attachment): Partial<Attribute> {
  return {
    default: null,
    parseHTML: (element) => element.dataset[name],
    renderHTML: (attributes) => {
      if (!attributes[name]) {
        return {};
      }

      return {
        [`data-${name}`]: attributes[name],
      };
    },
  };
}
