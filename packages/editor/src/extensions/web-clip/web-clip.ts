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
import { WebClipAttachment, getDataAttribute } from "../attachment/index.js";
import { createNodeView } from "../react/index.js";
import { WebClipComponent } from "./component.js";

export interface WebClipOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type WebClipAttributes = WebClipAttachment & {
  fullscreen: boolean;
};

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
      type: { default: "web-clip", rendered: false },
      progress: {
        default: 0,
        rendered: false
      },
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
      width: {
        default: null
      },
      height: {
        default: null
      },
      hash: getDataAttribute("hash"),
      mime: getDataAttribute("mime")
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
    return createNodeView(WebClipComponent, {
      shouldUpdate: (prev, next) => !hasSameAttributes(prev.attrs, next.attrs),
      forceEnableSelection: true
    });
  }
});
