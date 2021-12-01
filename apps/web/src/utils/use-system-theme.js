import { EVENTS } from "@notesnook/desktop/events";
import { useEffect, useState } from "react";
import { ElectronEventManager } from "../commands";
import useMediaQuery from "./use-media-query";

function useSystemTheme() {
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [systemTheme, setSystemTheme] = useState(isDarkMode ? "dark" : "light");

  useEffect(() => {
    setSystemTheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    function onThemeChanged({ theme }) {
      setSystemTheme(theme);
    }
    ElectronEventManager.subscribe(EVENTS.themeChanged, onThemeChanged);
    return () => {
      ElectronEventManager.unsubscribe(EVENTS.themeChanged, onThemeChanged);
    };
  }, []);

  return systemTheme === "dark";
}
export default useSystemTheme;
