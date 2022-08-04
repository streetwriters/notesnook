import { Editor, mergeAttributes, Node } from "@tiptap/core";
import { NodeType } from "prosemirror-model";
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

  addAttributes() {
    return {
      spacing: {
        keepOnSplit: false,
        default: getSpacing(this.options.doubleSpaced),
        parseHTML: (element) => element.dataset.spacing,
        renderHTML: (attributes) => {
          if (!attributes.spacing) return;

          return {
            "data-spacing": attributes.spacing,
          };
        },
      },
    };
  },

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

        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type || $from.depth > 1) {
          return false;
        }

        const endsWithNewline = $from.nodeBefore === null;

        if (endsWithNewline) {
          createParagraph(editor, this.type, true, false);
          return true;
        }

        return false;
      },
      "Mod-Enter": ({ editor }) =>
        createParagraph(editor, this.type, false, true),
      "Shift-Enter": ({ editor }) =>
        createParagraph(editor, this.type, false, true),
      "Mod-Alt-0": () => this.editor.commands.setParagraph(),
    };
  },
});

function getSpacing(doubleSpaced: boolean): "single" | "double" {
  return doubleSpaced ? "double" : "single";
}

function createParagraph(
  editor: Editor,
  type: NodeType,
  doubleSpaced: boolean,
  skipEmpty: boolean = true
) {
  return editor
    .chain()
    .command(({ tr }) => {
      const { from } = tr.selection;
      const currentParagraph = tr.doc.nodeAt(from - 1);
      if (currentParagraph?.type !== type) return true;
      if (currentParagraph.attrs.spacing === "double") return true;
      // if paragraph is empty, skip
      if (skipEmpty && currentParagraph.nodeSize === 2) return true;
      tr.delete(from - 1, from);
      return true;
    })
    .splitBlock({ keepMarks: true })
    .updateAttributes(type, {
      spacing: getSpacing(doubleSpaced),
    })
    .run();
}
