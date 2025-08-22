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
  textblockTypeInputRule,
  findParentNodeClosestToPos
} from "@tiptap/core";
import { Heading as TiptapHeading } from "@tiptap/extension-heading";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

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

          const { textAlign, textDirection } =
            state.selection.$from.parent.attrs;

          return commands.setNode(this.name, {
            ...attributes,
            textAlign,
            textDirection
          });
        },
      toggleHeadingCollapse:
        (pos: number) =>
        ({ tr }: { tr: any }) => {
          const node = tr.doc.nodeAt(pos);
          if (node && node.type === this.type) {
            tr.setNodeAttribute(pos, "collapsed", !node.attrs.collapsed);
            return true;
          }
          return false;
        }
    };
  },

  addKeyboardShortcuts() {
    return this.options.levels.reduce(
      (items, level) => ({
        ...items,
        ...{
          [tiptapKeys[`insertHeading${level}`].keys]: () =>
            this.editor.commands.setHeading({ level })
        }
      }),
      {}
    );
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: HEADING_REGEX,
        type: this.type,
        getAttributes: (match) => {
          const { textAlign, textDirection } =
            this.editor.state.selection.$from.parent?.attrs || {};
          const level = match[1].length;
          return { level, textAlign, textDirection };
        }
      })
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("collapsibleHeadings"),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { doc } = state;

            doc.descendants((node, pos) => {
              if (node.type.name === "heading" && node.attrs.collapsed) {
                const headingLevel = node.attrs.level;
                let nextPos = pos + node.nodeSize;

                while (nextPos < doc.content.size) {
                  const nextNode = doc.nodeAt(nextPos);
                  if (!nextNode) break;
                  if (
                    nextNode.type.name === "heading" &&
                    nextNode.attrs.level <= headingLevel
                  ) {
                    break;
                  }

                  decorations.push(
                    Decoration.node(nextPos, nextPos + nextNode.nodeSize, {
                      style: "display: none;"
                    })
                  );

                  nextPos += nextNode.nodeSize;
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          }
        }
      })
    ];
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
        const calloutAncestor = findParentNodeClosestToPos(
          resolvedPos,
          (node) => node.type.name === "callout"
        );
        if (calloutAncestor) return;

        const { x, y, right } = heading.getBoundingClientRect();

        const clientX =
          e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY =
          e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        const hitArea = { width: 40, height: 40 };

        const isRtl =
          heading.dir === "rtl" ||
          findParentNodeClosestToPos(
            resolvedPos,
            (node) => !!node.attrs.textDirection
          )?.node.attrs.textDirection === "rtl";

        let xStart = clientX >= x - hitArea.width;
        let xEnd = clientX <= x;
        const yStart = clientY >= y;
        const yEnd = clientY <= y + hitArea.height;

        if (isRtl) {
          xEnd = clientX <= x + hitArea.width;
          xStart = clientX >= right;
        }

        if (xStart && xEnd && yStart && yEnd) {
          e.preventDefault();
          e.stopImmediatePropagation();

          editor.commands.command(({ tr }) => {
            const currentNode = tr.doc.nodeAt(pos);
            if (currentNode) {
              tr.setNodeAttribute(
                pos,
                "collapsed",
                !currentNode.attrs.collapsed
              );
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

          return true;
        }
      };
    };
  }
});
