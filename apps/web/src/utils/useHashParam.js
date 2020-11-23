import { useState, useEffect } from "react";
import { isMobile } from "./dimensions";

const getHashSearchParams = () => {
  const hash = window.location.hash.slice(1);
  const [prefix, query] = hash.split("?");

  return [prefix, new URLSearchParams(query)];
};

const getHashParam = (key) => {
  const [, searchParams] = getHashSearchParams(window.location);
  return searchParams.get(key);
};

const setHashParam = (
  obj,
  notify = true,
  append = false,
  forcePush = false
) => {
  const [prefix, searchParams] = append
    ? getHashSearchParams()
    : ["", new URLSearchParams()];

  for (let key in obj) {
    let value = obj[key];
    searchParams.set(key, value);
  }

  const search = searchParams.toString();
  let hash = search ? `${prefix}?${search}` : prefix;
  if (window.history.replaceState) {
    if (isMobile() || forcePush) {
      window.history.pushState(null, null, `#${hash}`);
    } else {
      window.history.replaceState(null, null, `#${hash}`);
    }

    if (notify) window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = hash;
  }
};

const useHashParam = (key, defaultValue) => {
  const [innerValue, setInnerValue] = useState(getHashParam(key));

  useEffect(() => {
    const handleHashChange = () => setInnerValue(getHashParam(key));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [key]);

  return [innerValue || defaultValue];
};

export { setHashParam, useHashParam, getHashParam };
