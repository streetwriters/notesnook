"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathInline = void 0;
var core_1 = require("@tiptap/core");
var prosemirror_inputrules_1 = require("prosemirror-inputrules");
var plugin_1 = require("./plugin");
exports.MathInline = core_1.Node.create({
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
            (0, core_1.mergeAttributes)({ class: "math-inline math-node" }, HTMLAttributes),
            0,
        ];
    },
    addCommands: function () {
        var _this = this;
        return {
            insertMathInline: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch, view = _a.view;
                    return (0, plugin_1.insertMathNode)(_this.type)(state, dispatch, view);
                };
            },
        };
    },
    addProseMirrorPlugins: function () {
        var inputRulePlugin = (0, prosemirror_inputrules_1.inputRules)({
            rules: [(0, plugin_1.makeInlineMathInputRule)(plugin_1.REGEX_INLINE_MATH_DOLLARS, this.type)],
        });
        return [plugin_1.mathPlugin, inputRulePlugin];
    },
});
