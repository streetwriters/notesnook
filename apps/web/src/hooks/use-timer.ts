import { useEffect, useRef } from "react";
import { useSessionState } from "./use-session-state";

export function useTimer(id: string, duration: number) {
  const [seconds, setSeconds] = useSessionState(id, duration);
  const [enabled, setEnabled] = useSessionState(`${id}.canSendAgain`, true);
  const interval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) {
      interval.current = setInterval(() => {
        setSeconds((seconds) => {
          --seconds;
          if (seconds <= 0) {
            setEnabled(true);
            if (interval.current) clearInterval(interval.current);
            return duration;
          }
          return seconds;
        });
      }, 1000);
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [enabled, setEnabled, setSeconds, duration]);

  return { elapsed: seconds, enabled, setEnabled };
}
