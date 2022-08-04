import { mergeAttributes, Node } from "@tiptap/core";
import { HardBreak } from "@tiptap/extension-hard-break";

export interface ParagraphOptions {
  HTMLAttributes: Record<string, any>;
  doubleSpaced: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraph: {
      /**
       * Toggle a paragraph
       */
      setParagraph: () => ReturnType;
    };
  }
}

export const Paragraph = Node.create<ParagraphOptions>({
  name: "paragraph",

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
      doubleSpaced: true,
    };
  },

  group: "block",

  content: "inline*",

  // addAttributes() {
  //   return {
  //     spacing: {
  //       keepOnSplit: false,
  //       default: getSpacing(this.options.doubleSpaced),
  //       parseHTML: (element) => element.dataset.spacing,
  //       renderHTML: (attributes) => {
  //         if (!attributes.spacing) return;

  //         return {
  //           "data-spacing": attributes.spacing,
  //         };
  //       },
  //     },
  //   };
  // },

  parseHTML() {
    return [{ tag: "p" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (this.options.doubleSpaced) return false;

        // if (this.options.doubleSpaced) return false;

        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const endsWithNewline = $from.nodeBefore?.type.name === HardBreak.name;

        if (endsWithNewline) {
          return this.editor.commands.command(({ tr }) => {
            const { from } = tr.selection;
            tr.delete(from - 1, from);
            return false;
          });
        }

        return this.editor.commands.setHardBreak();
      },
      "Mod-Alt-0": () => this.editor.commands.setParagraph(),
    };
  },
});

function getSpacing(doubleSpaced: boolean): "single" | "double" {
  return doubleSpaced ? "double" : "single";
}
