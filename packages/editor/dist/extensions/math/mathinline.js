import { Node, mergeAttributes } from "@tiptap/core";
import { inputRules } from "prosemirror-inputrules";
import { makeInlineMathInputRule, REGEX_INLINE_MATH_DOLLARS, mathPlugin, } from "./plugin";
export var MathInline = Node.create({
    name: "math_inline",
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
    addProseMirrorPlugins: function () {
        var inputRulePlugin = inputRules({
            rules: [makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, this.type)],
        });
        return [mathPlugin, inputRulePlugin];
    },
});
