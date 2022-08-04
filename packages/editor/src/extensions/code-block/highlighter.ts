import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import {
  findChildren,
  findParentNodeClosestToPos,
  NodeWithPos,
} from "@tiptap/core";
import { Root, refractor } from "refractor/lib/core";
import { RootContent } from "hast";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import { toCaretPosition, toCodeLines } from "./code-block";

export type ReplaceMergedStep = ReplaceAroundStep | ReplaceStep;

function parseNodes(
  nodes: RootContent[],
  className: string[] = []
): { text: string; classes: string[] }[] {
  return nodes.reduce((result, node) => {
    if (node.type === "comment" || node.type === "doctype") return result;

    const classes: string[] = [...className];

    if (node.type === "element" && node.properties)
      classes.push(...(node.properties.className as string[]));
    // this is required so that even plain text is wrapped in a span
    // during highlighting. Without this, Prosemirror's selection acts
    // weird for the first highlighted node/span.
    // else classes.push("token", "text");

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

function getDecorations({
  block,
  defaultLanguage,
}: {
  block: NodeWithPos;
  defaultLanguage: string | null | undefined;
}) {
  const decorations: Decoration[] = [];
  const languages = refractor.listLanguages();

  const { node, pos } = block;
  const code = node.textContent;

  const language = node.attrs.language || defaultLanguage;
  const nodes = languages.includes(language)
    ? getHighlightNodes(refractor.highlight(code, language))
    : null;
  if (!nodes) return;
  let from = pos + 1;
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

  return decorations;
}

export function HighlighterPlugin({
  name,
  defaultLanguage,
}: {
  name: string;
  defaultLanguage: string | null | undefined;
}) {
  const key = new PluginKey("highlighter");
  return new Plugin({
    key,

    state: {
      init: (config, state) => {
        const allDecorations: Decoration[] = [];
        findChildren(state.doc, (node) => node.type.name === name).forEach(
          (block) => {
            allDecorations.push(
              ...(getDecorations({ block, defaultLanguage }) || [])
            );
          }
        );
        return DecorationSet.create(state.doc, allDecorations);
      },
      apply: (
        transaction,
        decorationSet: DecorationSet,
        oldState,
        newState
      ) => {
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;

        const isInsideCodeblock = oldNodeName === name || newNodeName === name;
        const isDocChanged = transaction.docChanged;

        // TODO: we need to find a way to trigger decoration changes
        // when user pastes something.

        if (isDocChanged && isInsideCodeblock) {
          const block = findParentNodeClosestToPos(
            newState.selection.$head,
            (node) => node.type.name === name
          );
          if (!block)
            return decorationSet.map(transaction.mapping, transaction.doc);

          const newDecorations = getDecorations({
            block,
            defaultLanguage,
          });
          if (!newDecorations)
            return decorationSet.map(transaction.mapping, transaction.doc);

          return decorationSet
            .map(transaction.mapping, transaction.doc)
            .add(transaction.doc, newDecorations);
        }

        return decorationSet.map(transaction.mapping, transaction.doc);
      },
    },

    props: {
      decorations(state) {
        return key.getState(state);
      },
    },

    appendTransaction: (transactions, oldState, newState) => {
      const oldNodeName = oldState.selection.$head.parent.type.name;
      const newNodeName = newState.selection.$head.parent.type.name;

      const isDocChanged = transactions.some(
        (transaction) => transaction.docChanged
      );
      const isInsideCodeblock = oldNodeName === name || newNodeName === name;
      const isSelectionChanged =
        isInsideCodeblock && !oldState.selection.eq(newState.selection);

      if (isDocChanged || isSelectionChanged) {
        const block = findParentNodeClosestToPos(
          newState.selection.$head,
          (node) => node.type.name === name
        );
        if (!block) return null;
        const { tr } = newState;
        const { node, pos } = block;
        const attributes = { ...node.attrs };

        if (isDocChanged || !attributes.lines?.length) {
          const lines = toCodeLines(node.textContent, pos);
          attributes.lines = lines.slice();
        }

        if (isDocChanged) {
          const position = toCaretPosition(
            newState.selection,
            isDocChanged ? toCodeLines(node.textContent, pos) : undefined
          );
          attributes.caretPosition = position;
        }

        if (isDocChanged || isSelectionChanged) {
          tr.setNodeMarkup(pos, node.type, attributes);
        }

        return tr;
      }
    },
  });
}
