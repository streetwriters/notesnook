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

import { Node, mergeAttributes, findChildren } from "@tiptap/core";
import { getDataAttribute } from "../attachment";
import { createSelectionBasedNodeView } from "../react";
import { WebClipComponent } from "./component";

export interface WebClipOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type WebClipAttributes = {
  fullscreen: boolean;
  src: string;
  html: string;
  title: string;
  hash: string;
  type: string;
  width?: string;
  height?: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    webclip: {
      updateWebClip: (
        query: { hash?: string },
        options: { src: string }
      ) => ReturnType;
    };
  }
}

export const WebClipNode = Node.create<WebClipOptions>({
  name: "webclip",
  content: "",
  marks: "",
  draggable: true,
  priority: 51,

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
      fullscreen: {
        rendered: false,
        default: false
      },
      html: {
        rendered: false,
        default: null
      },
      src: {
        default: null
      },
      title: {
        default: null
      },
      width: {
        default: null
      },
      height: {
        default: null
      },
      hash: getDataAttribute("hash"),
      type: getDataAttribute("mime")
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe[data-hash]"
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
    return createSelectionBasedNodeView(WebClipComponent);
  },

  addCommands() {
    return {
      updateWebClip:
        (query, options) =>
        ({ state, tr, dispatch }) => {
          const clips = findChildren(
            state.doc,
            (node) =>
              node.type.name === this.name && node.attrs["hash"] === query.hash
          );

          for (const clip of clips) {
            tr.setNodeMarkup(clip.pos, clip.node.type, {
              ...clip.node.attrs,
              html: options.src
            });
          }
          tr.setMeta("preventUpdate", true);
          tr.setMeta("addToHistory", false);
          if (dispatch) dispatch(tr);
          return true;
        }
    };
  }
});
