var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { findChildren } from "@tiptap/core";
import { refractor } from "refractor/lib/core";
import { getLines, toCaretPosition, toCodeLines, } from "./code-block";
function parseNodes(nodes, className) {
    if (className === void 0) { className = []; }
    return nodes.reduce(function (result, node) {
        if (node.type === "comment" || node.type === "doctype")
            return result;
        var classes = __spreadArray([], __read(className), false);
        if (node.type === "element" && node.properties)
            classes.push.apply(classes, __spreadArray([], __read(node.properties.className), false));
        else
            classes.push("token", "text");
        if (node.type === "element") {
            result.push.apply(result, __spreadArray([], __read(parseNodes(node.children, classes)), false));
        }
        else {
            result.push({ classes: classes, text: node.value });
        }
        return result;
    }, []);
}
function getHighlightNodes(result) {
    return result.children || [];
}
function getLineDecoration(from, line, total, isActive) {
    var attributes = {
        class: "line-number ".concat(isActive ? "active" : ""),
        "data-line": String(line).padEnd(String(total).length, " "),
    };
    var spec = {
        line: line,
        active: isActive,
        total: total,
    };
    // Prosemirror has a selection issue with the widget decoration
    // on the first line. To work around that we use inline decoration
    // for the first line.
    if (line === 1) {
        return Decoration.inline(from, from + 1, attributes, spec);
    }
    return Decoration.widget(from, function () {
        var element = document.createElement("span");
        element.classList.add("line-number-widget");
        if (isActive)
            element.classList.add("active");
        element.innerHTML = attributes["data-line"];
        return element;
    }, __assign(__assign({}, spec), { key: "".concat(line, "-").concat(isActive ? "active" : "inactive") }));
}
function getDecorations(_a) {
    var doc = _a.doc, name = _a.name, defaultLanguage = _a.defaultLanguage, currentLine = _a.currentLine;
    var decorations = [];
    var languages = refractor.listLanguages();
    findChildren(doc, function (node) { return node.type.name === name; }).forEach(function (block) {
        var e_1, _a;
        var code = block.node.textContent;
        var lines = block.node.attrs.lines;
        try {
            for (var _b = __values(lines || []), _c = _b.next(); !_c.done; _c = _b.next()) {
                var line = _c.value;
                var lineNumber = line.index + 1;
                var isActive = lineNumber === currentLine;
                var decoration = getLineDecoration(line.from, lineNumber, (lines === null || lines === void 0 ? void 0 : lines.length) || 0, isActive);
                decorations.push(decoration);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var language = block.node.attrs.language || defaultLanguage;
        var nodes = languages.includes(language)
            ? getHighlightNodes(refractor.highlight(code, language))
            : null;
        if (!nodes)
            return;
        var from = block.pos + 1;
        parseNodes(nodes).forEach(function (node) {
            var to = from + node.text.length;
            if (node.classes.length) {
                var decoration = Decoration.inline(from, to, {
                    class: node.classes.join(" "),
                });
                decorations.push(decoration);
            }
            from = to;
        });
    });
    return DecorationSet.create(doc, decorations);
}
export function HighlighterPlugin(_a) {
    var name = _a.name, defaultLanguage = _a.defaultLanguage;
    return new Plugin({
        key: new PluginKey("highlighter"),
        state: {
            init: function () {
                return DecorationSet.empty;
            },
            apply: function (transaction, decorationSet, oldState, newState) {
                var oldNodeName = oldState.selection.$head.parent.type.name;
                var newNodeName = newState.selection.$head.parent.type.name;
                var oldNodes = findChildren(oldState.doc, function (node) { return node.type.name === name; });
                var newNodes = findChildren(newState.doc, function (node) { return node.type.name === name; });
                var position = toCaretPosition(getLines(newState.selection.$head.parent), newState.selection);
                if (transaction.docChanged &&
                    // Apply decorations if:
                    // selection includes named node,
                    ([oldNodeName, newNodeName].includes(name) ||
                        // OR transaction adds/removes named node,
                        newNodes.length !== oldNodes.length ||
                        // OR transaction has changes that completely encapsulte a node
                        // (for example, a transaction that affects the entire document).
                        // Such transactions can happen during collab syncing via y-prosemirror, for example.
                        transaction.steps.some(function (step) {
                            return (step.from !== undefined &&
                                step.to !== undefined &&
                                oldNodes.some(function (node) {
                                    return (node.pos >= step.from &&
                                        node.pos + node.node.nodeSize <= step.to);
                                }));
                        }))) {
                    return getDecorations({
                        doc: transaction.doc,
                        name: name,
                        defaultLanguage: defaultLanguage,
                        currentLine: position === null || position === void 0 ? void 0 : position.line,
                    });
                }
                decorationSet = getActiveLineDecorations(transaction.doc, decorationSet, position);
                return decorationSet.map(transaction.mapping, transaction.doc);
            },
        },
        props: {
            decorations: function (state) {
                return this.getState(state);
            },
        },
        appendTransaction: function (transactions, _prevState, nextState) {
            var tr = nextState.tr;
            var modified = false;
            if (transactions.some(function (transaction) { return transaction.docChanged; })) {
                findChildren(nextState.doc, function (node) { return node.type.name === name; }).forEach(function (block) {
                    var node = block.node, pos = block.pos;
                    var lines = toCodeLines(node.textContent, pos);
                    tr.setNodeMarkup(pos, undefined, __assign(__assign({}, node.attrs), { lines: lines }));
                    modified = true;
                });
            }
            return modified ? tr : null;
        },
    });
}
/**
 * When `position` is undefined, all active line decorations
 * are reset (e.g. when you focus out of the code block).
 */
function getActiveLineDecorations(doc, decorations, position) {
    var e_2, _a;
    var lineDecorations = decorations.find(undefined, undefined, function (_a) {
        var line = _a.line, active = _a.active;
        return (position && line === position.line) || active;
    });
    if (!lineDecorations.length)
        return decorations;
    // we have to clone because prosemirror operates in-place
    var cloned = lineDecorations.slice();
    // remove old line decorations which inclue the current line decoration
    // and the previous current line decoration. We'll replace these with
    // new decorations.
    decorations = decorations.remove(lineDecorations);
    var newDecorations = [];
    try {
        for (var cloned_1 = __values(cloned), cloned_1_1 = cloned_1.next(); !cloned_1_1.done; cloned_1_1 = cloned_1.next()) {
            var decoration = cloned_1_1.value;
            var from = decoration.from, _b = decoration.spec, line = _b.line, total = _b.total;
            var isActive = line === (position === null || position === void 0 ? void 0 : position.line);
            var newDecoration = getLineDecoration(from, line, (position === null || position === void 0 ? void 0 : position.total) || total, isActive);
            newDecorations.push(newDecoration);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (cloned_1_1 && !cloned_1_1.done && (_a = cloned_1.return)) _a.call(cloned_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return decorations.add(doc, newDecorations);
}
