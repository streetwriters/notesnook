import { useEffect, useState } from "react";
import { initializeDatabase } from "../common/db";

export default function useDatabase() {
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await import("../app.css");
      await initializeDatabase();
      setIsAppLoaded(true);
    })();
  }, []);

  return [isAppLoaded];
}
