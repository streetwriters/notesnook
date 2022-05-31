import { Node, nodeInputRule, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "../react";
import { ImageComponent } from "./component";

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

export type ImageAttributes = Partial<ImageSizeOptions> & {
  src: string;
  alt?: string;
  title?: string;
};

export type ImageAlignmentOptions = {
  float?: boolean;
  align?: "center" | "left" | "right";
};

export type ImageSizeOptions = {
  width: number;
  height: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: ImageAttributes) => ReturnType;
      setImageAlignment: (options: ImageAlignmentOptions) => ReturnType;
      setImageSize: (options: ImageSizeOptions) => ReturnType;
    };
  }
}

export const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;

export const ImageNode = Node.create<ImageOptions>({
  name: "image",

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: { default: null },
      height: { default: null },
      float: {
        default: false,
      },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64
          ? "img[src]"
          : 'img[src]:not([src^="data:"])',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      setImageAlignment:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { ...options });
        },
      setImageSize:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { ...options });
        },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title] = match;

          return { src, alt, title };
        },
      }),
    ];
  },
});
