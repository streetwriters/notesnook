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
export type FetchOptions = {
  bypassCors?: boolean;
  corsHost: string;
  noCache?: boolean;
  crossOrigin?: "anonymous" | "use-credentials" | null;
};

export async function fetchResource(url: string, options?: FetchOptions) {
  if (!url) return null;

  const response = await fetch(constructUrl(url, options));
  if (!response.ok) return "";

  const blob = await response.blob();
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise<string>((resolve) => {
    reader.addEventListener("loadend", () => {
      if (typeof reader.result === "string") resolve(reader.result);
    });
  });
}

export function createImage(url: string, options?: FetchOptions) {
  if (url === "data:,") return Promise.resolve(null);
  return new Promise<HTMLImageElement>(function (resolve, reject) {
    const image = new Image();
    image.crossOrigin = options?.crossOrigin || null;
    image.onload = function () {
      resolve(image);
    };
    image.onerror = reject;
    image.src = constructUrl(url, options);
  });
}

export function reloadImage(image: HTMLImageElement, options: FetchOptions) {
  if (options.corsHost && image.currentSrc.startsWith(options.corsHost))
    return Promise.resolve(null);

  options.noCache = true;
  return new Promise<HTMLImageElement>(function (resolve, reject) {
    image.crossOrigin = options.crossOrigin || null;
    image.onload = function () {
      resolve(image);
    };
    image.onerror = (e) => {
      console.error("Failed to load image", image.currentSrc);
      reject(e);
    };

    image.src = constructUrl(image.currentSrc, options);
  });
}

export function constructUrl(url: string, options?: FetchOptions) {
  if (!url.startsWith("http")) return url;
  if (options?.noCache) {
    // Cache bypass so we dont have CORS issues with cached images
    // Source: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
    url += (/\?/.test(url) ? "&" : "?") + Date.now();
  }
  if (options?.bypassCors && options?.corsHost) {
    if (url.startsWith(options.corsHost)) return url;

    url = `${options.corsHost}/${url}`;
  }
  return url;
}
