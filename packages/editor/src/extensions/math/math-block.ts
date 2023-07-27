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

import { Node, mergeAttributes, textblockTypeInputRule } from "@tiptap/core";
import { nanoid } from "nanoid";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { HighlighterPlugin } from "../code-block/highlighter";
import {
  CaretPosition,
  CodeLine,
  Indent,
  compareCaretPosition,
  exitOnTripleEnter,
  getSelectedLines,
  indent,
  indentOnEnter,
  parseIndentation,
  withSelection
} from "../code-block";
import { createSelectionBasedNodeView } from "../react";
import { MathBlockComponent } from "./block";
import { findParentNodeClosestToPos } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: () => ReturnType;
    };
  }
}

export type MathBlockAttributes = {
  language: string;

  indentType: Indent["type"];
  indentLength: number;
  lines: CodeLine[];
  caretPosition?: CaretPosition;
};

// simple inputrule for block math
const REGEX_BLOCK_MATH_DOLLARS = /\$\$\$\s+$/; //new RegExp("\$\$\s+$", "i");
export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block math",
  content: "text*", // important!
  // atom: true, // important!
  code: true,
  draggable: false,
  marks: "",

  addAttributes() {
    return {
      language: {
        default: "latex",
        rendered: false
      },
      id: {
        default: undefined,
        rendered: false,
        parseHTML: () => createMathBlockId()
      },
      caretPosition: {
        default: undefined,
        rendered: false
      },
      lines: {
        default: [],
        rendered: false
      },
      indentType: {
        default: "space",
        parseHTML: (element) => {
          const indentType = element.dataset.indentType;
          return indentType;
        },
        renderHTML: (attributes) => {
          if (!attributes.indentType) {
            return {};
          }
          return {
            "data-indent-type": attributes.indentType
          };
        }
      },
      indentLength: {
        default: 2,
        parseHTML: (element) => {
          const indentLength = element.dataset.indentLength;
          return indentLength;
        },
        renderHTML: (attributes) => {
          if (!attributes.indentLength) {
            return {};
          }
          return {
            "data-indent-length": attributes.indentLength
          };
        }
      }
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-a": ({ editor }) => {
        const { $anchor } = this.editor.state.selection;
        if ($anchor.parent.type.name !== this.name) {
          return false;
        }
        const codeblock = findParentNodeClosestToPos(
          $anchor,
          (node) => node.type.name === this.type.name
        );

        if (!codeblock) return false;
        return editor.commands.setTextSelection({
          from: codeblock.pos + 1,
          to: codeblock.pos + codeblock.node.nodeSize - 1
        });
      },
      // remove code block when at start of document or code block is empty
      Backspace: ({ editor }) => {
        const { empty, $anchor } = editor.state.selection;

        const currentNode = $anchor.parent;
        const nextNode = editor.state.doc.nodeAt($anchor.pos + 1);
        const isCodeBlock = (node: ProsemirrorNode | null) =>
          node && node.type.name === this.name;
        const isAtStart = $anchor.pos === 1;

        if (!empty) {
          return false;
        }

        if (
          isAtStart ||
          (isCodeBlock(currentNode) && !currentNode.textContent.length)
        ) {
          return this.editor.commands.deleteNode(this.type);
        }
        // on android due to composition issues with various keyboards,
        // sometimes backspace is detected one node behind. We need to
        // manually handle this case.
        else if (
          nextNode &&
          isCodeBlock(nextNode) &&
          !nextNode.textContent.length
        ) {
          return this.editor.commands.command(({ tr }) => {
            tr.delete($anchor.pos + 1, $anchor.pos + 1 + nextNode.nodeSize);
            return true;
          });
        }

        return false;
      },

      // exit node on triple enter
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        if (this.options.exitOnTripleEnter && exitOnTripleEnter(editor, $from))
          return true;

        const indentation = parseIndentation($from.parent, this.name);

        if (indentation) return indentOnEnter(editor, $from, indentation);
        return false;
      },

      // exit node on arrow up
      ArrowUp: ({ editor }) => {
        if (!this.options.exitOnArrowUp) {
          return false;
        }

        const { state } = editor;
        const { selection } = state;
        const { $anchor, empty } = selection;

        if (!empty || $anchor.parent.type !== this.type) {
          return false;
        }

        const isAtStart = $anchor.pos === 1;
        if (!isAtStart) {
          return false;
        }

        return editor.commands.insertContentAt(0, "<p></p>");
      },
      // exit node on arrow down
      ArrowDown: ({ editor }) => {
        if (!this.options.exitOnArrowDown) {
          return false;
        }

        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

        if (!isAtEnd) {
          return false;
        }

        const after = $from.after();

        if (after === undefined) {
          return false;
        }

        const nodeAfter = doc.nodeAt(after);

        if (nodeAfter) {
          editor.commands.setNodeSelection($from.before());
          return false;
        }

        return editor.commands.exitCode();
      },
      "Shift-Tab": ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type !== this.type) {
          return false;
        }

        const indentation = parseIndentation($from.parent, this.name);
        if (!indentation) return false;

        const indentToken = indent(indentation);

        const { lines } = $from.parent.attrs as MathBlockAttributes;
        const selectedLines = getSelectedLines(lines, selection);

        return editor
          .chain()
          .command(({ tr }) =>
            withSelection(tr, (tr) => {
              for (const line of selectedLines) {
                if (line.text(indentToken.length) !== indentToken) continue;

                tr.delete(
                  tr.mapping.map(line.from),
                  tr.mapping.map(line.from + indentation.amount)
                );
              }
            })
          )
          .run();
      },
      Tab: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type !== this.type) {
          return false;
        }
        const indentation = parseIndentation($from.parent, this.name);
        if (!indentation) return false;

        const { lines } = $from.parent.attrs as MathBlockAttributes;
        const selectedLines = getSelectedLines(lines, selection);
        return editor
          .chain()
          .command(({ tr }) =>
            withSelection(tr, (tr) => {
              const indentToken = indent(indentation);

              if (selectedLines.length === 1)
                return tr.insertText(indentToken, $from.pos);

              for (const line of selectedLines) {
                tr.insertText(indentToken, tr.mapping.map(line.from));
              }
            })
          )
          .run();
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[class*='math-block']", // important!
        preserveWhitespace: "full"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "math-block math-node" }, HTMLAttributes),
      0
    ];
  },

  addCommands() {
    return {
      insertMathBlock:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name, {
            id: createMathBlockId()
          });
        }
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: REGEX_BLOCK_MATH_DOLLARS,
        type: this.type,
        getAttributes: {
          id: createMathBlockId()
        }
      })
    ];
  },

  addProseMirrorPlugins() {
    return [HighlighterPlugin({ name: this.name, defaultLanguage: "latex" })];
  },

  addNodeView() {
    return createSelectionBasedNodeView(MathBlockComponent, {
      contentDOMFactory: () => {
        const content = document.createElement("div");
        content.classList.add("node-content-wrapper");
        content.style.whiteSpace = "pre";
        // caret is not visible if content element width is 0px
        content.style.minWidth = "20px";
        return { dom: content };
      },
      shouldUpdate: ({ attrs: prev }, { attrs: next }) => {
        return (
          compareCaretPosition(prev.caretPosition, next.caretPosition) ||
          prev.indentType !== next.indentType
        );
      }
    });
  }
});

function createMathBlockId() {
  return `mathBlock-${nanoid(12)}`;
}
