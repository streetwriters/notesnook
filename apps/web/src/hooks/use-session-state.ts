import { useEffect, useState } from "react";

const memory: Record<string, any> = {};
export function useSessionState<T>(key: string, def: T) {
  const [value, setValue] = useState(
    memory[key] === undefined ? def : memory[key]
  );

  useEffect(() => {
    memory[key] = value;
  }, [key, value]);

  return [
    value as T,
    setValue as React.Dispatch<React.SetStateAction<T>>
  ] as const;
}
