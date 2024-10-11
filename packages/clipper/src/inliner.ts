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
  baseUrl?: string
) {
  url = baseUrl ? resolveUrl(url, baseUrl) : url;
  const dataUrl = await fetchResource(url, options);
  // const dataUrl = dataAsUrl(data, mimeType(url));
  return string.replace(urlAsRegex(url), "$1" + dataUrl + "$3");
}

function urlAsRegex(urlValue: string) {
  return new RegExp("(url\\(['\"]?)(" + escape(urlValue) + ")(['\"]?\\))", "g");
}

async function inlineAll(
  string: string,
  options?: FetchOptions,
  baseUrl?: string
) {
  if (!shouldProcess(string)) return string;

  const urls = readUrls(string);

  let prefix = string;
  for (const url of urls) {
    prefix = await inline(prefix, url, options, baseUrl);
  }
  return prefix;
}

export { shouldProcess, inlineAll, readUrls };
