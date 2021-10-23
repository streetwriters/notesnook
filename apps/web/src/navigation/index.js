import { useState } from "react";
import EventManager from "notes-core/utils/eventmanager";
import Config from "../utils/config";

export function navigate(url, replaceOrQuery, replace) {
  if (typeof url !== "string") {
    throw new Error(`"url" must be a string, was provided a(n) ${typeof url}`);
  }
  if (Array.isArray(replaceOrQuery)) {
    throw new Error(
      '"replaceOrQuery" must be boolean, object, or URLSearchParams'
    );
  }

  if (replaceOrQuery !== null && typeof replaceOrQuery === "object") {
    url += "?" + new URLSearchParams(replaceOrQuery).toString();
  } else if (replace === undefined && replaceOrQuery !== undefined) {
    replace = replaceOrQuery;
  } else if (replace === undefined && replaceOrQuery === undefined) {
    replace = false;
  }

  window.history[`${replace ? "replace" : "push"}State`](null, null, url);
  dispatchEvent(new PopStateEvent("popstate", null));
}
let last = 0;
export function hashNavigate(
  url,
  { replace = false, notify = true, addNonce = false } = {}
) {
  if (addNonce) url += `/${++last}`;

  window.history[`${replace ? "replace" : "push"}State`](null, null, `#${url}`);
  if (notify) dispatchEvent(new HashChangeEvent("hashchange"));
  // if (typeof url !== "string") {
  //   throw new Error(`"url" must be a string, was provided a(n) ${typeof url}`);
  // }
  // if (Array.isArray(replaceOrQuery)) {
  //   throw new Error(
  //     '"replaceOrQuery" must be boolean, object, or URLSearchParams'
  //   );
  // }

  // if (replaceOrQuery !== null && typeof replaceOrQuery === "object") {
  //   url += "?" + new URLSearchParams(replaceOrQuery).toString();
  // } else if (replace === undefined && replaceOrQuery !== undefined) {
  //   replace = replaceOrQuery;
  // } else if (replace === undefined && replaceOrQuery === undefined) {
  //   replace = false;
  // }

  // window.history[`${replace ? "replace" : "push"}State`](null, null, url);
  // dispatchEvent(new PopStateEvent("popstate", null));
}

export function useQueryParams(parseFn = parseQuery) {
  const [querystring] = useState(getQueryString());
  return [parseFn(querystring)];
}

function parseQuery(querystring) {
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
  3: "/tags",
};
export function getHomeRoute() {
  return HOMEPAGE_ROUTE[Config.get("homepage", 0)];
}
