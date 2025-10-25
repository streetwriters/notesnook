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
import { constructUrl, FetchOptions, fetchResource } from "./fetch.js";
import { isDataUrl, resolveUrl, escape } from "./utils.js";

const URL_REGEX = /url\(['"]?([^'"]+?)['"]?\)/g;

function shouldProcess(string: string) {
  return string.search(URL_REGEX) !== -1;
}

function readUrls(string: string) {
  const result = [];
  let match;
  while ((match = URL_REGEX.exec(string)) !== null) {
    result.push(match[1]);
  }
  return result.filter(function (url) {
    return !isDataUrl(url);
  });
}

async function inline(
  string: string,
  url: string,
  options?: FetchOptions,
  baseUrl?: string,
  onlyResolve?: boolean
) {
  const resolvedUrl = baseUrl ? resolveUrl(url, baseUrl) : url;
  const dataUrl = onlyResolve
    ? constructUrl(resolvedUrl, options)
    : await fetchResource(resolvedUrl, options).catch(() =>
        constructUrl(resolvedUrl, options)
      );
  return string.replace(url, dataUrl || resolvedUrl);
}

async function inlineAll(
  string: string,
  options?: FetchOptions,
  baseUrl?: string,
  onlyResolve?: boolean
) {
  if (!shouldProcess(string)) return string;

  const urls = readUrls(string);

  for (const url of urls) {
    string = await inline(string, url, options, baseUrl, onlyResolve).catch(
      (e) => {
        console.error(e);
        return string;
      }
    );
  }
  return string;
}

export { shouldProcess, inlineAll, readUrls };
