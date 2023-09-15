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

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Slice } from "prosemirror-model";
import { LIST_NODE_TYPES } from "../../utils/node-types";
import { ClipboardDOMParser } from "./clipboard-dom-parser";
import { ClipboardDOMSerializer } from "./clipboard-dom-serializer";
import { clipboardTextParser } from "./clipboard-text-parser";
import { clipboardTextSerializer } from "./clipboard-text-serializer";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    clipboard: {
      copyToClipboard: (text: string) => ReturnType;
    };
  }
}

export type ClipboardOptions = {
  copyToClipboard: (text: string) => void;
};

export const Clipboard = Extension.create({
  name: "clipboard",

  addOptions() {
    return {
      copyToClipboard: () => {}
    };
  },

  addCommands() {
    return {
      copyToClipboard: (text: string) => (props) => {
        this.options.copyToClipboard(text);
        return true;
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("clipboard"),
        props: {
          clipboardParser: ClipboardDOMParser.fromSchema(
            this.editor.view.state.schema
          ),
          clipboardSerializer: ClipboardDOMSerializer.fromSchema(
            this.editor.view.state.schema
          ),
          transformCopied,
          clipboardTextParser,
          clipboardTextSerializer
        }
      })
    ];
  }
});

export function transformCopied(slice: Slice): any {
  // when copying a single list item, we shouldn't retain the
  // list formatting but copy it as a paragraph.
  const maybeList = slice.content.firstChild;
  if (
    maybeList &&
    LIST_NODE_TYPES.includes(maybeList.type.name) &&
    maybeList.childCount === 1 &&
    maybeList.firstChild
  ) {
    return transformCopied(new Slice(maybeList.firstChild.content, 0, 0));
  }
  return slice;
}
