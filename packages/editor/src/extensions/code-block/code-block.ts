import { Editor } from "@tiptap/core";
import { Node, textblockTypeInputRule, mergeAttributes } from "@tiptap/core";
import {
  Plugin,
  PluginKey,
  TextSelection,
  Transaction,
  Selection,
} from "prosemirror-state";
import { ResolvedPos, Node as ProsemirrorNode } from "prosemirror-model";
import {
  findParentNodeClosestToPos,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { CodeblockComponent } from "./component";
import { HighlighterPlugin } from "./highlighter";
import detectIndent from "detect-indent";

export type IndentationOptions = {
  type: "space" | "tab";
  length: number;
};

export type CodeBlockAttributes = {
  indentType: IndentationOptions["type"];
  indentLength: number;
  language: string;
  lines: CodeLine[];
};

export interface CodeBlockOptions {
  /**
   * Adds a prefix to language classes that are applied to code tags.
   * Defaults to `'language-'`.
   */
  languageClassPrefix: string;
  /**
   * Define whether the node should be exited on triple enter.
   * Defaults to `true`.
   */
  exitOnTripleEnter: boolean;
  /**
   * Define whether the node should be exited on arrow down if there is no node after it.
   * Defaults to `true`.
   */
  exitOnArrowDown: boolean;
  /**
   * Define whether the node should be exited on arrow up if there is no node before it.
   * Defaults to `true`.
   */
  exitOnArrowUp: boolean;
  /**
   * Custom HTML attributes that should be added to the rendered HTML tag.
   */
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codeblock: {
      /**
       * Set a code block
       */
      setCodeBlock: (attributes?: { language: string }) => ReturnType;
      /**
       * Toggle a code block
       */
      toggleCodeBlock: (attributes?: { language: string }) => ReturnType;

      /**
       * Change code block indentation options
       */
      changeCodeBlockIndentation: (options: IndentationOptions) => ReturnType;
    };
  }
}

export const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
export const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;
const ZERO_WIDTH_SPACE = "\u200b";
const NEWLINE = "\n";
export const CodeBlock = Node.create<CodeBlockOptions>({
  name: "codeblock",

  addOptions() {
    return {
      languageClassPrefix: "language-",
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      exitOnArrowUp: true,
      HTMLAttributes: {},
    };
  },

  content: "text*",

  marks: "",

  group: "block",

  code: true,

  defining: true,

  addAttributes() {
    return {
      lines: {
        default: [],
        rendered: false,
      },
      indentType: {
        default: "space",
        parseHTML: (element) => {
          const indentType = element.dataset.indentType;
          if (indentType) return indentType;
          return detectIndent(element.innerText).type;
        },
        renderHTML: (attributes) => {
          if (!attributes.indentType) {
            return {};
          }
          return {
            "data-indent-type": attributes.indentType,
          };
        },
      },
      indentLength: {
        default: 2,
        parseHTML: (element) => {
          const indentLength = element.dataset.indentLength;
          if (indentLength) return indentLength;
          return detectIndent(element.innerText).amount;
        },
        renderHTML: (attributes) => {
          if (!attributes.indentLength) {
            return {};
          }
          return {
            "data-indent-length": attributes.indentLength,
          };
        },
      },
      language: {
        default: null,
        parseHTML: (element) => {
          const { languageClassPrefix } = this.options;
          const classNames = [
            ...(element.classList || []),
            ...(element?.firstElementChild?.classList || []),
          ];
          const languages = classNames
            .filter((className) => className.startsWith(languageClassPrefix))
            .map((className) => className.replace(languageClassPrefix, ""));
          const language = languages[0];

          if (!language) {
            return null;
          }

          return language;
        },
        renderHTML: (attributes) => {
          if (!attributes.language) {
            return {};
          }

          return {
            class: `language-${attributes.language}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre",
        preserveWhitespace: "full",
        // contentElement: (node) => {
        //   if (node instanceof HTMLElement) {
        //     node.innerText = node.innerText.replaceAll("\n\u200b\n", "\n\n");
        //   }
        //   return node;
        // },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
      toggleCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph", attributes);
        },
      changeCodeBlockIndentation:
        (options) =>
        ({ editor, tr, commands }) => {
          const { state } = editor;
          const { selection } = state;
          const { $from } = selection;

          if ($from.parent.type !== this.type) {
            return false;
          }

          const { lines } = $from.parent.attrs as CodeBlockAttributes;

          for (const line of lines) {
            const text = line.text();
            const whitespaceLength = text.length - text.trimStart().length;
            if (!whitespaceLength) continue;

            const indentLength = whitespaceLength;
            const indentToken = indent(options.type, indentLength);

            tr.insertText(
              indentToken,
              tr.mapping.map(line.from),
              tr.mapping.map(line.from + whitespaceLength)
            );
          }

          commands.updateAttributes(this.type, {
            indentType: options.type,
            indentLength: options.length,
          });
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),
      "Mod-a": ({ editor }) => {
        const { $anchor } = this.editor.state.selection;
        if ($anchor.parent.type.name !== this.name) {
          return false;
        }
        const codeblock = findParentNodeClosestToPos(
          $anchor,
          (node) => node.type.name === this.type.name
        );
        if (!codeblock) return false;
        return editor.commands.setTextSelection({
          from: codeblock.pos,
          to: codeblock.pos + codeblock.node.nodeSize,
        });
      },
      // remove code block when at start of document or code block is empty
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        const isAtStart = $anchor.pos === 1;

        if (!empty || $anchor.parent.type.name !== this.name) {
          return false;
        }

        if (isAtStart || !$anchor.parent.textContent.length) {
          return this.editor.commands.clearNodes();
        }

        return false;
      },

      // exit node on triple enter
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const indentation = parseIndentation($from.parent);

        return (
          (this.options.exitOnTripleEnter &&
            exitOnTripleEnter(editor, $from)) ||
          indentOnEnter(editor, $from, indentation)
        );
      },

      // exit node on arrow up
      ArrowUp: ({ editor }) => {
        if (!this.options.exitOnArrowUp) {
          return false;
        }

        const { state } = editor;
        const { selection } = state;
        const { $anchor, empty } = selection;

        if (!empty || $anchor.parent.type !== this.type) {
          return false;
        }

        const isAtStart = $anchor.pos === 1;
        if (!isAtStart) {
          return false;
        }

        return editor.commands.insertContentAt(0, "<p></p>");
      },
      // exit node on arrow down
      ArrowDown: ({ editor }) => {
        if (!this.options.exitOnArrowDown) {
          return false;
        }

        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

        if (!isAtEnd) {
          return false;
        }

        const after = $from.after();

        if (after === undefined) {
          return false;
        }

        const nodeAfter = doc.nodeAt(after);

        if (nodeAfter) {
          editor.commands.setNodeSelection($from.before());
          return false;
        }

        return editor.commands.exitCode();
      },
      "Shift-Tab": ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type !== this.type) {
          return false;
        }

        const indentation = parseIndentation($from.parent);
        const indentToken = indent(indentation.type, indentation.length);

        const { lines } = $from.parent.attrs as CodeBlockAttributes;
        const selectedLines = getSelectedLines(lines, selection);

        return editor
          .chain()
          .command(({ tr }) =>
            withSelection(tr, (tr) => {
              for (const line of selectedLines) {
                if (line.text(indentToken.length) !== indentToken) continue;

                tr.delete(
                  tr.mapping.map(line.from),
                  tr.mapping.map(line.from + indentation.length)
                );
              }
            })
          )
          .run();
      },
      Tab: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type !== this.type) {
          return false;
        }
        const { lines } = $from.parent.attrs as CodeBlockAttributes;
        const selectedLines = getSelectedLines(lines, selection);

        return editor
          .chain()
          .command(({ tr }) =>
            withSelection(tr, (tr) => {
              const indentation = parseIndentation($from.parent);
              const indentToken = indent(indentation.type, indentation.length);

              if (selectedLines.length === 1)
                return tr.insertText(indentToken, $from.pos);

              for (const line of selectedLines) {
                tr.insertText(indentToken, tr.mapping.map(line.from));
              }
            })
          )
          .run();
      },
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1],
        }),
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1],
        }),
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      // this plugin creates a code block for pasted content from VS Code
      // we can also detect the copied code language
      new Plugin({
        key: new PluginKey("codeBlockVSCodeHandler"),
        props: {
          handlePaste: (view, event) => {
            if (!event.clipboardData) {
              return false;
            }

            // don’t create a new code block within code blocks
            if (this.editor.isActive(this.type.name)) {
              return false;
            }

            const text = event.clipboardData.getData("text/plain");
            const vscode = event.clipboardData.getData("vscode-editor-data");
            const vscodeData = vscode ? JSON.parse(vscode) : undefined;
            const language = vscodeData?.mode;

            if (!text || !language) {
              return false;
            }

            const { tr } = view.state;

            // create an empty code block
            tr.replaceSelectionWith(this.type.create({ language }));

            // put cursor inside the newly created code block
            tr.setSelection(
              TextSelection.near(
                tr.doc.resolve(Math.max(0, tr.selection.from - 2))
              )
            );

            // add text to code block
            // strip carriage return chars from text pasted as code
            // see: https://github.com/ProseMirror/prosemirror-view/commit/a50a6bcceb4ce52ac8fcc6162488d8875613aacd
            tr.insertText(text.replace(/\r\n?/g, "\n"));

            // store meta information
            // this is useful for other plugins that depends on the paste event
            // like the paste rule plugin
            tr.setMeta("paste", true);

            view.dispatch(tr);

            return true;
          },
        },
      }),
      HighlighterPlugin({ name: this.name, defaultLanguage: "txt" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeblockComponent);
  },
});

export type CaretPosition = {
  column: number;
  line: number;
  selected?: number;
  total: number;
};
export function toCaretPosition(
  lines: CodeLine[],
  selection: Selection<any>
): CaretPosition | undefined {
  const { $from, $to, $head } = selection;
  if ($from.parent.type.name !== CodeBlock.name) return;

  for (const line of lines) {
    if ($head.pos >= line.from && $head.pos <= line.to) {
      const lineLength = line.length + 1;
      return {
        line: line.index + 1,
        column: lineLength - (line.to - $head.pos),
        selected: $to.pos - $from.pos,
        total: lines.length,
      };
    }
  }
  return;
}

export function getLines(node: ProsemirrorNode<any>) {
  const { lines } = node.attrs as CodeBlockAttributes;
  return lines || [];
}

function exitOnTripleEnter(editor: Editor, $from: ResolvedPos<any>) {
  const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
  const endsWithDoubleNewline = $from.parent.textContent.endsWith("\n\n");

  if (!isAtEnd || !endsWithDoubleNewline) {
    return false;
  }

  return editor
    .chain()
    .command(({ tr }) => {
      tr.delete($from.pos - 2, $from.pos);

      return true;
    })
    .exitCode()
    .run();
}

function indentOnEnter(
  editor: Editor,
  $from: ResolvedPos<any>,
  options: IndentationOptions
) {
  const { lines } = $from.parent.attrs as CodeBlockAttributes;
  const currentLine = getLineAt(lines, $from.pos);
  if (!currentLine) return false;

  const text = editor.state.doc.textBetween(currentLine.from, currentLine.to);
  const indentLength = text.length - text.trimStart().length;

  const newline = `${NEWLINE}${indent(options.type, indentLength)}`;
  return editor.commands.insertContent(newline, {
    parseOptions: { preserveWhitespace: "full" },
  });
}

type CodeLine = {
  index: number;
  from: number;
  to: number;
  length: number;
  text: (length?: number) => string;
};
export function toCodeLines(code: string, pos: number): CodeLine[] {
  const positions: CodeLine[] = [];

  let start = 0;
  let from = pos + 1;
  let index = 0;
  while (start <= code.length) {
    let end = code.indexOf("\n", start);
    if (end <= -1) end = code.length;

    const lineLength = end - start;
    const to = from + lineLength;
    const lineStart = start;
    positions.push({
      index,
      length: lineLength,
      from,
      to,
      text: (length) => {
        return code.slice(
          lineStart,
          length ? lineStart + length : lineStart + lineLength
        );
      },
    });

    from = to + 1;
    start = end + 1;
    ++index;
  }
  return positions;
}

function getSelectedLines(lines: CodeLine[], selection: Selection<any>) {
  const { $from, $to } = selection;
  return lines.filter(
    (line) =>
      inRange(line.from, $from.pos, $to.pos) ||
      inRange(line.to, $from.pos, $to.pos) ||
      inRange($from.pos, line.from, line.to)
  );
}

function parseIndentation(node: ProsemirrorNode<any>): IndentationOptions {
  const { indentType, indentLength } = node.attrs;
  return {
    type: indentType,
    length: parseInt(indentLength),
  };
}

function getLineAt(lines: CodeLine[], pos: number) {
  return lines.find((line) => pos >= line.from && pos <= line.to);
}

function inRange(x: number, a: number, b: number) {
  return x >= a && x <= b;
}

function indent(type: IndentationOptions["type"], length: number) {
  const char = type === "space" ? " " : "\t";
  return char.repeat(length);
}

/**
 * Persist selection between transaction steps
 */
function withSelection(
  tr: Transaction<any>,
  callback: (tr: Transaction<any>) => void
): boolean {
  const { $anchor, $head } = tr.selection;

  callback(tr);

  tr.setSelection(
    new TextSelection(
      tr.doc.resolve(tr.mapping.map($anchor.pos)),
      tr.doc.resolve(tr.mapping.map($head.pos))
    )
  );
  return true;
}
