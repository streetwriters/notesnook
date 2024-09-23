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
import { cloneNode, isSVGElement } from "./clone.js";
import { createImage, FetchOptions } from "./fetch.js";
import { resolveAll } from "./fontfaces.js";
import { inlineAllImages } from "./images.js";
import { Options } from "./types.js";
import { canvasToBlob, delay, escapeXhtml, height, width } from "./utils.js";
import { cacheStylesheets, inlineStylesheets } from "./styles.js";

// Default impl options
const defaultOptions: Options = {
  inlineOptions: {}
};

async function getInlinedNode(node: HTMLElement, options: Options) {
  const { fonts, images, stylesheets, inlineImages } =
    options.inlineOptions || {};

  if (stylesheets) await inlineStylesheets(options.fetchOptions);

  const documentStyles = getComputedStyle(document.documentElement);

  const styleCache = stylesheets
    ? await cacheStylesheets(documentStyles)
    : undefined;

  let clone = await cloneNode(node, {
    styles: options.styles,
    filter: options.filter,
    root: true,
    vector: !options.raster,
    fetchOptions: options.fetchOptions,
    getElementStyles: styleCache?.get,
    getPseudoElementStyles: styleCache?.getPseudo,
    images: images
  });

  if (!clone || clone instanceof Text) return;

  if (fonts) clone = await embedFonts(clone, options.fetchOptions);

  if (inlineImages) await inlineAllImages(clone, options.fetchOptions);

  finalize(clone);
  return clone;
}

async function toSvg(node: HTMLElement, options: Options) {
  options.inlineOptions = {
    fonts: true,
    images: true,
    stylesheets: true,
    ...options.inlineOptions
  };

  let clone = await getInlinedNode(node, options);
  if (!clone) return;

  clone = applyOptions(clone, options);

  return makeSvgDataUri(
    clone,
    options.width || width(node),
    options.height || height(node)
  );
}

function applyOptions(clone: HTMLElement, options: Options) {
  if (options.backgroundColor)
    clone.style.backgroundColor = options.backgroundColor;
  if (options.width) clone.style.width = options.width + "px";
  if (options.height) clone.style.height = options.height + "px";

  return clone;
}

function toPixelData(node: HTMLElement, options: Options) {
  options = options || {};
  options.raster = true;
  return draw(node, options).then(function (canvas) {
    return canvas
      ?.getContext("2d")
      ?.getImageData(0, 0, width(node), height(node)).data;
  });
}

function toPng(node: HTMLElement, options: Options) {
  options.raster = true;
  return draw(node, options).then(function (canvas) {
    return canvas?.toDataURL();
  });
}

function toJpeg(node: HTMLElement, options: Options) {
  options.raster = true;
  return draw(node, options).then(function (canvas) {
    return canvas?.toDataURL("image/jpeg", options.quality || 1.0);
  });
}

function toBlob(node: HTMLElement, options: Options) {
  options.raster = true;
  return draw(node, options).then((canvas) => canvas && canvasToBlob(canvas));
}

function toCanvas(node: HTMLElement, options: Options) {
  options.raster = true;
  return draw(node, options);
}

function draw(domNode: HTMLElement, options: Options) {
  options = { ...defaultOptions, ...options };
  return toSvg(domNode, options)
    .then((uri) => (uri ? createImage(uri, options.fetchOptions) : null))
    .then(delay(0))
    .then(function (image) {
      const scale = typeof options.scale !== "number" ? 1 : options.scale;
      const canvas = newCanvas(domNode, scale, options);
      const ctx = canvas?.getContext("2d");
      if (!ctx) return null;
      //   ctx.mozImageSmoothingEnabled = false;
      //   ctx.msImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      if (image) {
        ctx.scale(scale, scale);
        ctx.drawImage(image, 0, 0);
      }
      return canvas;
    });
}

function newCanvas(node: HTMLElement, scale: number, options: Options) {
  const canvas = document.createElement("canvas");
  canvas.width = (options.width || width(node)) * scale;
  canvas.height = (options.height || height(node)) * scale;

  if (options.backgroundColor) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

function embedFonts(node: HTMLElement, options?: FetchOptions) {
  return resolveAll(options).then(function (cssText) {
    const styleNode = document.createElement("style");
    node.appendChild(styleNode);
    styleNode.appendChild(document.createTextNode(cssText));
    return node;
  });
}

function makeSvgDataUri(node: HTMLElement, width: number, height: number) {
  node.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const xhtml = escapeXhtml(new XMLSerializer().serializeToString(node));
  const foreignObject =
    '<foreignObject x="0" y="0" width="100%" height="100%">' +
    xhtml +
    "</foreignObject>";

  const svgStr =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    width +
    '" height="' +
    height +
    '">' +
    foreignObject +
    "</svg>";

  return "data:image/svg+xml;charset=utf-8," + svgStr;
}

export { toJpeg, toBlob, toCanvas, toPixelData, toPng, toSvg, getInlinedNode };

const VALID_ATTRIBUTES = [
  "src",
  "href",
  "title",
  "style",
  "srcset",
  "sizes",
  "width",
  "height",
  "target",
  "rel"
];

function finalize(root: HTMLElement) {
  for (const element of root.querySelectorAll("*")) {
    if (!(element instanceof HTMLElement) || isSVGElement(element)) continue;
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name === "class" && element.className.includes("pseudo--"))
        continue;

      if (!VALID_ATTRIBUTES.includes(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element instanceof HTMLAnchorElement) {
      element.href = element.href.startsWith("http")
        ? element.href
        : document.location.origin + element.href;
    }
  }
}
