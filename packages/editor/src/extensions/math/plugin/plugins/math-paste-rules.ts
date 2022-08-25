/**
 * Note that for some of the `ParseRule`s defined below,
 * we define a `getAttrs` function, which, other than
 * defining node attributes, can be used to describe complex
 * match conditions for a rule.  
 
 * Returning `false` from `ParseRule.getAttrs` prevents the
 * rule from matching, while returning `null` indicates that
 * the default set of note attributes should be used.
 */

import {
  Node as ProseNode,
  Fragment,
  ParseRule,
  Schema,
  NodeType,
} from "prosemirror-model";

////////////////////////////////////////////////////////////

function getFirstMatch(
  root: Element,
  rules: ((root: Element) => false | string)[]
): false | string {
  for (let rule of rules) {
    let match: false | string = rule(root);
    if (match !== false) {
      return match;
    }
  }
  return false;
}

function makeTextFragment<S extends Schema<any, any>>(
  text: string,
  schema: S
): Fragment {
  return Fragment.from(schema.text(text) as ProseNode);
}

////////////////////////////////////////////////////////////

// -- Wikipedia ----------------------------------------- //

/**
 * Look for a child node that matches the following template:
 * <img src="https://wikimedia.org/api/rest_v1/media/math/render/svg/..."
 *              class="mwe-math-fallback-image-inline"
 *              alt="..." />
 */
function texFromMediaWikiFallbackImage(root: Element): false | string {
  let match = root.querySelector("img.mwe-math-fallback-image-inline[alt]");
  return match?.getAttribute("alt") ?? false;
}

/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_01(root: Element): false | string {
  let match = root.querySelector("math[alttext]");
  return match?.getAttribute("alttext") ?? false;
}

/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_02(root: Element): false | string {
  let match = root.querySelector(
    "math annotation[encoding='application/x-tex'"
  );
  return match?.textContent ?? false;
}

/**
 * Look for a child node that matches the following template:
 * <script type="math/tex"></script>
 */
function texFromScriptTag(root: Element): false | string {
  let match = root.querySelector("script[type*='math/tex']");
  return match?.textContent ?? false;
}

function matchWikipedia(root: Element): false | string {
  let match: false | string = getFirstMatch(root, [
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
export const wikipediaBlockMathParseRule: ParseRule = {
  tag: "dl",
  getAttrs(p: Node | string): false | null {
    let dl = p as HTMLDListElement;

    // <dl> must contain exactly one child
    if (dl.childElementCount !== 1) {
      return false;
    }
    let dd = dl.firstChild as Element;
    if (dd.tagName !== "DD") {
      return false;
    }

    // <dd> must contain exactly one child
    if (dd.childElementCount !== 1) {
      return false;
    }
    let mweElt = dd.firstChild as Element;
    if (!mweElt.classList.contains("mwe-math-element")) {
      return false;
    }

    // success!  proceed to `getContent` for further processing
    return null;
  },
  getContent<S extends Schema<any, any>>(p: Node, schema: S): Fragment {
    // search the matched element for a TeX string
    let match: false | string = matchWikipedia(p as Element);
    // return a fragment representing the math node's children
    let texString: string = match || "\\text{\\color{red}(paste error)}";
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
export const wikipediaInlineMathParseRule: ParseRule = {
  tag: "span",
  getAttrs(p: Node | string): false | null {
    let span = p as HTMLSpanElement;
    if (!span.classList.contains("mwe-math-element")) {
      return false;
    }
    // success!  proceed to `getContent` for further processing
    return null;
  },
  getContent<S extends Schema<any, any>>(p: Node, schema: S): Fragment {
    // search the matched element for a TeX string
    let match: false | string = matchWikipedia(p as Element);
    // return a fragment representing the math node's children
    let texString: string = match || "\\text{\\color{red}(paste error)}";
    return makeTextFragment(texString, schema);
  },
};

// -- MathJax ------------------------------------------- //

////////////////////////////////////////////////////////////

export const defaultInlineMathParseRules: ParseRule[] = [
  wikipediaInlineMathParseRule,
];

export const defaultBlockMathParseRules: ParseRule[] = [
  wikipediaBlockMathParseRule,
];
