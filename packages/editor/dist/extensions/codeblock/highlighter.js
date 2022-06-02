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
import { toCaretPosition, toCodeLines, } from "./code-block";
function parseNodes(nodes, className) {
    if (className === void 0) { className = []; }
    return nodes.reduce(function (result, node) {
        if (node.type === "comment" || node.type === "doctype")
            return result;
        var classes = __spreadArray([], __read(className), false);
        if (node.type === "element" && node.properties)
            classes.push.apply(classes, __spreadArray([], __read(node.properties.className), false));
        // this is required so that even plain text is wrapped in a span
        // during highlighting. Without this, Prosemirror's selection acts
        // weird for the first highlighted node/span.
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
    var maxLength = String(total).length;
    var attributes = {
        class: "line-number ".concat(isActive ? "active" : ""),
        "data-line": String(line).padEnd(maxLength, " "),
    };
    var spec = {
        line: line,
        active: isActive,
        total: total,
        from: from,
    };
    // Prosemirror has a selection issue with the widget decoration
    // on the first line. To work around that we use inline decoration
    // for the first line.
    if (line === 1 ||
        // Android Composition API (aka the virtual keyboard) doesn't behave well
        // with Decoration widgets so we have to resort to inline line numbers.
        isAndroid()) {
        return Decoration.inline(from, from + 1, attributes, spec);
    }
    return Decoration.widget(from, function () {
        var element = document.createElement("span");
        element.classList.add("line-number-widget");
        if (isActive)
            element.classList.add("active");
        element.innerHTML = attributes["data-line"];
        return element;
    }, __assign(__assign({}, spec), { 
        // should rerender when any of these change:
        // 1. line number
        // 2. line active state
        // 3. the max length of all lines
        key: "".concat(line, "-").concat(isActive ? "active" : "", "-").concat(maxLength) }));
}
function getDecorations(_a) {
    var doc = _a.doc, name = _a.name, defaultLanguage = _a.defaultLanguage, caretPosition = _a.caretPosition;
    var decorations = [];
    var languages = refractor.listLanguages();
    findChildren(doc, function (node) { return node.type.name === name; }).forEach(function (block) {
        var e_1, _a;
        var code = block.node.textContent;
        var lines = toCodeLines(code, block.pos);
        try {
            for (var _b = __values(lines || []), _c = _b.next(); !_c.done; _c = _b.next()) {
                var line = _c.value;
                var lineNumber = line.index + 1;
                var isActive = lineNumber === (caretPosition === null || caretPosition === void 0 ? void 0 : caretPosition.line) && line.from === (caretPosition === null || caretPosition === void 0 ? void 0 : caretPosition.from);
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
    var key = new PluginKey("highlighter");
    return new Plugin({
        key: key,
        state: {
            init: function () {
                return DecorationSet.empty;
            },
            apply: function (transaction, decorationSet, oldState, newState) {
                var oldNodeName = oldState.selection.$head.parent.type.name;
                var newNodeName = newState.selection.$head.parent.type.name;
                var oldNodes = findChildren(oldState.doc, function (node) { return node.type.name === name; });
                var newNodes = findChildren(newState.doc, function (node) { return node.type.name === name; });
                var position = toCaretPosition(newState.selection);
                // const isDocChanged =
                //   transaction.docChanged &&
                //   // TODO
                //   !transaction.steps.every((step) => step instanceof ReplaceAroundStep);
                // console.log("Selection", transaction.docChanged, isDocChanged);
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
                        caretPosition: position,
                    });
                }
                decorationSet = getActiveLineDecorations(transaction.doc, decorationSet, position);
                return decorationSet.map(transaction.mapping, transaction.doc);
            },
        },
        props: {
            decorations: function (state) {
                return key.getState(state);
            },
        },
        appendTransaction: function (transactions, prevState, nextState) {
            var tr = nextState.tr;
            var modified = false;
            var docChanged = transactions.some(function (transaction) { return transaction.docChanged; });
            var selectionChanged = (nextState.selection.$from.parent.type.name === name ||
                prevState.selection.$from.parent.type.name === name) &&
                prevState.selection.$from.pos !== nextState.selection.$from.pos;
            findChildren(nextState.doc, function (node) { return node.type.name === name; }).forEach(function (block) {
                var node = block.node, pos = block.pos;
                var attributes = __assign({}, node.attrs);
                if (docChanged) {
                    var lines = toCodeLines(node.textContent, pos);
                    attributes.lines = lines.slice();
                }
                if (selectionChanged) {
                    var position = toCaretPosition(nextState.selection, docChanged ? toCodeLines(node.textContent, pos) : undefined);
                    attributes.caretPosition = position;
                }
                if (docChanged || selectionChanged) {
                    tr.setNodeMarkup(pos, node.type, attributes);
                    modified = true;
                }
            });
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
        var line = _a.line, active = _a.active, from = _a.from;
        var isSame = position
            ? line === position.line && from === position.from
            : false;
        return isSame || active;
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
function isAndroid() {
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
}
