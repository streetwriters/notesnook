"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathBlock = void 0;
var core_1 = require("@tiptap/core");
var prosemirror_inputrules_1 = require("prosemirror-inputrules");
var plugin_1 = require("./plugin");
exports.MathBlock = core_1.Node.create({
    name: "mathBlock",
    group: "block math",
    content: "text*",
    atom: true,
    code: true,
    parseHTML: function () {
        return [
            {
                tag: "div[class*='math-display']", // important!
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return [
            "div",
            (0, core_1.mergeAttributes)({ class: "math-display math-node" }, HTMLAttributes),
            0,
        ];
    },
    addCommands: function () {
        var _this = this;
        return {
            insertMathBlock: function () {
                return function (_a) {
                    var state = _a.state, dispatch = _a.dispatch, view = _a.view;
                    return (0, plugin_1.insertMathNode)(_this.type)(state, dispatch, view);
                };
            },
        };
    },
    addProseMirrorPlugins: function () {
        var inputRulePlugin = (0, prosemirror_inputrules_1.inputRules)({
            rules: [(0, plugin_1.makeBlockMathInputRule)(plugin_1.REGEX_BLOCK_MATH_DOLLARS, this.type)],
        });
        return [inputRulePlugin];
    },
});
