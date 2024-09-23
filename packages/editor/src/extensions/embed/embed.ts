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

import { Node, mergeAttributes } from "@tiptap/core";
import { hasSameAttributes } from "../../utils/prosemirror.js";
import { createNodeView } from "../react/index.js";
import { TextDirections } from "../text-direction/index.js";
import { EmbedComponent } from "./component.js";

export interface EmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type EmbedAttributes = Partial<EmbedSizeOptions> & {
  src: string;
};

export type EmbedAlignmentOptions = {
  align?: "center" | "left" | "right";
  textDirection?: TextDirections;
};

export type Embed = Required<EmbedAttributes> & EmbedAlignmentOptions;

export type EmbedSizeOptions = {
  width: number;
  height: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      /**
       * Add an embed
       */
      insertEmbed: (options: EmbedAttributes) => ReturnType;
      setEmbedAlignment: (options: EmbedAlignmentOptions) => ReturnType;
      setEmbedSize: (options: EmbedSizeOptions) => ReturnType;
      setEmbedSource: (src: string) => ReturnType;
    };
  }
}

export const EmbedNode = Node.create<EmbedOptions>({
  name: "embed",
  content: "",
  marks: "",
  draggable: true,
  priority: 50,

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  group() {
    return "block";
  },

  addAttributes() {
    return {
      src: {
        default: null
      },
      width: { default: null },
      height: { default: null },
      align: { default: undefined }
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe[src]"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "iframe",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
    ];
  },

  addNodeView() {
    return createNodeView(EmbedComponent, {
      shouldUpdate: (prev, next) => !hasSameAttributes(prev.attrs, next.attrs)
    });
  },

  addCommands() {
    return {
      insertEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options
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
      setEmbedSource:
        (src) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { src });
        }
    };
  }
});
