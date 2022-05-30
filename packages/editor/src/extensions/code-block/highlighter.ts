import { Plugin, PluginKey, Transaction, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { findChildren } from "@tiptap/core";
import { Root, refractor } from "refractor/lib/core";
import { RootContent } from "hast";
import {
  AddMarkStep,
  RemoveMarkStep,
  ReplaceAroundStep,
  ReplaceStep,
} from "prosemirror-transform";
import {
  CaretPosition,
  CodeBlockAttributes,
  getLines,
  toCaretPosition,
  toCodeLines,
} from "./code-block";

type MergedStep =
  | AddMarkStep
  | RemoveMarkStep
  | ReplaceAroundStep
  | ReplaceStep;

function parseNodes(
  nodes: RootContent[],
  className: string[] = []
): { text: string; classes: string[] }[] {
  return nodes.reduce((result, node) => {
    if (node.type === "comment" || node.type === "doctype") return result;

    const classes: string[] = [...className];

    if (node.type === "element" && node.properties)
      classes.push(...(node.properties.className as string[]));
    else classes.push("token", "text");

    if (node.type === "element") {
      result.push(...parseNodes(node.children, classes));
    } else {
      result.push({ classes, text: node.value });
    }

    return result;
  }, [] as { text: string; classes: string[] }[]);
}

function getHighlightNodes(result: Root) {
  return result.children || [];
}

function getLineDecoration(
  from: number,
  line: number,
  total: number,
  isActive: boolean
) {
  const attributes = {
    class: `line-number ${isActive ? "active" : ""}`,
    "data-line": String(line).padEnd(String(total).length, " "),
  };
  const spec = {
    line: line,
    active: isActive,
    total,
  };

  // Prosemirror has a selection issue with the widget decoration
  // on the first line. To work around that we use inline decoration
  // for the first line.
  if (line === 1) {
    return Decoration.inline(from, from + 1, attributes, spec);
  }

  return Decoration.widget(
    from,
    () => {
      const element = document.createElement("span");
      element.classList.add("line-number-widget");
      if (isActive) element.classList.add("active");
      element.innerHTML = attributes["data-line"];
      return element;
    },
    {
      ...spec,
      key: `${line}-${isActive ? "active" : "inactive"}`,
    }
  );
}

function getDecorations({
  doc,
  name,
  defaultLanguage,
  currentLine,
}: {
  currentLine?: number;
  doc: ProsemirrorNode;
  name: string;
  defaultLanguage: string | null | undefined;
}) {
  const decorations: Decoration[] = [];
  const languages = refractor.listLanguages();
  findChildren(doc, (node) => node.type.name === name).forEach((block) => {
    const code = block.node.textContent;

    const { lines } = block.node.attrs as CodeBlockAttributes;
    for (const line of lines || []) {
      const lineNumber = line.index + 1;
      const isActive = lineNumber === currentLine;
      const decoration = getLineDecoration(
        line.from,
        lineNumber,
        lines?.length || 0,
        isActive
      );
      decorations.push(decoration);
    }

    const language = block.node.attrs.language || defaultLanguage;
    const nodes = languages.includes(language)
      ? getHighlightNodes(refractor.highlight(code, language))
      : null;
    if (!nodes) return;

    let from = block.pos + 1;
    parseNodes(nodes).forEach((node) => {
      const to = from + node.text.length;

      if (node.classes.length) {
        const decoration = Decoration.inline(from, to, {
          class: node.classes.join(" "),
        });

        decorations.push(decoration);
      }

      from = to;
    });
  });

  return DecorationSet.create(doc, decorations);
}

export function HighlighterPlugin({
  name,
  defaultLanguage,
}: {
  name: string;
  defaultLanguage: string | null | undefined;
}) {
  return new Plugin({
    key: new PluginKey("highlighter"),

    state: {
      init: () => {
        return DecorationSet.empty;
      },
      apply: (
        transaction,
        decorationSet: DecorationSet,
        oldState,
        newState
      ) => {
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;

        const oldNodes = findChildren(
          oldState.doc,
          (node) => node.type.name === name
        );
        const newNodes = findChildren(
          newState.doc,
          (node) => node.type.name === name
        );

        const position = toCaretPosition(
          getLines(newState.selection.$head.parent),
          newState.selection
        );

        if (
          transaction.docChanged &&
          // Apply decorations if:
          // selection includes named node,
          ([oldNodeName, newNodeName].includes(name) ||
            // OR transaction adds/removes named node,
            newNodes.length !== oldNodes.length ||
            // OR transaction has changes that completely encapsulte a node
            // (for example, a transaction that affects the entire document).
            // Such transactions can happen during collab syncing via y-prosemirror, for example.
            (transaction.steps as MergedStep[]).some((step) => {
              return (
                step.from !== undefined &&
                step.to !== undefined &&
                oldNodes.some((node) => {
                  return (
                    node.pos >= step.from &&
                    node.pos + node.node.nodeSize <= step.to
                  );
                })
              );
            }))
        ) {
          return getDecorations({
            doc: transaction.doc,
            name,
            defaultLanguage,
            currentLine: position?.line,
          });
        }

        decorationSet = getActiveLineDecorations(
          transaction.doc,
          decorationSet,
          position
        );

        return decorationSet.map(transaction.mapping, transaction.doc);
      },
    },

    props: {
      decorations(state) {
        return this.getState(state);
      },
    },

    appendTransaction: (transactions, _prevState, nextState) => {
      const tr = nextState.tr;
      let modified = false;

      if (transactions.some((transaction) => transaction.docChanged)) {
        findChildren(nextState.doc, (node) => node.type.name === name).forEach(
          (block) => {
            const { node, pos } = block;
            const lines = toCodeLines(node.textContent, pos);
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              lines,
            });
            modified = true;
          }
        );
      }

      return modified ? tr : null;
    },
  });
}

/**
 * When `position` is undefined, all active line decorations
 * are reset (e.g. when you focus out of the code block).
 */
function getActiveLineDecorations(
  doc: ProsemirrorNode<any>,
  decorations: DecorationSet,
  position?: CaretPosition
) {
  const lineDecorations = decorations.find(
    undefined,
    undefined,
    ({ line, active }) => {
      return (position && line === position.line) || active;
    }
  );

  if (!lineDecorations.length) return decorations;

  // we have to clone because prosemirror operates in-place
  const cloned = lineDecorations.slice();

  // remove old line decorations which inclue the current line decoration
  // and the previous current line decoration. We'll replace these with
  // new decorations.
  decorations = decorations.remove(lineDecorations);

  const newDecorations: Decoration[] = [];
  for (const decoration of cloned) {
    const {
      from,
      spec: { line, total },
    } = decoration;

    const isActive = line === position?.line;
    const newDecoration = getLineDecoration(
      from,
      line,
      position?.total || total,
      isActive
    );
    newDecorations.push(newDecoration);
  }
  return decorations.add(doc, newDecorations);
}
