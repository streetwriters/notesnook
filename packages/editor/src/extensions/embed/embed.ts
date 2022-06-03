import { Node, mergeAttributes } from "@tiptap/core";
import { createNodeView } from "../react";
import { EmbedComponent } from "./component";

export interface EmbedOptions {
  HTMLAttributes: Record<string, any>;
}

export type EmbedAttributes = Partial<EmbedSizeOptions> & {
  src: string;
};

export type EmbedAlignmentOptions = {
  align?: "center" | "left" | "right";
};

export type EmbedSizeOptions = {
  width: number;
  height: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      /**
       * Add an image
       */
      insertEmbed: (options: EmbedAttributes) => ReturnType;
      setEmbedAlignment: (options: EmbedAlignmentOptions) => ReturnType;
      setEmbedSize: (options: EmbedSizeOptions) => ReturnType;
    };
  }
}

export const EmbedNode = Node.create<EmbedOptions>({
  name: "embed",
  content: "",
  marks: "",
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group() {
    return "block";
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: { default: null },
      height: { default: null },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "iframe",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addNodeView() {
    return createNodeView(EmbedComponent);
  },

  addCommands() {
    return {
      insertEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      setEmbedAlignment:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { ...options });
        },
      setEmbedSize:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { ...options });
        },
    };
  },
});
