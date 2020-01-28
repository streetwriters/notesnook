import { useState } from "react";

export const usePersistentState = (key, def) => {
  const defState = JSON.parse(window.localStorage.getItem(key) || def);
  const [k, setKey] = useState(defState);
  const _setKey = s => {
    setKey(s);
    window.localStorage.setItem(key, s);
  };
  return [k, _setKey];
};
