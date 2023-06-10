/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import {
  Node,
  nodeInputRule,
  mergeAttributes,
  findChildren
} from "@tiptap/core";
import { Attrs } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import { hasSameAttributes } from "../../utils/prosemirror";
import { Attachment, getDataAttribute } from "../attachment";
import { createSelectionBasedNodeView } from "../react";
import { TextDirections } from "../text-direction";
import { ImageComponent } from "./component";
import { Writeable } from "@/src/types";

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, unknown>;
}

/**
 * We have two attributes that store the source of an image:
 *
 * 1. `src`
 * 2. `dataurl`
 *
 * `src` is the image's inherent source. This can contain a URL, a base64-dataurl,
 * a blob...etc. We should never touch this attribute. This is also where we store
 * the data that we want to upload so after we download a pasted image, its base64
 * dataurl goes in this attribute.
 *
 * `dataurl` should never get added to the final HTML. This attribute is where we
 * restore an image's data after loading a note.
 *
 * The reason we have 2 instead of a single attribute is to avoid unnecessary processing.
 * Keeping everything in the `src` attribute requires us to always send the rendered image
 * along with everything else. This is pointless because we already have the image's rendered
 * data.
 */
export type ImageAttributes = Partial<ImageSizeOptions> &
  Attachment & {
    src: string;
    dataurl?: string;
    alt?: string;
    title?: string;
    textDirection?: TextDirections;
    aspectRatio?: number;
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
      insertImage: (options: Partial<ImageAttributes>) => ReturnType;
      updateImage: (
        query: { src?: string; hash?: string },
        options: Partial<ImageAttributes> & { preventUpdate?: boolean }
      ) => ReturnType;
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
      inline: true,
      allowBase64: true,
      HTMLAttributes: {}
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
        default: null
      },
      alt: {
        default: null
      },
      title: {
        default: null
      },
      width: { default: null },
      height: { default: null },

      // TODO: maybe these should be stored as styles?
      float: getDataAttribute("float", false),
      align: getDataAttribute("align"),

      hash: getDataAttribute("hash"),
      filename: getDataAttribute("filename"),
      mime: getDataAttribute("mime"),
      size: getDataAttribute("size"),
      aspectRatio: {
        default: undefined,
        parseHTML: (element) => element.dataset.aspectRatio,
        renderHTML: (attributes) => {
          if (!attributes.aspectRatio) {
            return {};
          }

          return {
            [`data-aspect-ratio`]: attributes.aspectRatio
          };
        }
      },

      dataurl: {
        ...getDataAttribute("dataurl"),
        rendered: false
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64 ? "img" : 'img:not([src^="data:"])'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
    ];
  },

  addNodeView() {
    return createSelectionBasedNodeView(ImageComponent, {
      shouldUpdate: (prev, next) => !hasSameAttributes(prev.attrs, next.attrs),
      forceEnableSelection: true
    });
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformCopied: (content) => {
            content.content.descendants((node) => {
              if (
                node.type.name === this.name &&
                typeof node.attrs.dataurl === "string"
              ) {
                const attrs = node.attrs as Writeable<Attrs>;
                attrs.src = attrs.dataurl;
                delete attrs.dataurl;
              }
            });
            return content;
          }
        }
      })
    ];
  },

  addCommands() {
    return {
      insertImage:
        (options) =>
        ({ commands }) => {
          console.log(options);
          return commands.insertContent({
            type: this.name,
            attrs: options
          });
        },
      setImageAlignment:
        (options) =>
        ({ chain, tr }) => {
          const { from } = tr.selection;
          return chain()
            .updateAttributes(this.name, { ...options })
            .setNodeSelection(from)
            .run();
        },
      setImageSize:
        (options) =>
        ({ chain, tr }) => {
          const { from } = tr.selection;
          return chain()
            .updateAttributes(this.name, { ...options })
            .setNodeSelection(from)
            .run();
        },
      updateImage:
        (query, options) =>
        ({ state, tr }) => {
          const keyedQuery = query.hash
            ? { key: "hash", value: query.hash }
            : query.src
            ? { key: "src", value: query.src }
            : null;
          if (!keyedQuery) return false;

          const images = findChildren(
            state.doc,
            (node) =>
              node.type.name === this.name &&
              node.attrs[keyedQuery.key] === keyedQuery.value
          );
          for (const image of images) {
            tr.setNodeMarkup(image.pos, image.node.type, {
              ...image.node.attrs,
              ...options
            });
          }
          tr.setMeta("preventUpdate", options.preventUpdate || false);
          tr.setMeta("addToHistory", false);
          return true;
        }
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
        }
      })
    ];
  }
});
