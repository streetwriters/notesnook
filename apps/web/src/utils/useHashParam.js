import { useState, useEffect } from "react";

const getHashSearchParams = () => {
  const hash = window.location.hash.slice(1);
  const [prefix, query] = hash.split("?");

  return [prefix, new URLSearchParams(query)];
};

const getHashParam = (key) => {
  const [, searchParams] = getHashSearchParams(window.location);
  return searchParams.get(key);
};

const setHashParam = (obj, notify = true) => {
  //const [prefix, searchParams] = getHashSearchParams();
  const searchParams = new URLSearchParams();
  const prefix = "";

  for (let key in obj) {
    let value = obj[key];
    searchParams.set(key, value);
  }

  const search = searchParams.toString();
  let hash = search ? `${prefix}?${search}` : prefix;
  if (window.history.replaceState) {
    window.history.replaceState(null, null, `#${hash}`);
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

export { setHashParam, useHashParam };
