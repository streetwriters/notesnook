import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey, TextSelection, } from "prosemirror-state";
const updateView = (state, dispatch) => dispatch(state.tr);
const regex = (s, settings) => {
    const { enableRegex, matchCase, matchWholeWord } = settings;
    const boundary = matchWholeWord ? "\\b" : "";
    console.log(boundary);
    return RegExp(boundary +
        (enableRegex ? s : s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")) +
        boundary, matchCase ? "gu" : "gui");
};
function searchDocument(doc, searchResultClass, searchTerm) {
    if (!searchTerm)
        return { decorationSet: DecorationSet.empty, results: [] };
    const decorations = [];
    const results = [];
    let index = 0;
    let textNodesWithPosition = [];
    doc === null || doc === void 0 ? void 0 : doc.descendants((node, pos) => {
        if (node.isText) {
            if (textNodesWithPosition[index]) {
                textNodesWithPosition[index] = {
                    text: textNodesWithPosition[index].text + node.text,
                    pos: textNodesWithPosition[index].pos,
                };
            }
            else {
                textNodesWithPosition[index] = {
                    text: node.text || "",
                    pos,
                };
            }
        }
        else {
            index += 1;
        }
    });
    textNodesWithPosition = textNodesWithPosition.filter(Boolean);
    for (const { text, pos } of textNodesWithPosition) {
        const matches = text.matchAll(searchTerm);
        for (const m of matches) {
            if (m[0] === "")
                break;
            if (m.index !== undefined) {
                results.push({
                    from: pos + m.index,
                    to: pos + m.index + m[0].length,
                });
            }
        }
    }
    for (const { from, to } of results) {
        decorations.push(Decoration.inline(from, to, { class: searchResultClass }));
    }
    return {
        decorationSet: DecorationSet.create(doc, decorations),
        results,
    };
}
const replaceAll = (replaceTerm, results, tr) => {
    let offset = 0;
    if (!results.length)
        return;
    const map = tr.mapping;
    for (let i = 0; i < results.length; i += 1) {
        const { from, to } = results[i];
        tr.insertText(replaceTerm, from, to);
        if (i + 1 < results.length) {
            const { from, to } = results[i + 1];
            results[i + 1] = {
                from: map.map(from),
                to: map.map(to),
            };
        }
    }
    return tr;
};
export const SearchReplace = Extension.create({
    name: "searchreplace",
    addOptions() {
        return {
            searchResultClass: "search-result",
        };
    },
    addCommands() {
        return {
            startSearch: () => ({ state }) => {
                this.storage.isSearching = true;
                if (!state.selection.empty) {
                    this.storage.selectedText = state.doc.textBetween(state.selection.$from.pos, state.selection.$to.pos);
                }
                return true;
            },
            endSearch: () => ({ state, dispatch }) => {
                this.storage.isSearching = false;
                this.storage.searchTerm = "";
                updateView(state, dispatch);
                return true;
            },
            search: (term, options) => ({ state, dispatch }) => {
                this.storage.searchTerm = term;
                this.storage.enableRegex = (options === null || options === void 0 ? void 0 : options.enableRegex) || false;
                this.storage.matchCase = (options === null || options === void 0 ? void 0 : options.matchCase) || false;
                this.storage.matchWholeWord = (options === null || options === void 0 ? void 0 : options.matchWholeWord) || false;
                this.storage.results = [];
                updateView(state, dispatch);
                return true;
            },
            moveToNextResult: () => ({ chain }) => {
                const { selectedIndex, results } = this.storage;
                if (!results || results.length <= 0)
                    return false;
                let nextIndex = selectedIndex + 1;
                if (isNaN(nextIndex) || nextIndex >= results.length)
                    nextIndex = 0;
                const { from, to } = results[nextIndex];
                console.log("[moveToNextResult]", from, to);
                const result = chain()
                    .focus(undefined, { scrollIntoView: true })
                    .setTextSelection({ from, to })
                    .run();
                if (result)
                    this.storage.selectedIndex = nextIndex;
                return result;
            },
            moveToPreviousResult: () => ({ chain }) => {
                const { selectedIndex, results } = this.storage;
                if (!results || results.length <= 0)
                    return false;
                let prevIndex = selectedIndex - 1;
                if (isNaN(prevIndex) || prevIndex < 0)
                    prevIndex = results.length - 1;
                const { from, to } = results[prevIndex];
                const result = chain()
                    .focus(undefined, { scrollIntoView: true })
                    .setTextSelection({ from, to })
                    .run();
                if (result)
                    this.storage.selectedIndex = prevIndex;
                return result;
            },
            replace: (term) => ({ commands, tr, dispatch }) => {
                const { selectedIndex, results } = this.storage;
                if (!dispatch || !results || results.length <= 0)
                    return false;
                const index = selectedIndex === undefined ? 0 : selectedIndex;
                const { from, to } = results[index];
                tr.insertText(term, from, to);
                if (index + 1 < results.length) {
                    const { from, to } = results[index + 1];
                    const nextResult = (results[index + 1] = {
                        from: tr.mapping.map(from),
                        to: tr.mapping.map(to),
                    });
                    commands.focus();
                    tr.setSelection(new TextSelection(tr.doc.resolve(nextResult.from), tr.doc.resolve(nextResult.to)));
                }
                dispatch(tr);
                results.splice(index, 1);
                return true;
            },
            replaceAll: (term) => ({ state, tr, dispatch }) => {
                if (!dispatch)
                    return false;
                const { results } = this.storage;
                if (!dispatch || !results || results.length <= 0)
                    return false;
                dispatch(replaceAll(term, results, tr));
                return true;
            },
        };
    },
    addKeyboardShortcuts() {
        return {
            "Mod-f": ({ editor }) => editor.commands.startSearch(),
            Escape: ({ editor }) => editor.commands.endSearch(),
        };
    },
    addProseMirrorPlugins() {
        const key = new PluginKey("searchreplace");
        return [
            new Plugin({
                key,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply: ({ doc, docChanged, setSelection }) => {
                        const { searchTerm, enableRegex, matchCase, matchWholeWord } = this.storage;
                        const { searchResultClass } = this.options;
                        if (docChanged || searchTerm) {
                            const searchRegex = searchTerm
                                ? regex(searchTerm, { enableRegex, matchCase, matchWholeWord })
                                : undefined;
                            const { decorationSet, results } = searchDocument(doc, searchResultClass, searchRegex);
                            this.storage.results = results;
                            return decorationSet;
                        }
                        return DecorationSet.empty;
                    },
                },
                props: {
                    decorations(state) {
                        return key.getState(state);
                    },
                },
            }),
        ];
    },
});
