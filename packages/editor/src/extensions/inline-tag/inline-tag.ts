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
import { InputRule } from "@tiptap/core";

const REGEX_INLINE_TAG = /#(\w+)\s$/;

export const InlineTag = Node.create({
  name: "inlineTag",
  group: "inline",
  inline: true,
  atom: true,
  content: "",

  addAttributes() {
    return {
      tag: {
        default: null
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-inline-tag]"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-inline-tag": HTMLAttributes.tag,
        class: "inline-tag"
      }),
      `#${HTMLAttributes.tag}`
    ];
  },

  addInputRules() {
    return [
      new InputRule({
        find: REGEX_INLINE_TAG,
        handler: ({ match, range, chain }) => {
          const tagText = match[1];

          const success = chain()
            .deleteRange(range)
            .insertContentAt(range.from, {
              type: "inlineTag",
              attrs: { tag: tagText }
            })
            .focus()
            .run();
          if (success) this.editor.storage.addTag?.(tagText);
        }
      })
    ];
  }
});
