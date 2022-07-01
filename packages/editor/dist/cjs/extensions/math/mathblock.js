"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathBlock = void 0;
const core_1 = require("@tiptap/core");
const prosemirror_inputrules_1 = require("prosemirror-inputrules");
const plugin_1 = require("./plugin");
exports.MathBlock = core_1.Node.create({
    name: "mathBlock",
    group: "block math",
    content: "text*",
    atom: true,
    code: true,
    parseHTML() {
        return [
            {
                tag: `div[class*='math-block']`, // important!
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            (0, core_1.mergeAttributes)({ class: "math-block math-node" }, HTMLAttributes),
            0,
        ];
    },
    addCommands() {
        return {
            insertMathBlock: () => ({ state, dispatch, view }) => {
                return (0, plugin_1.insertMathNode)(this.type)(state, dispatch, view);
            },
        };
    },
    addProseMirrorPlugins() {
        const inputRulePlugin = (0, prosemirror_inputrules_1.inputRules)({
            rules: [(0, plugin_1.makeBlockMathInputRule)(plugin_1.REGEX_BLOCK_MATH_DOLLARS, this.type)],
        });
        return [inputRulePlugin];
    },
});
