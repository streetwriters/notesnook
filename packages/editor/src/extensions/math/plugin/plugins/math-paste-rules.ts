/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
  Schema
} from "prosemirror-model";

////////////////////////////////////////////////////////////

function getFirstMatch(
  root: Element,
  rules: ((root: Element) => false | string)[]
): false | string {
  for (const rule of rules) {
    const match: false | string = rule(root);
    if (match !== false) {
      return match;
    }
  }
  return false;
}

function makeTextFragment<S extends Schema>(text: string, schema: S): Fragment {
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
  const match = root.querySelector("img.mwe-math-fallback-image-inline[alt]");
  return match?.getAttribute("alt") ?? false;
}

/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_01(root: Element): false | string {
  const match = root.querySelector("math[alttext]");
  return match?.getAttribute("alttext") ?? false;
}

/**
 * Look for a child node that matches the following template:
 * <math xmlns="http://www.w3.org/1998/Math/MathML" alttext="...">
 */
function texFromMathML_02(root: Element): false | string {
  const match = root.querySelector(
    "math annotation[encoding='application/x-tex'"
  );
  return match?.textContent ?? false;
}

// /**
//  * Look for a child node that matches the following template:
//  * <script type="math/tex"></script>
//  */
// function texFromScriptTag(root: Element): false | string {
//   const match = root.querySelector("script[type*='math/tex']");
//   return match?.textContent ?? false;
// }

function matchWikipedia(root: Element): false | string {
  const match: false | string = getFirstMatch(root, [
    texFromMediaWikiFallbackImage,
    texFromMathML_01,
    texFromMathML_02
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
    const dl = p as HTMLDListElement;

    // <dl> must contain exactly one child
    if (dl.childElementCount !== 1) {
      return false;
    }
    const dd = dl.firstChild as Element;
    if (dd.tagName !== "DD") {
      return false;
    }

    // <dd> must contain exactly one child
    if (dd.childElementCount !== 1) {
      return false;
    }
    const mweElt = dd.firstChild as Element;
    if (!mweElt.classList.contains("mwe-math-element")) {
      return false;
    }

    // success!  proceed to `getContent` for further processing
    return null;
  },
  getContent<S extends Schema>(p: Node, schema: S): Fragment {
    // search the matched element for a TeX string
    const match: false | string = matchWikipedia(p as Element);
    // return a fragment representing the math node's children
    const texString: string = match || "\\text{\\color{red}(paste error)}";
    return makeTextFragment(texString, schema);
  }
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
    const span = p as HTMLSpanElement;
    if (!span.classList.contains("mwe-math-element")) {
      return false;
    }
    // success!  proceed to `getContent` for further processing
    return null;
  },
  getContent<S extends Schema>(p: Node, schema: S): Fragment {
    // search the matched element for a TeX string
    const match: false | string = matchWikipedia(p as Element);
    // return a fragment representing the math node's children
    const texString: string = match || "\\text{\\color{red}(paste error)}";
    return makeTextFragment(texString, schema);
  }
};

// -- MathJax ------------------------------------------- //

////////////////////////////////////////////////////////////

export const defaultInlineMathParseRules: ParseRule[] = [
  wikipediaInlineMathParseRule
];

export const defaultBlockMathParseRules: ParseRule[] = [
  wikipediaBlockMathParseRule
];
