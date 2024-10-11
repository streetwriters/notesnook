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
import { getFontById } from "../../utils/font.js";

export type FontFamilyOptions = {
  types: string[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontFamily: {
      /**
       * Set the font family
       */
      setFontFamily: (fontFamily: string) => ReturnType;
      /**
       * Unset the font family
       */
      unsetFontFamily: () => ReturnType;
    };
  }
}

export const FontFamily = Extension.create<FontFamilyOptions>({
  name: "fontFamily",

  addOptions() {
    return {
      types: ["textStyle"]
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) =>
              element.style.fontFamily?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) {
                return {};
              }

              const realFontFamily =
                attributes["data-font-family"] || attributes.fontFamily;
              const font =
                getFontById(realFontFamily)?.font || attributes.fontFamily;
              return {
                "data-font-family": realFontFamily,
                style: `font-family: ${font}`
              };
            }
          }
        }
      }
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontFamily }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontFamily: null })
            .removeEmptyTextStyle()
            .run();
        }
    };
  }
});
