import { useState } from "react";
import config from "./config";

export const usePersistentState = (key, def) => {
  let defState = config.get(key, def);
  const [k, setKey] = useState(defState);
  const _setKey = (s) => {
    setKey(s);
    config.set(key, s);
  };
  return [k, _setKey];
};
