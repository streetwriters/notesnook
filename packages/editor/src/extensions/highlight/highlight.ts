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

import "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";

export interface HighlightOptions {
  types: string[];
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlight: {
      /**
       * Set a highlight mark
       */
      setHighlight: (backgroundColor: string) => ReturnType;
      /**
       * Toggle a highlight mark
       */
      toggleHighlight: (backgroundColor: string) => ReturnType;
      /**
       * Unset a highlight mark
       */
      unsetHighlight: () => ReturnType;
    };
  }
}

export const Highlight = Extension.create<HighlightOptions>({
  name: "highlight",

  addOptions() {
    return {
      types: ["textStyle"],
      HTMLAttributes: {}
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element) =>
              element.style.backgroundColor?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.backgroundColor) {
                return {};
              }

              return {
                style: `background-color: ${attributes.backgroundColor}`
              };
            }
          }
        }
      }
    ];
  },

  addCommands() {
    return {
      setHighlight:
        (backgroundColor) =>
        ({ commands }) => {
          return commands.setMark("textStyle", { backgroundColor });
        },
      toggleHighlight:
        (backgroundColor) =>
        ({ commands }) => {
          return commands.toggleMark("textStyle", { backgroundColor });
        },
      unsetHighlight:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { backgroundColor: null })
            .removeEmptyTextStyle()
            .run();
        }
    };
  }

  // addKeyboardShortcuts() {
  //   return {
  //     "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
  //   };
  // },
});
