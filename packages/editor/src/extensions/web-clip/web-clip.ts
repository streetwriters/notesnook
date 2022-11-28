/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Node, mergeAttributes, Editor } from "@tiptap/core";
import { getDataAttribute } from "../attachment";
import { createSelectionBasedNodeView } from "../react";
import { WebClipComponent } from "./component";

export interface WebClipOptions {
  HTMLAttributes: Record<string, unknown>;
  onLoadWebClip: (
    editor: Editor,
    attachmentHash: string
  ) => Promise<string | undefined>;
}

export type WebClipAttributes = {
  fullscreen: boolean;
  src: string;
  title: string;
  hash: string;
  type: string;
};

export const WebClipNode = Node.create<
  WebClipOptions,
  Omit<WebClipOptions, "HTMLAttributes">
>({
  name: "webclip",
  content: "",
  marks: "",
  draggable: true,
  priority: 51,

  addOptions() {
    return {
      HTMLAttributes: {},
      onLoadWebClip: () => Promise.resolve(undefined)
    };
  },

  addStorage() {
    return {
      onLoadWebClip: this.options.onLoadWebClip
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
      src: {
        default: null
      },
      title: {
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
  }
});
