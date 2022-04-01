import { useEffect, useState } from "react";
import { initializeDatabase } from "../common/db";

const memory = {
  isAppLoaded: false,
};
export default function useDatabase(persistence) {
  const [isAppLoaded, setIsAppLoaded] = useState(memory.isAppLoaded);

  useEffect(() => {
    if (memory.isAppLoaded) return;

    (async () => {
      await import("../app.css");
      await initializeDatabase(persistence);
      setIsAppLoaded(true);
      memory.isAppLoaded = true;
    })();
  }, [persistence]);

  return [isAppLoaded];
}
