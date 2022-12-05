import "@tiptap/extension-text-style";
import { getFontConfig } from "@notesnook/theme/dist/theme/font";
import { Extension } from "@tiptap/core";

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

const FONTS: Record<string, string> = {
  monospace: getFontConfig().fonts.monospace,
  "sans-serif": getFontConfig().fonts.body,
  serif: `Noto Serif, Times New Roman, serif`
};

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
              const font = FONTS[realFontFamily] || attributes.fontFamily;
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
