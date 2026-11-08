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

import { useState } from "react";
import { EventManager } from "@notesnook/core";
import { history } from "@platform";
import Config from "../utils/config";
import type { HashRoute } from "./hash-routes";
import type { ReplaceParametersInPath } from "./types";
import { HomePage } from "../stores/setting-store";

export const navigationHistory = {
  get state() {
    return history.state;
  },
  back() {
    history.back();
  }
};

history.subscribe((change) => {
  NavigationEvents.publish(change.type, { notify: true });
});

export function encodeQuery(query: Record<string, string>) {
  return Object.entries(query)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
}

export function decodeQuery(querystring: string) {
  const result: Record<string, string> = {};
  for (const pair of querystring.replace(/^\?/, "").split("&")) {
    if (!pair) continue;
    const separator = pair.indexOf("=");
    const key = separator < 0 ? pair : pair.slice(0, separator);
    const value = separator < 0 ? "" : pair.slice(separator + 1);
    result[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return result;
}

export function navigate(
  url: string,
  options: {
    notify?: boolean;
    replace?: boolean;
    query?: Record<string, string>;
  } = {}
) {
  const { notify, query, replace } = options;
  const separator = url.indexOf("?");
  const path = separator < 0 ? url : url.slice(0, separator);
  let search = separator < 0 ? history.location.search : url.slice(separator);
  if (query) search = `?${encodeQuery(query)}`;
  const location = { path, hash: history.location.hash, search };
  if (replace) history.replace(location);
  else history.push(location);

  if (notify) NavigationEvents.publish("popstate");
}

type HashNavigateOptions = {
  replace?: boolean;
  notify?: boolean;
  addNonce?: boolean;
};

let lastNonce = 0;
export function hashNavigate<TPath extends HashRoute>(
  path: ReplaceParametersInPath<TPath>,
  options: HashNavigateOptions = {}
) {
  const { replace = false, notify = true, addNonce = false } = options;
  let url: string = path;
  if (addNonce) url += `/${++lastNonce}`;

  const location = { ...history.location, hash: `#${url}` };
  if (replace) history.replace(location, { replace });
  else history.push(location, { replace });

  NavigationEvents.publish("hashchange", { notify });
}

export function useQueryParams(parseFn = parseQuery) {
  const [querystring] = useState(getQueryString());
  return [parseFn(querystring)];
}

function parseQuery(querystring: string): Partial<Record<string, string>> {
  return decodeQuery(querystring);
}

export function getQueryString() {
  return history.location.search;
}

export function getQueryParams() {
  const params = parseQuery(getQueryString());
  if (Object.keys(params).length <= 0) return;
  return params;
}

export function getCurrentPath() {
  return history.location.path || "/";
}

export function getCurrentHash() {
  return history.location.hash;
}

export const NavigationEvents = new EventManager();

export function getHomeRoute() {
  const homepage = Config.get<HomePage>("homepage-v2");
  if (!homepage) return "/notes";

  switch (homepage.type) {
    case "route":
      return `/${homepage.id}`;
    case "notebook":
      return `/notebooks/${homepage.id}`;
    case "tag":
      return `/tags/${homepage.id}`;
    case "color":
      return `/colors/${homepage.id}`;
    default:
      return "/notes";
  }
}

export function extendHomeRoute(route: string) {
  return `${getHomeRoute()}${route}`;
}

export function hardNavigate(route: string, search?: string) {
  history.hardNavigate({
    path: route,
    hash: history.location.hash,
    search: search ?? history.location.search
  });
}
