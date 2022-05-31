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
import { Node, textblockTypeInputRule, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection, } from "prosemirror-state";
import { findParentNodeClosestToPos, ReactNodeViewRenderer } from "../react";
import { CodeblockComponent } from "./component";
import { HighlighterPlugin } from "./highlighter";
import detectIndent from "detect-indent";
export var backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
export var tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;
var ZERO_WIDTH_SPACE = "\u200b";
var NEWLINE = "\n";
export var CodeBlock = Node.create({
    name: "codeblock",
    addOptions: function () {
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
    addAttributes: function () {
        var _this = this;
        return {
            lines: {
                default: [],
                rendered: false,
            },
            indentType: {
                default: "space",
                parseHTML: function (element) {
                    var indentType = element.dataset.indentType;
                    if (indentType)
                        return indentType;
                    return detectIndent(element.innerText).type;
                },
                renderHTML: function (attributes) {
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
                parseHTML: function (element) {
                    var indentLength = element.dataset.indentLength;
                    if (indentLength)
                        return indentLength;
                    return detectIndent(element.innerText).amount;
                },
                renderHTML: function (attributes) {
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
                parseHTML: function (element) {
                    var _a;
                    var languageClassPrefix = _this.options.languageClassPrefix;
                    var classNames = __spreadArray(__spreadArray([], __read((element.classList || [])), false), __read((((_a = element === null || element === void 0 ? void 0 : element.firstElementChild) === null || _a === void 0 ? void 0 : _a.classList) || [])), false);
                    var languages = classNames
                        .filter(function (className) { return className.startsWith(languageClassPrefix); })
                        .map(function (className) { return className.replace(languageClassPrefix, ""); });
                    var language = languages[0];
                    if (!language) {
                        return null;
                    }
                    return language;
                },
                renderHTML: function (attributes) {
                    if (!attributes.language) {
                        return {};
                    }
                    return {
                        class: "language-".concat(attributes.language),
                    };
                },
            },
        };
    },
    parseHTML: function () {
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
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "pre",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
            0,
        ];
    },
    addCommands: function () {
        var _this = this;
        return {
            setCodeBlock: function (attributes) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.setNode(_this.name, attributes);
                };
            },
            toggleCodeBlock: function (attributes) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.toggleNode(_this.name, "paragraph", attributes);
                };
            },
            changeCodeBlockIndentation: function (options) {
                return function (_a) {
                    var e_1, _b;
                    var editor = _a.editor, tr = _a.tr, commands = _a.commands;
                    var state = editor.state;
                    var selection = state.selection;
                    var $from = selection.$from;
                    if ($from.parent.type !== _this.type) {
                        return false;
                    }
                    var lines = $from.parent.attrs.lines;
                    try {
                        for (var lines_1 = __values(lines), lines_1_1 = lines_1.next(); !lines_1_1.done; lines_1_1 = lines_1.next()) {
                            var line = lines_1_1.value;
                            var text = line.text();
                            var whitespaceLength = text.length - text.trimStart().length;
                            if (!whitespaceLength)
                                continue;
                            var indentLength = whitespaceLength;
                            var indentToken = indent(options.type, indentLength);
                            tr.insertText(indentToken, tr.mapping.map(line.from), tr.mapping.map(line.from + whitespaceLength));
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (lines_1_1 && !lines_1_1.done && (_b = lines_1.return)) _b.call(lines_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    commands.updateAttributes(_this.type, {
                        indentType: options.type,
                        indentLength: options.length,
                    });
                    return true;
                };
            },
        };
    },
    addKeyboardShortcuts: function () {
        var _this = this;
        return {
            "Mod-Alt-c": function () { return _this.editor.commands.toggleCodeBlock(); },
            "Mod-a": function (_a) {
                var editor = _a.editor;
                var $anchor = _this.editor.state.selection.$anchor;
                if ($anchor.parent.type.name !== _this.name) {
                    return false;
                }
                var codeblock = findParentNodeClosestToPos($anchor, function (node) { return node.type.name === _this.type.name; });
                if (!codeblock)
                    return false;
                return editor.commands.setTextSelection({
                    from: codeblock.pos,
                    to: codeblock.pos + codeblock.node.nodeSize,
                });
            },
            // remove code block when at start of document or code block is empty
            Backspace: function () {
                var _a = _this.editor.state.selection, empty = _a.empty, $anchor = _a.$anchor;
                var isAtStart = $anchor.pos === 1;
                if (!empty || $anchor.parent.type.name !== _this.name) {
                    return false;
                }
                if (isAtStart || !$anchor.parent.textContent.length) {
                    return _this.editor.commands.clearNodes();
                }
                return false;
            },
            // exit node on triple enter
            Enter: function (_a) {
                var editor = _a.editor;
                var state = editor.state;
                var selection = state.selection;
                var $from = selection.$from, empty = selection.empty;
                if (!empty || $from.parent.type !== _this.type) {
                    return false;
                }
                var indentation = parseIndentation($from.parent);
                return ((_this.options.exitOnTripleEnter &&
                    exitOnTripleEnter(editor, $from)) ||
                    indentOnEnter(editor, $from, indentation));
            },
            // exit node on arrow up
            ArrowUp: function (_a) {
                var editor = _a.editor;
                if (!_this.options.exitOnArrowUp) {
                    return false;
                }
                var state = editor.state;
                var selection = state.selection;
                var $anchor = selection.$anchor, empty = selection.empty;
                if (!empty || $anchor.parent.type !== _this.type) {
                    return false;
                }
                var isAtStart = $anchor.pos === 1;
                if (!isAtStart) {
                    return false;
                }
                return editor.commands.insertContentAt(0, "<p></p>");
            },
            // exit node on arrow down
            ArrowDown: function (_a) {
                var editor = _a.editor;
                if (!_this.options.exitOnArrowDown) {
                    return false;
                }
                var state = editor.state;
                var selection = state.selection, doc = state.doc;
                var $from = selection.$from, empty = selection.empty;
                if (!empty || $from.parent.type !== _this.type) {
                    return false;
                }
                var isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
                if (!isAtEnd) {
                    return false;
                }
                var after = $from.after();
                if (after === undefined) {
                    return false;
                }
                var nodeAfter = doc.nodeAt(after);
                if (nodeAfter) {
                    editor.commands.setNodeSelection($from.before());
                    return false;
                }
                return editor.commands.exitCode();
            },
            "Shift-Tab": function (_a) {
                var editor = _a.editor;
                var state = editor.state;
                var selection = state.selection;
                var $from = selection.$from;
                if ($from.parent.type !== _this.type) {
                    return false;
                }
                var indentation = parseIndentation($from.parent);
                var indentToken = indent(indentation.type, indentation.length);
                var lines = $from.parent.attrs.lines;
                var selectedLines = getSelectedLines(lines, selection);
                return editor
                    .chain()
                    .command(function (_a) {
                    var tr = _a.tr;
                    return withSelection(tr, function (tr) {
                        var e_2, _a;
                        try {
                            for (var selectedLines_1 = __values(selectedLines), selectedLines_1_1 = selectedLines_1.next(); !selectedLines_1_1.done; selectedLines_1_1 = selectedLines_1.next()) {
                                var line = selectedLines_1_1.value;
                                if (line.text(indentToken.length) !== indentToken)
                                    continue;
                                tr.delete(tr.mapping.map(line.from), tr.mapping.map(line.from + indentation.length));
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (selectedLines_1_1 && !selectedLines_1_1.done && (_a = selectedLines_1.return)) _a.call(selectedLines_1);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    });
                })
                    .run();
            },
            Tab: function (_a) {
                var editor = _a.editor;
                var state = editor.state;
                var selection = state.selection;
                var $from = selection.$from;
                if ($from.parent.type !== _this.type) {
                    return false;
                }
                var lines = $from.parent.attrs.lines;
                var selectedLines = getSelectedLines(lines, selection);
                return editor
                    .chain()
                    .command(function (_a) {
                    var tr = _a.tr;
                    return withSelection(tr, function (tr) {
                        var e_3, _a;
                        var indentation = parseIndentation($from.parent);
                        var indentToken = indent(indentation.type, indentation.length);
                        if (selectedLines.length === 1)
                            return tr.insertText(indentToken, $from.pos);
                        try {
                            for (var selectedLines_2 = __values(selectedLines), selectedLines_2_1 = selectedLines_2.next(); !selectedLines_2_1.done; selectedLines_2_1 = selectedLines_2.next()) {
                                var line = selectedLines_2_1.value;
                                tr.insertText(indentToken, tr.mapping.map(line.from));
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (selectedLines_2_1 && !selectedLines_2_1.done && (_a = selectedLines_2.return)) _a.call(selectedLines_2);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                    });
                })
                    .run();
            },
        };
    },
    addInputRules: function () {
        return [
            textblockTypeInputRule({
                find: backtickInputRegex,
                type: this.type,
                getAttributes: function (match) { return ({
                    language: match[1],
                }); },
            }),
            textblockTypeInputRule({
                find: tildeInputRegex,
                type: this.type,
                getAttributes: function (match) { return ({
                    language: match[1],
                }); },
            }),
        ];
    },
    addProseMirrorPlugins: function () {
        var _this = this;
        return [
            // this plugin creates a code block for pasted content from VS Code
            // we can also detect the copied code language
            new Plugin({
                key: new PluginKey("codeBlockVSCodeHandler"),
                props: {
                    handlePaste: function (view, event) {
                        if (!event.clipboardData) {
                            return false;
                        }
                        // don’t create a new code block within code blocks
                        if (_this.editor.isActive(_this.type.name)) {
                            return false;
                        }
                        var text = event.clipboardData.getData("text/plain");
                        var vscode = event.clipboardData.getData("vscode-editor-data");
                        var vscodeData = vscode ? JSON.parse(vscode) : undefined;
                        var language = vscodeData === null || vscodeData === void 0 ? void 0 : vscodeData.mode;
                        if (!text || !language) {
                            return false;
                        }
                        var tr = view.state.tr;
                        // create an empty code block
                        tr.replaceSelectionWith(_this.type.create({ language: language }));
                        // put cursor inside the newly created code block
                        tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, tr.selection.from - 2))));
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
    addNodeView: function () {
        return ReactNodeViewRenderer(CodeblockComponent);
    },
});
export function toCaretPosition(lines, selection) {
    var e_4, _a;
    var $from = selection.$from, $to = selection.$to, $head = selection.$head;
    if ($from.parent.type.name !== CodeBlock.name)
        return;
    try {
        for (var lines_2 = __values(lines), lines_2_1 = lines_2.next(); !lines_2_1.done; lines_2_1 = lines_2.next()) {
            var line = lines_2_1.value;
            if ($head.pos >= line.from && $head.pos <= line.to) {
                var lineLength = line.length + 1;
                return {
                    line: line.index + 1,
                    column: lineLength - (line.to - $head.pos),
                    selected: $to.pos - $from.pos,
                    total: lines.length,
                };
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (lines_2_1 && !lines_2_1.done && (_a = lines_2.return)) _a.call(lines_2);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return;
}
export function getLines(node) {
    var lines = node.attrs.lines;
    return lines || [];
}
function exitOnTripleEnter(editor, $from) {
    var isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
    var endsWithDoubleNewline = $from.parent.textContent.endsWith("\n\n");
    if (!isAtEnd || !endsWithDoubleNewline) {
        return false;
    }
    return editor
        .chain()
        .command(function (_a) {
        var tr = _a.tr;
        tr.delete($from.pos - 2, $from.pos);
        return true;
    })
        .exitCode()
        .run();
}
function indentOnEnter(editor, $from, options) {
    var lines = $from.parent.attrs.lines;
    var currentLine = getLineAt(lines, $from.pos);
    if (!currentLine)
        return false;
    var text = editor.state.doc.textBetween(currentLine.from, currentLine.to);
    var indentLength = text.length - text.trimStart().length;
    var newline = "".concat(NEWLINE).concat(indent(options.type, indentLength));
    return editor.commands.insertContent(newline, {
        parseOptions: { preserveWhitespace: "full" },
    });
}
export function toCodeLines(code, pos) {
    var positions = [];
    var start = 0;
    var from = pos + 1;
    var index = 0;
    var _loop_1 = function () {
        var end = code.indexOf("\n", start);
        if (end <= -1)
            end = code.length;
        var lineLength = end - start;
        var to = from + lineLength;
        var lineStart = start;
        positions.push({
            index: index,
            length: lineLength,
            from: from,
            to: to,
            text: function (length) {
                return code.slice(lineStart, length ? lineStart + length : lineStart + lineLength);
            },
        });
        from = to + 1;
        start = end + 1;
        ++index;
    };
    while (start <= code.length) {
        _loop_1();
    }
    return positions;
}
function getSelectedLines(lines, selection) {
    var $from = selection.$from, $to = selection.$to;
    return lines.filter(function (line) {
        return inRange(line.from, $from.pos, $to.pos) ||
            inRange(line.to, $from.pos, $to.pos) ||
            inRange($from.pos, line.from, line.to);
    });
}
function parseIndentation(node) {
    var _a = node.attrs, indentType = _a.indentType, indentLength = _a.indentLength;
    return {
        type: indentType,
        length: parseInt(indentLength),
    };
}
function getLineAt(lines, pos) {
    return lines.find(function (line) { return pos >= line.from && pos <= line.to; });
}
function inRange(x, a, b) {
    return x >= a && x <= b;
}
function indent(type, length) {
    var char = type === "space" ? " " : "\t";
    return char.repeat(length);
}
/**
 * Persist selection between transaction steps
 */
function withSelection(tr, callback) {
    var _a = tr.selection, $anchor = _a.$anchor, $head = _a.$head;
    callback(tr);
    tr.setSelection(new TextSelection(tr.doc.resolve(tr.mapping.map($anchor.pos)), tr.doc.resolve(tr.mapping.map($head.pos))));
    return true;
}
