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
import { createImage, FetchOptions } from "./fetch.js";
import { Filter } from "./types.js";
import { uid } from "./utils.js";

const SVGElements = [
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "title",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern"
].map((a) => a.toLowerCase());

const INVALID_ELEMENTS = ["script"].map((a) => a.toLowerCase());

type CloneProps = {
  filter?: Filter;
  root: boolean;
  vector: boolean;
  styles?: boolean;
  getElementStyles?: (element: HTMLElement) => CSSStyleDeclaration | undefined;
  getPseudoElementStyles?: (
    element: HTMLElement,
    pseudoElement: string
  ) => CSSStyleDeclaration | undefined;
  fetchOptions?: FetchOptions;
  images?: boolean;
};

export async function cloneNode(node: HTMLElement, options: CloneProps) {
  const { root, filter } = options;
  if (!root && filter && !filter(node)) return null;

  let clone = await makeNodeCopy(node, options);

  if (!clone) return null;
  clone = await cloneChildren(node, clone, options);

  const processed = processClone(node, clone, options);
  return processed;
}

function makeNodeCopy(original: HTMLElement, options?: CloneProps) {
  try {
    if (original instanceof HTMLCanvasElement && options?.images)
      return createImage(original.toDataURL(), options?.fetchOptions);

    if (!options?.images && original instanceof HTMLImageElement) return null;

    if (
      !options?.styles &&
      (original instanceof HTMLButtonElement ||
        original instanceof HTMLFormElement ||
        original instanceof HTMLSelectElement ||
        original instanceof HTMLInputElement ||
        original instanceof HTMLTextAreaElement)
    )
      return null;

    if (original.nodeType === Node.COMMENT_NODE) return null;

    if (isInvalidElement(original)) return null;

    if (original.nodeType !== Node.TEXT_NODE && !isSVGElement(original)) {
      const { display, width, height } = window.getComputedStyle(original);
      if (display === "none" || (width === "0px" && height === "0px"))
        return null;

      if (isCustomElement(original)) {
        const isInline = display.includes("inline");
        const element = document.createElement(isInline ? "span" : "div");
        for (const attribute of original.attributes) {
          element.setAttribute(attribute.name, attribute.value);
        }
        return element;
      }
    }

    return original.cloneNode(false) as HTMLElement;
  } catch (e) {
    console.error("Failed to clone element", e);
    return null;
  }
}

function isCustomElement(element: HTMLElement) {
  if (!element || !element.tagName) return false;
  return (
    !SVGElements.includes(element.tagName.toLowerCase()) &&
    element.tagName.includes("-")
  );
}

export function isSVGElement(element: HTMLElement) {
  if (!element || !element.tagName) return false;
  return SVGElements.includes(element.tagName.toLowerCase());
}

function isInvalidElement(element: HTMLElement) {
  if (!element || !element.tagName) return false;
  return INVALID_ELEMENTS.includes(element.tagName.toLowerCase());
}

async function cloneChildren(
  original: HTMLElement,
  clone: HTMLElement,
  options: CloneProps
) {
  const children = original.childNodes;
  if (children.length === 0) return clone;

  await cloneChildrenInOrder(clone, children, options);
  return clone;
}

async function cloneChildrenInOrder(
  parent: HTMLElement,
  childs: NodeListOf<ChildNode>,
  options: CloneProps
) {
  for (const node of childs) {
    const childClone = await cloneNode(node as HTMLElement, {
      ...options,
      root: false
    });
    if (childClone) parent.appendChild(childClone);
  }
}

function processClone(
  original: HTMLElement,
  clone: HTMLElement,
  options: CloneProps
) {
  if (!(clone instanceof Element)) return clone;

  // if (clone instanceof HTMLElement) removeAttributes(clone);

  if (options.styles) {
    copyStyle(original, clone, options);
    clonePseudoElements(original, clone, options);
  }
  fixRelativeUrl(clone);
  copyUserInput(original, clone);
  fixSvg(clone);
  return clone;
}

function fixRelativeUrl(node: HTMLElement) {
  const attributes = ["href", "src"];
  const baseUrl = window.location.href;
  for (const attribute of attributes) {
    const url = node.getAttribute(attribute);
    const relativeUrl = url?.startsWith("http") ? undefined : url;
    if (relativeUrl) {
      const absoluteUrl = new URL(relativeUrl, baseUrl).href;
      node.setAttribute(attribute, absoluteUrl);
    }
  }
}

function copyFont(source: CSSStyleDeclaration, target: CSSStyleDeclaration) {
  target.font = source.font;
  target.fontFamily = source.fontFamily;
  target.fontFeatureSettings = source.fontFeatureSettings;
  target.fontKerning = source.fontKerning;
  target.fontSize = source.fontSize;
  target.fontStretch = source.fontStretch;
  target.fontStyle = source.fontStyle;
  target.fontVariant = source.fontVariant;
  target.fontVariantCaps = source.fontVariantCaps;
  target.fontVariantEastAsian = source.fontVariantEastAsian;
  target.fontVariantLigatures = source.fontVariantLigatures;
  target.fontVariantNumeric = source.fontVariantNumeric;
  target.fontVariationSettings = source.fontVariationSettings;
  target.fontWeight = source.fontWeight;
}

function copyStyle(
  sourceElement: HTMLElement,
  targetElement: HTMLElement,
  options: CloneProps
) {
  const { getElementStyles } = options;
  const sourceComputedStyles =
    getElementStyles && getElementStyles(sourceElement);
  if (!sourceComputedStyles) return;

  targetElement.style.cssText = sourceComputedStyles.cssText;

  if (sourceElement.tagName.toLowerCase() === "body") {
    copyFont(getComputedStyle(sourceElement), targetElement.style);
  }

  const styles = targetElement.getAttribute("style");
  if (styles) targetElement.setAttribute("style", minifyStyles(styles));
}

function clonePseudoElements(
  original: HTMLElement,
  clone: HTMLElement,
  options: CloneProps
) {
  const { getPseudoElementStyles } = options;
  let hasPseudoElements = false;

  const styleElement = document.createElement("style");
  const className = `pseudo--${uid()}`;

  for (const element of [":before", ":after"]) {
    const style =
      (getPseudoElementStyles && getPseudoElementStyles(original, element)) ||
      getComputedStyle(original, element);

    if (!style.cssText) continue;

    const selector = `.${className}:${element} {
        ${style.cssText}
      }`;

    styleElement.appendChild(document.createTextNode(selector));
    hasPseudoElements = true;
  }

  if (hasPseudoElements) {
    clone.className = className;
    clone.appendChild(styleElement);
  }

  return hasPseudoElements;
}

function copyUserInput(original: HTMLElement, clone: HTMLElement) {
  if (
    original instanceof HTMLInputElement ||
    original instanceof HTMLTextAreaElement
  )
    clone.setAttribute("value", original.value);
}

function fixSvg(clone: Element) {
  if (!(clone instanceof SVGElement)) return;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // if (!(clone instanceof SVGRectElement)) return;
  ["width", "height"].forEach(function (attribute) {
    const value = clone.getAttribute(attribute);
    if (!value || !!clone.style.getPropertyValue(attribute)) return;

    clone.style.setProperty(attribute, value);
  });
}

function minifyStyles(text: string) {
  return text.replace(/(:?[:;])(:? +)/gm, (_full, sep) => {
    return sep;
  });
}
