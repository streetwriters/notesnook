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
import { resolveAll } from "./fontfaces.js";
import { inlineAllImages } from "./images.js";
import { Options } from "./types.js";
import { canvasToBlob, delay, height, width, isSVGElement } from "./utils.js";
import { cloneNode } from "./clone.js";

// Default impl options
const defaultOptions: Options = {
  inlineOptions: {}
};

async function getInlinedNode(node: HTMLElement, options: Options) {
  const { fonts, images, stylesheets, inlineImages } =
    options.inlineOptions || {};

  let clone = cloneNode(node, {
    images,
    styles: stylesheets
  });

  if (!clone || clone instanceof Text) return;

  if (fonts) clone = await embedFonts(clone, options.fetchOptions);

  if (inlineImages) await inlineAllImages(clone, options.fetchOptions);

  finalize(clone);
  return clone;
}

function toPng(body: HTMLElement, head: HTMLHeadElement, options: Options) {
  options.raster = true;
  return draw(body, head, options).then(function (canvas) {
    return canvas?.toDataURL();
  });
}

async function toJpeg(
  body: HTMLElement,
  head: HTMLHeadElement,
  options: Options
) {
  options.raster = true;

  return draw(body, head, options).then((canvas) =>
    canvas?.toDataURL("image/jpeg", options.quality || 1.0)
  );
}

function toBlob(body: HTMLElement, head: HTMLHeadElement, options: Options) {
  options.raster = true;
  return draw(body, head, options).then(
    (canvas) => canvas && canvasToBlob(canvas)
  );
}

function toSvg(body: HTMLElement, head: HTMLHeadElement, options: Options) {
  return makeSvg(
    body,
    head,
    options.width || width(body),
    options.height || height(body)
  );
}

async function draw(
  body: HTMLElement,
  head: HTMLHeadElement,
  options: Options
) {
  options = { ...defaultOptions, ...options };
  const uri = makeSvgDataUri(
    makeSvg(
      body,
      head,
      options.width || width(body),
      options.height || height(body)
    )
  );

  return createImage(uri, options.fetchOptions)
    .then(delay(0))
    .then(function (image) {
      if (!image) return null;

      image.setAttribute("crossorigin", "anonymous");

      const scale = typeof options.scale !== "number" ? 1 : options.scale;
      const canvas = newCanvas(body, scale, options);
      const ctx = canvas?.getContext("2d");
      if (!ctx) return null;
      //   ctx.mozImageSmoothingEnabled = false;
      //   ctx.msImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      ctx.scale(scale, scale);
      ctx.drawImage(image as HTMLImageElement, 0, 0);
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

function makeSvg(
  body: HTMLElement,
  head: HTMLHeadElement,
  width: number,
  height: number
) {
  body.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  /**
   * We're removing all attributes that contain non-word characters
   * Sometimes a webpage could have invalid html and that causes attribute names to break
   * HTML is resilient to this but SVG is not and will throw an error, so we remove these attributes altogether
   */
  for (const element of body.querySelectorAll("img, svg, video, iframe")) {
    const attributes = element.getAttributeNames();
    for (const attribute of attributes) {
      if (attribute.match(/\W/)) {
        element.removeAttribute(attribute);
      }
    }
  }

  const xhtml = new XMLSerializer().serializeToString(body);

  const xstyles = Array.from(head.getElementsByTagName("style"))
    .map((s) => new XMLSerializer().serializeToString(s))
    .join("\n");

  const foreignObject =
    '<foreignObject x="0" y="0" width="100%" height="100%">' +
    xhtml +
    "</foreignObject>";

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    width +
    '" height="' +
    height +
    '">' +
    xstyles +
    foreignObject +
    "</svg>"
  );
}

function makeSvgDataUri(str: string) {
  return "data:image/svg+xml; charset=utf8, " + encodeURIComponent(str);
}

export { toJpeg, toBlob, toPng, toSvg, getInlinedNode };

function finalize(root: HTMLElement) {
  for (const element of root.querySelectorAll("*")) {
    if (!(element instanceof HTMLElement) || isSVGElement(element)) continue;

    if (element instanceof HTMLAnchorElement) {
      element.href = element.href.startsWith("http")
        ? element.href
        : document.location.origin + element.href;
    }
  }
}
