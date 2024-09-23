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

import { Plugin, PluginKey, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import {
  findChildren,
  findParentNodeClosestToPos,
  NodeWithPos
} from "@tiptap/core";
import { Root, refractor } from "refractor/lib/core.js";
import { RootContent } from "hast";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import { toCaretPosition, toCodeLines } from "./utils.js";
import Languages from "./languages.json";
import { isLanguageLoaded, loadLanguage } from "./loader.js";
import { getChangedNodes } from "../../utils/prosemirror.js";

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
  defaultLanguage
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
        class: node.classes.join(" ")
      });
      decorations.push(decoration);
    }
    from = to;
  });

  return decorations;
}

type HighlighterState = {
  decorations: DecorationSet;
  languages: Record<string, string>;
};

export function HighlighterPlugin({
  name,
  defaultLanguage
}: {
  name: string;
  defaultLanguage: string | null | undefined;
}) {
  const HIGHLIGHTER_PLUGIN_KEY = new PluginKey<HighlighterState>("highlighter");
  const HIGHLIGHTED_BLOCKS: Set<string> = new Set();

  return new Plugin<HighlighterState>({
    key: HIGHLIGHTER_PLUGIN_KEY,
    view() {
      return {
        destroy() {
          HIGHLIGHTED_BLOCKS.clear();
        },
        async update(view) {
          const pluginState = HIGHLIGHTER_PLUGIN_KEY.getState(view.state);
          if (!pluginState) return;

          const changedBlocks: Set<string> = new Set();
          for (const blockKey in pluginState.languages) {
            const language = pluginState.languages[blockKey];
            if (
              HIGHLIGHTED_BLOCKS.has(blockKey) &&
              refractor.registered(language)
            ) {
              continue;
            }

            const languageDefinition = Languages.find(
              (l) =>
                l.filename === language || l.alias?.some((a) => a === language)
            );
            if (!languageDefinition) continue;

            if (
              isLanguageLoaded(languageDefinition.filename) ||
              refractor.registered(languageDefinition.filename)
            ) {
              if (!HIGHLIGHTED_BLOCKS.has(blockKey)) {
                HIGHLIGHTED_BLOCKS.add(blockKey);
                changedBlocks.add(blockKey);
              }
              continue;
            }

            changedBlocks.add(blockKey);
            HIGHLIGHTED_BLOCKS.add(blockKey);

            try {
              const syntax = await loadLanguage(languageDefinition.filename);
              if (!syntax) {
                throw new Error(
                  "Failed to load language definition for " +
                    languageDefinition.filename
                );
              }

              refractor.register(syntax);
            } catch (err) {
              console.error(err);
              HIGHLIGHTED_BLOCKS.delete(blockKey);
              changedBlocks.delete(blockKey);
            }
          }

          if (changedBlocks.size > 0) {
            const { tr } = view.state;
            const changedNodes = findChildren(
              tr.doc,
              (n) => n.type.name === name && changedBlocks.has(n.attrs.id)
            );
            changedNodes.forEach(({ node, pos }) => {
              tr.setNodeMarkup(pos, node.type, node.attrs);
            });
            tr.setMeta("preventUpdate", true);
            tr.setMeta("addToHistory", false);
            view.dispatch(tr);
          }
        }
      };
    },
    state: {
      init: (_config, state) => {
        const languages: Record<string, string> = {};
        findChildren(state.doc, (node) => node.type.name === name).forEach(
          (block) => {
            const { id, language } = block.node.attrs;
            if (id && language) languages[id] = language;
          }
        );
        return { decorations: DecorationSet.empty, languages };
      },
      apply: (tr, pluginState) => {
        let { decorations } = pluginState;
        const { languages } = pluginState;

        if (tr.docChanged && !tr.getMeta("selectionUpdate")) {
          const changedBlocks = getChangedNodes(tr, {
            descend: true,
            predicate: (n) => n.type.name === name
          });
          if (changedBlocks.length > 0) {
            const updated: Set<number> = new Set();
            let hasChanges = false;

            changedBlocks.forEach((block) => {
              if (updated.has(block.pos)) return;
              updated.add(block.pos);

              const { id, language } = block.node.attrs;

              if (
                !languages[id] ||
                (language && !refractor.registered(language))
              ) {
                languages[id] = language;
                hasChanges = true;
              } else {
                const newDecorations = getDecorations({
                  block,
                  defaultLanguage
                });
                if (!newDecorations) return;

                decorations = decorations.map(tr.mapping, tr.doc);

                const oldDecorations = decorations.find(
                  block.pos,
                  block.pos + block.node.nodeSize
                );

                const { toAdd, toRemove } = diffDecorations(
                  oldDecorations,
                  newDecorations
                );

                if (toRemove.length > 0)
                  decorations = decorations.remove(toRemove);
                if (toAdd.length > 0)
                  decorations = decorations.add(tr.doc, toAdd);

                hasChanges = true;
              }
            });

            if (hasChanges) {
              return { decorations, languages };
            }
          }
        }

        return {
          decorations: decorations.map(tr.mapping, tr.doc),
          languages
        };
      }
    },

    props: {
      decorations(state) {
        return HIGHLIGHTER_PLUGIN_KEY.getState(state)?.decorations;
      }
    },
    appendTransaction(transactions, oldState, newState) {
      const isDocChanged = transactions.some((tr) => tr.docChanged);
      return updateSelection(name, oldState, newState, isDocChanged);
    }
  });
}

function updateSelection(
  name: string,
  oldState: EditorState,
  newState: EditorState,
  isDocChanged: boolean
) {
  const oldNodeName = oldState.selection.$head.parent.type.name;
  const newNodeName = newState.selection.$head.parent.type.name;

  const isInsideCodeblock = oldNodeName === name || newNodeName === name;
  const isSelectionChanged =
    isInsideCodeblock && !oldState.selection.eq(newState.selection);

  if (isDocChanged || isSelectionChanged) {
    const block = findParentNodeClosestToPos(
      newState.selection.$head,
      (node) => node.type.name === name
    );
    if (!block) return null;
    const { node, pos } = block;
    const attributes = { ...node.attrs };

    if (isDocChanged || !attributes.lines?.length) {
      const lines = toCodeLines(node.textContent, pos);
      attributes.lines = lines.slice();
    }

    const position = toCaretPosition(
      newState.selection,
      isDocChanged ? toCodeLines(node.textContent, pos) : undefined
    );
    attributes.caretPosition = position;

    const { tr } = newState;
    tr.setMeta("preventUpdate", true);
    tr.setMeta("addToHistory", false);
    tr.setMeta("selectionUpdate", true);
    tr.setNodeMarkup(pos, node.type, attributes);
    return tr;
  }
}

function diffDecorations(
  oldDecorations: Decoration[],
  newDecorations: Decoration[]
) {
  const toAdd: Decoration[] = [];
  const toRemove: Decoration[] = [];

  for (let i = 0; i < oldDecorations.length; ++i) {
    const oldDecoration = oldDecorations[i];
    const newDecoration = newDecorations[i];

    if (!newDecoration) {
      toRemove.push(oldDecoration);
    } else if (
      oldDecoration.from !== newDecoration.from ||
      oldDecoration.to !== newDecoration.to ||
      oldDecoration.spec.class !== newDecoration.spec.class
    ) {
      toAdd.push(newDecoration);
      toRemove.push(oldDecoration);
    }
  }

  const extraDecorations = newDecorations.length - oldDecorations.length;
  if (extraDecorations > 0) {
    toAdd.push(
      ...newDecorations.slice(newDecorations.length - extraDecorations)
    );
  }
  return { toAdd, toRemove };
}
