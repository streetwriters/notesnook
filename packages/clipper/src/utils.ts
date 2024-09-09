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

/*
 * Only WOFF and EOT mime types for fonts are 'real'
 * see http://www.iana.org/assignments/media-types/media-types.xhtml
 */
const WOFF = "application/font-woff";
const JPEG = "image/jpeg";

const mimes = {
  woff: WOFF,
  woff2: WOFF,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: JPEG,
  jpeg: JPEG,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml"
};

function parseExtension(url: string) {
  const match = /\.([^./]*?)(\?|$)/g.exec(url);
  if (match) return match[1];
  else return "";
}

function mimeType(url: string) {
  const extension = parseExtension(url).toLowerCase();
  return mimes[extension as keyof typeof mimes] || "";
}

function isDataUrl(url: string) {
  return url.search(/^(data:)/) !== -1;
}

function asBlob(canvas: HTMLCanvasElement) {
  const binaryString = atob(canvas.toDataURL().split(",")[1]);
  const length = binaryString.length;
  const binaryArray = new Uint8Array(length);

  for (let i = 0; i < length; i++) binaryArray[i] = binaryString.charCodeAt(i);

  return new Blob([binaryArray], {
    type: "image/png"
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  if (canvas.toBlob)
    return new Promise<Blob | null>(function (resolve) {
      canvas.toBlob(resolve);
    });

  return Promise.resolve(asBlob(canvas));
}

function resolveUrl(url: string, baseUrl: string) {
  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement("base");
  doc.head.appendChild(base);
  const a = doc.createElement("a");
  doc.body.appendChild(a);
  base.href = baseUrl;
  a.href = url;
  return a.href;
}

let index = 0;
function uid() {
  return "u" + fourRandomChars() + index++;

  function fourRandomChars() {
    /* see http://stackoverflow.com/a/6248722/2519373 */
    return (
      "0000" + ((Math.random() * Math.pow(36, 4)) << 0).toString(36)
    ).slice(-4);
  }
}

function dataAsUrl(content: string, type: string) {
  return "data:" + type + ";base64," + content;
}

function escape(string: string) {
  return string.replace(/([.*+?^${}()|[\]/\\])/g, "\\$1");
}

function delay(ms: number) {
  return function <T>(arg: T) {
    return new Promise<T>(function (resolve) {
      setTimeout(function () {
        resolve(arg);
      }, ms);
    });
  };
}

function asArray<T>(arrayLike: ArrayLike<T>) {
  const array = [];
  const length = arrayLike.length;
  for (let i = 0; i < length; i++) array.push(arrayLike[i]);
  return array;
}

function escapeXhtml(string: string) {
  return string.replace(/%/g, "%25").replace(/#/g, "%23").replace(/\n/g, "%0A");
}

function width(node: HTMLElement) {
  const leftBorder = px(node, "border-left-width");
  const rightBorder = px(node, "border-right-width");
  return node.scrollWidth + leftBorder + rightBorder;
}

function height(node: HTMLElement) {
  const topBorder = px(node, "border-top-width");
  const bottomBorder = px(node, "border-bottom-width");
  return node.scrollHeight + topBorder + bottomBorder;
}

function px(node: HTMLElement, styleProperty: string) {
  const value = getComputedStyle(node).getPropertyValue(styleProperty);
  return parseFloat(value.replace("px", ""));
}

function injectCss(rules: string, id: string) {
  const variableCss = document.getElementById(id);
  const head = document.getElementsByTagName("head")[0];
  if (variableCss) {
    head.removeChild(variableCss);
  }
  const css = document.createElement("style");
  css.type = "text/css";
  css.id = id;
  css.appendChild(document.createTextNode(rules));

  head.insertBefore(css, getRootStylesheet());
}

function getRootStylesheet() {
  for (const sty of document.querySelectorAll("style")) {
    if (sty.innerHTML.includes("#root")) {
      return sty;
    }
  }
  return null;
}

function safeQuerySelectorAll(root: Node, selector: string) {
  try {
    return (root as HTMLElement).querySelectorAll(selector);
  } catch (e) {
    return new NodeList();
  }
}

export {
  injectCss,
  escape,
  parseExtension,
  mimeType,
  dataAsUrl,
  isDataUrl,
  canvasToBlob,
  resolveUrl,
  uid,
  delay,
  asArray,
  escapeXhtml,
  width,
  height,
  safeQuerySelectorAll
};
