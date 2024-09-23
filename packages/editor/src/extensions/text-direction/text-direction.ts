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

import { Extension, Editor, findParentNode } from "@tiptap/core";
import "@tiptap/extension-text-style";
import { Paragraph } from "../paragraph/index.js";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { isListActive } from "../../utils/list.js";

export type TextDirections = undefined | "rtl";
const TEXT_DIRECTION_TYPES = [
  "paragraph",
  "heading",
  "orderedList",
  "bulletList",
  "outlineList",
  "taskList",
  "table",
  "blockquote",
  "embed",
  "image"
];

type TextDirectionOptions = {
  types: string[];
  defaultDirection: TextDirections;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textDirection: {
      /**
       * Set the font family
       */
      setTextDirection: (direction: TextDirections) => ReturnType;
    };
  }
}

export function getTextDirection(editor: Editor): TextDirections {
  const selection = editor.state.selection;

  const parent = findParentNode(
    (node) =>
      !!node.attrs.textDirection && !isTextDirectionIgnored(editor, node)
  )(selection);
  if (!parent) return;
  return parent.node.attrs.textDirection;
}

function isTextDirectionIgnored(editor: Editor, node: ProsemirrorNode) {
  const isInsideList = isListActive(editor);
  const isParagraph = node.type.name === Paragraph.name;
  return isInsideList && isParagraph;
}

export const TextDirection = Extension.create<TextDirectionOptions>({
  name: "textDirection",

  addOptions() {
    return {
      types: TEXT_DIRECTION_TYPES,
      defaultDirection: undefined
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textDirection: {
            // NOTE: for some reason setting this to undefined breaks enter behaviour
            // on Android for some keyboards (GBoard etc.). Empty string works fine.
            default: this.options.defaultDirection || "",
            parseHTML: (element) => (element.dir === "rtl" ? "rtl" : undefined),
            keepOnSplit: true,
            renderHTML: (attributes) => {
              if (
                !attributes.textDirection ||
                attributes.textDirection !== "rtl"
              ) {
                return {};
              }

              return {
                dir: attributes.textDirection
              };
            }
          }
        }
      }
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { textDirection: direction })
          );
        }
    };
  }
});
