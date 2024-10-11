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
import Config from "../utils/config";
import type { HashRoute } from "./hash-routes";
import type { ReplaceParametersInPath } from "./types";

export function navigate(
  url: string,
  options: {
    notify?: boolean;
    replace?: boolean;
    query?: URLSearchParams;
  } = {}
) {
  const { notify, query, replace } = options;
  if (query !== null && typeof query === "object")
    url += "?" + query.toString();
  if (replace)
    window.history.replaceState(null, "", makeURL(url, getCurrentHash()));
  else window.history.pushState(null, "", makeURL(url, getCurrentHash()));

  if (notify) dispatchEvent(new PopStateEvent("popstate"));
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

  if (replace) window.history.replaceState({ replace }, "", `#${url}`);
  else window.history.pushState({ replace }, "", `#${url}`);

  const event = new HashChangeEvent("hashchange");
  (event as any).notify = notify;
  dispatchEvent(event);
}

export function useQueryParams(parseFn = parseQuery) {
  const [querystring] = useState(getQueryString());
  return [parseFn(querystring)];
}

function parseQuery(querystring: string) {
  return Object.fromEntries(new URLSearchParams(querystring).entries());
}

export function getQueryString() {
  return window.location.search;
}

export function getQueryParams() {
  const params = parseQuery(getQueryString());
  if (Object.keys(params).length <= 0) return;
  return params;
}

export function getCurrentPath() {
  return window.location.pathname || "/";
}

export function getCurrentHash() {
  return window.location.hash;
}

export const NavigationEvents = new EventManager();

const HOMEPAGE_ROUTE = {
  0: "/notes",
  1: "/notebooks",
  2: "/favorites",
  3: "/tags"
} as const;
export function getHomeRoute() {
  return HOMEPAGE_ROUTE[Config.get("homepage", 0)];
}

export function extendHomeRoute(route: string) {
  return `${getHomeRoute()}${route}`;
}

export function hardNavigate(route: string) {
  window.open(makeURL(route, getCurrentHash()), "_self");
}

export function makeURL(route: string, hash?: string, search?: string) {
  const url = new URL(route, window.location.origin);
  if (!url.hash) url.hash = hash || getCurrentHash();
  url.search = search || getQueryString();
  return url;
}
