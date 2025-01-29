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

import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import {
  EditorState,
  Plugin,
  PluginKey,
  Transaction,
  TextSelection
} from "prosemirror-state";
import { SearchSettings } from "../../toolbar/stores/search-store.js";

type DispatchFn = (tr: Transaction) => void;
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchreplace: {
      startSearch: () => ReturnType;
      endSearch: () => ReturnType;
      search: (term: string, options?: SearchSettings) => ReturnType;
      moveToNextResult: () => ReturnType;
      moveToPreviousResult: () => ReturnType;
      replace: (term: string) => ReturnType;
      replaceAll: (term: string) => ReturnType;
    };
  }
}

interface Result {
  from: number;
  to: number;
}

interface SearchOptions {
  searchResultClass: string;
  onStartSearch: (term?: string) => boolean;
  onEndSearch: () => boolean;
}

export type SearchStorage = {
  selectedIndex: number;
  selectedText?: string;
  results?: Result[];
};

interface TextNodesWithPosition {
  text: string;
  startPos: number;
  endPos: number;
  start: number;
  end: number;
}

const updateView = (state: EditorState, dispatch: DispatchFn) => {
  if (!state.tr) return;

  dispatch(state.tr);
};

const regex = (s: string, settings: SearchSettings): RegExp | undefined => {
  const { enableRegex, matchCase, matchWholeWord } = settings;
  const boundary = matchWholeWord ? "\\b" : "";
  try {
    return RegExp(
      boundary +
        (enableRegex ? s : s.replace(/[/\\^$*+?.()|[\]]/g, "\\$&")) +
        boundary,
      matchCase ? "gum" : "guim"
    );
  } catch (e) {
    console.error(e);
  }
};

function searchDocument(
  tr: Transaction,
  searchResultClass: string,
  searchTerm?: RegExp,
  selectedIndex?: number
): { decorationSet: DecorationSet; results: Result[]; startIndex: number } {
  if (!searchTerm)
    return {
      decorationSet: DecorationSet.empty,
      results: [],
      startIndex: selectedIndex || 0
    };

  const doc = tr.doc;
  const results: Result[] = [];

  let index = -1;
  const textNodesWithPosition: TextNodesWithPosition[] = [];

  let cursor = 0;
  doc?.descendants((node, pos) => {
    if (node.isText) {
      if (textNodesWithPosition[index]) {
        textNodesWithPosition[index].text += node.text;
        textNodesWithPosition[index].end = cursor + (node.text?.length || 0);
      } else {
        textNodesWithPosition[index] = {
          text: node.text || "",
          startPos: pos,
          endPos: pos + node.nodeSize,
          start: cursor,
          end: cursor + (node.text?.length || 0)
        };
      }
      cursor += node.text?.length || 0;
    } else if (node.isBlock) {
      const lastNode = textNodesWithPosition[index];
      if (lastNode) {
        lastNode.text += "\n";
        lastNode.end++;
        lastNode.endPos = pos;
        cursor++;
      }
      index++;
    }
  });

  const text = textNodesWithPosition.map((c) => c.text).join("");
  for (const match of text.matchAll(searchTerm)) {
    const start = match.index;
    const end = match.index + match[0].length;

    // Gets all matching nodes that have either the start or end of the
    // search term in them. This adds support for multi line regex searches.
    const nodes = textNodesWithPosition.filter((node) => {
      const nodeStart = node.start;
      const nodeEnd = node.end;
      return (
        (start >= nodeStart && start < nodeEnd) ||
        (end >= nodeStart && end < nodeEnd)
      );
    });

    if (!nodes.length) continue;
    const endNode = nodes[nodes.length - 1];
    const startNode = nodes[0];
    results.push({
      // reposition our RegExp match index relative to the actual node.
      from: start + (startNode.startPos - startNode.start),
      to: end + (endNode.endPos - endNode.end)
    });
  }

  const { from: selectedFrom, to: selectedTo } = tr.selection;
  for (let i = 0; i < results.length; i++) {
    const { from, to } = results[i];
    if (
      // if a result is already selected, persist it
      (selectedFrom === from && to === selectedTo) ||
      // otherwise select the first matching result after the selection
      from >= selectedFrom
    ) {
      selectedIndex = i;
      break;
    }
  }

  return {
    startIndex: selectedIndex || 0,
    decorationSet: DecorationSet.create(
      doc,
      resultsToDecorations(results, searchResultClass, selectedIndex)
    ),
    results
  };
}

function resultsToDecorations(
  results: Result[],
  searchResultClass: string,
  selectedIndex?: number
) {
  const decorations: Decoration[] = [];
  for (let i = 0; i < results.length; i++) {
    const { from, to } = results[i];
    const resultClass =
      i === selectedIndex ? `${searchResultClass} selected` : searchResultClass;
    decorations.push(Decoration.inline(from, to, { class: resultClass }));
  }
  return decorations;
}

const replaceAll = (
  replaceTerm: string,
  results: Result[],
  tr: Transaction
) => {
  if (!results.length) return;

  const map = tr.mapping;
  for (let i = 0; i < results.length; i += 1) {
    const { from, to } = results[i];

    tr.insertText(replaceTerm, from, to);

    if (i + 1 < results.length) {
      const { from, to } = results[i + 1];
      results[i + 1] = {
        from: map.map(from),
        to: map.map(to)
      };
    }
  }
  return tr;
};

export const SearchReplace = Extension.create<SearchOptions, SearchStorage>({
  name: "searchreplace",

  addOptions() {
    return {
      searchResultClass: "search-result",
      onStartSearch: () => false,
      onEndSearch: () => false
    };
  },

  addStorage() {
    return {
      selectedIndex: 0,
      results: [],
      selectedText: undefined
    };
  },

  addCommands() {
    return {
      startSearch:
        () =>
        ({ state, commands }) => {
          const term = !state.selection.empty
            ? state.doc.textBetween(
                state.selection.$from.pos,
                state.selection.$to.pos
              )
            : undefined;
          if (term) commands.search(term);

          return this.options.onStartSearch(term);
        },
      endSearch:
        () =>
        ({ state, dispatch }) => {
          this.storage.results = [];
          this.storage.selectedIndex = 0;
          state.tr.setMeta("selectedIndex", 0);
          state.tr.setMeta("isSearching", false);
          if (dispatch) updateView(state, dispatch);
          return this.options.onEndSearch();
        },
      search:
        (term, options?: SearchSettings) =>
        ({ state, dispatch }) => {
          state.tr.setMeta("isSearching", true);
          state.tr.setMeta("searchTerm", term);
          state.tr.setMeta("enableRegex", options?.enableRegex);
          state.tr.setMeta("matchCase", options?.matchCase);
          state.tr.setMeta("matchWholeWord", options?.matchWholeWord);

          if (dispatch) updateView(state, dispatch);
          return true;
        },
      moveToNextResult:
        () =>
        ({ state, dispatch }) => {
          const { selectedIndex, results } = this.storage;
          if (!results || results.length <= 0) return false;

          let nextIndex = selectedIndex + 1;
          if (isNaN(nextIndex) || nextIndex >= results.length) nextIndex = 0;

          const { tr } = state;
          const { from, to } = results[nextIndex];
          tr.setSelection(
            TextSelection.create(
              tr.doc,
              tr.mapping.map(from),
              tr.mapping.map(to)
            )
          );
          scrollIntoView();

          this.storage.selectedIndex = nextIndex;
          tr.setMeta("selectedIndex", nextIndex);
          if (dispatch) updateView(state, dispatch);
          return true;
        },
      moveToPreviousResult:
        () =>
        ({ state, dispatch }) => {
          const { selectedIndex, results } = this.storage;
          if (!results || results.length <= 0) return false;

          let prevIndex = selectedIndex - 1;
          if (isNaN(prevIndex) || prevIndex < 0) prevIndex = results.length - 1;

          const { tr } = state;
          const { from, to } = results[prevIndex];
          tr.setSelection(
            TextSelection.create(
              tr.doc,
              tr.mapping.map(from),
              tr.mapping.map(to)
            )
          );
          scrollIntoView();

          this.storage.selectedIndex = prevIndex;
          tr.setMeta("selectedIndex", prevIndex);
          if (dispatch) updateView(state, dispatch);

          return true;
        },
      replace:
        (term) =>
        ({ chain, tr, dispatch }) => {
          const { selectedIndex, results } = this.storage;

          if (!dispatch || !results || results.length <= 0) return false;

          const index = selectedIndex === undefined ? 0 : selectedIndex;
          const { from, to } = results[index];

          tr.insertText(term, from, to);
          return chain().moveToNextResult().run();
        },
      replaceAll:
        (term) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          const { results } = this.storage;
          if (!dispatch || !results || results.length <= 0) return false;

          dispatch(replaceAll(term, results, tr));
          return true;
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-f": ({ editor }) => editor.commands.startSearch(),
      Escape: ({ editor }) => editor.commands.endSearch()
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("searchreplace");

    return [
      new Plugin<
        SearchSettings & {
          searchTerm: string;
          results: DecorationSet;
          isSearching: boolean;
          selectedIndex: number;
        }
      >({
        key,
        state: {
          init() {
            return {
              results: DecorationSet.empty,
              searchTerm: "",
              isSearching: false,
              enableRegex: false,
              matchCase: false,
              matchWholeWord: false,
              selectedIndex: 0
            };
          },
          apply: (tr, value) => {
            const { docChanged } = tr;
            const isSearching = tr.getMeta("isSearching") ?? value.isSearching;
            if (!isSearching)
              return {
                ...value,
                isSearching: false,
                results: DecorationSet.empty
              };

            const searchTerm = tr.getMeta("searchTerm") ?? value.searchTerm;
            const enableRegex = tr.getMeta("enableRegex") ?? value.enableRegex;
            const matchCase = tr.getMeta("matchCase") ?? value.matchCase;
            const matchWholeWord =
              tr.getMeta("matchWholeWord") ?? value.matchWholeWord;
            const selectedIndex =
              tr.getMeta("selectedIndex") ?? value.selectedIndex;
            const shouldResearch =
              docChanged ||
              (isSearching !== value.isSearching && isSearching) ||
              searchTerm !== value.searchTerm ||
              matchCase !== value.matchCase ||
              matchWholeWord !== value.matchWholeWord ||
              enableRegex !== value.enableRegex;

            if (
              selectedIndex !== value.selectedIndex &&
              this.storage.results &&
              !shouldResearch
            ) {
              return {
                ...value,
                selectedIndex,
                results: DecorationSet.create(
                  tr.doc,
                  resultsToDecorations(
                    this.storage.results,
                    this.options.searchResultClass,
                    selectedIndex
                  )
                )
              };
            }

            if (shouldResearch) {
              const { searchResultClass } = this.options;

              const searchRegex = searchTerm
                ? regex(searchTerm, { enableRegex, matchCase, matchWholeWord })
                : undefined;
              const result = searchDocument(
                tr,
                searchResultClass,
                searchRegex,
                0 // TODO: first index should be relative to cursor position
              );
              const { decorationSet, results, startIndex } = result;
              this.storage.results = results;
              this.storage.selectedIndex = startIndex;

              return {
                selectedIndex,
                searchTerm,
                isSearching,
                results: decorationSet,
                enableRegex,
                matchCase,
                matchWholeWord
              };
            }

            return value;
          }
        },
        props: {
          decorations(state) {
            return key.getState(state).results;
          }
        }
      })
    ];
  }
});

function scrollIntoView() {
  setTimeout(() => {
    const domNode = document.querySelector(".search-result.selected");
    if (!(domNode instanceof HTMLElement)) return;

    domNode.scrollIntoView({
      behavior: "instant",
      block: "center"
    });
  });
}
