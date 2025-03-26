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
import { Plugin, PluginKey } from "@tiptap/pm/state";

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
            .insertContentAt(range.from, [
              {
                type: "inlineTag",
                attrs: { tag: tagText }
              },
              {
                type: "text",
                text: " "
              }
            ])
            .focus()
            .run();

          if (success) {
            this.editor.storage.addTag?.(tagText);
          }
        }
      })
    ];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { selection } = this.editor.state;
        const { $anchor, $from, empty } = selection;

        // when cursor is right at the end of the inline tag
        const nodeBefore = $anchor.nodeBefore;
        if (empty && nodeBefore && nodeBefore.type.name === "inlineTag") {
          const tagText = nodeBefore.attrs.tag;
          if (typeof tagText === "string") {
            this.editor.storage.removeTag?.(tagText);
            return false;
          }
        }

        // when the inline tag is selected/focused
        const nodeAfter = $from.nodeAfter;
        if (!empty && nodeAfter && nodeAfter.type.name === "inlineTag") {
          const tagText = nodeAfter.attrs.tag;
          if (typeof tagText === "string") {
            this.editor.storage.removeTag?.(tagText);
            return false;
          }
        }

        return false;
      },
      Enter: () => {
        const { selection } = this.editor.state;
        const { $from } = selection;

        const node = $from.nodeAfter;
        if (node && node.type.name === "inlineTag") {
          const tagText = node.attrs.tag;
          if (typeof tagText === "string") {
            this.editor.storage.openTag?.(tagText);
            return true;
          }
        }

        return false;
      }
    };
  },

  addProseMirrorPlugins() {
    const openTag = this.editor.storage.openTag;

    return [
      new Plugin({
        key: new PluginKey("handleClickInlineTag"),
        props: {
          handleClick(view, pos) {
            const { doc } = view.state;

            const node = doc.nodeAt(pos);
            if (node && node.type.name === "inlineTag") {
              const tagText = node.attrs.tag;
              if (typeof tagText === "string") {
                openTag?.(tagText);
                return true;
              }
            }

            return false;
          }
        }
      })
    ];
  }
});
