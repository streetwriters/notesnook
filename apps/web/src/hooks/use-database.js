import { useEffect, useState } from "react";
import { initializeDatabase } from "../common/db";
import { loadTrackerScript } from "../utils/analytics";

if (process.env.NODE_ENV === "production") {
  loadTrackerScript();
  console.log = () => {};
}

const memory = {
  isAppLoaded: false
};
export default function useDatabase(persistence) {
  const [isAppLoaded, setIsAppLoaded] = useState(memory.isAppLoaded);

  useEffect(() => {
    if (memory.isAppLoaded) return;

    (async () => {
      await import("../app.css");
      if (process.env.NODE_ENV !== "development")
        await initializeDatabase(persistence);
      setIsAppLoaded(true);
      memory.isAppLoaded = true;
    })();
  }, [persistence]);

  return [isAppLoaded];
}
