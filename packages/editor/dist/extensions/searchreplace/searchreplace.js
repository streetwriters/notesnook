var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey, TextSelection, } from "prosemirror-state";
var updateView = function (state, dispatch) { return dispatch(state.tr); };
var regex = function (s, settings) {
    var enableRegex = settings.enableRegex, matchCase = settings.matchCase, matchWholeWord = settings.matchWholeWord;
    var boundary = matchWholeWord ? "\\b" : "";
    console.log(boundary);
    return RegExp(boundary +
        (enableRegex ? s : s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")) +
        boundary, matchCase ? "gu" : "gui");
};
function searchDocument(doc, searchResultClass, searchTerm) {
    var e_1, _a, e_2, _b, e_3, _c;
    if (!searchTerm)
        return { decorationSet: DecorationSet.empty, results: [] };
    var decorations = [];
    var results = [];
    var index = 0;
    var textNodesWithPosition = [];
    doc === null || doc === void 0 ? void 0 : doc.descendants(function (node, pos) {
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
                    pos: pos,
                };
            }
        }
        else {
            index += 1;
        }
    });
    textNodesWithPosition = textNodesWithPosition.filter(Boolean);
    try {
        for (var textNodesWithPosition_1 = __values(textNodesWithPosition), textNodesWithPosition_1_1 = textNodesWithPosition_1.next(); !textNodesWithPosition_1_1.done; textNodesWithPosition_1_1 = textNodesWithPosition_1.next()) {
            var _d = textNodesWithPosition_1_1.value, text = _d.text, pos = _d.pos;
            var matches = text.matchAll(searchTerm);
            try {
                for (var matches_1 = (e_2 = void 0, __values(matches)), matches_1_1 = matches_1.next(); !matches_1_1.done; matches_1_1 = matches_1.next()) {
                    var m = matches_1_1.value;
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
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (matches_1_1 && !matches_1_1.done && (_b = matches_1.return)) _b.call(matches_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (textNodesWithPosition_1_1 && !textNodesWithPosition_1_1.done && (_a = textNodesWithPosition_1.return)) _a.call(textNodesWithPosition_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        for (var results_1 = __values(results), results_1_1 = results_1.next(); !results_1_1.done; results_1_1 = results_1.next()) {
            var _e = results_1_1.value, from = _e.from, to = _e.to;
            decorations.push(Decoration.inline(from, to, { class: searchResultClass }));
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (results_1_1 && !results_1_1.done && (_c = results_1.return)) _c.call(results_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return {
        decorationSet: DecorationSet.create(doc, decorations),
        results: results,
    };
}
var replaceAll = function (replaceTerm, results, tr) {
    var offset = 0;
    if (!results.length)
        return;
    var map = tr.mapping;
    for (var i = 0; i < results.length; i += 1) {
        var _a = results[i], from = _a.from, to = _a.to;
        tr.insertText(replaceTerm, from, to);
        if (i + 1 < results.length) {
            var _b = results[i + 1], from_1 = _b.from, to_1 = _b.to;
            results[i + 1] = {
                from: map.map(from_1),
                to: map.map(to_1),
            };
        }
    }
    return tr;
};
export var SearchReplace = Extension.create({
    name: "searchreplace",
    addOptions: function () {
        return {
            searchResultClass: "search-result",
        };
    },
    addCommands: function () {
        var _this = this;
        return {
            startSearch: function () {
                return function (_a) {
                    var state = _a.state;
                    _this.storage.isSearching = true;
                    if (!state.selection.empty) {
                        _this.storage.selectedText = state.doc.textBetween(state.selection.$from.pos, state.selection.$to.pos);
                    }
                    return true;
                };
            },
            endSearch: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    _this.storage.isSearching = false;
                    _this.storage.searchTerm = "";
                    updateView(state, dispatch);
                    return true;
                };
            },
            search: function (term, options) {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch;
                    _this.storage.searchTerm = term;
                    _this.storage.enableRegex = (options === null || options === void 0 ? void 0 : options.enableRegex) || false;
                    _this.storage.matchCase = (options === null || options === void 0 ? void 0 : options.matchCase) || false;
                    _this.storage.matchWholeWord = (options === null || options === void 0 ? void 0 : options.matchWholeWord) || false;
                    updateView(state, dispatch);
                    return true;
                };
            },
            moveToNextResult: function () {
                return function (_a) {
                    var chain = _a.chain;
                    var _b = _this.storage, selectedIndex = _b.selectedIndex, results = _b.results;
                    if (results.length <= 0)
                        return false;
                    var nextIndex = selectedIndex + 1;
                    if (isNaN(nextIndex) || nextIndex >= results.length)
                        nextIndex = 0;
                    var _c = results[nextIndex], from = _c.from, to = _c.to;
                    console.log("[moveToNextResult]", from, to);
                    var result = chain()
                        .focus(undefined, { scrollIntoView: true })
                        .setTextSelection({ from: from, to: to })
                        .run();
                    if (result)
                        _this.storage.selectedIndex = nextIndex;
                    return result;
                };
            },
            moveToPreviousResult: function () {
                return function (_a) {
                    var chain = _a.chain;
                    var _b = _this.storage, selectedIndex = _b.selectedIndex, results = _b.results;
                    if (results.length <= 0)
                        return false;
                    var prevIndex = selectedIndex - 1;
                    if (isNaN(prevIndex) || prevIndex < 0)
                        prevIndex = results.length - 1;
                    var _c = results[prevIndex], from = _c.from, to = _c.to;
                    var result = chain()
                        .focus(undefined, { scrollIntoView: true })
                        .setTextSelection({ from: from, to: to })
                        .run();
                    if (result)
                        _this.storage.selectedIndex = prevIndex;
                    return result;
                };
            },
            replace: function (term) {
                return function (_a) {
                    var commands = _a.commands, tr = _a.tr, dispatch = _a.dispatch;
                    var _b = _this.storage, selectedIndex = _b.selectedIndex, results = _b.results;
                    if (!dispatch || results.length <= 0)
                        return false;
                    var index = selectedIndex === undefined ? 0 : selectedIndex;
                    var _c = results[index], from = _c.from, to = _c.to;
                    tr.insertText(term, from, to);
                    if (index + 1 < results.length) {
                        var _d = results[index + 1], from_2 = _d.from, to_2 = _d.to;
                        var nextResult = (results[index + 1] = {
                            from: tr.mapping.map(from_2),
                            to: tr.mapping.map(to_2),
                        });
                        commands.focus();
                        tr.setSelection(new TextSelection(tr.doc.resolve(nextResult.from), tr.doc.resolve(nextResult.to)));
                    }
                    dispatch(tr);
                    results.splice(index, 1);
                    return true;
                };
            },
            replaceAll: function (term) {
                return function (_a) {
                    var state = _a.state, tr = _a.tr, dispatch = _a.dispatch;
                    if (!dispatch)
                        return false;
                    var _b = _this.storage, selectedIndex = _b.selectedIndex, results = _b.results;
                    dispatch(replaceAll(term, results, tr));
                    return true;
                };
            },
        };
    },
    addKeyboardShortcuts: function () {
        return {
            "Mod-f": function (_a) {
                var editor = _a.editor;
                return editor.commands.startSearch();
            },
            Escape: function (_a) {
                var editor = _a.editor;
                return editor.commands.endSearch();
            },
        };
    },
    addProseMirrorPlugins: function () {
        var _this = this;
        var key = new PluginKey("searchreplace");
        return [
            new Plugin({
                key: key,
                state: {
                    init: function () {
                        return DecorationSet.empty;
                    },
                    apply: function (_a) {
                        var doc = _a.doc, docChanged = _a.docChanged, setSelection = _a.setSelection;
                        var _b = _this.storage, searchTerm = _b.searchTerm, enableRegex = _b.enableRegex, matchCase = _b.matchCase, matchWholeWord = _b.matchWholeWord;
                        var searchResultClass = _this.options.searchResultClass;
                        if (docChanged || searchTerm) {
                            var searchRegex = searchTerm
                                ? regex(searchTerm, { enableRegex: enableRegex, matchCase: matchCase, matchWholeWord: matchWholeWord })
                                : undefined;
                            var _c = searchDocument(doc, searchResultClass, searchRegex), decorationSet = _c.decorationSet, results = _c.results;
                            _this.storage.results = results;
                            return decorationSet;
                        }
                        return DecorationSet.empty;
                    },
                },
                props: {
                    decorations: function (state) {
                        return key.getState(state);
                    },
                },
            }),
        ];
    },
});
