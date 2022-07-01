/**
 * Note that for some of the `ParseRule`s defined below,
 * we define a `getAttrs` function, which, other than
 * defining node attributes, can be used to describe complex
 * match conditions for a rule.
 
 * Returning `false` from `ParseRule.getAttrs` prevents the
 * rule from matching, while returning `null` indicates that
 * the default set of note attributes should be used.
 */
import { ParseRule } from "prosemirror-model";
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
export declare const wikipediaBlockMathParseRule: ParseRule;
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
export declare const wikipediaInlineMathParseRule: ParseRule;
export declare const defaultInlineMathParseRules: ParseRule[];
export declare const defaultBlockMathParseRules: ParseRule[];
