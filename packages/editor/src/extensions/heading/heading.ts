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

import { tiptapKeys } from "@notesnook/common";
import {
  findParentNodeClosestToPos,
  textblockTypeInputRule
} from "@tiptap/core";
import { Heading as TiptapHeading } from "@tiptap/extension-heading";
import { isClickWithinBounds } from "../../utils/prosemirror.js";
import { Plugin, PluginKey, Selection, Transaction } from "@tiptap/pm/state";
import { Node } from "@tiptap/pm/model";
import { useToolbarStore } from "../../toolbar/stores/toolbar-store.js";

const COLLAPSIBLE_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "checkList",
  "taskList",
  "table",
  "callout",
  "codeblock",
  "image",
  "outlineList",
  "mathBlock",
  "webclip",
  "embed"
];

const HEADING_REGEX = /^(#{1,6})\s$/;
export const Heading = TiptapHeading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      collapsed: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.collapsed === "true",
        renderHTML: (attributes) => ({
          "data-collapsed": attributes.collapsed === true
        })
      }
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setHeading:
        (attributes) =>
        ({ commands, state }) => {
          if (!this.options.levels.includes(attributes.level)) {
            return false;
          }

          const { textAlign, textDirection, collapsed } =
            state.selection.$from.parent.attrs;

          return commands.setNode(this.name, {
            ...attributes,
            textAlign,
            textDirection,
            collapsed
          });
        }
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: COLLAPSIBLE_BLOCK_TYPES,
        attributes: {
          hidden: {
            default: false,
            keepOnSplit: false,
            parseHTML: (element) => element.dataset.hidden === "true",
            renderHTML: (attributes) => {
              if (!attributes.hidden) return {};
              return {
                "data-hidden": attributes.hidden === true
              };
            }
          }
        }
      }
    ];
  },

  addKeyboardShortcuts() {
    return {
      ...this.options.levels.reduce(
        (items, level) => ({
          ...items,
          ...{
            [tiptapKeys[`insertHeading${level}`].keys]: () =>
              this.editor.commands.setHeading({ level })
          }
        }),
        {}
      ),
      Enter: ({ editor }) => {
        const { state, commands } = editor;
        const { $from } = state.selection;
        const node = $from.node();
        if (node.type.name !== this.name) return false;

        const isAtEnd = $from.parentOffset === node.textContent.length;
        if (isAtEnd && node.attrs.collapsed) {
          const headingPos = $from.before();
          const endPos = findEndOfCollapsedSection(
            state.doc,
            headingPos,
            node.attrs.level
          );
          if (endPos === -1) return false;

          return commands.command(({ tr }) => {
            tr.insert(endPos, state.schema.nodes.paragraph.create());
            const newPos = endPos + 1;
            tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
            return true;
          });
        }
        return false;
      }
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: HEADING_REGEX,
        type: this.type,
        getAttributes: (match) => {
          const { textAlign, textDirection, collapsed } =
            this.editor.state.selection.$from.parent?.attrs || {};
          const level = match[1].length;
          return { level, textAlign, textDirection, collapsed };
        }
      })
    ];
  },

  addProseMirrorPlugins() {
    return [headingUpdatePlugin];
  },

  addNodeView() {
    return ({ node, getPos, editor, HTMLAttributes }) => {
      const heading = document.createElement(`h${node.attrs.level}`);

      for (const attr in HTMLAttributes) {
        heading.setAttribute(attr, HTMLAttributes[attr]);
      }

      if (node.attrs.collapsed) heading.dataset.collapsed = "true";
      else delete heading.dataset.collapsed;

      function onClick(e: MouseEvent | TouchEvent) {
        if (e instanceof MouseEvent && e.button !== 0) return;
        if (!(e.target instanceof HTMLHeadingElement)) return;

        const pos = typeof getPos === "function" ? getPos() : 0;
        if (typeof pos !== "number") return;

        const resolvedPos = editor.state.doc.resolve(pos);
        const forbiddenParents = ["callout", "table"];
        if (
          findParentNodeClosestToPos(resolvedPos, (node) =>
            forbiddenParents.includes(node.type.name)
          )
        ) {
          return;
        }

        if (
          isClickWithinBounds(
            e,
            resolvedPos,
            useToolbarStore.getState().isMobile ? "right" : "left"
          )
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();

          editor.commands.command(({ tr }) => {
            const currentNode = tr.doc.nodeAt(pos);
            if (currentNode && currentNode.type.name === "heading") {
              const shouldCollapse = !currentNode.attrs.collapsed;
              const headingLevel = currentNode.attrs.level;

              tr.setNodeAttribute(pos, "collapsed", shouldCollapse);
              toggleNodesUnderHeading(tr, pos, headingLevel, shouldCollapse);
            }
            return true;
          });
        }
      }

      heading.onmousedown = onClick;
      heading.ontouchstart = onClick;

      return {
        dom: heading,
        contentDOM: heading,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          if (updatedNode.attrs.level !== node.attrs.level) {
            return false;
          }

          if (updatedNode.attrs.collapsed) heading.dataset.collapsed = "true";
          else delete heading.dataset.collapsed;

          if (updatedNode.attrs.hidden)
            heading.dataset.hidden = updatedNode.attrs.hidden;
          else delete heading.dataset.hidden;

          if (updatedNode.attrs.textAlign)
            heading.style.textAlign =
              updatedNode.attrs.textAlign === "left"
                ? ""
                : updatedNode.attrs.textAlign;

          if (updatedNode.attrs.textDirection)
            heading.dir = updatedNode.attrs.textDirection;
          else heading.dir = "";

          return true;
        }
      };
    };
  }
});

function toggleNodesUnderHeading(
  tr: Transaction,
  headingPos: number,
  headingLevel: number,
  isCollapsing: boolean
) {
  const { doc } = tr;
  const headingNode = doc.nodeAt(headingPos);
  if (!headingNode || headingNode.type.name !== "heading") return;

  let nextPos = headingPos + headingNode.nodeSize;
  const cursorPos = tr.selection.from;
  let shouldMoveCursor = false;
  let insideCollapsedHeading = false;
  let nestedHeadingLevel: number | null = null;

  while (nextPos < doc.content.size) {
    const nextNode = doc.nodeAt(nextPos);
    if (!nextNode) break;

    if (
      nextNode.type.name === "heading" &&
      nextNode.attrs.level <= headingLevel
    ) {
      break;
    }

    if (
      isCollapsing &&
      cursorPos >= nextPos &&
      cursorPos < nextPos + nextNode.nodeSize
    ) {
      shouldMoveCursor = true;
    }

    const currentPos = nextPos;
    nextPos += nextNode.nodeSize;

    if (COLLAPSIBLE_BLOCK_TYPES.includes(nextNode.type.name)) {
      if (isCollapsing) {
        tr.setNodeAttribute(currentPos, "hidden", true);
      } else {
        if (insideCollapsedHeading) {
          if (
            nextNode.type.name === "heading" &&
            nestedHeadingLevel !== null &&
            nextNode.attrs.level <= nestedHeadingLevel
          ) {
            insideCollapsedHeading = false;
            nestedHeadingLevel = null;
          } else {
            continue;
          }
        }

        tr.setNodeAttribute(currentPos, "hidden", false);
        if (nextNode.type.name === "heading" && nextNode.attrs.collapsed) {
          insideCollapsedHeading = true;
          nestedHeadingLevel = nextNode.attrs.level;
        }
      }
    }
  }

  if (shouldMoveCursor) {
    const headingEndPos = headingPos + headingNode.nodeSize - 1;
    tr.setSelection(Selection.near(tr.doc.resolve(headingEndPos)));
  }
}

function findEndOfCollapsedSection(
  doc: Node,
  headingPos: number,
  headingLevel: number
) {
  const headingNode = doc.nodeAt(headingPos);
  if (!headingNode || headingNode.type.name !== "heading") return -1;

  let nextPos = headingPos + headingNode.nodeSize;

  while (nextPos < doc.content.size) {
    const nextNode = doc.nodeAt(nextPos);
    if (!nextNode) break;

    if (
      nextNode.type.name === "heading" &&
      nextNode.attrs.level <= headingLevel
    ) {
      break;
    }

    nextPos += nextNode.nodeSize;
  }

  return nextPos;
}

const headingUpdatePlugin = new Plugin({
  key: new PluginKey("headingUpdate"),
  appendTransaction(transactions, oldState, newState) {
    const hasDocChanges = transactions.some(
      (transaction) => transaction.docChanged
    );
    if (!hasDocChanges) return null;

    const tr = newState.tr;
    const oldDoc = oldState.doc;
    const newDoc = newState.doc;
    let modified = false;

    newDoc.descendants((newNode, pos) => {
      if (newNode.type.name === "heading") {
        if (pos >= oldDoc.content.size) return;

        const oldNode = oldDoc.nodeAt(pos);
        if (
          oldNode &&
          oldNode.type.name === "heading" &&
          oldNode.attrs.level !== newNode.attrs.level
        ) {
          /**
           * if the level of a collapsed heading is changed,
           * we need to reset visibility of all the nodes under it as there
           * might be a heading of same or higher level previously
           * hidden under this heading
           */
          if (newNode.attrs.collapsed) {
            toggleNodesUnderHeading(tr, pos, oldNode.attrs.level, false);
            toggleNodesUnderHeading(tr, pos, newNode.attrs.level, true);
            modified = true;
          }
        }
      }
    });

    return modified ? tr : null;
  }
});
