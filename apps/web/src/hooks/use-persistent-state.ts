import { useEffect, useState } from "react";
import config from "../utils/config";

export function usePersistentState<T>(key: string, def: T) {
  let defState = config.get<T>(key, def);
  const [value, setValue] = useState(defState);

  useEffect(() => {
    config.set<T>(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
