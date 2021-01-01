import { useState } from "react";
// import { useCallback } from "react";

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

export function useQueryParams(
  parseFn = parseQuery
  //serializeFn = serializeQuery
) {
  const [querystring] = useState(getQueryString());
  // const setQueryParams = useCallback(
  //   (params, { replace = true } = {}) => {
  //     let path = getCurrentPath();
  //     params = replace ? params : { ...parseFn(querystring), ...params };
  //     const serialized = serializeFn(params).toString();
  //     if (serialized) path += "?" + serialized;
  //     if (!replace) path += getCurrentHash();
  //     navigate(path);
  //   },
  //   [querystring]
  // );
  // Update state when route changes
  // const updateQuery = useCallback(() => setQuerystring(getQueryString()), [
  //   setQueryParams,
  // ]);
  //useLocationChange(updateQuery);
  return [parseFn(querystring)];
}

function parseQuery(querystring) {
  return Object.fromEntries(new URLSearchParams(querystring).entries());
}

// function serializeQuery(queryParams) {
//   return new URLSearchParams(
//     Object.entries(queryParams).filter(([, v]) => v !== null)
//   );
// }

export function getQueryString() {
  return window.location.search;
}

export function getCurrentPath() {
  return window.location.pathname || "/";
}

export function getCurrentHash() {
  return window.location.hash;
}
