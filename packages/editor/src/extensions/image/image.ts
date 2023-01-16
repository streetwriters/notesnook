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
import { Attachment, getDataAttribute } from "../attachment";
import { createSelectionBasedNodeView } from "../react";
import { ImageComponent } from "./component";

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, unknown>;
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
      updateImage: (
        query: { src?: string; hash?: string },
        options: ImageAttributes & { preventUpdate?: boolean }
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
      align: getDataAttribute("align", "left"),

      hash: getDataAttribute("hash"),
      filename: getDataAttribute("filename"),
      type: getDataAttribute("mime"),
      size: getDataAttribute("size")
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
    return createSelectionBasedNodeView(ImageComponent);
  },

  addCommands() {
    return {
      insertImage:
        (options) =>
        ({ commands }) => {
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
        ({ state, tr, dispatch }) => {
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
          if (dispatch) dispatch(tr);
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
