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
import { FetchOptions, fetchResource } from "./fetch.js";
import { isDataUrl } from "./utils.js";

async function inlineAllImages(root: HTMLElement, options?: FetchOptions) {
  const imageNodes = root.querySelectorAll("img");
  const promises: Promise<any>[] = [];
  for (let i = 0; i < imageNodes.length; ++i) {
    const image = imageNodes[i];
    promises.push(inlineImage(image, options));
  }

  await Promise.allSettled(promises).catch((e) => console.error(e));
}
export { inlineAllImages };

async function inlineImage(element: HTMLImageElement, options?: FetchOptions) {
  if (isDataUrl(element.currentSrc)) return Promise.resolve(null);

  const dataURL = await fetchResource(
    element.currentSrc || element.src,
    options
  );
  if (!dataURL) return null;

  if (dataURL === "data:,") {
    element.removeAttribute("src");
    return element;
  }

  if (element.parentElement?.tagName === "PICTURE") {
    element.parentElement?.replaceWith(element);
  }

  element.src = dataURL;
  element.removeAttribute("srcset");
}
