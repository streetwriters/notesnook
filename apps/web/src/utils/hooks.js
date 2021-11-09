import { useEffect, useState } from "react";
import config from "./config";

export const usePersistentState = (key, def) => {
  let defState = config.get(key, def);
  const [value, setValue] = useState(defState);

  useEffect(() => {
    config.set(key, value);
  }, [key, value]);

  return [value, setValue];
};

const memory = {};
export const useSessionState = (key, def) => {
  const [value, setValue] = useState(
    memory[key] === undefined ? def : memory[key]
  );

  useEffect(() => {
    memory[key] = value;
  }, [key, value]);

  return [value, setValue];
};
