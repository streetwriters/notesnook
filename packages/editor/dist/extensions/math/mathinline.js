import { Node, mergeAttributes } from "@tiptap/core";
import { inputRules } from "prosemirror-inputrules";
import { makeInlineMathInputRule, REGEX_INLINE_MATH_DOLLARS, mathPlugin, insertMathNode, } from "./plugin";
export var MathInline = Node.create({
    name: "mathInline",
    group: "inline math",
    content: "text*",
    inline: true,
    atom: true,
    code: true,
    parseHTML: function () {
        return [
            {
                tag: "span[class*='math-inline']", // important!,
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "span",
            mergeAttributes({ class: "math-inline math-node" }, HTMLAttributes),
            0,
        ];
    },
    addCommands: function () {
        var _this = this;
        return {
            insertMathInline: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch, view = _a.view;
                    return insertMathNode(_this.type)(state, dispatch, view);
                };
            },
        };
    },
    addProseMirrorPlugins: function () {
        var inputRulePlugin = inputRules({
            rules: [makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, this.type)],
        });
        return [mathPlugin, inputRulePlugin];
    },
});
