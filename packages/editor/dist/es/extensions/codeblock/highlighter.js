import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { findChildren } from "@tiptap/core";
import { refractor } from "refractor/lib/core";
import { toCaretPosition, toCodeLines } from "./code-block";
function parseNodes(nodes, className = []) {
    return nodes.reduce((result, node) => {
        if (node.type === "comment" || node.type === "doctype")
            return result;
        const classes = [...className];
        if (node.type === "element" && node.properties)
            classes.push(...node.properties.className);
        // this is required so that even plain text is wrapped in a span
        // during highlighting. Without this, Prosemirror's selection acts
        // weird for the first highlighted node/span.
        else
            classes.push("token", "text");
        if (node.type === "element") {
            result.push(...parseNodes(node.children, classes));
        }
        else {
            result.push({ classes, text: node.value });
        }
        return result;
    }, []);
}
function getHighlightNodes(result) {
    return result.children || [];
}
function getLineDecoration(from, line, total, isActive) {
    const maxLength = String(total).length;
    const attributes = {
        class: `line-number ${isActive ? "active" : ""}`,
        "data-line": String(line).padEnd(maxLength, " "),
        autocapitalize: "none"
    };
    const spec = {
        line: line,
        active: isActive,
        total,
        from
    };
    return Decoration.inline(from, from + 1, attributes, spec);
}
function getDecorations({ doc, name, defaultLanguage, caretPosition }) {
    const decorations = [];
    const languages = refractor.listLanguages();
    findChildren(doc, (node) => node.type.name === name).forEach((block) => {
        const code = block.node.textContent;
        const lines = toCodeLines(code, block.pos);
        for (const line of lines || []) {
            const lineNumber = line.index + 1;
            const isActive = lineNumber === (caretPosition === null || caretPosition === void 0 ? void 0 : caretPosition.line) && line.from === (caretPosition === null || caretPosition === void 0 ? void 0 : caretPosition.from);
            const decoration = getLineDecoration(line.from, lineNumber, (lines === null || lines === void 0 ? void 0 : lines.length) || 0, isActive);
            decorations.push(decoration);
        }
        const language = block.node.attrs.language || defaultLanguage;
        const nodes = languages.includes(language)
            ? getHighlightNodes(refractor.highlight(code, language))
            : null;
        if (!nodes)
            return;
        let from = block.pos + 1;
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
    });
    return DecorationSet.create(doc, decorations);
}
export function HighlighterPlugin({ name, defaultLanguage }) {
    const key = new PluginKey("highlighter");
    return new Plugin({
        key,
        state: {
            init: (config, state) => {
                return getDecorations({
                    doc: state.doc,
                    name,
                    defaultLanguage
                });
            },
            apply: (transaction, decorationSet, oldState, newState) => {
                const oldNodeName = oldState.selection.$head.parent.type.name;
                const newNodeName = newState.selection.$head.parent.type.name;
                const oldNodes = findChildren(oldState.doc, (node) => node.type.name === name);
                const newNodes = findChildren(newState.doc, (node) => node.type.name === name);
                const position = toCaretPosition(newState.selection);
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
                        transaction.steps.some((step) => {
                            return (step.from !== undefined &&
                                step.to !== undefined &&
                                oldNodes.some((node) => {
                                    return (node.pos >= step.from &&
                                        node.pos + node.node.nodeSize <= step.to);
                                }));
                        }))) {
                    return getDecorations({
                        doc: transaction.doc,
                        name,
                        defaultLanguage,
                        caretPosition: position
                    });
                }
                decorationSet = getActiveLineDecorations(transaction.doc, decorationSet, position);
                return decorationSet.map(transaction.mapping, transaction.doc);
            }
        },
        props: {
            decorations(state) {
                return key.getState(state);
            }
        },
        appendTransaction: (transactions, prevState, nextState) => {
            const tr = nextState.tr;
            let modified = false;
            const docChanged = transactions.some((transaction) => transaction.docChanged);
            const selectionChanged = (nextState.selection.$from.parent.type.name === name ||
                prevState.selection.$from.parent.type.name === name) &&
                prevState.selection.$from.pos !== nextState.selection.$from.pos;
            findChildren(nextState.doc, (node) => node.type.name === name).forEach((block) => {
                var _a;
                const { node, pos } = block;
                const attributes = Object.assign({}, node.attrs);
                if (docChanged || !((_a = attributes.lines) === null || _a === void 0 ? void 0 : _a.length)) {
                    const lines = toCodeLines(node.textContent, pos);
                    attributes.lines = lines.slice();
                }
                if (selectionChanged) {
                    const position = toCaretPosition(nextState.selection, docChanged ? toCodeLines(node.textContent, pos) : undefined);
                    attributes.caretPosition = position;
                }
                if (docChanged || selectionChanged) {
                    tr.setNodeMarkup(pos, node.type, attributes);
                    modified = true;
                }
            });
            return modified ? tr : null;
        }
    });
}
/**
 * When `position` is undefined, all active line decorations
 * are reset (e.g. when you focus out of the code block).
 */
function getActiveLineDecorations(doc, decorations, position) {
    const lineDecorations = decorations.find(undefined, undefined, ({ line, active, from }) => {
        const isSame = position
            ? line === position.line && from === position.from
            : false;
        return isSame || active;
    });
    if (!lineDecorations.length)
        return decorations;
    // we have to clone because prosemirror operates in-place
    const cloned = lineDecorations.slice();
    // remove old line decorations which inclue the current line decoration
    // and the previous current line decoration. We'll replace these with
    // new decorations.
    decorations = decorations.remove(lineDecorations);
    const newDecorations = [];
    for (const decoration of cloned) {
        const { from, spec: { line, total } } = decoration;
        const isActive = line === (position === null || position === void 0 ? void 0 : position.line);
        const newDecoration = getLineDecoration(from, line, (position === null || position === void 0 ? void 0 : position.total) || total, isActive);
        newDecorations.push(newDecoration);
    }
    return decorations.add(doc, newDecorations);
}
function isAndroid() {
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
}
