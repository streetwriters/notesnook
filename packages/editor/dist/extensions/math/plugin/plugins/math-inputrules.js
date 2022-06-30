"use strict";
/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeBlockMathInputRule = exports.makeInlineMathInputRule = exports.REGEX_BLOCK_MATH_DOLLARS = exports.REGEX_INLINE_MATH_DOLLARS_ESCAPED = exports.REGEX_INLINE_MATH_DOLLARS = void 0;
var prosemirror_inputrules_1 = require("prosemirror-inputrules");
var prosemirror_state_1 = require("prosemirror-state");
////////////////////////////////////////////////////////////
// ---- Inline Input Rules ------------------------------ //
// simple input rule for inline math
exports.REGEX_INLINE_MATH_DOLLARS = /\$\$(.+)\$\$/; //new RegExp("\$(.+)\$", "i");
// negative lookbehind regex notation allows for escaped \$ delimiters
// (requires browser supporting ECMA2018 standard -- currently only Chrome / FF)
// (see https://javascript.info/regexp-lookahead-lookbehind)
exports.REGEX_INLINE_MATH_DOLLARS_ESCAPED = (function () {
    // attempt to create regex with negative lookbehind
    try {
        return new RegExp("(?<!\\\\)\\$(.+)(?<!\\\\)\\$");
    }
    catch (e) {
        return exports.REGEX_INLINE_MATH_DOLLARS;
    }
})();
// ---- Block Input Rules ------------------------------- //
// simple inputrule for block math
exports.REGEX_BLOCK_MATH_DOLLARS = /\$\$\$\s+$/; //new RegExp("\$\$\s+$", "i");
////////////////////////////////////////////////////////////
function makeInlineMathInputRule(pattern, nodeType, getAttrs) {
    return new prosemirror_inputrules_1.InputRule(pattern, function (state, match, start, end) {
        var $start = state.doc.resolve(start);
        var index = $start.index();
        var $end = state.doc.resolve(end);
        // get attrs
        var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
        // check if replacement valid
        if (!$start.parent.canReplaceWith(index, $end.index(), nodeType)) {
            return null;
        }
        // perform replacement
        return state.tr.replaceRangeWith(start, end, nodeType.create(attrs, nodeType.schema.text(match[1])));
    });
}
exports.makeInlineMathInputRule = makeInlineMathInputRule;
function makeBlockMathInputRule(pattern, nodeType, getAttrs) {
    return new prosemirror_inputrules_1.InputRule(pattern, function (state, match, start, end) {
        var $start = state.doc.resolve(start);
        var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
        if (!$start
            .node(-1)
            .canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType))
            return null;
        var tr = state.tr
            .delete(start, end)
            .setBlockType(start, start, nodeType, attrs);
        return tr.setSelection(prosemirror_state_1.NodeSelection.create(tr.doc, tr.mapping.map($start.pos - 1)));
    });
}
exports.makeBlockMathInputRule = makeBlockMathInputRule;
