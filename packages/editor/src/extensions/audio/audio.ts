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
import { DataURL } from "@notesnook/common";
import { hasSameAttributes } from "../../utils/prosemirror.js";
import { AudioAttachment, getDataAttribute } from "../attachment/index.js";
import { createNodeView } from "../react/index.js";
import { AudioComponent } from "./component.js";
import { getDataURLMetadata } from "../../utils/downloader.js";

export interface AudioOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type AudioAttributes = AudioAttachment;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      insertAudio: (audio: AudioAttachment) => ReturnType;
    };
  }
}

export const AudioNode = Node.create<AudioOptions>({
  name: "audio",
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
      type: { default: "audio", rendered: false },
      progress: {
        default: 0,
        rendered: false
      },
      // plain (non data-*) attribute so it round-trips through the native
      // <audio src="..."> markup, mirroring how the image node keeps `src`.
      // this is what carries a pasted data: URI or an external https URL
      // until postProcess() turns it into a real hashed attachment.
      src: { default: null },
      filename: getDataAttribute("filename"),
      size: getDataAttribute("size"),
      hash: getDataAttribute("hash"),
      mime: getDataAttribute("mime")
    };
  },

  parseHTML() {
    return [
      {
        tag: "audio",
        getAttrs: (element) => {
          const src = element.getAttribute("src");
          if (!src || !DataURL.isValid(src)) return null;

          const { mimeType, size } = getDataURLMetadata(src);
          return {
            mime: element.dataset.mime || mimeType,
            size: element.dataset.size || size
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)
    ];
  },

  addCommands() {
    return {
      insertAudio:
        (audio) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: audio
          });
        }
    };
  },

  addNodeView() {
    return createNodeView(AudioComponent, {
      shouldUpdate: (prev, next) => !hasSameAttributes(prev.attrs, next.attrs),
      forceEnableSelection: true
    });
  }
});
