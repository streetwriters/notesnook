import { useEffect, useRef, useState } from 'react';

/**
 * A hook that can be used to rotate values in an array.
 * It will return random item in an array after given interval
 */
function useRotator<T>(data: T[], interval = 3000): T | null {
  if (!Array.isArray(data)) return null;
  //@ts-ignore
  const [current, setCurrent] = useState<T>(data.sample());
  const intervalRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      //@ts-ignore
      setCurrent(data.sample());
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  });

  return current;
}

export default useRotator;
