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
import { constructUrl, FetchOptions } from "./fetch.js";
import { compare, calculate, SpecificityArray } from "specificity";
import { tokenize } from "./css-tokenizer.js";
import { stringify, parse, SelectorType } from "css-what";
import { safeQuerySelectorAll } from "./utils.js";

const SHORTHANDS = [
  "animation",
  "background",
  "border",
  "border-block-end",
  "border-block-start",
  "border-bottom",
  "border-color",
  "border-image",
  "border-inline-end",
  "border-inline-start",
  "border-left",
  "border-radius",
  "border-right",
  "border-style",
  "border-top",
  "border-width",
  "column-rule",
  "columns",
  "contain-intrinsic-size",
  "flex",
  "flex-flow",
  "font",
  "gap",
  "grid",
  "grid-area",
  "grid-column",
  "grid-row",
  "grid-template",
  "grid-gap",
  "list-style",
  "margin",
  "mask",
  "offset",
  "outline",
  "overflow",
  "padding",
  "place-content",
  "place-items",
  "place-self",
  "scroll-margin",
  "scroll-padding",
  "text-decoration",
  "text-emphasis",
  "transition"
];

export async function inlineStylesheets(options?: FetchOptions) {
  for (const sheet of document.styleSheets) {
    if (await skipStyleSheet(sheet, options)) continue;
  }
  await resolveImports(options);
}

async function resolveImports(options?: FetchOptions) {
  for (const sheet of document.styleSheets) {
    const rulesToDelete = [];
    if (await skipStyleSheet(sheet, options)) continue;

    for (let i = 0; i < sheet.cssRules.length; ++i) {
      const rule = sheet.cssRules.item(i);
      if (!rule) continue;

      if (rule.type === CSSRule.IMPORT_RULE) {
        const href = (rule as CSSImportRule).href;
        const result = await downloadStylesheet(href, options);
        if (result) {
          if (sheet.ownerNode) sheet.ownerNode.before(result);
          else document.head.appendChild(result);
          rulesToDelete.push(i);
        }
      }
    }

    for (const ruleIndex of rulesToDelete) sheet.deleteRule(ruleIndex);
  }
}

async function downloadStylesheet(href: string, options?: FetchOptions) {
  try {
    const style = document.createElement("style");
    const response = await fetch(constructUrl(href, options));
    if (!response.ok) return false;
    style.innerText = await response.text();
    style.setAttribute("href", href);
    return style;
  } catch (e) {
    console.error("Failed to inline stylesheet", href, e);
  }
}

type StyleableElement = HTMLElement | SVGElement;
type BaseStyle = {
  rule: CSSStyleDeclaration;
  href: URL | null;
};
type SpecifiedStyle = BaseStyle & {
  specificity: SpecificityArray;
};
type PseudoElementStyle = BaseStyle & {
  pseudoElement: string;
};
type CSSStyledElements = Map<StyleableElement, SpecifiedStyle[]>;
type CSSPseudoElements = Map<StyleableElement, PseudoElementStyle[]>;

export async function cacheStylesheets(documentStyles: CSSStyleDeclaration) {
  const styledElements: CSSStyledElements = new Map();
  const styledPseudoElements: CSSPseudoElements = new Map();

  for (const sheet of document.styleSheets) {
    if (await skipStyleSheet(sheet)) continue;
    let href = sheet.href || undefined;
    if (!href && sheet.ownerNode instanceof HTMLElement)
      href = sheet.ownerNode.getAttribute("href") || undefined;

    walkRules(
      sheet.cssRules,
      documentStyles,
      styledElements,
      styledPseudoElements,
      href
    );
  }

  return {
    getPseudo(element: StyleableElement, pseudoElement: string) {
      const styles = styledPseudoElements
        .get(element)
        ?.filter((s) => s.pseudoElement.includes(pseudoElement));
      if (!styles || !styles.length) return;

      return getElementStyles(element, styles, documentStyles);
    },
    get(element: StyleableElement) {
      const styles = styledElements.get(element);
      if (!styles) return;

      const allStyles = styles.sort((a, b) =>
        compare(a.specificity, b.specificity)
      );
      allStyles.push({
        rule: element.style,
        specificity: [0, 0, 0, 0],
        href: null
      });

      return getElementStyles(element, allStyles, documentStyles);
    }
  };
}

function walkRules(
  cssRules: CSSRuleList,
  documentStyles: CSSStyleDeclaration,
  styled: CSSStyledElements,
  pseudoElements: CSSPseudoElements,
  href?: string
) {
  for (const rule of cssRules) {
    if (rule instanceof CSSStyleRule) {
      if (isPseudoSelector(rule.selectorText)) {
        const selectors = parsePseudoSelector(rule.selectorText);

        for (const selector of selectors) {
          if (!selector || !selector.selector.trim()) continue;
          const elements = safeQuerySelectorAll(
            document,
            selector.selector
          ) as NodeListOf<StyleableElement>;

          for (const element of elements) {
            if (
              !(element instanceof HTMLElement) &&
              !(element instanceof SVGElement)
            )
              continue;

            const styles: PseudoElementStyle[] =
              pseudoElements.get(element) || [];
            pseudoElements.set(element, styles);

            styles.push({
              rule: rule.style,
              href: getBaseUrl(href),
              pseudoElement: selector.pseudoElement
            });
          }
        }
      }

      const elements = safeQuerySelectorAll(
        document,
        rule.selectorText
      ) as NodeListOf<StyleableElement>;

      for (const element of elements) {
        if (
          !(element instanceof HTMLElement) &&
          !(element instanceof SVGElement)
        )
          continue;

        const parts = rule.selectorText.split(",");
        const styles: SpecifiedStyle[] = styled.get(element) || [];
        styled.set(element, styles);

        for (const part of parts) {
          try {
            const specificity = calculate(part)[0];
            styles.push({
              specificity: specificity.specificityArray,
              rule: rule.style,
              href: getBaseUrl(href)
            });
            break;
          } catch (e) {
            console.error(e, href && getBaseUrl(href));
            // ignore
          }
        }
      }
    } else if (
      rule instanceof CSSMediaRule &&
      window.matchMedia(rule.conditionText).matches
    ) {
      walkRules(rule.cssRules, documentStyles, styled, pseudoElements, href);
    } else if (
      rule instanceof CSSSupportsRule &&
      CSS.supports(rule.conditionText)
    ) {
      walkRules(rule.cssRules, documentStyles, styled, pseudoElements, href);
    }
  }
}

function getElementStyles(
  element: StyleableElement,
  styles: BaseStyle[],
  documentStyles: CSSStyleDeclaration
) {
  const newStyles = newStyleDeclaration();
  const computedStyle = lazyComputedStyle(element);
  const overrides = ["display"];

  for (const style of styles) {
    for (const property of [...style.rule, ...SHORTHANDS]) {
      let value = style.rule.getPropertyValue(property);
      if (overrides.includes(property))
        value = computedStyle.style.getPropertyValue(property);

      if (value.trim()) {
        setStyle(
          newStyles,
          property,
          value,
          (variable) => {
            return (
              computedStyle.style.getPropertyValue(variable) ||
              documentStyles.getPropertyValue(variable)
            );
          },
          (url) => {
            console.log("resolving url", url, style.href);
            if (url.startsWith("data:") || !style.href) return url;
            console.log("resolving url", url, style.href.href);
            if (url.startsWith("/"))
              return new URL(`${style.href.origin}${url}`).href;

            return new URL(`${style.href.href}${url}`).href;
          },
          style.rule.getPropertyPriority(property)
        );
      }
    }
  }
  return newStyles;
}

function setStyle(
  target: CSSStyleDeclaration,
  property: string,
  value: string,
  get: (variable: string) => string,
  resolveUrl: (variable: string) => string,
  priority?: string
) {
  value = resolveCssVariables(value, get);
  value = resolveCssUrl(value, resolveUrl);

  target.setProperty(property, value, priority);
}

function newStyleDeclaration() {
  const sheet = new CSSStyleSheet();
  sheet.insertRule(".dummy{}");
  return (sheet.cssRules[0] as CSSStyleRule).style;
}

function lazyComputedStyle(element: StyleableElement) {
  let computedStyle: CSSStyleDeclaration | undefined;

  return Object.defineProperty({}, "style", {
    get: () => {
      if (!computedStyle) computedStyle = getComputedStyle(element);
      return computedStyle;
    }
  }) as { style: CSSStyleDeclaration };
}

async function skipStyleSheet(sheet: CSSStyleSheet, options?: FetchOptions) {
  try {
    sheet.cssRules.length;
  } catch (_e) {
    const node = sheet.ownerNode;
    if (sheet.href && node instanceof HTMLLinkElement) {
      const styleNode = await downloadStylesheet(node.href, options);
      if (styleNode) node.replaceWith(styleNode);
    }
    return true;
  }

  return sheet.media.mediaText
    .split(",")
    .map((t) => t.trim())
    .includes("print");
}

function resolveCssVariables(css: string, get: (variable: string) => string) {
  const tokens = tokenize(css);
  const finalTokens: string[] = [];
  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    if (token === "var") {
      const args = tokenize(tokens[++i].slice(1, -1));
      const [variable, operator, space, ...restArgs] = args;

      const value = get(variable);
      if (value) {
        finalTokens.push(value);
      } else if (operator && restArgs.length <= 1) {
        finalTokens.push(restArgs[0] || space);
      } else if (operator && restArgs.length === 2) {
        finalTokens.push(resolveCssVariables(restArgs.join(""), get));
      }
    } else if (token.startsWith("(") && token.endsWith(")")) {
      finalTokens.push("(", resolveCssVariables(token.slice(1, -1), get), ")");
    } else finalTokens.push(token);
  }
  return finalTokens.join("");
}

function resolveCssUrl(css: string, get: (url: string) => string) {
  const tokens = tokenize(css);
  const finalTokens: string[] = [];
  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    if (token === "url" && !tokens[i + 1].startsWith("(data")) {
      const url = tokens[++i].slice(2, -2);
      const resolvedUrl = get(url);
      if (resolvedUrl) {
        finalTokens.push(token);
        finalTokens.push('("');
        finalTokens.push(resolvedUrl);
        finalTokens.push('")');
      }
    } else finalTokens.push(token);
  }
  return finalTokens.join("");
}

function getBaseUrl(href?: string | null) {
  if (!href) return null;
  if (href.startsWith("/")) href = `${document.location.origin}${href}`;
  const url = new URL(href);
  const basepath = url.pathname.split("/").slice(0, -1).join("/");
  return new URL(`${url.origin}${basepath}/`);
}

function isPseudoSelector(text: string) {
  return (
    text.includes(":before") ||
    text.includes(":after") ||
    text.includes("::after") ||
    text.includes("::before")
  );
}

function parsePseudoSelector(selector: string) {
  const output = [];
  const selectors = parse(selector);
  for (const part of selectors) {
    const pseduoElementIndex = part.findIndex(
      (s) =>
        (s.type === SelectorType.Pseudo ||
          s.type === SelectorType.PseudoElement) &&
        (s.name === "after" || s.name === "before")
    );
    if (pseduoElementIndex <= -1) continue;

    output.push({
      selector: stringify([part.slice(0, pseduoElementIndex)]),
      pseudoElement: stringify([part.slice(pseduoElementIndex)])
    });
  }
  return output;
}
