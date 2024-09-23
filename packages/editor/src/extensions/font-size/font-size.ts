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

import { useToolbarStore } from "../../toolbar/stores/toolbar-store.js";
import { Editor, Extension } from "@tiptap/core";

type FontSizeOptions = {
  types: string[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font family
       */
      setFontSize: (fontSize: string) => ReturnType;
      /**
       * Unset the font family
       */
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create<FontSizeOptions>({
  name: "fontSize",

  defaultOptions: {
    types: ["textStyle"]
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`
              };
            }
          }
        }
      }
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        }
    };
  },
  addKeyboardShortcuts() {
    return {
      "ctrl-]": ({ editor }) => {
        editor
          .chain()
          .focus()
          .setFontSize(`${Math.min(120, getFontSize(editor) + 1)}px`)
          .run();
        return true;
      },
      "Ctrl-[": ({ editor }) => {
        editor
          .chain()
          .focus()
          .setFontSize(`${Math.max(8, getFontSize(editor) - 1)}px`)
          .run();
        return true;
      }
    };
  }
});

function getFontSize(editor: Editor) {
  const defaultFontSize = useToolbarStore.getState().fontSize;
  const { fontSize } = editor.getAttributes("textStyle");
  return fontSize
    ? parseInt(fontSize.replace("px", "")) || 16
    : defaultFontSize;
}
