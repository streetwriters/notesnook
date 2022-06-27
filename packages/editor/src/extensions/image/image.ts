import {
  Node,
  nodeInputRule,
  mergeAttributes,
  findChildren,
} from "@tiptap/core";
import { Attachment, getDataAttribute } from "../attachment";
import {
  createNodeView,
  createSelectionBasedNodeView,
  NodeViewSelectionNotifierPlugin,
} from "../react";
import { ImageComponent } from "./component";

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

export type ImageAttributes = Partial<ImageSizeOptions> &
  Partial<Attachment> & {
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
      insertImage: (options: ImageAttributes) => ReturnType;
      updateImage: (options: ImageAttributes) => ReturnType;
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

      float: getDataAttribute("float", false),
      align: getDataAttribute("align", "left"),
      hash: getDataAttribute("hash"),
      filename: getDataAttribute("filename"),
      type: getDataAttribute("mime"),
      size: getDataAttribute("size"),
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
    return createSelectionBasedNodeView(ImageComponent);
  },

  addCommands() {
    return {
      insertImage:
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
      updateImage:
        (options) =>
        ({ state, tr, dispatch }) => {
          const query = options.hash
            ? { key: "hash", value: options.hash }
            : options.src
            ? { key: "src", value: options.src }
            : null;
          if (!query) return false;

          const images = findChildren(
            state.doc,
            (node) =>
              node.type.name === this.name &&
              node.attrs[query.key] === query.value
          );
          for (const image of images) {
            tr.setNodeMarkup(image.pos, image.node.type, {
              ...image.node.attrs,
              ...options,
            });
          }
          tr.setMeta("preventUpdate", true);
          tr.setMeta("addToHistory", false);
          if (dispatch) dispatch(tr);
          return true;
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
