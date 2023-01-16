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

import { Editor, mergeAttributes, Node } from "@tiptap/core";
import { NodeType } from "prosemirror-model";

export interface ParagraphOptions {
  HTMLAttributes: Record<string, unknown>;
  doubleSpaced: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraph: {
      /**
       * Toggle a paragraph
       */
      setParagraph: () => ReturnType;
    };
  }
}

export const Paragraph = Node.create<ParagraphOptions>({
  name: "paragraph",

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
      doubleSpaced: true
    };
  },

  group: "block",

  content: "inline*",

  addAttributes() {
    return {
      spacing: {
        keepOnSplit: false,
        default: getSpacing(this.options.doubleSpaced),
        parseHTML: (element) => element.dataset.spacing,
        renderHTML: (attributes) => {
          if (!attributes.spacing) return;

          return {
            "data-spacing": attributes.spacing
          };
        }
      }
    };
  },

  parseHTML() {
    return [{ tag: "p" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }) => {
          console.log("HELLO2");
          return commands.setNode(this.name);
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (this.options.doubleSpaced) return false;

        const { state } = editor;
        const { selection } = state;
        const { $from, empty, $to } = selection;
        const atEnd = $to.parentOffset === $to.parent.content.size;

        if (
          !empty ||
          $from.parent.type !== this.type ||
          $from.depth > 1 ||
          atEnd
        ) {
          return false;
        }

        if (!atEnd) {
          return createParagraph(editor, this.type, false, true);
        }

        return false;
      },
      "Mod-Enter": ({ editor }) =>
        createParagraph(editor, this.type, false, true),
      "Shift-Enter": ({ editor }) =>
        createParagraph(editor, this.type, false, true),
      "Mod-Alt-0": () => this.editor.commands.setParagraph()
    };
  }
});

function getSpacing(doubleSpaced: boolean): "single" | "double" {
  return doubleSpaced ? "double" : "single";
}

function createParagraph(
  editor: Editor,
  type: NodeType,
  doubleSpaced: boolean,
  skipEmpty = true
) {
  return editor
    .chain()
    .command(({ tr }) => {
      const { from } = tr.selection;
      const currentParagraph = tr.doc.nodeAt(from - 1);
      if (currentParagraph?.type !== type) return true;
      if (currentParagraph.attrs.spacing === "double") return true;
      // if paragraph is empty, skip
      if (skipEmpty && currentParagraph.nodeSize === 2) return true;
      tr.delete(from - 1, from);
      return true;
    })
    .splitBlock({ keepMarks: true })
    .updateAttributes(type, {
      spacing: getSpacing(doubleSpaced)
    })
    .run();
}
