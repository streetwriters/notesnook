"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathInline = void 0;
const core_1 = require("@tiptap/core");
const prosemirror_inputrules_1 = require("prosemirror-inputrules");
const plugin_1 = require("./plugin");
exports.MathInline = core_1.Node.create({
    name: "mathInline",
    group: "inline math",
    content: "text*",
    inline: true,
    atom: true,
    code: true,
    parseHTML() {
        return [
            {
                tag: "span[class*='math-inline']", // important!,
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            (0, core_1.mergeAttributes)({ class: "math-inline math-node" }, HTMLAttributes),
            0,
        ];
    },
    addCommands() {
        return {
            insertMathInline: () => ({ state, dispatch, view }) => {
                return (0, plugin_1.insertMathNode)(this.type)(state, dispatch, view);
            },
        };
    },
    addProseMirrorPlugins() {
        const inputRulePlugin = (0, prosemirror_inputrules_1.inputRules)({
            rules: [(0, plugin_1.makeInlineMathInputRule)(plugin_1.REGEX_INLINE_MATH_DOLLARS, this.type)],
        });
        return [plugin_1.mathPlugin, inputRulePlugin];
    },
});
