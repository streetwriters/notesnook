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
    types: ["paragraph", "heading"],
    defaultDirection: "ltr",
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
                dir: attributes.textDirection,
              };
            },
          },
        },
      },
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
        },
    };
  },
});
