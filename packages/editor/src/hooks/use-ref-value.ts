import { useEffect, useRef } from "react";

export function useRefValue<T>(value: T) {
  const refValue = useRef(value);

  useEffect(() => {
    refValue.current = value;
  }, [value]);
  return refValue;
}
