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
import "@tiptap/extension-text-style";

type TextDirectionOptions = {
  types: string[];
  defaultDirection: TextDirections;
};

type TextDirections = "ltr" | "rtl";
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

export const TextDirection = Extension.create<TextDirectionOptions>({
  name: "textDirection",

  defaultOptions: {
    types: [
      "paragraph",
      "heading",
      "orderedList",
      "bulletList",
      "outlineList",
      "taskList"
    ],
    defaultDirection: "ltr"
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textDirection: {
            default: this.options.defaultDirection,
            parseHTML: (element) => element.dir,
            renderHTML: (attributes) => {
              if (!attributes.textDirection) {
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
