import { EVENTS } from "@notesnook/desktop/events";
import { useEffect, useState } from "react";
import { AppEventManager } from "../common/app-events";
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
    AppEventManager.subscribe(EVENTS.themeChanged, onThemeChanged);
    return () => {
      AppEventManager.unsubscribe(EVENTS.themeChanged, onThemeChanged);
    };
  }, []);

  return systemTheme === "dark";
}
export default useSystemTheme;
