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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBlockMathParseRules = exports.defaultInlineMathParseRules = exports.wikipediaInlineMathParseRule = exports.wikipediaBlockMathParseRule = void 0;
const prosemirror_model_1 = require("prosemirror-model");
////////////////////////////////////////////////////////////
function getFirstMatch(root, rules) {
    for (let rule of rules) {
        let match = rule(root);
        if (match !== false) {
            return match;
        }
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
    let match = root.querySelector("img.mwe-math-fallback-image-inline[alt]");
    return (_a = match === null || match === void 0 ? void 0 : match.getAttribute("alt")) !== null && _a !== void 0 ? _a : false;
}
/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_01(root) {
    var _a;
    let match = root.querySelector("math[alttext]");
    return (_a = match === null || match === void 0 ? void 0 : match.getAttribute("alttext")) !== null && _a !== void 0 ? _a : false;
}
/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_02(root) {
    var _a;
    let match = root.querySelector("math annotation[encoding='application/x-tex'");
    return (_a = match === null || match === void 0 ? void 0 : match.textContent) !== null && _a !== void 0 ? _a : false;
}
/**
 * Look for a child node that matches the following template:
 * <script type="math/tex"></script>
 */
function texFromScriptTag(root) {
    var _a;
    let match = root.querySelector("script[type*='math/tex']");
    return (_a = match === null || match === void 0 ? void 0 : match.textContent) !== null && _a !== void 0 ? _a : false;
}
function matchWikipedia(root) {
    let match = getFirstMatch(root, [
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
    getAttrs(p) {
        let dl = p;
        // <dl> must contain exactly one child
        if (dl.childElementCount !== 1) {
            return false;
        }
        let dd = dl.firstChild;
        if (dd.tagName !== "DD") {
            return false;
        }
        // <dd> must contain exactly one child
        if (dd.childElementCount !== 1) {
            return false;
        }
        let mweElt = dd.firstChild;
        if (!mweElt.classList.contains("mwe-math-element")) {
            return false;
        }
        // success!  proceed to `getContent` for further processing
        return null;
    },
    getContent(p, schema) {
        // search the matched element for a TeX string
        let match = matchWikipedia(p);
        // return a fragment representing the math node's children
        let texString = match || "\\text{\\color{red}(paste error)}";
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
    getAttrs(p) {
        let span = p;
        if (!span.classList.contains("mwe-math-element")) {
            return false;
        }
        // success!  proceed to `getContent` for further processing
        return null;
    },
    getContent(p, schema) {
        // search the matched element for a TeX string
        let match = matchWikipedia(p);
        // return a fragment representing the math node's children
        let texString = match || "\\text{\\color{red}(paste error)}";
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
