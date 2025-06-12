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

type CloneNodeOptions = {
  images?: boolean;
  styles?: boolean;
};

export function cloneNode(node: HTMLElement, options: CloneNodeOptions) {
  const clone = node.cloneNode(true) as HTMLElement;
  processNode(clone, options);
  return clone;
}

function processNode(node: HTMLElement, options: CloneNodeOptions) {
  try {
    if (!options.images && node instanceof HTMLImageElement) {
      node.remove();
      return;
    }

    if (
      !options.styles &&
      (node instanceof HTMLButtonElement ||
        node instanceof HTMLFormElement ||
        node instanceof HTMLSelectElement ||
        node instanceof HTMLInputElement ||
        node instanceof HTMLTextAreaElement)
    ) {
      node.remove();
      return;
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove();
      return;
    }

    if (isInvalidElement(node)) {
      node.remove();
      return;
    }

    if (node.nodeType !== Node.TEXT_NODE && !isSVGElement(node)) {
      const { display, width, height } = window.getComputedStyle(node);
      if (display === "none" || (width === "0px" && height === "0px")) {
        node.remove();
        return;
      }

      if (isCustomElement(node)) {
        const isInline = display.includes("inline");
        const element = document.createElement(isInline ? "span" : "div");
        for (const attribute of node.attributes) {
          element.setAttribute(attribute.name, attribute.value);
        }
        node.replaceWith(element);
      }
    }

    node.childNodes.forEach((child) =>
      processNode(child as HTMLElement, options)
    );
  } catch (e) {
    console.error("Failed to process node", e);
    return null;
  }
}

function isInvalidElement(element: HTMLElement) {
  if (!element || !element.tagName) return false;
  return INVALID_ELEMENTS.includes(element.tagName.toLowerCase());
}

export function isSVGElement(element: HTMLElement) {
  if (!element || !element.tagName) return false;
  return SVGElements.includes(element.tagName.toLowerCase());
}

function isCustomElement(element: HTMLElement) {
  if (!element || !element.tagName) return false;
  return (
    !SVGElements.includes(element.tagName.toLowerCase()) &&
    element.tagName.includes("-")
  );
}
