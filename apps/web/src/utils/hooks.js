import { useState } from "react";
import { tryParse } from "./parse";

export const usePersistentState = (key, def) => {
  let value = window.localStorage.getItem(key) || def;
  const defState = tryParse(value);
  const [k, setKey] = useState(defState);
  const _setKey = (s) => {
    setKey(s);
    window.localStorage.setItem(key, s);
  };
  return [k, _setKey];
};
