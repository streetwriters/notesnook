import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

export const useDelayLayout = (delay: number) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel: () => void;
    const timeout = setTimeout(() => {
      cancel = InteractionManager.runAfterInteractions(() => {
        setLoading(false);
      }).cancel;
    }, delay);
    return () => {
      cancel && cancel();
      clearTimeout(timeout);
    };
  }, [delay]);

  return loading;
};
