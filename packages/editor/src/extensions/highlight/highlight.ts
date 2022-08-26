import "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";

export interface HighlightOptions {
  types: string[];
  HTMLAttributes: Record<string, any>;
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
