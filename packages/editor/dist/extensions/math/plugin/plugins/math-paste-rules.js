"use strict";
/**
 * Note that for some of the `ParseRule`s defined below,
 * we define a `getAttrs` function, which, other than
 * defining node attributes, can be used to describe complex
 * match conditions for a rule.
 
 * Returning `false` from `ParseRule.getAttrs` prevents the
 * rule from matching, while returning `null` indicates that
 * the default set of note attributes should be used.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBlockMathParseRules = exports.defaultInlineMathParseRules = exports.wikipediaInlineMathParseRule = exports.wikipediaBlockMathParseRule = void 0;
var prosemirror_model_1 = require("prosemirror-model");
////////////////////////////////////////////////////////////
function getFirstMatch(root, rules) {
    var e_1, _a;
    try {
        for (var rules_1 = __values(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
            var rule = rules_1_1.value;
            var match = rule(root);
            if (match !== false) {
                return match;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
}
function makeTextFragment(text, schema) {
    return prosemirror_model_1.Fragment.from(schema.text(text));
}
////////////////////////////////////////////////////////////
// -- Wikipedia ----------------------------------------- //
/**
 * Look for a child node that matches the following template:
 * <img src="https://wikimedia.org/api/rest_v1/media/math/render/svg/..."
 *              class="mwe-math-fallback-image-inline"
 *              alt="..." />
 */
function texFromMediaWikiFallbackImage(root) {
    var _a;
    var match = root.querySelector("img.mwe-math-fallback-image-inline[alt]");
    return (_a = match === null || match === void 0 ? void 0 : match.getAttribute("alt")) !== null && _a !== void 0 ? _a : false;
}
/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_01(root) {
    var _a;
    var match = root.querySelector("math[alttext]");
    return (_a = match === null || match === void 0 ? void 0 : match.getAttribute("alttext")) !== null && _a !== void 0 ? _a : false;
}
/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_02(root) {
    var _a;
    var match = root.querySelector("math annotation[encoding='application/x-tex'");
    return (_a = match === null || match === void 0 ? void 0 : match.textContent) !== null && _a !== void 0 ? _a : false;
}
/**
 * Look for a child node that matches the following template:
 * <script type="math/tex"></script>
 */
function texFromScriptTag(root) {
    var _a;
    var match = root.querySelector("script[type*='math/tex']");
    return (_a = match === null || match === void 0 ? void 0 : match.textContent) !== null && _a !== void 0 ? _a : false;
}
function matchWikipedia(root) {
    var match = getFirstMatch(root, [
        texFromMediaWikiFallbackImage,
        texFromMathML_01,
        texFromMathML_02,
    ]);
    // TODO: if no tex string was found, but we have MathML, try to parse it
    return match;
}
/**
 * Wikipedia formats block math inside a <dl>...</dl> element, as below.
 *
 *   - Evidently no CSS class is used to distinguish inline vs block math
 *   - Sometimes the `\displaystyle` TeX command is present even in inline math
 *
 * ```html
 * <dl><dd><span class="mwe-math-element">
 *     <span class="mwe-math-mathml-inline mwe-math-mathml-ally" style="...">
 *         <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 *             <semantics>
 *                 <mrow class="MJX-TeXAtom-ORD">...</mrow>
 *                 <annotation encoding="application/x-tex">...</annotation>
 *             </semantics>
 *         </math>
 *         <img src="https://wikimedia.org/api/rest_v1/media/math/render/svg/..."
 *              class="mwe-math-fallback-image-inline"
 *              alt="..." />
 *     </span>
 * </span></dd></dl>
 * ```
 */
exports.wikipediaBlockMathParseRule = {
    tag: "dl",
    getAttrs: function (p) {
        var dl = p;
        // <dl> must contain exactly one child
        if (dl.childElementCount !== 1) {
            return false;
        }
        var dd = dl.firstChild;
        if (dd.tagName !== "DD") {
            return false;
        }
        // <dd> must contain exactly one child
        if (dd.childElementCount !== 1) {
            return false;
        }
        var mweElt = dd.firstChild;
        if (!mweElt.classList.contains("mwe-math-element")) {
            return false;
        }
        // success!  proceed to `getContent` for further processing
        return null;
    },
    getContent: function (p, schema) {
        // search the matched element for a TeX string
        var match = matchWikipedia(p);
        // return a fragment representing the math node's children
        var texString = match || "\\text{\\color{red}(paste error)}";
        return makeTextFragment(texString, schema);
    },
};
/**
 * Parse rule for inline math content on Wikipedia of the following form:
 *
 * ```html
 * <span class="mwe-math-element">
 *     <span class="mwe-math-mathml-inline mwe-math-mathml-ally" style="...">
 *         <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 *             <semantics>
 *                 <mrow class="MJX-TeXAtom-ORD">...</mrow>
 *                 <annotation encoding="application/x-tex">...</annotation>
 *             </semantics>
 *         </math>
 *         <img src="https://wikimedia.org/api/rest_v1/media/math/render/svg/..."
 *              class="mwe-math-fallback-image-inline"
 *              alt="..." />
 *     </span>
 * </span>
 * ```
 */
exports.wikipediaInlineMathParseRule = {
    tag: "span",
    getAttrs: function (p) {
        var span = p;
        if (!span.classList.contains("mwe-math-element")) {
            return false;
        }
        // success!  proceed to `getContent` for further processing
        return null;
    },
    getContent: function (p, schema) {
        // search the matched element for a TeX string
        var match = matchWikipedia(p);
        // return a fragment representing the math node's children
        var texString = match || "\\text{\\color{red}(paste error)}";
        return makeTextFragment(texString, schema);
    },
};
// -- MathJax ------------------------------------------- //
////////////////////////////////////////////////////////////
exports.defaultInlineMathParseRules = [
    exports.wikipediaInlineMathParseRule,
];
exports.defaultBlockMathParseRules = [
    exports.wikipediaBlockMathParseRule,
];
