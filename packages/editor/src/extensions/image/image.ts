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

import { Node, nodeInputRule, mergeAttributes } from "@tiptap/core";
import { hasSameAttributes } from "../../utils/prosemirror.js";
import {
  ImageAlignmentOptions,
  ImageAttachment,
  getDataAttribute
} from "../attachment/index.js";
import { createNodeView } from "../react/index.js";
import { TextDirections } from "../text-direction/index.js";
import { ImageComponent } from "./component.js";
import { tiptapKeys } from "@notesnook/common";
import { DOMParser } from "@tiptap/pm/model";

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, unknown>;
}

export type ImageAttributes = ImageAttachment & {
  textDirection?: TextDirections;
};

export type ImageSize = {
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
      setImageAlignment: (options: ImageAlignmentOptions) => ReturnType;
      setImageSize: (size: ImageSize) => ReturnType;
    };
  }
}

const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;

export const ImageNode = Node.create<ImageOptions>({
  name: "image",
  atom: true,
  addOptions() {
    return {
      inline: false,
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
      type: { default: "image", rendered: false },
      progress: {
        default: 0,
        rendered: false
      },

      src: {
        default: null
      },
      width: { default: null },
      height: { default: null },

      // TODO: maybe these should be stored as styles?
      align: getDataAttribute("align"),

      hash: getDataAttribute("hash"),
      filename: getDataAttribute("filename"),
      mime: getDataAttribute("mime"),
      size: getDataAttribute("size"),
      aspectRatio: {
        default: undefined,
        parseHTML: (element) =>
          element.dataset.aspectRatio
            ? parseFloat(element.dataset.aspectRatio)
            : 1,
        renderHTML: (attributes) => {
          if (!attributes.aspectRatio) {
            return {};
          }

          return {
            [`data-aspect-ratio`]: attributes.aspectRatio
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      // migration for inline image nodes into block nodes
      {
        priority: 60,
        tag: "p",
        getAttrs(node) {
          if (node.querySelectorAll("img").length <= 0) return false;
          return null;
        },
        getContent: (dom, schema) => {
          const wrapper = document.createElement("div");
          let buffer = "";

          const flushBuffer = () => {
            if (buffer.trim().length > 0) {
              const pEl = document.createElement("p");
              pEl.innerHTML = buffer;
              wrapper.appendChild(pEl);
              buffer = "";
            }
          };

          for (const child of dom.childNodes) {
            if (
              child.nodeType === globalThis.Node.ELEMENT_NODE &&
              (child as HTMLElement).tagName === "IMG"
            ) {
              flushBuffer();
              wrapper.appendChild(child);
            } else {
              if (child.nodeType === globalThis.Node.ELEMENT_NODE) {
                buffer += (child as HTMLElement).outerHTML;
              } else if (child.nodeType === globalThis.Node.TEXT_NODE) {
                buffer += child.textContent;
              }
            }
          }
          flushBuffer();

          const parser = DOMParser.fromSchema(schema);
          const parsedTaskList = parser.parse(wrapper).content.firstChild;
          if (!parsedTaskList)
            throw new Error("Failed to migrate from old task list.");

          return parsedTaskList.content;
        }
      },
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
    return createNodeView(ImageComponent, {
      componentKey: (node) => node.attrs.hash,
      shouldUpdate: (prev, next) => !hasSameAttributes(prev.attrs, next.attrs),
      forceEnableSelection: true
    });
  },

  addCommands() {
    return {
      insertImage:
        (options) =>
        ({ commands, state }) => {
          const { $from } = state.selection;
          const maybeImageNode = state.doc.nodeAt($from.pos);
          if (maybeImageNode?.type === this.type) {
            return commands.insertContentAt($from.pos + 1, {
              type: this.name,
              attrs: options
            });
          }

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
  },

  addKeyboardShortcuts() {
    return {
      [tiptapKeys.addImage.keys]: () =>
        this.editor.storage.openAttachmentPicker?.("image") || true
    };
  }
});
